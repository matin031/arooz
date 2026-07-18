// موتور تصحیح هوشمند داخلی عروضینو
// پاسخ تشریحی کاربر را با معیار تصحیح (روبریک) مقایسه مفهومی می‌کند،
// طبق بارم نمره می‌دهد و بازخورد و نکته آموزشی تولید می‌کند.
// کاملاً داخل خود سایت اجرا می‌شود؛ بدون سرویس خارجی و بدون کلید API.

import {
  containsKeyword,
  keywordPositions,
  normalizeFa,
} from "./normalize";
import { lessons, type LessonKey } from "./lessons";

/**
 * هر بخش قابل نمره از یک سوال.
 * groups: گروه‌های مفهومی؛ هر گروه مجموعه‌ای از واژه‌های هم‌ارز است و
 * وجود یکی از اعضای گروه در پاسخ، آن گروه را «برآورده» می‌کند.
 * minGroups: چند گروه باید برآورده شود تا نمره کاملِ این بخش داده شود
 * (پیش‌فرض: همه گروه‌ها). گروه‌های کمتر → نمره جزئی متناسب.
 * near: اگر تعیین شود، کلیدواژه فقط وقتی پذیرفته می‌شود که نزدیکِ
 * یکی از این واژه‌ها آمده باشد (برای سوال‌هایی مثل ارکان تشبیه که
 * «برچسب‌گذاری» مهم است، نه صرف حضور واژه).
 */
export type RubricItem = {
  label: string;
  score: number;
  groups: string[][];
  minGroups?: number;
  near?: string[];
};

export type GradeResult = {
  score: number;
  verdict: "correct" | "partial" | "incorrect";
  feedback: string;
  lesson: string | null;
  correctAnswer: string;
};

const NEAR_WINDOW = 60; // بازه مجاورت بر حسب نویسه در متن نرمال‌شده

const faNum = (n: number) =>
  n.toLocaleString("fa-IR", { maximumFractionDigits: 2 });

/** گرد کردن به نزدیک‌ترین گام ۰/۲۵ */
const quarter = (n: number) => Math.round(n * 4) / 4;

function groupMatches(
  answerNorm: string,
  group: string[],
  near: string[] | undefined,
): boolean {
  for (const keyword of group) {
    const kw = normalizeFa(keyword);
    if (!near) {
      if (containsKeyword(answerNorm, kw)) return true;
      continue;
    }
    // حالت مجاورت: کلیدواژه باید نزدیک یکی از واژه‌های near باشد
    const kwPositions = keywordPositions(answerNorm, kw);
    if (!kwPositions.length) continue;
    for (const nearWord of near) {
      const nearPositions = keywordPositions(answerNorm, normalizeFa(nearWord));
      for (const np of nearPositions) {
        for (const kp of kwPositions) {
          if (Math.abs(kp - np) <= NEAR_WINDOW) return true;
        }
      }
    }
  }
  return false;
}

export function gradeAnswer(params: {
  rubric: RubricItem[];
  maxScore: number;
  lessonKey: LessonKey;
  answerKey: string;
  userAnswer: string;
}): GradeResult {
  const { rubric, maxScore, lessonKey, answerKey, userAnswer } = params;
  const answerNorm = normalizeFa(userAnswer);

  let total = 0;
  const lines: string[] = [];

  for (const item of rubric) {
    const need = Math.min(item.minGroups ?? item.groups.length, item.groups.length);
    let matched = 0;
    for (const group of item.groups) {
      if (groupMatches(answerNorm, group, item.near)) matched++;
    }
    matched = Math.min(matched, need);
    const itemScore = quarter((matched / need) * item.score);
    total += itemScore;

    if (itemScore >= item.score) {
      lines.push(`✔ ${item.label}: درست (${faNum(itemScore)} نمره)`);
    } else if (itemScore > 0) {
      lines.push(
        `◐ ${item.label}: ناقص (${faNum(itemScore)} از ${faNum(item.score)} نمره)`,
      );
    } else {
      lines.push(`✘ ${item.label}: در پاسخ شما یافت نشد (۰ نمره)`);
    }
  }

  const score = Math.min(maxScore, quarter(total));
  const verdict: GradeResult["verdict"] =
    score >= maxScore ? "correct" : score > 0 ? "partial" : "incorrect";

  const intro =
    verdict === "correct"
      ? "آفرین! پاسخ شما کامل بود."
      : verdict === "partial"
        ? "پاسخ شما بخشی از نمره را گرفت؛ ریز نمره:"
        : "پاسخ شما با پاسخنامه هم‌خوانی نداشت؛ ریز نمره:";

  return {
    score,
    verdict,
    feedback: [intro, ...lines].join("\n"),
    lesson: verdict === "correct" ? null : lessons[lessonKey],
    correctAnswer: answerKey,
  };
}
