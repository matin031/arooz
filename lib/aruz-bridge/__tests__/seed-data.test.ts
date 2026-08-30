import assert from "node:assert/strict";
import test from "node:test";

import rawQuestions from "../seed-data/questions-v1.json";

interface SeedQuestion {
  id: number;
  phrase: string;
  option1: string;
  option2: string;
  correctOption: 1 | 2;
  correctAnswer?: string;
}

test("بستهٔ پل وزن ۶۳۶ پرسشِ یکتا و قابلِ پاسخ دارد", () => {
  const questions = rawQuestions as SeedQuestion[];
  assert.equal(questions.length, 636);
  assert.equal(new Set(questions.map((question) => question.id)).size, 636);

  for (const question of questions) {
    const correct =
      question.correctOption === 1 ? question.option1 : question.option2;
    const wrong =
      question.correctOption === 1 ? question.option2 : question.option1;
    assert.ok(Number.isInteger(question.id));
    assert.ok(question.phrase.trim());
    assert.ok(correct.trim());
    assert.ok(wrong.trim());
    assert.notEqual(correct, wrong);
    if (question.correctAnswer !== undefined) {
      assert.equal(question.correctAnswer, correct);
    }
  }
});
