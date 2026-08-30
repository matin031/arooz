export type NavLink = { href: string; label: string };

export const HEADER_NAV_LINKS: NavLink[] = [
  { href: "/game", label: "بازی‌ها" },
  { href: "/doroos", label: "درسنامه" },
  { href: "/aruz", label: "عروض" },
  { href: "/vazn-yab", label: "وزن‌یاب" },
  { href: "/guide", label: "راهنما" },
];

export const FOOTER_SECTIONS: { title: string; links: NavLink[] }[] = [
  {
    title: "یادگیری",
    links: [
      { href: "/doroos", label: "درسنامه" },
      { href: "/guide", label: "راهنمای یادگیری" },
      { href: "/quiz", label: "آزمون عروض سماعی" },
    ],
  },
  {
    title: "ابزارها",
    links: [
      { href: "/vazn-yab", label: "وزن‌یاب" },
      { href: "/game", label: "بازی‌ها" },
      { href: "/aruz", label: "معرفی عروض" },
    ],
  },
  {
    title: "حساب",
    links: [
      { href: "/auth", label: "ورود و ثبت‌نام" },
      { href: "/panel", label: "پنل کاربری" },
    ],
  },
  {
    title: "سروا",
    links: [
      { href: "/", label: "صفحهٔ اصلی" },
      { href: "/about", label: "دربارهٔ ما" },
    ],
  },
];
