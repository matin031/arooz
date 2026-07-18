// ابزارهای پردازش متن فارسی برای موتور تصحیح هوشمند داخلی سایت

/**
 * نرمال‌سازی متن فارسی:
 * یکسان‌سازی حروف عربی/فارسی، حذف اعراب و کشیدگی، حذف نیم‌فاصله،
 * تبدیل ارقام و حذف علائم نگارشی تا مقایسه معنایی پایدار شود.
 */
export function normalizeFa(input: string): string {
  return (
    input
      // یکسان‌سازی حروف
      .replace(/[يى]/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/[أإآ]/g, "ا")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ی")
      .replace(/ة/g, "ه")
      // حذف اعراب و علامت‌ها
      .replace(/[ً-ْٰـ]/g, "")
      // نیم‌فاصله و فاصله مجازی → حذف (می‌کند = میکند)
      .replace(/[‌‏‎]/g, "")
      // ارقام فارسی/عربی → لاتین
      .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
      .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
      // علائم نگارشی → فاصله
      .replace(/[.،؛:؟!()«»"'\-ــ_/\\[\]{}<>|,;?]/g, " ")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim()
  );
}

/** فاصله ویرایشی (لِوِنشتاین) با سقف؛ برای تحمل غلط تایپی کوچک */
export function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => i);
  for (let j = 1; j <= b.length; j++) {
    let prev = dp[0];
    dp[0] = j;
    let rowMin = dp[0];
    for (let i = 1; i <= a.length; i++) {
      const tmp = dp[i];
      dp[i] = Math.min(
        dp[i] + 1,
        dp[i - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      prev = tmp;
      rowMin = Math.min(rowMin, dp[i]);
    }
    if (rowMin > max) return max + 1;
  }
  return dp[a.length];
}

/**
 * آیا کلیدواژه در متن (هر دو نرمال‌شده) وجود دارد؟
 * ابتدا جست‌وجوی زیررشته‌ای؛ سپس برای واژه‌های تک‌کلمه‌ای بلند،
 * مقایسه تقریبی توکن‌به‌توکن با تحمل یک غلط تایپی.
 */
export function containsKeyword(textNorm: string, keywordNorm: string): boolean {
  if (!keywordNorm) return false;
  if (textNorm.includes(keywordNorm)) return true;

  // تطبیق تقریبی فقط برای کلیدواژه تک‌واژه‌ای با طول کافی
  if (!keywordNorm.includes(" ") && keywordNorm.length >= 4) {
    const tolerance = keywordNorm.length >= 6 ? 2 : 1;
    for (const token of textNorm.split(" ")) {
      if (editDistance(token, keywordNorm, tolerance) <= tolerance) return true;
    }
  }
  return false;
}

/** همه جایگاه‌های شروعِ رخدادهای کلیدواژه در متن (فقط تطبیق زیررشته‌ای) */
export function keywordPositions(textNorm: string, keywordNorm: string): number[] {
  const positions: number[] = [];
  let idx = textNorm.indexOf(keywordNorm);
  while (idx !== -1) {
    positions.push(idx);
    idx = textNorm.indexOf(keywordNorm, idx + 1);
  }
  return positions;
}
