export type Operation = "add" | "sub" | "mul" | "div";

export function charToVal(c: string): number {
  const code = c.toUpperCase().charCodeAt(0);
  if (code >= 48 && code <= 57) return code - 48; // 0-9
  if (code >= 65 && code <= 90) return code - 55; // A-Z =10-35
  return -1;
}
export function valToChar(v: number): string {
  if (v >= 0 && v <= 9) return String(v);
  return String.fromCharCode(55 + v); // 10->A
}
export function isValidForBase(str: string, base: number): boolean {
  if (!str) return false;
  const s = str.trim().toUpperCase();
  if (s === "") return false;
  // allow leading minus?
  const body = s.startsWith("-") ? s.slice(1) : s;
  if (body.length === 0) return false;
  for (const ch of body) {
    const v = charToVal(ch);
    if (v < 0 || v >= base) return false;
  }
  return true;
}
export function normalize(str: string): string {
  let s = str.trim().toUpperCase();
  let neg = false;
  if (s.startsWith("-")) {
    neg = true;
    s = s.slice(1);
  }
  s = s.replace(/^0+/, "") || "0";
  return neg && s !== "0" ? "-" + s : s;
}
export function compareAbs(a: string, b: string, base: number): number {
  // compare absolute values in given base. Returns 1 if a>b, -1 if a<b, 0 if equal
  const na = normalize(a).replace(/^-/, "");
  const nb = normalize(b).replace(/^-/, "");
  // need to compare length after stripping leading zeros, but for non-decimal, numeric ordering equals string length then lexicographic via digit values
  if (na.length !== nb.length) return na.length > nb.length ? 1 : -1;
  for (let i = 0; i < na.length; i++) {
    const av = charToVal(na[i]);
    const bv = charToVal(nb[i]);
    if (av !== bv) return av > bv ? 1 : -1;
  }
  return 0;
}
export function toDecimalBigInt(str: string, base: number): bigint {
  let s = str.trim().toUpperCase();
  let neg = false;
  if (s.startsWith("-")) {
    neg = true;
    s = s.slice(1);
  }
  let acc = BigInt(0);
  const b = BigInt(base);
  for (const ch of s) {
    const v = BigInt(charToVal(ch));
    acc = acc * b + v;
  }
  return neg ? -acc : acc;
}
export function fromDecimalBigInt(n: bigint, base: number): string {
  if (n === BigInt(0)) return "0";
  let neg = n < BigInt(0);
  let v = neg ? -n : n;
  const b = BigInt(base);
  let out = "";
  while (v > BigInt(0)) {
    const r = Number(v % b);
    out = valToChar(r) + out;
    v = v / b;
  }
  return neg ? "-" + out : out;
}

export interface SubStep {
  pos: number; // from right 0-indexed
  indexFromLeft: number;
  aChar: string;
  bChar: string;
  aVal: number;
  bVal: number;
  borrowIn: number;
  effectiveA: number;
  borrowOut: number;
  resultVal: number;
  resultChar: string;
  text: string;
  borrowChain?: string;
}

export interface CalcResult {
  result: string;
  decimalA: bigint;
  decimalB: bigint;
  decimalResult: bigint;
  steps: SubStep[];
  borrows: number[];
  paddedA: string;
  paddedB: string;
  paddedResult: string;
  isNegative: boolean;
  swapped?: boolean;
  error?: string;
}

export function calcSubtraction(aRaw: string, bRaw: string, base: number): CalcResult {
  const aNorm = normalize(aRaw);
  const bNorm = normalize(bRaw);
  // only handle positive for step visualization; if negative input convert via decimal
  // For simplicity if any is negative, fallback to decimal method without steps
  if (aNorm.startsWith("-") || bNorm.startsWith("-")) {
    const da = toDecimalBigInt(aNorm, base);
    const db = toDecimalBigInt(bNorm, base);
    const dr = da - db;
    const res = fromDecimalBigInt(dr, base);
    return {
      result: res,
      decimalA: da,
      decimalB: db,
      decimalResult: dr,
      steps: [],
      borrows: [],
      paddedA: aNorm,
      paddedB: bNorm,
      paddedResult: res,
      isNegative: dr < BigInt(0),
    };
  }
  const cmp = compareAbs(aNorm, bNorm, base);
  let swapped = false;
  let a = aNorm;
  let b = bNorm;
  let isNegative = false;
  if (cmp < 0) {
    // result negative: compute b - a
    swapped = true;
    isNegative = true;
    a = bNorm;
    b = aNorm;
  }
  const maxLen = Math.max(a.length, b.length);
  const paddedA = a.padStart(maxLen, "0");
  const paddedB = b.padStart(maxLen, "0");
  const steps: SubStep[] = [];
  const borrows: number[] = new Array(maxLen + 1).fill(0); // borrows[i] is borrow into position i from right? easier using array from left
  // We'll do from right
  let borrow = 0;
  let resultChars: string[] = new Array(maxLen);
  // For visualization of borrow chain, we also track where borrow came from
  for (let i = maxLen - 1; i >= 0; i--) {
    const posFromRight = maxLen - 1 - i;
    const aChar = paddedA[i];
    const bChar = paddedB[i];
    const aVal = charToVal(aChar);
    const bVal = charToVal(bChar);
    const borrowIn = borrow;
    let effectiveA = aVal - borrowIn;
    let borrowOut = 0;
    let explainBorrow = "";
    if (effectiveA < 0) {
      // This happens when previous borrow made -1 and we need extra? Actually aVal -1 could be -1, then need borrow again
      // We already account: effectiveA = aVal - borrowIn, if <0 we borrow
      effectiveA += base;
      borrowOut = 1;
      explainBorrow = `ยืม ${base} จากหลักถัดไปเพราะ ${aVal} - ยืมเข้า ${borrowIn} = ${aVal - borrowIn} < 0`;
    } else if (effectiveA < bVal) {
      effectiveA += base;
      borrowOut = 1;
      explainBorrow = `ยืม ${base} เพราะ ${aVal} - ${borrowIn} = ${aVal - borrowIn} < ${bVal}`;
    }
    // If we had borrowIn and effectiveA was adjusted, borrowOut already 1
    // Otherwise borrowOut=0
    const rVal = effectiveA - bVal;
    const rChar = valToChar(rVal);
    resultChars[i] = rChar;
    // For borrow array visualization (borrow out of this position to next left)
    borrows[i] = borrowOut; // borrow generated at i to be used at i-1
    let text = "";
    if (borrowOut === 1) {
      if (borrowIn === 1) {
        text = `หลักที่ ${posFromRight + 1} จากขวา: (${aVal} - ยืม ${borrowIn}) = ${aVal - borrowIn} < ${bVal} → ยืม ${base} ได้ ${effectiveA} → ${effectiveA} - ${bVal} = ${rVal} (${rChar})`;
      } else {
        text = `หลักที่ ${posFromRight + 1} จากขวา: ${aVal} < ${bVal} → ยืม ${base} ได้ ${effectiveA} → ${effectiveA} - ${bVal} = ${rVal} (${rChar})`;
      }
      if (explainBorrow) text += ` — ${explainBorrow}`;
    } else {
      text = `หลักที่ ${posFromRight + 1} จากขวา: ${aVal - borrowIn} - ${bVal} = ${rVal} (${rChar})` + (borrowIn ? ` (หักยืมเข้า ${borrowIn})` : "");
    }
    steps.unshift({
      pos: posFromRight,
      indexFromLeft: i,
      aChar,
      bChar,
      aVal,
      bVal,
      borrowIn,
      effectiveA,
      borrowOut,
      resultVal: rVal,
      resultChar: rChar,
      text,
    });
    borrow = borrowOut;
  }
  let paddedResult = resultChars.join("").replace(/^0+/, "") || "0";
  let finalResult = paddedResult;
  if (isNegative && finalResult !== "0") finalResult = "-" + finalResult;
  // we also keep padded with sign? For display, pad to maxLen
  const displayPaddedResult = resultChars.join("");
  const da = toDecimalBigInt(aNorm, base);
  const db = toDecimalBigInt(bNorm, base);
  const dr = da - db;
  return {
    result: finalResult,
    decimalA: da,
    decimalB: db,
    decimalResult: dr,
    steps: swapped ? [] : steps, // if swapped, steps currently show absolute swapped calc; we hide or explain
    borrows,
    paddedA,
    paddedB,
    paddedResult: displayPaddedResult,
    isNegative,
    swapped,
  };
}

export function calcAdd(aRaw: string, bRaw: string, base: number): { result: string; decimalA: bigint; decimalB: bigint; decimalResult: bigint } {
  const da = toDecimalBigInt(aRaw, base);
  const db = toDecimalBigInt(bRaw, base);
  const dr = da + db;
  return { result: fromDecimalBigInt(dr, base), decimalA: da, decimalB: db, decimalResult: dr };
}
export function calcMul(aRaw: string, bRaw: string, base: number) {
  const da = toDecimalBigInt(aRaw, base);
  const db = toDecimalBigInt(bRaw, base);
  const dr = da * db;
  return { result: fromDecimalBigInt(dr, base), decimalA: da, decimalB: db, decimalResult: dr };
}
export function calcDiv(aRaw: string, bRaw: string, base: number) {
  const da = toDecimalBigInt(aRaw, base);
  const db = toDecimalBigInt(bRaw, base);
  if (db === BigInt(0)) throw new Error("หารด้วยศูนย์ไม่ได้");
  const q = da / db;
  const r = da % db;
  return { result: fromDecimalBigInt(q, base), remainder: fromDecimalBigInt(r, base), decimalA: da, decimalB: db, decimalResult: q, decimalRemainder: r };
}
