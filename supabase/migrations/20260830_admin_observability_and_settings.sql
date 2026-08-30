-- Frontend parity support for the Sarva-style admin activity/settings UI.
-- Safe to run more than once. It does not drop, truncate, or delete data.

create extension if not exists pgcrypto;

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text not null,
  action text not null,
  target_type text not null,
  target_id text,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  ip inet,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_at_idx
  on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_actor_id_idx
  on public.admin_audit_log (actor_id, created_at desc);
create index if not exists admin_audit_log_target_idx
  on public.admin_audit_log (target_type, target_id, created_at desc);
create index if not exists admin_audit_log_action_idx
  on public.admin_audit_log (action, created_at desc);

create table if not exists public.app_error_log (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  message text not null,
  context text,
  detail text,
  fingerprint text not null,
  occurrences integer not null default 1 check (occurrences > 0),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  constraint app_error_log_resolution_check
    check (resolved_at is not null or resolved_by is null)
);

create unique index if not exists app_error_log_open_fingerprint_uidx
  on public.app_error_log (fingerprint)
  where resolved_at is null;
create index if not exists app_error_log_recent_idx
  on public.app_error_log (last_seen_at desc);
create index if not exists app_error_log_open_idx
  on public.app_error_log (last_seen_at desc)
  where resolved_at is null;

create or replace function public.record_app_error(
  p_source text,
  p_message text,
  p_context text,
  p_detail text,
  p_fingerprint text
) returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.app_error_log (source, message, context, detail, fingerprint)
  values (p_source, p_message, p_context, p_detail, p_fingerprint)
  on conflict (fingerprint) where resolved_at is null
  do update set
    occurrences = public.app_error_log.occurrences + 1,
    last_seen_at = now();
end;
$$;

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  constraint app_settings_key_check check (
    key in ('mail.from', 'sms.driver', 'sms.api_key', 'sms.sender', 'sms.base_url')
  )
);

alter table public.admin_audit_log enable row level security;
alter table public.app_error_log enable row level security;
alter table public.app_settings enable row level security;

-- These tables are intentionally server-only. Admin identity is checked by
-- requireAdmin(), then all access uses the service-role Supabase client.
revoke all on table public.admin_audit_log from anon, authenticated;
revoke all on table public.app_error_log from anon, authenticated;
revoke all on table public.app_settings from anon, authenticated;

grant select, insert, update, delete on table public.admin_audit_log to service_role;
grant select, insert, update, delete on table public.app_error_log to service_role;
grant select, insert, update, delete on table public.app_settings to service_role;
revoke all on function public.record_app_error(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.record_app_error(text, text, text, text, text) to service_role;

comment on table public.admin_audit_log is
  'Server-only audit trail for authenticated Arooz administrators.';
comment on table public.app_error_log is
  'Server-only deduplicated application errors for the admin activity UI.';
comment on table public.app_settings is
  'Server-only runtime settings; secret values are never sent back to the browser.';
