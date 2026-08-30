"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function EmailVerification() {
  const [email, setEmail] = useState("");
  const [verified, setVerified] = useState<boolean | null>(null);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      setVerified(Boolean(data.user?.email_confirmed_at));
    });
  }, []);

  if (verified === null || !email) return null;
  if (verified) {
    return (
      <section className="glass flex items-center gap-3 rounded-2xl p-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
          </svg>
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold">ایمیلت تأیید شده</h3>
          <p className="truncate text-sm text-muted-foreground" dir="ltr">{email}</p>
        </div>
      </section>
    );
  }

  const sendCode = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    const { error: resendError } = await supabase.auth.resend({ type: "signup", email });
    setLoading(false);
    if (resendError) {
      setError(resendError.message);
      return;
    }
    setSent(true);
    setMessage("کد تأیید به ایمیلت فرستاده شد. صندوق ورودی و پوشهٔ اسپم را ببین.");
    setTimeout(() => inputRefs.current[0]?.focus(), 50);
  };

  const onDigit = (index: number, value: string) => {
    const digit = value
      .replace(/[۰-۹]/g, (char) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(char)))
      .replace(/\D/g, "")
      .slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const verify = async () => {
    const token = code.join("");
    if (token.length !== 6) {
      setError("کد ۶ رقمی را کامل وارد کن.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: verifyError } = await supabase.auth.verifyOtp({ email, token, type: "signup" });
    setLoading(false);
    if (verifyError) {
      setError(verifyError.message);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      return;
    }
    setVerified(true);
    setMessage("ایمیلت تأیید شد.");
  };

  return (
    <section className="glass flex flex-col gap-4 rounded-2xl border border-gold/30 p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="size-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold">ایمیلت هنوز تأیید نشده</h3>
          <p className="mt-1 text-sm text-muted-foreground">برای بازیابی امن حساب، ایمیلت را تأیید کن.</p>
          <p className="mt-1 truncate text-sm text-muted-foreground" dir="ltr">{email}</p>
        </div>
      </div>

      {sent && (
        <div className="flex justify-center gap-2" dir="ltr">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(element) => { inputRefs.current[index] = element; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(event) => onDigit(index, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Backspace" && !code[index] && index > 0) inputRefs.current[index - 1]?.focus();
              }}
              aria-label={`رقم ${index + 1} از کد تأیید`}
              className="size-11 rounded-xl border-2 border-border bg-background text-center text-lg font-bold outline-none transition-colors focus:border-primary"
            />
          ))}
        </div>
      )}

      {message && <p className="text-sm text-primary">{message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {sent && (
          <button type="button" disabled={loading} onClick={verify}
            className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-60">
            {loading ? "در حال بررسی…" : "تأیید کد"}
          </button>
        )}
        <button type="button" disabled={loading} onClick={sendCode}
          className={`min-h-11 rounded-xl px-5 text-sm font-semibold disabled:opacity-60 ${sent ? "border border-border text-muted-foreground" : "bg-primary text-primary-foreground"}`}>
          {loading && !sent ? "در حال ارسال…" : sent ? "ارسال دوبارهٔ کد" : "ارسال کد تأیید"}
        </button>
      </div>
    </section>
  );
}
