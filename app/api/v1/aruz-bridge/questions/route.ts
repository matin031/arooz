import type { NextRequest } from "next/server";
import { ARUZ_BRIDGE_QUESTIONS } from "@/lib/aruz-bridge/static-content";
import type { Difficulty } from "@/lib/aruz-bridge/types";

const MAX_LIMIT = 1000;

function error(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const difficultyRaw = params.get("difficulty");
  let difficulty: Difficulty | null = null;
  if (difficultyRaw !== null) {
    const parsed = Number(difficultyRaw);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 3) {
      return error("سطحِ سختی باید ۱، ۲ یا ۳ باشد.", 400);
    }
    difficulty = parsed as Difficulty;
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

  const questions = ARUZ_BRIDGE_QUESTIONS.filter(
    (question) => difficulty === null || question.difficulty === difficulty,
  ).slice(0, take);

  return Response.json({ questions });
}
