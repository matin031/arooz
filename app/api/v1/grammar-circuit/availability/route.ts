import { GRADE_KEYS, selectableLessons } from "@/lib/grammar-circuit/curriculum";
import { getGrammarCircuitQuestions } from "@/lib/grammar-circuit/static-content";

export async function GET() {
  const questions = await getGrammarCircuitQuestions();
  const counts = new Map<string, number>();
  for (const question of questions) {
    if (!question.grade || question.lesson === undefined) continue;
    const key = `${question.grade}:${question.lesson}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Response.json({
    grades: GRADE_KEYS.map((grade) => ({
      grade,
      lessons: selectableLessons(grade).map((lesson) => {
        const questionCount = counts.get(`${grade}:${lesson}`) ?? 0;
        return { lesson, available: questionCount > 0, questionCount };
      }),
    })),
  });
}
