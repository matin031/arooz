"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import {
  AUDIT_ACTION_LABELS,
  DESTRUCTIVE_ACTIONS,
  recordAudit,
  recordError,
  type AuditAction,
} from "@/lib/admin/audit";
import { AUDIT_PAGE_SIZE, ERROR_PAGE_SIZE } from "@/lib/admin/log-constants";

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; errors: string[] };

export type AuditRow = {
  id: string;
  actorEmail: string;
  actorId: string | null;
  action: AuditAction;
  actionLabel: string;
  targetType: string;
  targetId: string | null;
  summary: string;
  metadata: Record<string, unknown>;
  ip: string | null;
  createdAt: string;
  destructive: boolean;
};

export type AuditFilter = {
  actorId?: string;
  action?: string;
  destructiveOnly?: boolean;
  limit?: number;
  offset?: number;
};

type AuditDatabaseRow = {
  id: string;
  actor_id: string | null;
  actor_email: string;
  action: string;
  target_type: string;
  target_id: string | null;
  summary: string;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  created_at: string;
};

function mapAudit(row: AuditDatabaseRow): AuditRow {
  const action = row.action as AuditAction;
  return {
    id: row.id,
    actorId: row.actor_id,
    actorEmail: row.actor_email,
    action,
    actionLabel: AUDIT_ACTION_LABELS[action] ?? row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    summary: row.summary,
    metadata: row.metadata ?? {},
    ip: row.ip,
    createdAt: row.created_at,
    destructive: DESTRUCTIVE_ACTIONS.has(action),
  };
}

export async function adminListAudit(filter: AuditFilter = {}): Promise<{ rows: AuditRow[]; total: number }> {
  await requireAdmin();
  if (filter.action && !(filter.action in AUDIT_ACTION_LABELS)) return { rows: [], total: 0 };

  const supabase = createSupabaseAdmin();
  const limit = Math.min(Math.max(filter.limit ?? AUDIT_PAGE_SIZE, 1), 200);
  const offset = Math.max(filter.offset ?? 0, 0);
  let query = supabase
    .from("admin_audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filter.actorId) query = query.eq("actor_id", filter.actorId);
  if (filter.action) query = query.eq("action", filter.action);
  if (filter.destructiveOnly) query = query.in("action", [...DESTRUCTIVE_ACTIONS]);

  const { data, count, error } = await query;
  if (error) return { rows: [], total: 0 };
  return { rows: ((data ?? []) as AuditDatabaseRow[]).map(mapAudit), total: count ?? 0 };
}

export async function adminAuditActors(): Promise<{ id: string; email: string }[]> {
  await requireAdmin();
  const { data } = await createSupabaseAdmin()
    .from("admin_audit_log")
    .select("actor_id, actor_email")
    .not("actor_id", "is", null)
    .order("actor_email");
  const actors = new Map<string, string>();
  for (const row of data ?? []) if (row.actor_id) actors.set(row.actor_id, row.actor_email);
  return [...actors].map(([id, email]) => ({ id, email }));
}

export async function adminAuditActions(): Promise<{ action: string; label: string; count: number }[]> {
  await requireAdmin();
  const { data } = await createSupabaseAdmin().from("admin_audit_log").select("action");
  const counts = new Map<string, number>();
  for (const row of data ?? []) counts.set(row.action, (counts.get(row.action) ?? 0) + 1);
  return [...counts]
    .filter(([action]) => action in AUDIT_ACTION_LABELS)
    .map(([action, count]) => ({
      action,
      label: AUDIT_ACTION_LABELS[action as AuditAction],
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

export type ErrorRow = {
  id: string;
  source: string;
  message: string;
  context: string | null;
  detail: string | null;
  occurrences: number;
  firstSeenAt: string;
  lastSeenAt: string;
  resolvedAt: string | null;
};

export async function adminListErrors(
  options: { includeResolved?: boolean; limit?: number; offset?: number } = {},
): Promise<{ rows: ErrorRow[]; total: number; openCount: number }> {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const limit = Math.min(Math.max(options.limit ?? ERROR_PAGE_SIZE, 1), 200);
  const offset = Math.max(options.offset ?? 0, 0);
  let query = supabase
    .from("app_error_log")
    .select("*", { count: "exact" })
    .order("last_seen_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (!options.includeResolved) query = query.is("resolved_at", null);

  const [{ data, count, error }, openResult] = await Promise.all([
    query,
    supabase.from("app_error_log").select("id", { count: "exact", head: true }).is("resolved_at", null),
  ]);
  if (error) return { rows: [], total: 0, openCount: 0 };
  return {
    total: count ?? 0,
    openCount: openResult.count ?? 0,
    rows: (data ?? []).map((row) => ({
      id: row.id,
      source: row.source,
      message: row.message,
      context: row.context,
      detail: row.detail,
      occurrences: Number(row.occurrences),
      firstSeenAt: row.first_seen_at,
      lastSeenAt: row.last_seen_at,
      resolvedAt: row.resolved_at,
    })),
  };
}

export async function adminResolveError(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const { data, error } = await createSupabaseAdmin()
    .from("app_error_log")
    .update({ resolved_at: new Date().toISOString(), resolved_by: admin.id })
    .eq("id", id)
    .is("resolved_at", null)
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false, errors: [error?.message ?? "این خطا پیدا نشد یا قبلاً رسیدگی شده."] };
  revalidatePath("/admin/activity");
  return { ok: true, data: null };
}

export async function adminResolveAllErrors(): Promise<ActionResult<{ count: number }>> {
  const admin = await requireAdmin();
  const supabase = createSupabaseAdmin();
  const { count } = await supabase.from("app_error_log").select("id", { count: "exact", head: true }).is("resolved_at", null);
  const { error } = await supabase
    .from("app_error_log")
    .update({ resolved_at: new Date().toISOString(), resolved_by: admin.id })
    .is("resolved_at", null);
  if (error) return { ok: false, errors: [error.message] };
  revalidatePath("/admin/activity");
  return { ok: true, data: { count: count ?? 0 } };
}

export type RecentActivity = {
  newUsersToday: number;
  newUsersWeek: number;
  quizAttemptsWeek: number;
  examAttemptsWeek: number;
  clubPostsWeek: number;
  latestUsers: { id: string; name: string | null; email: string; createdAt: string }[];
  latestAudit: AuditRow[];
  openErrors: number;
};

async function recentCount(table: string, since: string): Promise<number> {
  const { count } = await createSupabaseAdmin()
    .from(table)
    .select("id", { count: "exact", head: true })
    .gte("created_at", since);
  return count ?? 0;
}

export async function adminRecentActivity(): Promise<RecentActivity> {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const now = Date.now();
  const day = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
  const week = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [usersPage, profilesResult, usersToday, usersWeek, quizAttemptsWeek, examAttemptsWeek, clubPostsWeek, audit, errors] =
    await Promise.all([
      supabase.auth.admin.listUsers({ page: 1, perPage: 5 }),
      supabase.from("profiles").select("id, full_name"),
      supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      recentCount("quiz_attempts", week),
      recentCount("exam_attempts", week),
      recentCount("club_posts", week),
      adminListAudit({ limit: 6 }),
      supabase.from("app_error_log").select("id", { count: "exact", head: true }).is("resolved_at", null),
    ]);

  const names = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile.full_name as string | null]));
  const countSince = (result: typeof usersToday, since: string) =>
    (result.data?.users ?? []).filter((user) => user.created_at >= since).length;

  return {
    newUsersToday: countSince(usersToday, day),
    newUsersWeek: countSince(usersWeek, week),
    quizAttemptsWeek,
    examAttemptsWeek,
    clubPostsWeek,
    latestUsers: (usersPage.data?.users ?? []).map((user) => ({
      id: user.id,
      name: names.get(user.id) ?? (user.user_metadata?.full_name as string | undefined) ?? null,
      email: user.email ?? "",
      createdAt: user.created_at,
    })),
    latestAudit: audit.rows,
    openErrors: errors.count ?? 0,
  };
}

export async function adminTestErrorLog(kind: "info" | "error" = "error"): Promise<ActionResult> {
  const admin = await requireAdmin();
  await recordError(
    "other",
    new Error(kind === "error" ? "این یک خطای آزمایشی از پنل مدیریت است." : "این یک پیام آزمایشی از پنل مدیریت است."),
    "آزمایش دستی از /admin/activity",
  );
  await recordAudit({
    actor: admin,
    action: "setting.test_email",
    targetType: "setting",
    targetId: "error-log-test",
    summary: "ثبت یک خطای آزمایشی برای بررسی کارکرد لاگ",
  });
  revalidatePath("/admin/activity");
  return { ok: true, data: null };
}
