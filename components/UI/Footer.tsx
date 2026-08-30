import Link from "next/link";
import { FOOTER_SECTIONS } from "@/lib/site-nav";
import MainLogo from "../svgs/mainLogo";

const SOCIALS = [
  {
    href: "https://t.me/jafarimatin",
    label: "تلگرام",
    path: "M22 3 2 11l6 2 2 6 4-4 5 4z",
  },
  {
    href: "https://www.instagram.com/jafarimatin13?igsh=NjhsMjlqNWN3NDAw",
    label: "اینستاگرام",
    path: "M3 7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4zm9 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6m5-2h.01",
  },
];

const EMAIL = "matinjafaridev@gmail.com";

export default function Footer() {
  return (
    <footer dir="rtl" className="relative z-20 mt-20 w-full border-t border-border">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-primary/40 to-transparent" />

      <div className="container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
        <div className="sm:col-span-2 lg:col-span-4">
          <Link href="/" className="inline-flex items-center gap-x-2">
            <span className="size-11 text-primary"><MainLogo /></span>
            <span className="text-2xl font-bold text-primary">سروا</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            پلتفرمی تعاملی برای یادگیری عروض، وزن شعر، دستور زبان و ادب فارسی.
          </p>
          <Link href={`mailto:${EMAIL}`} className="mt-5 inline-flex items-center gap-x-2 text-sm text-muted-foreground transition-colors hover:text-primary">
            <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            <span dir="ltr">{EMAIL}</span>
          </Link>
          <div className="mt-5 flex items-center gap-x-3">
            {SOCIALS.map((social) => (
              <Link key={social.label} href={social.href} aria-label={social.label} target="_blank" rel="noreferrer noopener" className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary hover:text-primary-foreground">
                <svg className="size-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" viewBox="0 0 24 24" aria-hidden>
                  <path d={social.path} />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        <nav aria-label="پیوندهای سایت" className="grid grid-cols-2 gap-x-6 gap-y-8 sm:col-span-2 sm:grid-cols-4 lg:col-span-8">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="mb-3 text-xs font-black tracking-[0.15em] text-foreground">{section.title}</h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary">
                      <span aria-hidden className="h-px w-0 bg-primary transition-all duration-300 group-hover:w-2.5" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-y-2 py-5 text-xs text-muted-foreground sm:flex-row sm:text-sm">
          <p>© ۲۰۲۶ کلیهٔ حقوق برای <span className="font-bold text-primary">سروا</span> محفوظ است.</p>
          <p>ساخته‌شده برای عاشقان ادبیات فارسی توسط متین</p>
        </div>
      </div>
    </footer>
  );
}
