import "server-only";

import rawQuestions from "./seed-data/questions-v1.json";
import type { AruzBridgeQuestion, Difficulty } from "./types";

interface SeedQuestion {
  id: number;
  phrase: string;
  option1: string;
  option2: string;
  correctOption: 1 | 2;
  correctAnswer?: string;
}

const FOOT: Record<string, string> = {
  "فعولن": "U--",
  "فعل": "U-",
  "فعولان": "U---",
  "فاعلن": "-U-",
  "فاعلاتن": "-U--",
  "فاعلات": "-U-U",
  "فعلاتن": "UU--",
  "فعلات": "UU-U",
  "فعلن": "UU-",
  "مفاعیلن": "U---",
  "مفاعیل": "U--U",
  "مفاعلن": "U-U-",
  "مفاعلتن": "U-UU-",
  "مستفعلن": "--U-",
  "مستفعل": "--U",
  "مستفعلتن": "--UU-",
  "مفعول": "--U",
  "مفعولن": "---",
  "مفعولات": "---U",
  "مفتعلن": "-UU-",
  "متفاعلن": "UU-U-",
  "متفاعلاتن": "UU-U--",
  "فع": "-",
  "لن": "-",
  "فع‌لن": "--",
};

function distance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[b.length];
}

function difficultyOf(correct: string, wrong: string): Difficulty {
  const a = FOOT[correct];
  const b = FOOT[wrong];
  if (!a || !b) return 2;
  const delta = distance(a, b);
  return delta <= 1 ? 3 : delta === 2 ? 2 : 1;
}

export const ARUZ_BRIDGE_QUESTIONS: readonly AruzBridgeQuestion[] = (
  rawQuestions as SeedQuestion[]
).map((record) => {
  const correct =
    record.correctOption === 1 ? record.option1.trim() : record.option2.trim();
  const wrong =
    record.correctOption === 1 ? record.option2.trim() : record.option1.trim();

  if (
    !Number.isInteger(record.id) ||
    !record.phrase.trim() ||
    !correct ||
    !wrong ||
    correct === wrong ||
    (record.correctAnswer !== undefined && record.correctAnswer !== correct)
  ) {
    throw new Error(`پرسشِ نامعتبر در بستهٔ پل وزن: ${record.id}`);
  }

  return {
    id: String(record.id),
    promptText: record.phrase.trim(),
    correctPattern: correct,
    wrongPattern: wrong,
    difficulty: difficultyOf(correct, wrong),
  };
});
