import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import type { GrammarCircuitQuestion } from "../types";
import { validateGrammarCircuitQuestion } from "../validator";

interface SeedRecord
  extends Omit<GrammarCircuitQuestion, "id" | "isDemo"> {
  sourceId: string;
  isPublished?: boolean;
}

test("بستهٔ دوازدهم دقیقاً ۵۵۰ پرسشِ یکتا و معتبر دارد", async () => {
  const json = await readFile(
    new URL("../seed-data/davazdahom-v1.json", import.meta.url),
    "utf8",
  );
  const records = JSON.parse(json) as SeedRecord[];
  assert.equal(records.length, 550);
  assert.equal(new Set(records.map((record) => record.sourceId)).size, 550);

  const lessons = new Set<number>();
  for (const record of records) {
    assert.equal(record.grade, "davazdahom");
    assert.notEqual(record.isPublished, false);
    assert.ok(record.lesson !== undefined);
    lessons.add(record.lesson);

    const result = validateGrammarCircuitQuestion({
      ...record,
      id: record.sourceId,
      sourceId: record.sourceId,
    });
    assert.equal(
      result.ok,
      true,
      `${record.sourceId}: ${result.errors.join(" | ")}`,
    );
  }

  assert.deepEqual([...lessons].sort((a, b) => a - b), [
    1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18,
  ]);
});
