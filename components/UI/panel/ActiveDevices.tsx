"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

function browserLabel(): string {
  if (typeof navigator === "undefined") return "این مرورگر";
  const agent = navigator.userAgent;
  const browser = agent.includes("Edg/") ? "Edge" : agent.includes("Firefox/") ? "Firefox" : agent.includes("Chrome/") ? "Chrome" : agent.includes("Safari/") ? "Safari" : "مرورگر";
  const system = agent.includes("Windows") ? "Windows" : agent.includes("Android") ? "Android" : /iPhone|iPad/.test(agent) ? "iOS" : agent.includes("Mac OS") ? "macOS" : "این دستگاه";
  return `${browser} روی ${system}`;
}

export default function ActiveDevices() {
  const [device, setDevice] = useState("این مرورگر");
  const [signedInAt, setSignedInAt] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setDevice(browserLabel());
      setSignedInAt(data.session?.user.last_sign_in_at ?? data.session?.user.created_at ?? null);
    });
  }, []);

  const revokeOthers = async () => {
    setConfirming(false);
    setBusy(true);
    setError(null);
    setMessage(null);
    const { error: signOutError } = await supabase.auth.signOut({ scope: "others" });
    setBusy(false);
    if (signOutError) {
      setError(signOutError.message);
      return;
    }
    setMessage("همهٔ نشست‌های دیگر بسته شدند؛ همین دستگاه وارد می‌ماند.");
  };

  return (
    <section className="glass flex flex-col gap-4 rounded-2xl p-5">
      <div>
        <h3 className="font-semibold">دستگاه‌های وارد شده</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Supabase جزئیات نشست‌های دیگر را به مرورگر نشان نمی‌دهد، اما می‌توانی همهٔ آن‌ها را امن و یکجا ببندی.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/40 bg-primary/5 p-3">
        <div>
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
            {device}
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] text-primary">همین دستگاه</span>
          </p>
          {signedInAt && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              آخرین ورود: {new Date(signedInAt).toLocaleString("fa-IR")}
            </p>
          )}
        </div>
      </div>
      {message && <p className="text-sm text-primary">{message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button type="button" disabled={busy} onClick={() => setConfirming(true)}
        className="min-h-11 self-start rounded-xl border border-destructive/40 px-5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60">
        {busy ? "در حال خروج…" : "خروج از همهٔ دستگاه‌های دیگر"}
      </button>
      <ConfirmDialog
        open={confirming}
        title="خروج از دستگاه‌های دیگر"
        body="همهٔ نشست‌های دیگر این حساب در Supabase بسته می‌شوند."
        consequence="همین دستگاه وارد می‌ماند."
        confirmLabel="نشست‌های دیگر را ببند"
        onConfirm={revokeOthers}
        onCancel={() => setConfirming(false)}
      />
    </section>
  );
}
