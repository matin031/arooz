import type { Grade, GradeKey, Lesson } from "@/lib/doroos/types";

/** Registry for the درسنامه section. Only content that actually exists is
 * published here; unfinished book/lesson placeholders are intentionally absent. */

/**
 * شمارهٔ درس از آدرس.
 *
 * ⚠️ ارقام فارسی هم پذیرفته می‌شوند. کلِ رابط شماره‌ها را فارسی نشان می‌دهد
 * («درس ۱»)، پس کاربری که آدرس را از روی صفحه تایپ یا کپی می‌کند، طبیعتاً
 * `/doroos/yazdahom/۱` می‌سازد — و `Number("۱")` در جاوااسکریپت NaN است، یعنی
 * یک ۴۰۴ برای درسی که وجود دارد.
 *
 * `Number` تنها بعد از این نرمال‌سازی صدا زده می‌شود و ورودی‌هایی مثل "1.5" یا
 * "1e2" یا رشتهٔ خالی هم رد می‌شوند: شمارهٔ درس یک عدد صحیح است، نه هر چیزی که
 * جاوااسکریپت بتواند به عدد تبدیلش کند.
 */
export function parseLessonNumber(raw: string): number | null {
  // ⚠️ اول decode. Next پارامترِ مسیر را **کدشده** می‌دهد، نه رمزگشایی‌شده:
  //    برای `/doroos/yazdahom/۱` رشته‌ای که به اینجا می‌رسد `"%DB%B1"` است، نه
  //    `"۱"`. بدون این خط، نرمال‌سازیِ ارقام فارسیِ پایین هیچ‌وقت چیزی برای
  //    نرمال کردن پیدا نمی‌کرد. (این با یک لاگِ موقت روی همان مسیر دیده شد،
  //    نه از روی حدس.)
  //
  //    decodeURIComponent روی `%` تنها یا دنبالهٔ ناقص استثنا می‌دهد، و
  //    آدرس را کاربر می‌سازد — پس داخل try.
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }

  // ارقام فارسی (۰-۹، U+06F0..U+06F9) و عربی (٠-٩، U+0660..U+0669) هر دو
  // پذیرفته می‌شوند: کلِ رابط شماره‌ها را فارسی نشان می‌دهد («درس ۱»)، پس
  // کاربری که آدرس را از روی صفحه کپی یا تایپ می‌کند طبیعتاً همان را می‌سازد.
  const normalized = decoded
    .trim()
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

  // فقط رقم — نه "1.5"، نه "1e2"، نه رشتهٔ خالی. شمارهٔ درس عدد صحیح است، نه
  // هر چیزی که Number بتواند به عدد تبدیلش کند.
  if (!/^\d+$/.test(normalized)) return null;
  const n = Number(normalized);
  return Number.isInteger(n) ? n : null;
}

export const GRADES: Grade[] = [
  {
    key: "yazdahom",
    label: "یازدهم",
    book: "فارسی ۲",
    lessons: [{ number: 1, title: "روباهِ بی‌دست‌وپا", ready: true }],
  },
];

export const GRADE_KEYS = GRADES.map((g) => g.key);

export function getGrade(key: string): Grade | undefined {
  return GRADES.find((g) => g.key === key);
}

/** Content modules, imported lazily so a lesson's text is only shipped to the
 *  reader who opens that lesson — 54 lessons of analysis must never all land in
 *  one bundle. */
const CONTENT: Partial<
  Record<GradeKey, Record<number, () => Promise<{ default: Lesson }>>>
> = {
  yazdahom: {
    1: () => import("@/lib/doroos/content/yazdahom-01"),
  },
};

export async function getLesson(
  grade: string,
  number: number,
): Promise<Lesson | null> {
  const loader = CONTENT[grade as GradeKey]?.[number];
  if (!loader) return null;
  const mod = await loader();
  return mod.default;
}

/** Every (grade, lesson) pair that has content — used to prerender exactly the
 *  lesson pages that exist. */
export function readyLessonParams(): { grade: string; lesson: string }[] {
  return GRADES.flatMap((g) =>
    g.lessons
      .filter((l) => l.ready)
      .map((l) => ({ grade: g.key, lesson: String(l.number) })),
  );
}

/** Persian digits, for labels like «درس ۱۲». */
export function faNum(n: number | string): string {
  return String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}
