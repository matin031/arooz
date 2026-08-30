import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getGrade,
  getLesson,
  parseLessonNumber,
  readyLessonParams,
} from "@/lib/doroos";
import LessonView from "@/components/UI/doroos/LessonView";

export function generateStaticParams() {
  return readyLessonParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ grade: string; lesson: string }>;
}): Promise<Metadata> {
  const { grade: gradeKey, lesson: lessonNo } = await params;
  const grade = getGrade(gradeKey);
  const number = parseLessonNumber(lessonNo);
  const lesson = number === null ? null : await getLesson(gradeKey, number);

  if (!grade || !lesson) {
    // درسی که هنوز نوشته نشده نباید ایندکس شود — وگرنه گوگل صفحه‌ای را ثبت
    // می‌کند که محتوایش هیچ‌وقت آنجا نبوده.
    return { title: "درسنامه", robots: { index: false, follow: true } };
  }

  return {
    title: `${lesson.title} — ${grade.book}`,
    description:
      lesson.kind === "poem"
        ? `شرحِ بیت‌به‌بیتِ «${lesson.title}» با تفکیکِ قلمرو زبانی، ادبی و فکری.`
        : `شرحِ «${lesson.title}» با تفکیکِ قلمرو زبانی، ادبی و فکری.`,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ grade: string; lesson: string }>;
}) {
  const { grade: gradeKey, lesson: lessonNo } = await params;
  const grade = getGrade(gradeKey);
  const number = parseLessonNumber(lessonNo);

  if (!grade || number === null) notFound();

  const lesson = await getLesson(gradeKey, number);
  if (!lesson) notFound();
  return <LessonView grade={grade} lesson={lesson} />;
}
