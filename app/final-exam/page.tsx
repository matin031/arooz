import type { Metadata } from "next";
import FinalExam from "@/components/UI/FinalExam";
import { getPublicQuestions } from "@/lib/final-exam-questions";

export const metadata: Metadata = {
  title: "آزمون نهایی ادبیات فارسی",
  description:
    "آزمون تشریحی ادبیات فارسی در سبک امتحان نهایی با تصحیح هوشمند: پاسخ شما با پاسخنامه مقایسه، نمره‌گذاری و با نکته‌های آموزشی همراه می‌شود.",
};

function page() {
  // فقط نسخه بدون پاسخنامه به کلاینت ارسال می‌شود
  const questions = getPublicQuestions();
  return <FinalExam questions={questions} />;
}

export default page;
