import type { NextRequest } from "next/server";
import { GRAMMAR_CIRCUIT_CONFIG } from "@/lib/grammar-circuit/config";
import {
  isSelectableLesson,
  isValidGradeKey,
  LESSONS_PER_GRADE,
} from "@/lib/grammar-circuit/curriculum";
import { getGrammarCircuitQuestions } from "@/lib/grammar-circuit/static-content";

const MAX_LIMIT = 200;

function error(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const grade = params.get("grade");
  if (!isValidGradeKey(grade)) {
    return error("پایهٔ درخواستی نامعتبر است.", 400);
  }

  const lessonsRaw = params.get("lessons");
  if (!lessonsRaw?.trim()) {
    return error("دستِ‌کم یک درس باید انتخاب شود.", 400);
  }

  const parts = lessonsRaw.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length > GRAMMAR_CIRCUIT_CONFIG.maxLessonsPerSession) {
    return error(
      `حداکثر ${GRAMMAR_CIRCUIT_CONFIG.maxLessonsPerSession} درس در یک تمرین.`,
      400,
    );
  }

  const lessons: number[] = [];
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return error("شمارهٔ درس باید عدد باشد.", 400);
    const lesson = Number(part);
    if (!Number.isInteger(lesson) || lesson < 1 || lesson > LESSONS_PER_GRADE) {
      return error(`شمارهٔ درس باید بین ۱ تا ${LESSONS_PER_GRADE} باشد.`, 400);
    }
    if (!isSelectableLesson(grade, lesson)) {
      return error(`درس ${lesson} در این پایه برای «مدار دستور» در دسترس نیست.`, 400);
    }
    if (lessons.includes(lesson)) {
      return error("درسِ تکراری در فهرست.", 400);
    }
    lessons.push(lesson);
  }

  const limitRaw = params.get("limit");
  let take = MAX_LIMIT;
  if (limitRaw !== null) {
    const parsed = Number(limitRaw);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return error("تعدادِ درخواستی نامعتبر است.", 400);
    }
    take = Math.min(parsed, MAX_LIMIT);
  }

  const pool = await getGrammarCircuitQuestions();
  const questions = pool.filter(
    (question) =>
      question.grade === grade &&
      question.lesson !== undefined &&
      lessons.includes(question.lesson),
  ).slice(0, take);

  return Response.json({ grade, lessons, questions });
}
