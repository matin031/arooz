"use client";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import type { PublicFinalExamQuestion } from "@/lib/final-exam-questions";
import type { GradeResult } from "@/app/api/final-exam/grade/route";
import BookLoader from "../svgs/LoadingIcon";

type AnsweredEntry = {
  question: PublicFinalExamQuestion;
  userAnswer: string;
  result: GradeResult;
};

const faNum = (n: number) =>
  n.toLocaleString("fa-IR", { maximumFractionDigits: 2 });

const verdictStyles: Record<
  GradeResult["verdict"],
  { label: string; className: string }
> = {
  correct: {
    label: "درست",
    className:
      "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/40",
  },
  partial: {
    label: "نسبتاً درست",
    className:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/40",
  },
  incorrect: {
    label: "نادرست",
    className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/40",
  },
};

function FinalExam({ questions }: { questions: PublicFinalExamQuestion[] }) {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [grading, setGrading] = useState(false);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<GradeResult | null>(null);
  const [answered, setAnswered] = useState<AnsweredEntry[]>([]);
  const [finished, setFinished] = useState(false);

  const totalMax = useMemo(
    () => questions.reduce((sum, q) => sum + q.maxScore, 0),
    [questions],
  );
  const totalScore = useMemo(
    () => answered.reduce((sum, a) => sum + a.result.score, 0),
    [answered],
  );

  const question = questions[currentIndex];

  const submitAnswer = async () => {
    if (grading || !question) return;
    setGrading(true);
    setGradeError(null);

    try {
      const res = await fetch("/api/final-exam/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, userAnswer: answer }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGradeError(data?.error ?? "خطا در تصحیح پاسخ");
        return;
      }
      const result = data as GradeResult;
      setCurrentResult(result);
      setAnswered((prev) => [
        ...prev,
        { question, userAnswer: answer, result },
      ]);
    } catch {
      setGradeError("اتصال برقرار نشد؛ دوباره تلاش کنید");
    } finally {
      setGrading(false);
    }
  };

  const nextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setAnswer("");
    setCurrentResult(null);
    setGradeError(null);
  };

  const restart = () => {
    setStarted(false);
    setCurrentIndex(0);
    setAnswer("");
    setCurrentResult(null);
    setGradeError(null);
    setAnswered([]);
    setFinished(false);
  };

  if (!started) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container my-15 max-w-2xl mx-auto text-center"
      >
        <div className="glass rounded-2xl p-8 md:p-12">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-4">
            آزمون نهایی ادبیات فارسی
          </h1>
          <p className="text-muted-foreground leading-8 mb-6">
            در این آزمون به {faNum(questions.length)} سوال تشریحی در سبک امتحان
            نهایی پاسخ می‌دهید. پاسخ شما توسط هوش مصنوعی با پاسخنامه مقایسه و
            نمره‌گذاری می‌شود و اگر جایی اشتباه کنید، همان‌جا نکته آموزشی همان
            مبحث را یاد می‌گیرید.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            مجموع بارم آزمون: {faNum(totalMax)} نمره
          </p>
          <button
            onClick={() => setStarted(true)}
            className="bg-primary text-primary-foreground hover:brightness-90 transition-all
             rounded-xl px-10 py-3 font-medium active:scale-95"
          >
            شروع آزمون
          </button>
        </div>
      </motion.div>
    );
  }

  if (finished) {
    const percent = totalMax ? Math.round((totalScore / totalMax) * 100) : 0;
    return (
      <div className="container my-15 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 text-center mb-8"
        >
          <h2 className="text-2xl font-bold text-primary mb-3">پایان آزمون</h2>
          <p className="text-lg">
            نمره شما: <span className="font-bold">{faNum(totalScore)}</span> از{" "}
            {faNum(totalMax)} ({faNum(percent)}٪)
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            {percent >= 80
              ? "آفرین! تسلط خیلی خوبی داری."
              : percent >= 50
                ? "خوب بود؛ نکته‌های آموزشی را مرور کن تا نمره‌ات بالاتر برود."
                : "اشکالی ندارد؛ با مرور نکته‌های آموزشی هر سوال، دفعه بعد خیلی بهتر می‌شوی."}
          </p>
          <button
            onClick={restart}
            className="mt-6 bg-primary text-primary-foreground hover:brightness-90
             transition-all rounded-xl px-8 py-2.5 font-medium active:scale-95"
          >
            آزمون دوباره
          </button>
        </motion.div>

        <div className="space-y-4">
          {answered.map((entry, i) => {
            const v = verdictStyles[entry.result.verdict];
            return (
              <div key={entry.question.id} className="glass rounded-xl p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="text-xs text-muted-foreground">
                    سوال {faNum(i + 1)} - {entry.question.topic}
                  </span>
                  <span
                    className={`text-xs border rounded-full px-3 py-1 ${v.className}`}
                  >
                    {v.label} - {faNum(entry.result.score)} از{" "}
                    {faNum(entry.question.maxScore)}
                  </span>
                </div>
                <p className="whitespace-pre-line text-sm leading-7 mb-2">
                  {entry.question.question}
                </p>
                <p className="text-sm text-muted-foreground leading-7">
                  {entry.result.feedback}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="container my-15 max-w-3xl mx-auto">
      {/* header */}
      <div className="flex items-center justify-between mb-6 text-sm text-muted-foreground">
        <span>
          سوال {faNum(currentIndex + 1)} از {faNum(questions.length)}
        </span>
        <span>
          نمره تاکنون: {faNum(totalScore)} از {faNum(totalMax)}
        </span>
      </div>

      {/* progress bar */}
      <div className="h-2 rounded-full bg-muted overflow-hidden mb-8">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{
            width: `${((currentIndex + (currentResult ? 1 : 0)) / questions.length) * 100}%`,
          }}
        />
      </div>

      <motion.div
        key={question.id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass rounded-2xl p-6 md:p-8"
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className="text-xs bg-primary/10 text-primary rounded-full px-3 py-1">
            {question.topic}
          </span>
          <span className="text-xs text-muted-foreground">
            بارم: {faNum(question.maxScore)} نمره
          </span>
        </div>

        <p className="whitespace-pre-line leading-8 text-base md:text-lg mb-6">
          {question.question}
        </p>

        {!currentResult && (
          <>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={grading}
              rows={5}
              placeholder="پاسخ خود را اینجا بنویسید..."
              className="w-full rounded-xl border border-border bg-input/40 p-4 leading-7
               outline-none focus:ring-2 focus:ring-ring transition-all resize-y
               disabled:opacity-60"
              dir="rtl"
            />

            {gradeError && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-3">
                {gradeError}
              </p>
            )}

            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={submitAnswer}
                disabled={grading || !answer.trim()}
                className={`transition-all rounded-xl px-8 py-2.5 font-medium
                 text-primary-foreground inline-flex items-center gap-x-2 ${
                   grading || !answer.trim()
                     ? "bg-primary/50 cursor-not-allowed"
                     : "bg-primary hover:brightness-90 active:scale-95"
                 }`}
              >
                {grading ? "در حال تصحیح..." : "ثبت پاسخ"}
              </button>
              {grading && (
                <span className="text-sm text-muted-foreground">
                  هوش مصنوعی در حال مقایسه پاسخ شما با پاسخنامه است...
                </span>
              )}
            </div>
            {grading && (
              <div className="flex justify-center mt-4">
                <BookLoader />
              </div>
            )}
          </>
        )}

        {currentResult && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="rounded-xl border border-border bg-muted/40 p-4 mb-4">
              <p className="text-xs text-muted-foreground mb-2">پاسخ شما:</p>
              <p className="text-sm leading-7 whitespace-pre-line">
                {answered[answered.length - 1]?.userAnswer}
              </p>
            </div>

            <div
              className={`rounded-xl border p-4 mb-4 ${verdictStyles[currentResult.verdict].className}`}
            >
              <p className="font-medium mb-1">
                {verdictStyles[currentResult.verdict].label} - نمره{" "}
                {faNum(currentResult.score)} از {faNum(question.maxScore)}
              </p>
              <p className="text-sm leading-7 text-foreground/90">
                {currentResult.feedback}
              </p>
            </div>

            {currentResult.lesson && (
              <div className="rounded-xl border border-accent/50 bg-accent/10 p-4 mb-4">
                <p className="font-medium text-accent-foreground dark:text-accent mb-2">
                  📚 نکته آموزشی
                </p>
                <p className="text-sm leading-8 whitespace-pre-line">
                  {currentResult.lesson}
                </p>
              </div>
            )}

            <button
              onClick={nextQuestion}
              className="bg-primary text-primary-foreground hover:brightness-90
               transition-all rounded-xl px-8 py-2.5 font-medium active:scale-95"
            >
              {currentIndex + 1 >= questions.length
                ? "مشاهده نتیجه نهایی"
                : "سوال بعدی"}
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default FinalExam;
