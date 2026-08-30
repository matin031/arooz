import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { GrammarCircuitQuestion } from "./types";
import { filterValidQuestions } from "./validator";

interface SeedRecord
  extends Omit<GrammarCircuitQuestion, "id" | "isDemo"> {
  sourceId: string;
  isPublished?: boolean;
  sortIndex?: number;
}

let cachedQuestions: Promise<readonly GrammarCircuitQuestion[]> | null = null;

async function loadQuestions(): Promise<readonly GrammarCircuitQuestion[]> {
  const json = await readFile(
    join(
      process.cwd(),
      "lib",
      "grammar-circuit",
      "seed-data",
      "davazdahom-v1.json",
    ),
    "utf8",
  );
  const records = JSON.parse(json) as SeedRecord[];
  const published = records
    .filter((record) => record.isPublished !== false)
    .sort(
      (a, b) =>
        (a.lesson ?? 0) - (b.lesson ?? 0) ||
        (a.sortIndex ?? 0) - (b.sortIndex ?? 0) ||
        a.sourceId.localeCompare(b.sourceId),
    )
    .map(
      ({
        sourceId,
        isPublished: _isPublished,
        sortIndex: _sortIndex,
        ...record
      }): GrammarCircuitQuestion => {
        void _isPublished;
        void _sortIndex;
        return {
          ...record,
          id: sourceId,
          sourceId,
        };
      },
    );

  const valid = filterValidQuestions(published);
  if (valid.length !== published.length) {
    throw new Error("بستهٔ محتوایی مدار دستور شامل پرسشِ نامعتبر است.");
  }
  return valid;
}

export function getGrammarCircuitQuestions(): Promise<
  readonly GrammarCircuitQuestion[]
> {
  cachedQuestions ??= loadQuestions();
  return cachedQuestions;
}
