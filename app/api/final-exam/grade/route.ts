import { NextResponse } from "next/server";
import { getQuestionById } from "@/lib/final-exam-questions";
import { gradeAnswer, type GradeResult } from "@/lib/exam-ai/engine";

// تصحیح با موتور هوشمند داخلی سایت انجام می‌شود؛ بدون سرویس خارجی.
// این مسیر سمت سرور می‌ماند تا پاسخنامه و معیار تصحیح به مرورگر نرسد.

export type { GradeResult };

export async function POST(req: Request) {
  let body: { questionId?: string; userAnswer?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "درخواست نامعتبر است" }, { status: 400 });
  }

  const { questionId, userAnswer } = body;
  if (!questionId || typeof userAnswer !== "string") {
    return NextResponse.json(
      { error: "شناسه سوال و پاسخ الزامی است" },
      { status: 400 },
    );
  }

  const question = getQuestionById(questionId);
  if (!question) {
    return NextResponse.json({ error: "سوال یافت نشد" }, { status: 404 });
  }

  const trimmedAnswer = userAnswer.trim().slice(0, 2000);
  if (!trimmedAnswer) {
    const result: GradeResult = {
      score: 0,
      verdict: "incorrect",
      feedback: "پاسخی ثبت نشده است.",
      lesson: null,
      correctAnswer: question.answerKey,
    };
    return NextResponse.json(result);
  }

  const result = gradeAnswer({
    rubric: question.rubric,
    maxScore: question.maxScore,
    lessonKey: question.lessonKey,
    answerKey: question.answerKey,
    userAnswer: trimmedAnswer,
  });

  return NextResponse.json(result);
}
