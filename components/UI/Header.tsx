"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { motion } from "motion/react";
import { supabase } from "@/lib/supabase";
import { HEADER_NAV_LINKS } from "@/lib/site-nav";
import MainLogo from "../svgs/mainLogo";
import DarkModeButton from "./DarkModeButton";
import MobileDrawer, { DrawerToggle } from "./MobileDrawer";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const nameRef = useRef<HTMLSpanElement>(null);
  const [isOverflow, setIsOverflow] = useState(false);

  // The existing Supabase auth source remains authoritative.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!nameRef.current) return;
    setIsOverflow(
      nameRef.current.scrollWidth > nameRef.current.parentElement!.clientWidth,
    );
  }, [user]);

  return (
    <>
      <nav className="container relative z-200 mt-4 flex items-center justify-between gap-3" dir="rtl">
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link className="flex items-center gap-x-2 transition hover:brightness-90" href="/">
            <span id="site-logo" className="size-13 text-primary-foreground">
              <MainLogo />
            </span>
            <span className="hidden text-3xl font-bold text-primary sm:block">ســـروا</span>
          </Link>
        </motion.div>

        <div className="hidden items-center gap-4 text-sm font-semibold text-muted-foreground lg:flex">
          {HEADER_NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-primary">
              {link.label}
            </Link>
          ))}
          <Link href="/about" className="transition-colors hover:text-primary">درباره</Link>
        </div>

        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2 font-semibold sm:gap-3"
        >
          <DarkModeButton />
          {user ? (
            <>
              <Link
                href="/panel"
                className="glass hidden max-w-24 overflow-hidden rounded-lg px-4 py-1 text-sm transition-all hover:bg-accent/70! active:scale-95 sm:flex"
              >
                <span
                  ref={nameRef}
                  className={isOverflow ? "animate-marquee whitespace-nowrap" : "whitespace-nowrap"}
                >
                  {user.user_metadata?.full_name ?? "پنل کاربری"}
                </span>
              </Link>
              <Link
                href="/panel"
                aria-label="پنل کاربری"
                className="glass flex rounded-lg p-2 transition-all hover:bg-accent/70! active:scale-95 sm:hidden"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </Link>
            </>
          ) : (
            <Link href="/auth" className="glass rounded-lg px-4 py-1 text-sm transition-all hover:bg-accent/70! active:scale-95">
              ورود
            </Link>
          )}
          <Link href="/quiz" className="hidden rounded-lg bg-primary px-5 py-1 text-sm text-white transition-all hover:brightness-90 active:scale-95 sm:block">
            آغاز یادگیری
          </Link>
          <span className="lg:hidden">
            <DrawerToggle onClick={() => setMenuOpen(true)} label="باز کردن فهرست سایت" />
          </span>
        </motion.div>
      </nav>

      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} title="فهرست سروا">
        <nav className="space-y-1">
          {HEADER_NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="block rounded-xl px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
              {link.label}
            </Link>
          ))}
          <Link href="/about" className="block rounded-xl px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
            دربارهٔ ما
          </Link>
          <Link href="/quiz" className="mt-4 block rounded-xl bg-primary px-4 py-3 text-center text-sm font-bold text-primary-foreground">
            آغاز یادگیری
          </Link>
        </nav>
      </MobileDrawer>
    </>
  );
}
