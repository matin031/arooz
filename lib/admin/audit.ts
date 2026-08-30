import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export type AuditAction =
  | "user.role_change" | "user.ban" | "user.unban" | "user.delete"
  | "setting.update" | "setting.reset" | "setting.test_email"
  | "exam.create" | "exam.update" | "exam.delete"
  | "exam.section_create" | "exam.section_delete"
  | "exam.question_save" | "exam.question_delete"
  | "quiz.question_save" | "quiz.question_delete"
  | "vocab.word_save" | "vocab.word_delete"
  | "club.post_status" | "club.post_feature" | "club.post_delete"
  | "club.comment_status" | "club.comment_delete" | "club.report_resolve"
  | "upload.audio";

export type AuditTargetType =
  | "user" | "setting" | "exam" | "exam_section" | "exam_question"
  | "quiz_question" | "vocab_word" | "club_post" | "club_comment"
  | "club_report" | "file";

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  "user.role_change": "تغییر نقش کاربر",
  "user.ban": "مسدود کردن کاربر",
  "user.unban": "رفع مسدودی کاربر",
  "user.delete": "حذف کاربر",
  "setting.update": "تغییر تنظیمات",
  "setting.reset": "بازگرداندن تنظیم",
  "setting.test_email": "ارسال ایمیل آزمایشی",
  "exam.create": "ساخت آزمون",
  "exam.update": "ویرایش آزمون",
  "exam.delete": "حذف آزمون",
  "exam.section_create": "افزودن بخش",
  "exam.section_delete": "حذف بخش",
  "exam.question_save": "ذخیرهٔ سؤال آزمون",
  "exam.question_delete": "حذف سؤال آزمون",
  "quiz.question_save": "ذخیرهٔ سؤال عروض سماعی",
  "quiz.question_delete": "حذف سؤال عروض سماعی",
  "vocab.word_save": "ذخیرهٔ واژه",
  "vocab.word_delete": "حذف واژه",
  "club.post_status": "تعیین وضعیت سروده",
  "club.post_feature": "برگزیده کردن سروده",
  "club.post_delete": "حذف سروده",
  "club.comment_status": "تعیین وضعیت دیدگاه",
  "club.comment_delete": "حذف دیدگاه",
  "club.report_resolve": "رسیدگی به گزارش",
  "upload.audio": "آپلود فایل صوتی",
};

export const DESTRUCTIVE_ACTIONS: ReadonlySet<AuditAction> = new Set([
  "user.delete", "user.ban", "exam.delete", "exam.section_delete",
  "exam.question_delete", "quiz.question_delete", "vocab.word_delete",
  "club.post_delete", "club.comment_delete", "user.role_change",
]);

const SECRET_KEY_PATTERN = /(secret|password|token|api[_-]?key|pepper|credential)/i;

function redactMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(metadata).map(([key, value]) => [
    key,
    SECRET_KEY_PATTERN.test(key)
      ? "«پنهان»"
      : typeof value === "string" && value.length > 300
        ? `${value.slice(0, 300)}…`
        : value,
  ]));
}
async function requestIp(): Promise<string | null> {
  try {
    const chain = ((await headers()).get("x-forwarded-for") ?? "")
      .split(",").map((part) => part.trim()).filter(Boolean);
    const candidate = chain.at(-1);
    return candidate && candidate.length <= 45 ? candidate : null;
  } catch {
    return null;
  }
}

export type AuditEntry = {
  actor: User;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
};

export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from("admin_audit_log").insert({
      actor_id: entry.actor.id,
      actor_email: entry.actor.email ?? "",
      action: entry.action,
      target_type: entry.targetType,
      target_id: entry.targetId ?? null,
      summary: entry.summary,
      metadata: redactMetadata(entry.metadata ?? {}),
      ip: await requestIp(),
    });
    if (error) throw error;
  } catch (error) {
    console.error("[audit] ثبت فعالیت ناموفق بود:", error);
  }
}

export type ErrorSource = "api" | "action" | "mail" | "sms" | "db" | "upload" | "other";

function errorFingerprint(source: string, message: string, context: string | null): string {
  const normalized = message
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "«شناسه»")
    .replace(/\d+/g, "«عدد»")
    .slice(0, 500);
  return createHash("sha256").update(`${source}|${context ?? ""}|${normalized}`).digest("hex").slice(0, 32);
}

export async function recordError(source: ErrorSource, error: unknown, context?: string | null): Promise<void> {
  try {
    const supabase = createSupabaseAdmin();
    const cause = error instanceof Error ? error : new Error(String(error));
    const message = (cause.message || "خطای بدون پیام").slice(0, 1000);
    const detail = (cause.stack ?? "").slice(0, 4000) || null;
    const safeContext = context?.slice(0, 300) ?? null;
    const fingerprint = errorFingerprint(source, message, safeContext);
    const { error: rpcError } = await supabase.rpc("record_app_error", {
      p_source: source,
      p_message: message,
      p_context: safeContext,
      p_detail: detail,
      p_fingerprint: fingerprint,
    });
    if (rpcError) throw rpcError;
  } catch (loggingError) {
    console.error("[error-log] ثبت خطا ناموفق بود:", loggingError);
  }
}
