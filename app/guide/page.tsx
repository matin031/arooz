import type { Metadata } from "next";
import GuideView from "@/components/UI/guide/GuideView";

export const metadata: Metadata = {
  title: "راهنمای سروا | با هر بخش آشنا شو",
  description:
    "راهنمای بخش‌های آمادهٔ سروا: عروض سماعی، وزن‌یاب محلی، بازی‌های ادبی و دستوری و درسنامهٔ فارسی.",
  alternates: { canonical: "/guide" },
  openGraph: {
    title: "راهنمای سروا",
    description: "از عروض سماعی تا وزن‌یاب، بازی‌ها و درسنامهٔ فارسی.",
    url: "/guide",
  },
};

export default function GuidePage() {
  return <GuideView />;
}
