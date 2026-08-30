"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { requireAdmin } from "@/lib/require-admin";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { recordAudit, recordError } from "@/lib/admin/audit";
import {
  SETTING_SPECS,
  getAppSetting,
  listAppSettings,
  type ListedSetting,
  type SettingKey,
} from "@/lib/admin/settings-store";

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; errors: string[] };
export type AdminSetting = ListedSetting;
export type AdapterStatus = {
  mail: { driver: string; label: string; healthy: boolean; note: string };
  sms: { driver: string; label: string; healthy: boolean; note: string };
  storage: { driver: string; label: string; healthy: boolean; note: string };
};

export async function adminListSettings(): Promise<AdminSetting[]> {
  await requireAdmin();
  return listAppSettings();
}

export async function adminAdapterStatus(): Promise<AdapterStatus> {
  await requireAdmin();
  const smsDriver = (await getAppSetting("sms.driver")) ?? "mock";
  const smsApiKey = await getAppSetting("sms.api_key");
  const smsSender = await getAppSetting("sms.sender");
  const smsLabel = SETTING_SPECS["sms.driver"].options?.find((option) => option.value === smsDriver)?.label ?? smsDriver;
  return {
    mail: {
      driver: "resend",
      label: "سرویس Resend",
      healthy: Boolean(process.env.RESEND_API_KEY),
      note: process.env.RESEND_API_KEY
        ? "برای اطمینان، یک ایمیل آزمایشی بفرستید."
        : "کلید RESEND_API_KEY در تنظیمات سرور وجود ندارد.",
    },
    sms: {
      driver: smsDriver,
      label: smsLabel,
      healthy: false,
      note: smsDriver === "mock"
        ? "هیچ پیامکی ارسال نمی‌شود؛ احراز هویت فعلی Arooz ایمیلی است."
        : !smsApiKey
          ? "کلید API وارد نشده و اتصال پیامک در Arooz هنوز فعال نیست."
          : !smsSender
            ? "شمارهٔ فرستنده وارد نشده و اتصال پیامک در Arooz هنوز فعال نیست."
            : "اطلاعات ذخیره شده، اما اتصال پیامک در معماری فعلی Arooz پیاده‌سازی نشده است.",
    },
    storage: {
      driver: "supabase-storage",
      label: "Supabase Storage",
      healthy: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      note: "فایل‌ها با زیرساخت Supabase پروژه نگهداری می‌شوند.",
    },
  };
}

export async function adminSetSetting(key: SettingKey, value: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!(key in SETTING_SPECS)) return { ok: false, errors: ["تنظیم ناشناخته."] };
  const trimmed = value.trim();
  if (!trimmed) return { ok: false, errors: ["مقدار نمی‌تواند خالی باشد."] };
  if (key === "mail.from") {
    const address = trimmed.match(/<([^>]+)>/)?.[1] ?? trimmed;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.trim())) {
      return { ok: false, errors: ["آدرس ایمیل معتبر نیست. مثال: سرو <noreply@example.com>"] };
    }
  }
  const options = SETTING_SPECS[key].options;
  if (options && !options.some((option) => option.value === trimmed)) {
    return { ok: false, errors: ["گزینهٔ انتخاب‌شده معتبر نیست."] };
  }
  if (key === "sms.base_url" && !/^https:\/\/[^\s]+$/.test(trimmed)) {
    return { ok: false, errors: ["آدرس سرویس باید با https:// شروع شود."] };
  }

  const { error } = await createSupabaseAdmin().from("app_settings").upsert({
    key,
    value: trimmed,
    updated_by: admin.id,
    updated_at: new Date().toISOString(),
  }, { onConflict: "key" });
  if (error) return { ok: false, errors: [error.message] };

  await recordAudit({
    actor: admin,
    action: "setting.update",
    targetType: "setting",
    targetId: key,
    summary: `تنظیم «${SETTING_SPECS[key].label}» تغییر کرد`,
    metadata: { [key]: trimmed },
  });
  revalidatePath("/admin/settings");
  return { ok: true, data: null };
}

export async function adminResetSetting(key: SettingKey): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!(key in SETTING_SPECS)) return { ok: false, errors: ["تنظیم ناشناخته."] };
  const { error } = await createSupabaseAdmin().from("app_settings").delete().eq("key", key);
  if (error) return { ok: false, errors: [error.message] };
  await recordAudit({
    actor: admin,
    action: "setting.reset",
    targetType: "setting",
    targetId: key,
    summary: `تنظیم «${SETTING_SPECS[key].label}» به مقدار سرور برگشت`,
  });
  revalidatePath("/admin/settings");
  return { ok: true, data: null };
}

export async function adminSendTestEmail(to: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const recipient = to.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    return { ok: false, errors: ["آدرس گیرنده معتبر نیست."] };
  }
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, errors: ["RESEND_API_KEY در تنظیمات سرور وجود ندارد."] };

  try {
    const from = (await getAppSetting("mail.from")) ?? "noreply@aruzino.ir";
    const { error } = await new Resend(apiKey).emails.send({
      from,
      to: recipient,
      subject: "ایمیل آزمایشی سرو",
      html: '<div dir="rtl" style="font-family:sans-serif"><p>این یک ایمیل آزمایشی از پنل مدیریت سرو است.</p><p style="color:#64748b;font-size:13px">اگر این پیام را می‌بینید، تنظیمات ایمیل درست کار می‌کند.</p></div>',
      text: "این یک ایمیل آزمایشی از پنل مدیریت سرو است.",
    });
    if (error) throw new Error(error.message);
    await recordAudit({
      actor: admin,
      action: "setting.test_email",
      targetType: "setting",
      targetId: "mail.from",
      summary: `ایمیل آزمایشی به ${recipient} فرستاده شد`,
    });
    return { ok: true, data: null };
  } catch (error) {
    await recordError("mail", error, "ارسال ایمیل آزمایشی از پنل");
    return { ok: false, errors: [error instanceof Error ? error.message : "ارسال ایمیل ناموفق بود."] };
  }
}
