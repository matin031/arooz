"use server";

import { requireAdmin } from "@/lib/require-admin";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { recordAudit } from "@/lib/admin/audit";
import { USER_PAGE_SIZE } from "@/lib/admin/log-constants";

export type AdminUserRow = {
  id: string;
  email: string | undefined;
  fullName: string | undefined;
  role: "student" | "admin";
  createdAt: string;
  lastSignInAt: string | undefined;
  emailConfirmed: boolean;
  isBanned: boolean;
};

export type ActionResult<T> = { ok: true; data: T } | { ok: false; errors: string[] };
export type UserListParams = {
  query?: string;
  role?: "student" | "admin";
  status?: "active" | "banned" | "unverified";
  limit?: number;
  offset?: number;
};

const ROLE_LABEL = { student: "دانش‌آموز", admin: "مدیر" } as const;

async function allUsers(): Promise<AdminUserRow[]> {
  const supabase = createSupabaseAdmin();
  const [{ data: usersPage, error: usersError }, { data: profiles, error: profilesError }] = await Promise.all([
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    supabase.from("profiles").select("id, role, full_name"),
  ]);
  if (usersError) throw new Error(`adminListUsers: ${usersError.message}`);
  if (profilesError) throw new Error(`adminListUsers profiles: ${profilesError.message}`);

  const roleById = new Map((profiles ?? []).map((profile) => [profile.id, profile.role as "student" | "admin"]));
  const nameById = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name ?? undefined]));

  return usersPage.users.map((user) => ({
    id: user.id,
    email: user.email,
    fullName: nameById.get(user.id) ?? (user.user_metadata?.full_name as string | undefined),
    role: roleById.get(user.id) ?? "student",
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? undefined,
    emailConfirmed: Boolean(user.email_confirmed_at),
    isBanned: Boolean(user.banned_until && new Date(user.banned_until) > new Date()),
  })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function adminListUsers(
  params: UserListParams = {},
): Promise<{ users: AdminUserRow[]; total: number }> {
  await requireAdmin();
  const search = params.query?.trim().toLocaleLowerCase("fa");
  let users = await allUsers();
  if (search) {
    users = users.filter((user) =>
      user.email?.toLocaleLowerCase("fa").includes(search) ||
      user.fullName?.toLocaleLowerCase("fa").includes(search),
    );
  }
  if (params.role) users = users.filter((user) => user.role === params.role);
  if (params.status === "banned") users = users.filter((user) => user.isBanned);
  if (params.status === "unverified") users = users.filter((user) => !user.emailConfirmed);
  if (params.status === "active") users = users.filter((user) => !user.isBanned && user.emailConfirmed);

  const total = users.length;
  const offset = Math.max(params.offset ?? 0, 0);
  const limit = Math.min(Math.max(params.limit ?? USER_PAGE_SIZE, 1), 200);
  return { users: users.slice(offset, offset + limit), total };
}

export async function adminGetUser(userId: string): Promise<AdminUserRow | null> {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const [{ data, error }, profileResult] = await Promise.all([
    supabase.auth.admin.getUserById(userId),
    supabase.from("profiles").select("role, full_name").eq("id", userId).maybeSingle(),
  ]);
  if (error || !data.user) return null;
  const user = data.user;
  return {
    id: user.id,
    email: user.email,
    fullName: profileResult.data?.full_name ?? (user.user_metadata?.full_name as string | undefined),
    role: (profileResult.data?.role as "student" | "admin" | undefined) ?? "student",
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? undefined,
    emailConfirmed: Boolean(user.email_confirmed_at),
    isBanned: Boolean(user.banned_until && new Date(user.banned_until) > new Date()),
  };
}

export async function adminUserCounts(): Promise<{
  total: number;
  admins: number;
  banned: number;
  unverified: number;
}> {
  await requireAdmin();
  const users = await allUsers();
  return {
    total: users.length,
    admins: users.filter((user) => user.role === "admin").length,
    banned: users.filter((user) => user.isBanned).length,
    unverified: users.filter((user) => !user.emailConfirmed).length,
  };
}

export async function adminSetUserRole(userId: string, role: "student" | "admin"): Promise<ActionResult<null>> {
  const admin = await requireAdmin();
  if (userId === admin.id && role !== "admin") {
    return { ok: false, errors: ["نمی‌توانید نقش مدیریت خودتان را بردارید."] };
  }
  const supabase = createSupabaseAdmin();
  const current = await adminGetUser(userId);
  const { error } = await supabase.from("profiles").upsert({ id: userId, role }, { onConflict: "id" });
  if (error) return { ok: false, errors: [error.message] };
  await recordAudit({
    actor: admin,
    action: "user.role_change",
    targetType: "user",
    targetId: userId,
    summary: `نقش «${current?.email ?? userId}» از ${ROLE_LABEL[current?.role ?? "student"]} به ${ROLE_LABEL[role]} تغییر کرد`,
    metadata: { previousRole: current?.role, nextRole: role },
  });
  return { ok: true, data: null };
}

export async function adminSetUserBanned(userId: string, banned: boolean): Promise<ActionResult<null>> {
  const admin = await requireAdmin();
  if (userId === admin.id) return { ok: false, errors: ["نمی‌توانید حساب خودتان را مسدود کنید."] };
  const user = await adminGetUser(userId);
  const { error } = await createSupabaseAdmin().auth.admin.updateUserById(userId, {
    ban_duration: banned ? "876000h" : "none",
  });
  if (error) return { ok: false, errors: [error.message] };
  await recordAudit({
    actor: admin,
    action: banned ? "user.ban" : "user.unban",
    targetType: "user",
    targetId: userId,
    summary: banned ? `کاربر «${user?.email ?? userId}» مسدود شد` : `مسدودی «${user?.email ?? userId}» برداشته شد`,
  });
  return { ok: true, data: null };
}

export async function adminDeleteUser(userId: string): Promise<ActionResult<null>> {
  const admin = await requireAdmin();
  if (userId === admin.id) return { ok: false, errors: ["نمی‌توانید حساب خودتان را حذف کنید."] };
  const user = await adminGetUser(userId);
  const { error } = await createSupabaseAdmin().auth.admin.deleteUser(userId);
  if (error) return { ok: false, errors: [error.message] };
  await recordAudit({
    actor: admin,
    action: "user.delete",
    targetType: "user",
    targetId: userId,
    summary: `کاربر «${user?.email ?? userId}» حذف شد`,
  });
  return { ok: true, data: null };
}
