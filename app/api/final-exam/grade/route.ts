import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getQuestionById } from "@/lib/final-exam-questions";

export const maxDuration = 60;

export type GradeResult = {
  score: number;
  verdict: "correct" | "partial" | "incorrect";
  feedback: string;
  lesson: string | null;
};

const gradeSchema = {
  type: "object",
  properties: {
    score: {
      type: "number",
      description:
        "نمره کسب‌شده کاربر بین صفر و بارم سوال، در گام‌های ۰/۲۵",
    },
    verdict: {
      type: "string",
      enum: ["correct", "partial", "incorrect"],
      description:
        "correct یعنی نمره کامل، partial یعنی بخشی از نمره، incorrect یعنی صفر",
    },
    feedback: {
      type: "string",
      description:
        "بازخورد کوتاه فارسی: مقایسه پاسخ کاربر با پاسخنامه و دلیل نمره",
    },
    lesson: {
      type: ["string", "null"],
      description:
        "اگر پاسخ کامل نبود، یک نکته آموزشی فارسی که مفهوم سوال را با مثال آموزش دهد؛ اگر پاسخ کاملاً درست بود null",
    },
  },
  required: ["score", "verdict", "feedback", "lesson"],
  additionalProperties: false,
} as const;

const systemPrompt = `تو یک دبیر باتجربه ادبیات فارسی هستی که برگه‌های امتحان نهایی را تصحیح می‌کنی و به دانش‌آموز آموزش می‌دهی.

وظایف تو:
۱. پاسخ دانش‌آموز را با پاسخنامه (کلید تصحیح) مقایسه کن. به معنا و مفهوم توجه کن، نه تطابق واژه‌به‌واژه؛ اگر دانش‌آموز با عبارت دیگری همان مفهوم درست را رسانده، نمره بده.
۲. طبق بارم سوال نمره بده (در گام‌های ۰/۲۵ و هرگز بیشتر از بارم). پاسخ خالی یا کاملاً بی‌ربط نمره صفر می‌گیرد.
۳. بازخورد کوتاه و دلگرم‌کننده بده: کدام بخش درست بود، کدام بخش جا افتاد یا غلط بود.
۴. اگر پاسخ کامل نبود، در بخش lesson همان مفهوم را مثل یک معلم آموزش بده: تعریف ساده، روش تشخیص، و یک یا دو مثال. مثلاً اگر سوال درباره «مسند» است و دانش‌آموز اشتباه جواب داده، توضیح بده مسند چیست (ویژگی یا حالتی که با فعل اسنادی مانند است/بود/شد به نهاد نسبت داده می‌شود) و با مثال نشان بده چطور آن را پیدا کند.
۵. لحن تو محترمانه، صمیمی و آموزشی است و همه خروجی‌ها به زبان فارسی است.`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return NextResponse.json(
      { error: "سرویس هوش مصنوعی پیکربندی نشده است (ANTHROPIC_API_KEY)" },
      { status: 503 },
    );
  }

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
    // پاسخ خالی نیازی به تماس با هوش مصنوعی ندارد
    const result: GradeResult = {
      score: 0,
      verdict: "incorrect",
      feedback: "پاسخی ثبت نشده است.",
      lesson: null,
    };
    return NextResponse.json(result);
  }

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      system: systemPrompt,
      output_config: {
        format: {
          type: "json_schema",
          schema: gradeSchema,
        },
      },
      messages: [
        {
          role: "user",
          content: `موضوع سوال: ${question.topic}
بارم سوال: ${question.maxScore} نمره

صورت سوال:
${question.question}

پاسخنامه (کلید تصحیح):
${question.answerKey}

پاسخ دانش‌آموز:
${trimmedAnswer}

پاسخ دانش‌آموز را تصحیح کن و نمره بده.`,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "تصحیح این پاسخ ممکن نبود. لطفاً دوباره تلاش کنید" },
        { status: 502 },
      );
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock) {
      return NextResponse.json(
        { error: "پاسخی از سرویس تصحیح دریافت نشد" },
        { status: 502 },
      );
    }

    const parsed = JSON.parse(textBlock.text) as GradeResult;

    // نمره را در محدوده مجاز نگه می‌داریم
    const score = Math.min(
      question.maxScore,
      Math.max(0, Math.round(parsed.score * 4) / 4),
    );

    const result: GradeResult = {
      score,
      verdict: parsed.verdict,
      feedback: parsed.feedback,
      lesson: parsed.lesson,
    };
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "درخواست‌ها زیاد است؛ لطفاً چند لحظه بعد دوباره تلاش کنید" },
        { status: 429 },
      );
    }
    if (error instanceof Anthropic.APIConnectionError) {
      return NextResponse.json(
        { error: "اتصال به سرویس تصحیح برقرار نشد" },
        { status: 502 },
      );
    }
    if (error instanceof Anthropic.APIError) {
      console.error("Anthropic API error:", error.status, error.message);
      return NextResponse.json(
        { error: "خطا در سرویس تصحیح هوشمند" },
        { status: 502 },
      );
    }
    console.error("Grading failed:", error);
    return NextResponse.json(
      { error: "خطای غیرمنتظره در تصحیح پاسخ" },
      { status: 500 },
    );
  }
}
