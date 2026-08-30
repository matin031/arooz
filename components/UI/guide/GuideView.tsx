"use client";

import Link from "next/link";
import { motion, MotionConfig, useReducedMotion } from "motion/react";
import GuideChapter, { type Chapter } from "@/components/UI/guide/GuideChapter";
import {
  RevealGroup,
  RevealItem,
  RevealLine,
  RevealWords,
} from "@/components/UI/aruz/reveal";

const CHAPTERS: Chapter[] = [
  {
    index: "۰۱",
    tag: "عروضِ سماعی",
    title: "وزن را با گوش تشخیص بده",
    desc: "ریتمِ هر بیت را می‌شنوی و از میان گزینه‌ها وزنِ درست را انتخاب می‌کنی؛ سه نوع پرسشِ صوتی، بدونِ نیاز به حفظ‌کردنِ ارکان.",
    steps: [
      "روی دکمهٔ پخش بزن و به ریتم گوش بده",
      "وزن یا بیتِ هم‌وزن را از گزینه‌ها انتخاب کن",
      "بازخوردِ فوری بگیر و گوشِ موسیقایی‌ات را قوی کن",
    ],
    href: "/aruz",
    cta: "شروعِ عروضِ سماعی",
    accent: "var(--color-primary)",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9 9 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
      />
    ),
    preview: (
      <div className="flex h-8 items-end gap-1">
        {[10, 26, 16, 32, 20, 30, 14, 24, 12].map((height, index) => (
          <span key={index} className="w-1.5 rounded-full bg-primary/70" style={{ height }} />
        ))}
      </div>
    ),
  },
  {
    index: "۰۲",
    tag: "وزن‌یاب",
    title: "مصراع را بده، وزنش را بگیر",
    desc: "کافی‌ست بیت را تایپ کنی؛ سروا در مرورگر وزنِ عروضی و بحرِ آن را نشانت می‌دهد.",
    steps: ["دو مصراع را وارد کن", "ارکان را همان لحظه ببین", "نامِ وزن و بحر را بشناس"],
    href: "/vazn-yab",
    cta: "بازکردنِ وزن‌یاب",
    accent: "var(--color-gold)",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      />
    ),
    preview: (
      <span className="rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-sm font-bold text-gold">
        وزن: مفاعیلن فعولن
      </span>
    ),
  },
  {
    index: "۰۳",
    tag: "بازی‌ها",
    title: "با بازی یاد بگیر، نه با حفظ",
    desc: "جاسوسِ نقش‌ها، نینجای دستور و جفت‌های ادبی؛ مفاهیمِ ادبی و دستوری را با بازی‌های تعاملی تمرین می‌کنی.",
    steps: [
      "یکی از سه بازی را انتخاب کن",
      "نقش‌ها یا اثر و نویسنده را تمرین کن",
      "پیشرفت همان دور را در مرورگر نگه دار",
    ],
    href: "/game",
    cta: "رفتن به بازی‌ها",
    accent: "var(--color-lapis-light)",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
      />
    ),
    preview: (
      <div className="flex gap-2">
        {["🕵️", "🥷", "📚"].map((emoji) => (
          <span key={emoji} className="flex size-10 items-center justify-center rounded-xl border border-border bg-background/70 text-xl">
            {emoji}
          </span>
        ))}
      </div>
    ),
  },
  {
    index: "۰۴",
    tag: "درسنامه",
    title: "هر بیت را در سه قلمرو بخوان",
    desc: "درس روباهِ بی‌دست‌وپا از فارسی یازدهم، بیت‌به‌بیت با معنی و قلمروهای زبانی، ادبی و فکری باز می‌شود.",
    steps: [
      "درس منتشرشده را باز کن",
      "معنی و مفهوم هر بیت را بخوان",
      "نقش‌های دستوری و آرایه‌ها را روی بیت ببین",
    ],
    href: "/doroos/yazdahom/1",
    cta: "خواندنِ درسنامه",
    accent: "var(--color-primary)",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25A8.966 8.966 0 0 1 18 3.75c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
      />
    ),
    preview: <span className="font-serif text-lg font-bold text-primary">روباهِ بی‌دست‌وپا</span>,
  },
];

export default function GuideView() {
  const reduced = useReducedMotion() ?? false;

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative">
        <section dir="rtl" className="relative z-20 overflow-hidden py-16 sm:py-20">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -right-32 top-0 size-[380px] rounded-full bg-primary/20 blur-[80px]" />
            <div className="absolute -left-24 top-1/4 size-[340px] rounded-full bg-gold/15 blur-[80px]" />
          </div>

          <RevealGroup stagger={0.12} className="container text-center">
            <RevealItem>
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
                راهنمای سروا
              </span>
            </RevealItem>
            <h1 className="text-4xl leading-[1.15] font-black sm:text-5xl md:text-6xl">
              <RevealLine className="text-foreground" delay={0.08}>با هر بخشِ سروا</RevealLine>
              <RevealLine className="aruz-gradient-text" delay={0.2}>آشنا شو</RevealLine>
            </h1>
            <RevealItem>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                از عروضِ سماعی و وزن‌یاب تا بازی‌ها و درسنامه؛ این‌جا با هر بخشِ آماده و مستقلِ سروا کوتاه و کاربردی آشنا می‌شوی.
              </p>
            </RevealItem>
            <RevealItem>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link href="/aruz" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-6 font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:brightness-95 active:scale-95">
                  شروعِ یادگیری
                </Link>
                <span className="text-sm text-muted-foreground">۴ بخش · اسکرول کن تا همه را ببینی ↓</span>
              </div>
            </RevealItem>
          </RevealGroup>
        </section>

        {CHAPTERS.map((chapter, index) => (
          <GuideChapter key={chapter.index} chapter={chapter} flip={index % 2 === 1} reduced={reduced} />
        ))}

        <section dir="rtl" className="container relative z-20 py-16 sm:py-20">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="glass relative z-20 mx-auto max-w-3xl overflow-hidden rounded-[2.5rem] border border-primary/30 p-10 text-center shadow-2xl sm:p-16"
          >
            <h2 className="relative text-3xl font-black text-foreground sm:text-4xl">
              <RevealWords text="آماده‌ای شروع کنی؟" />
            </h2>
            <p className="relative mx-auto mt-4 max-w-lg text-muted-foreground">
              از یکی از بخش‌های آماده شروع کن و قدم‌به‌قدم جلو برو.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/game" className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-primary px-8 text-lg font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:brightness-95 active:scale-95">
                شروعِ بازی
              </Link>
              <Link href="/" className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-border bg-card/60 px-8 font-bold text-foreground transition-all hover:border-primary/40 active:scale-95">
                صفحهٔ اصلی
              </Link>
            </div>
          </motion.div>
        </section>
      </div>
    </MotionConfig>
  );
}
