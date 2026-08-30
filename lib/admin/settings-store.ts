import "server-only";

import { createSupabaseAdmin } from "@/lib/supabase-admin";

export type SettingKey = "mail.from" | "sms.driver" | "sms.api_key" | "sms.sender" | "sms.base_url";

type SettingSpec = {
  envVar: string;
  label: string;
  description: string;
  group: "mail" | "sms";
  secret?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
};

export const SETTING_SPECS: Record<SettingKey, SettingSpec> = {
  "mail.from": {
    envVar: "MAIL_FROM",
    group: "mail",
    label: "آدرس فرستندهٔ ایمیل",
    description: "نام و نشانی‌ای که گیرنده می‌بیند. دامنه باید در سرویس ایمیل تأیید شده باشد.",
    placeholder: "سرو <noreply@example.com>",
  },
  "sms.driver": {
    envVar: "SMS_DRIVER",
    group: "sms",
    label: "سرویس پیامک",
    description: "تا وقتی روی «غیرفعال» باشد هیچ پیامکی فرستاده نمی‌شود.",
    options: [
      { value: "mock", label: "غیرفعال (فقط ثبت در گزارش)" },
      { value: "kavenegar", label: "کاوه‌نگار" },
      { value: "sms_ir", label: "اس‌ام‌اس دات آی‌آر" },
      { value: "melipayamak", label: "ملی‌پیامک" },
      { value: "custom", label: "سرویس دیگر (با آدرس دلخواه)" },
    ],
  },
  "sms.api_key": {
    envVar: "SMS_API_KEY",
    group: "sms",
    label: "کلید API پیامک",
    description: "کلیدی که پنل پیامک می‌دهد. مقدار ذخیره‌شده هرگز دوباره نمایش داده نمی‌شود.",
    secret: true,
    placeholder: "کلید را اینجا بچسبانید",
  },
  "sms.sender": {
    envVar: "SMS_SENDER",
    group: "sms",
    label: "شمارهٔ فرستنده",
    description: "شماره‌ای که پیامک از آن ارسال می‌شود.",
    placeholder: "۱۰۰۰۱۲۳۴",
  },
  "sms.base_url": {
    envVar: "SMS_BASE_URL",
    group: "sms",
    label: "آدرس سرویس پیامک",
    description: "فقط برای سرویس «دیگر» لازم است.",
    placeholder: "https://api.example.com/send",
  },
};

export type ListedSetting = {
  key: SettingKey;
  label: string;
  description: string;
  group: "mail" | "sms";
  secret: boolean;
  options: { value: string; label: string }[] | null;
  placeholder: string | null;
  value: string | null;
  hasValue: boolean;
  source: "db" | "env" | "none";
};

async function storedSettings(): Promise<Record<string, unknown>> {
  try {
    const { data, error } = await createSupabaseAdmin().from("app_settings").select("key, value");
    if (error) return {};
    return Object.fromEntries((data ?? []).map((row) => [row.key, row.value]));
  } catch {
    return {};
  }
}

export async function getAppSetting(key: SettingKey): Promise<string | null> {
  const stored = await storedSettings();
  const dbValue = typeof stored[key] === "string" && stored[key] ? String(stored[key]).trim() : null;
  return dbValue ?? process.env[SETTING_SPECS[key].envVar]?.trim() ?? null;
}

export async function listAppSettings(): Promise<ListedSetting[]> {
  const stored = await storedSettings();
  return (Object.keys(SETTING_SPECS) as SettingKey[]).map((key) => {
    const spec = SETTING_SPECS[key];
    const dbValue = typeof stored[key] === "string" && stored[key] ? String(stored[key]).trim() : null;
    const envValue = process.env[spec.envVar]?.trim() || null;
    const resolved = dbValue ?? envValue;
    return {
      key,
      label: spec.label,
      description: spec.description,
      group: spec.group,
      secret: spec.secret ?? false,
      options: spec.options ?? null,
      placeholder: spec.placeholder ?? null,
      value: spec.secret ? null : resolved,
      hasValue: Boolean(resolved),
      source: dbValue ? "db" : envValue ? "env" : "none",
    };
  });
}
