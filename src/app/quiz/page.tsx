"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { fromDecimalBigInt, valToChar } from "@/lib/baseMath";

// ---------- helpers ----------
const BASE_LABEL: Record<number, { name: string; short: string; sub: string }> = {
  2: { name: "Binary", short: "BIN", sub: "₂" },
  8: { name: "Octal", short: "OCT", sub: "₈" },
  10: { name: "Decimal", short: "DEC", sub: "₁₀" },
  16: { name: "Hexadecimal", short: "HEX", sub: "₁₆" },
};

function baseLabel(b: number) {
  return BASE_LABEL[b] ?? { name: `Base-${b}`, short: `B${b}`, sub: ` (${b})` };
}

type DifficultyConfig = {
  max: number;
  label: string;
  desc: string;
  color: string;
};

const DIFFICULTY: Record<number, DifficultyConfig> = {
  1: { max: 15, label: "Beginner", desc: "0 – 15 • small numbers", color: "bg-emerald-500" },
  2: { max: 31, label: "Easy", desc: "0 – 31 • 1–2 digits", color: "bg-emerald-500" },
  3: { max: 63, label: "Easy +", desc: "0 – 63 • 2–3 digits", color: "bg-lime-500" },
  4: { max: 127, label: "Medium", desc: "0 – 127 • HEX range", color: "bg-yellow-500" },
  5: { max: 255, label: "Medium", desc: "0 – 255 • 2-digit HEX", color: "bg-yellow-500" },
  6: { max: 511, label: "Medium +", desc: "0 – 511 • 3-digit OCT", color: "bg-amber-500" },
  7: { max: 1023, label: "Hard", desc: "0 – 1023 • 10-bit BIN", color: "bg-orange-500" },
  8: { max: 2047, label: "Hard +", desc: "0 – 2047 • 4-digit HEX", color: "bg-orange-500" },
  9: { max: 4095, label: "Expert", desc: "0 – 4095 • large numbers", color: "bg-red-500" },
  10: { max: 8191, label: "Master", desc: "0 – 8191 • max challenge", color: "bg-red-600" },
};

const BASE_OPTIONS = [
  { value: 2, label: "Base 2", sub: "Binary", mono: "BIN" },
  { value: 8, label: "Base 8", sub: "Octal", mono: "OCT" },
  { value: 10, label: "Base 10", sub: "Decimal", mono: "DEC" },
  { value: 16, label: "Base 16", sub: "Hex", mono: "HEX" },
] as const;

type BaseValue = (typeof BASE_OPTIONS)[number]["value"];

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

type Question = {
  id: number;
  decimal: number;
  fromBase: number;
  toBase: number;
  fromValue: string;
  toValue: string;
};

function normalizeAnswer(s: string): string {
  let t = s.trim().toUpperCase();
  if (t === "") return "";
  t = t.replace(/^0+/, "") || "0";
  return t;
}

function generateQuestions(difficulty: number, basesPool: number[], count = 10): Question[] {
  const cfg = DIFFICULTY[difficulty] ?? DIFFICULTY[5];
  // fallback if pool invalid
  const pool = basesPool.length >= 2 ? basesPool : [2, 8, 10, 16];
  const qs: Question[] = [];
  for (let i = 0; i < count; i++) {
    const dec = randInt(0, cfg.max);
    const fromBase = pool[randInt(0, pool.length - 1)];
    let toBase = pool[randInt(0, pool.length - 1)];
    let attempts = 0;
    while (toBase === fromBase && attempts < 10) {
      toBase = pool[randInt(0, pool.length - 1)];
      attempts++;
    }
    if (toBase === fromBase) {
      toBase = pool.find((b) => b !== fromBase) ?? (fromBase === 10 ? 2 : 10);
    }
    const fromValue = fromDecimalBigInt(BigInt(dec), fromBase);
    const toValue = normalizeAnswer(fromDecimalBigInt(BigInt(dec), toBase));
    qs.push({ id: i + 1, decimal: dec, fromBase, toBase, fromValue: fromValue.toUpperCase(), toValue });
  }
  return qs;
}

// ---------- Component ----------
export default function QuizPage() {
  const [view, setView] = useState<"settings" | "quiz" | "result">("settings");
  const [difficulty, setDifficulty] = useState<number>(5);
  const [selectedBases, setSelectedBases] = useState<BaseValue[]>([2, 8, 10, 16]); // default All
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(10).fill(""));
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [showToast, setShowToast] = useState<null | { ok: boolean; msg: string }>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const current = questions[idx];
  const isAllSelected = selectedBases.length === 4 && [2, 8, 10, 16].every((b) => selectedBases.includes(b as BaseValue));
  const canStart = selectedBases.length >= 2;

  const toggleBase = (b: BaseValue) => {
    setSelectedBases((prev) => {
      if (prev.includes(b)) {
        const next = prev.filter((x) => x !== b);
        // allow 1 but will block start; keep at least 1 to avoid empty
        return next;
      } else {
        const next = [...prev, b].sort((a, c) => a - c) as BaseValue[];
        return next;
      }
    });
  };

  const selectAll = () => setSelectedBases([2, 8, 10, 16]);
  const clearAll = () => setSelectedBases([]);

  const preview = useMemo(() => generateQuestions(difficulty, selectedBases, 3), [difficulty, selectedBases]);

  const startQuiz = useCallback(() => {
    if (!canStart) {
      setShowToast({ ok: false, msg: "กรุณาเลือกอย่างน้อย 2 ฐาน" });
      return;
    }
    const qs = generateQuestions(difficulty, selectedBases, 10);
    setQuestions(qs);
    setIdx(0);
    setAnswers(Array(10).fill(""));
    setInput("");
    setFeedback(null);
    setChecked(false);
    setScore(0);
    setStartTime(Date.now());
    setElapsed(0);
    setView("quiz");
  }, [difficulty, selectedBases, canStart]);

  useEffect(() => {
    if (view !== "quiz" || !startTime) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(t);
  }, [view, startTime]);

  useEffect(() => {
    if (!showToast) return;
    const tm = setTimeout(() => setShowToast(null), 2200);
    return () => clearTimeout(tm);
  }, [showToast]);

  const handleSubmit = () => {
    if (!current || checked) return;
    const norm = normalizeAnswer(input);
    if (norm === "") {
      setShowToast({ ok: false, msg: "กรุณากรอกคำตอบก่อน" });
      return;
    }
    const expected = current.toValue;
    const isCorrect = norm === expected;
    setFeedback(isCorrect ? "correct" : "incorrect");
    setChecked(true);
    setShowToast({ ok: isCorrect, msg: isCorrect ? "ถูกต้อง ✓" : `ผิด — เฉลย: ${expected}` });
    const nextAnswers = [...answers];
    nextAnswers[idx] = input.trim().toUpperCase();
    setAnswers(nextAnswers);
    if (isCorrect) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (idx + 1 < questions.length) {
      setIdx((i) => i + 1);
      const nextAns = answers[idx + 1] || "";
      setInput(nextAns);
      setFeedback(null);
      setChecked(false);
    } else {
      setView("result");
    }
  };

  const handleSkip = () => {
    if (!checked) {
      setFeedback("incorrect");
      setChecked(true);
      const nextAnswers = [...answers];
      nextAnswers[idx] = input.trim().toUpperCase();
      setAnswers(nextAnswers);
      setShowToast({ ok: false, msg: `ข้าม — เฉลย: ${current.toValue}` });
    }
  };

  const restartSame = () => startQuiz();
  const backToSettings = () => {
    setView("settings");
    setFeedback(null);
    setChecked(false);
  };

  const barPct = view === "quiz" ? ((idx + (checked ? 1 : 0)) / 10) * 100 : view === "result" ? 100 : 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-[64px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
              PLC
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold leading-none tracking-tight text-gray-900">
                Handbook PLC
              </h1>
              <p className="text-xs sm:text-[13px] text-gray-500 font-medium">Number Base Quiz • 10 ข้อ</p>
            </div>
          </Link>
          <nav className="hidden sm:flex items-center gap-2 text-sm">
            <Link
              href="/"
              className="px-4 py-2 rounded-full border border-gray-200 bg-white text-gray-700 font-medium shadow-sm hover:bg-gray-50 hover:border-gray-300 transition"
            >
              ← Calculator
            </Link>
            <Link href="/quiz" className="px-4 py-2 rounded-full bg-orange-500 text-white font-semibold shadow-md">
              Quiz
            </Link>
            <a
              href="https://github.com/Guy2547/WED-PLC"
              target="_blank"
              className="px-4 py-2 rounded-full border border-gray-200 bg-white text-gray-700 font-medium shadow-sm hover:bg-gray-50 transition hidden lg:inline-flex"
            >
              GitHub
            </a>
          </nav>
          <div className="sm:hidden flex items-center gap-2">
            <Link href="/" className="px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-700 text-xs font-semibold">
              Calc
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 flex flex-col items-center">
        {/* Toast */}
        {showToast && (
          <div
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg border text-sm font-bold flex items-center gap-2 ${
              showToast.ok ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-extrabold text-white shadow-sm ${showToast.ok ? "bg-emerald-500" : "bg-red-500"}`}>
              {showToast.ok ? "✓" : "×"}
            </span>
            {showToast.msg}
          </div>
        )}

        {view === "settings" && (
          <div className="w-full max-w-3xl space-y-6">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold shadow-sm">
                <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" /> Number Base Quiz
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
                ฝึกแปลง<span className="text-orange-500">เลขฐาน</span> — 10 ข้อ
              </h2>
              <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
                ตั้งค่าความยากและเลือกฐานที่ต้องการฝึก แล้วเริ่มทำแบบทดสอบแบบสุ่ม
              </p>
            </div>

            {/* Settings / Dashboard — Pre-Quiz Setup */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden">
              <div className="px-6 sm:px-8 py-7 space-y-7">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <span className="h-8 w-8 rounded-lg bg-orange-500 text-white flex items-center justify-center text-sm font-bold shadow-sm">⚙</span>
                    Pre-Quiz Setup / Dashboard
                  </h3>
                  <span className="hidden sm:inline text-xs font-bold tracking-widest text-gray-500 uppercase">Configure before Start</span>
                </div>

                {/* Difficulty Selector */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold">1</span>
                      Difficulty Selector <span className="text-xs font-medium text-gray-500">(1 – 10)</span>
                    </label>
                    <span className={`px-3 py-1 rounded-full text-white text-sm font-extrabold shadow-md ${DIFFICULTY[difficulty].color}`}>
                      {difficulty} — {DIFFICULTY[difficulty].label}
                    </span>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
                    <input type="range" min={1} max={10} value={difficulty} onChange={(e) => setDifficulty(parseInt(e.target.value))} className="w-full accent-orange-500 h-2" />
                    <div className="flex justify-between text-[11px] font-bold text-gray-400">
                      <span>1 Beginner</span>
                      <span>5 Medium</span>
                      <span>10 Master</span>
                    </div>
                    <div className="flex justify-between gap-1">
                      {Array.from({ length: 10 }, (_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setDifficulty(i + 1)}
                          className={`h-8 w-8 rounded-full text-xs font-bold border shadow-sm transition ${
                            difficulty === i + 1
                              ? "bg-orange-500 border-orange-500 text-white shadow-md scale-110"
                              : difficulty > i + 1
                              ? "bg-orange-100 border-orange-200 text-orange-700"
                              : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <span className="text-xs font-semibold text-gray-500">หรือเลือกแบบ Dropdown</span>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(parseInt(e.target.value))}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {Array.from({ length: 10 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          Level {i + 1} — {DIFFICULTY[i + 1].label} ({DIFFICULTY[i + 1].desc})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-white border border-gray-200 p-3 shadow-sm">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Max value</div>
                      <div className="font-mono font-extrabold text-gray-900 text-lg">{DIFFICULTY[difficulty].max}</div>
                      <div className="text-xs text-gray-500">0 – {DIFFICULTY[difficulty].max} (decimal)</div>
                    </div>
                    <div className="rounded-xl bg-orange-50 border border-orange-200 p-3 shadow-sm">
                      <div className="text-xs font-bold text-orange-700 uppercase tracking-widest">Description</div>
                      <div className="font-semibold text-gray-900 text-sm">{DIFFICULTY[difficulty].label}</div>
                      <div className="text-xs text-gray-600">{DIFFICULTY[difficulty].desc}</div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200" />

                {/* Number Base Selector */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <label className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">2</span>
                      Number Base Selector
                    </label>
                    <span className="text-xs font-bold text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1">
                      {selectedBases.length} selected
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 -mt-2">เลือกฐานที่ต้องการสุ่มใน Quiz (เลือกได้หลายฐาน, ต้อง ≥ 2 ฐาน)</p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {BASE_OPTIONS.map((opt) => {
                      const active = selectedBases.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          onClick={() => toggleBase(opt.value)}
                          className={`relative rounded-xl border p-4 text-left transition-all shadow-sm flex flex-col gap-1 ${
                            active
                              ? "bg-orange-500 border-orange-500 text-white shadow-md scale-[1.02]"
                              : "bg-white border-gray-200 text-gray-800 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md"
                          }`}
                        >
                          <div className={`text-sm font-extrabold flex items-center gap-2 ${active ? "text-white" : "text-gray-900"}`}>
                            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold border ${active ? "bg-white text-orange-600 border-white" : "bg-gray-50 border-gray-200 text-gray-700"}`}>
                              {active ? "✓" : opt.mono[0]}
                            </span>
                            {opt.label}
                          </div>
                          <div className={`text-xs font-bold ${active ? "text-white/90" : "text-gray-500"}`}>{opt.sub} • {opt.mono}</div>
                          <div className={`text-[11px] font-mono px-2 py-0.5 rounded-full border inline-block w-fit mt-1 ${active ? "bg-white/20 border-white/30 text-white" : "bg-gray-50 border-gray-200 text-gray-500"}`}>
                            Base {opt.value}
                          </div>
                          {active && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-white shadow-sm" />}
                        </button>
                      );
                    })}
                    {/* All Bases chip */}
                    <button
                      onClick={selectAll}
                      className={`rounded-xl border p-4 text-left transition-all shadow-sm flex flex-col gap-1 sm:col-span-1 col-span-2 ${
                        isAllSelected
                          ? "bg-gray-900 border-gray-900 text-white shadow-md scale-[1.02]"
                          : "bg-white border-gray-200 text-gray-800 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md"
                      }`}
                    >
                      <div className={`text-sm font-extrabold flex items-center gap-2 ${isAllSelected ? "text-white" : "text-gray-900"}`}>
                        <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold border ${isAllSelected ? "bg-white text-gray-900 border-white" : "bg-orange-50 border-orange-200 text-orange-600"}`}>★</span>
                        All Bases
                      </div>
                      <div className={`text-xs font-bold ${isAllSelected ? "text-white/80" : "text-gray-500"}`}>Mixed • BIN/OCT/DEC/HEX</div>
                      <div className={`text-[11px] font-mono px-2 py-0.5 rounded-full border inline-block w-fit mt-1 ${isAllSelected ? "bg-white/20 border-white/30 text-white" : "bg-orange-50 border-orange-200 text-orange-700"}`}>
                        2 • 8 • 10 • 16
                      </div>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={selectAll} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100">
                      Select All
                    </button>
                    <button onClick={clearAll} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">
                      Clear
                    </button>
                    <span className="text-xs text-gray-500">
                      Selected: <span className="font-mono font-bold text-gray-900">{selectedBases.length ? selectedBases.join(", ") : "—"}</span>
                    </span>
                    {!canStart && <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-2.5 py-1">⚠ เลือกอย่างน้อย 2 ฐาน</span>}
                  </div>

                  {/* Selected preview bar */}
                  <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 shadow-sm">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Bases pool ที่ใช้</div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {selectedBases.length ? (
                        selectedBases.map((b) => (
                          <span key={b} className="px-2.5 py-1 rounded-full bg-orange-500 text-white text-xs font-bold shadow-sm">
                            {baseLabel(b).name} ({b})
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">— ยังไม่ได้เลือก —</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{isAllSelected ? "Mixed สุ่มครบทุกฐาน" : `${selectedBases.length} bases • สุ่มเฉพาะฐานที่เลือก`}</div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200" />

                {/* Preview */}
                <div>
                  <div className="text-xs font-bold tracking-widest text-gray-500 uppercase">Preview (ตัวอย่าง 3 ข้อจากตั้งค่าปัจจุบัน)</div>
                  <div className="mt-3 grid gap-2.5">
                    {canStart ? (
                      preview.map((q) => (
                        <div key={q.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 shadow-sm">
                          <div className="font-mono font-bold text-gray-900">
                            {q.fromValue}
                            <span className="text-orange-600 text-xs align-super">({q.fromBase})</span>
                            <span className="mx-2 text-gray-400">→</span>
                            <span className="text-gray-500">{baseLabel(q.toBase).short}</span>
                            <span className="text-orange-600 text-xs align-super">({q.toBase})</span>
                          </div>
                          <span className="text-xs font-mono bg-white border border-gray-200 rounded-full px-2.5 py-1 text-gray-600">= {q.toValue}</span>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">เลือกอย่างน้อย 2 ฐานเพื่อให้สร้างตัวอย่างได้</div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">* สุ่มใหม่ทุกครั้งที่กด Start • difficulty ควบคุมช่วงตัวเลข</p>
                </div>

                {/* Start Button */}
                <button
                  onClick={startQuiz}
                  disabled={!canStart}
                  className={`w-full py-4 rounded-xl font-extrabold text-base shadow-md transition flex items-center justify-center gap-2 ${
                    canStart ? "bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg" : "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-200"
                  }`}
                >
                  ▶ เริ่มทำ Quiz — 10 ข้อ (Level {difficulty} • {selectedBases.length ? selectedBases.join("/") : "—"})
                </button>
                <div className="flex items-center justify-center gap-4 text-xs font-medium text-gray-500">
                  <span>⏱ ไม่จับเวลา</span>
                  <span>•</span>
                  <span>✏️ ไม่ต้องใส่ leading zeros</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
              <h4 className="text-sm font-extrabold text-gray-900">กติกา</h4>
              <ul className="mt-3 space-y-2 text-sm text-gray-600 list-disc pl-5 leading-relaxed">
                <li>เลือก <span className="font-bold text-gray-900">Difficulty 1–10</span> และ <span className="font-bold text-orange-600">Base</span> ที่ต้องการก่อนเริ่ม (ต้อง ≥2 ฐาน)</li>
                <li>Quiz มี <span className="font-bold text-gray-900">10 ข้อ</span> สุ่มจาก pool ที่เลือกเท่านั้น</li>
                <li>พิมพ์คำตอบแล้วกด <span className="font-semibold text-orange-600">Submit</span> → ตรวจทันทีพร้อมเฉลย</li>
                <li>กด Enter เพื่อ Submit / Next ได้</li>
              </ul>
            </div>
          </div>
        )}

        {view === "quiz" && current && (
          <div className="w-full max-w-2xl space-y-5">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-gray-900">
                  Question <span className="text-orange-600">{idx + 1}</span> of 10
                </span>
                <span className="text-xs font-bold tracking-widest text-gray-500 uppercase">
                  Difficulty {difficulty} • {DIFFICULTY[difficulty].label} • {selectedBases.join("/")}
                </span>
              </div>
              <div className="mt-3 h-2.5 w-full rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${barPct}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-xs font-medium text-gray-400">
                <span>
                  Progress {Math.round(barPct)}% • Score {score}/{idx + (checked ? 1 : 0)}
                </span>
                <span>⏱ {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</span>
              </div>
              <div className="mt-3 flex gap-1.5 justify-center">
                {Array.from({ length: 10 }, (_, i) => (
                  <span
                    key={i}
                    className={`h-2 w-6 rounded-full transition-colors ${
                      i < idx ? (answers[i] && normalizeAnswer(answers[i]) === questions[i]?.toValue ? "bg-emerald-500" : "bg-red-400") : i === idx ? "bg-orange-500 ring-2 ring-orange-200" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 to-amber-500" />
              <div className="px-6 sm:px-8 py-8 sm:py-10 text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-xs font-bold text-gray-600 shadow-sm">
                  แปลงเลขฐาน
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold tracking-widest text-gray-500 uppercase">Convert this number</div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="font-mono font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-widest text-gray-900 break-all">
                      {current.fromValue}
                      <span className="ml-1 text-xl sm:text-2xl text-orange-600 align-super font-bold">({current.fromBase})</span>
                    </div>
                    <div className="text-gray-400 font-bold">↓</div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-200 shadow-sm">
                      <span className="text-sm font-extrabold text-gray-900">{baseLabel(current.toBase).name}</span>
                      <span className="text-xs font-mono bg-white border border-orange-200 rounded-full px-2 py-0.5 text-orange-700 font-bold">
                        Base {current.toBase} • {baseLabel(current.toBase).short}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-500">
                    {baseLabel(current.fromBase).name} ({current.fromBase}) → {baseLabel(current.toBase).name} ({current.toBase})
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-md p-6 sm:p-7 space-y-4">
              <label className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">✏️</span>
                Your Answer <span className="text-xs font-medium text-gray-500">({baseLabel(current.toBase).short} • Base {current.toBase})</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (!checked) handleSubmit();
                      else handleNext();
                    }
                  }}
                  disabled={checked}
                  placeholder={current.toBase === 16 ? "เช่น 1A3F" : current.toBase === 2 ? "10101" : "เช่น 255"}
                  className={`flex-1 rounded-xl border px-5 py-4 font-mono text-lg tracking-widest uppercase shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${
                    checked
                      ? feedback === "correct"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800 focus:ring-emerald-400"
                        : "border-red-300 bg-red-50 text-red-800 focus:ring-red-400"
                      : "border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:ring-orange-500 focus:shadow-md"
                  } disabled:opacity-90`}
                  autoFocus
                />
                {!checked ? (
                  <button onClick={handleSubmit} className="px-8 py-4 rounded-xl bg-orange-500 text-white font-extrabold text-base shadow-md hover:bg-orange-600 hover:shadow-lg transition whitespace-nowrap">
                    Submit ✓
                  </button>
                ) : (
                  <button onClick={handleNext} className="px-8 py-4 rounded-xl bg-gray-900 text-white font-extrabold text-base shadow-md hover:bg-black hover:shadow-lg transition whitespace-nowrap">
                    {idx + 1 < 10 ? "Next →" : "See Result →"}
                  </button>
                )}
              </div>
              {current.toBase > 10 && (
                <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  ใช้ {Array.from({ length: current.toBase }, (_, i) => valToChar(i)).join(" ")} (A=10..F=15)
                </p>
              )}
              <div className="flex gap-2">
                <button onClick={() => setInput("")} disabled={checked} className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50 disabled:opacity-50">
                  Clear
                </button>
                {!checked && (
                  <button onClick={handleSkip} className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-gray-50">
                    Skip
                  </button>
                )}
                <span className="text-xs text-gray-400 self-center">กด Enter เพื่อ Submit/Next</span>
              </div>

              {checked && feedback && (
                <div className={`rounded-xl border p-4 flex items-start gap-3 shadow-sm ${feedback === "correct" ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                  <span className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-extrabold text-white shadow-sm shrink-0 ${feedback === "correct" ? "bg-emerald-500" : "bg-red-500"}`}>
                    {feedback === "correct" ? "✓" : "×"}
                  </span>
                  <div className="flex-1">
                    <div className={`text-sm font-extrabold ${feedback === "correct" ? "text-emerald-800" : "text-red-800"}`}>{feedback === "correct" ? "Correct! ยอดเยี่ยม" : "Incorrect — ลองดูเฉลย"}</div>
                    <div className="text-sm mt-1">
                      {feedback === "incorrect" ? (
                        <span className="text-gray-700">
                          คำตอบที่ถูก: <span className="font-mono font-extrabold text-gray-900 bg-white border border-gray-200 rounded px-2 py-1">{current.toValue}</span> <span className="text-gray-500">({baseLabel(current.toBase).name})</span>
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium">ตอบถูกแล้ว — พร้อมไปข้อถัดไป!</span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-gray-500 mt-2 bg-white border border-gray-200 rounded-lg px-3 py-2 inline-block">
                      ตรวจ: {current.fromValue}({current.fromBase}) = {current.decimal}₁₀ = {current.toValue}({current.toBase})
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between text-xs font-medium text-gray-500">
              <button onClick={backToSettings} className="hover:text-gray-700 hover:underline">
                ← เปลี่ยนตั้งค่า
              </button>
              <span>
                ข้อ {idx + 1} / 10 • {checked ? "กด Next เพื่อไปต่อ" : "พิมพ์คำตอบแล้วกด Submit"}
              </span>
            </div>
          </div>
        )}

        {view === "result" && (
          <div className="w-full max-w-2xl space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden text-center">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-8 text-white">
                <div className="inline-flex h-16 w-16 rounded-full bg-white text-orange-600 items-center justify-center text-3xl font-extrabold shadow-md">
                  {score === 10 ? "🏆" : score >= 7 ? "🎉" : score >= 5 ? "👍" : "💪"}
                </div>
                <h2 className="mt-4 text-3xl font-extrabold tracking-tight">สรุปผล — {score}/10</h2>
                <p className="text-white/90 font-medium mt-1">{score === 10 ? "Perfect! เก่งมาก!" : score >= 8 ? "Excellent — ใกล้เต็ม!" : score >= 6 ? "Good job — ฝึกอีกนิด!" : score >= 4 ? "Not bad — มาฝึกต่อ!" : "Keep practicing — สู้ต่อ!"}</p>
                <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-1.5 border border-white/20 text-sm font-bold">
                  <span>
                    Level {difficulty} • {DIFFICULTY[difficulty].label}
                  </span>
                  <span>•</span>
                  <span>
                    {selectedBases.join("/")} • {Math.round((score / 10) * 100)}% • ⏱ {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
                  </span>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                    <div className="text-2xl font-extrabold text-emerald-600">{score}</div>
                    <div className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Correct</div>
                  </div>
                  <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                    <div className="text-2xl font-extrabold text-red-600">{10 - score}</div>
                    <div className="text-xs font-bold text-red-700 uppercase tracking-widest">Wrong</div>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                    <div className="text-2xl font-extrabold text-gray-900">{Math.round((score / 10) * 100)}%</div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Score</div>
                  </div>
                </div>

                <div className="h-3 w-full rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all" style={{ width: `${(score / 10) * 100}%` }} />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={restartSame} className="flex-1 py-3.5 rounded-xl bg-orange-500 text-white font-extrabold shadow-md hover:bg-orange-600 hover:shadow-lg transition">
                    🔄 เล่นใหม่ (Level {difficulty})
                  </button>
                  <button onClick={backToSettings} className="flex-1 py-3.5 rounded-xl bg-white border border-gray-200 text-gray-800 font-bold shadow-sm hover:bg-gray-50 hover:border-gray-300 transition">
                    ⚙ เปลี่ยนตั้งค่า
                  </button>
                </div>
                <Link href="/" className="block w-full py-3 rounded-xl bg-gray-900 text-white font-bold text-center shadow-sm hover:bg-black transition">
                  ← กลับ Calculator
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-gray-900">Review — ดูเฉลยทุกข้อ</h3>
                <span className="text-xs font-bold text-gray-500">{score}/10 correct</span>
              </div>
              <div className="divide-y divide-gray-200">
                {questions.map((q, i) => {
                  const userNorm = normalizeAnswer(answers[i] || "");
                  const isCorrect = userNorm === q.toValue;
                  return (
                    <div key={q.id} className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isCorrect ? "bg-emerald-50/40" : "bg-red-50/30"}`}>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Q{i + 1}</div>
                        <div className="font-mono font-bold text-gray-900">
                          {q.fromValue}
                          <span className="text-orange-600 text-xs">({q.fromBase})</span> → {baseLabel(q.toBase).short}({q.toBase})
                        </div>
                        <div className="text-xs text-gray-500">
                          = {q.decimal}₁₀ → <span className="font-mono font-bold text-gray-900">{q.toValue}</span>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${isCorrect ? "bg-emerald-100 border-emerald-200 text-emerald-700" : "bg-red-100 border-red-200 text-red-700"}`}>
                          {isCorrect ? "✓ Correct" : "× Wrong"}
                        </div>
                        <div className="text-sm font-mono">
                          <span className="text-gray-500">Your:</span> <span className={`font-bold ${isCorrect ? "text-emerald-700" : "text-red-700"}`}>{answers[i] ? normalizeAnswer(answers[i]) : "— (ข้าม)"}</span>
                        </div>
                        {!isCorrect && <div className="text-xs font-mono text-gray-600">Ans: {q.toValue}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <footer className="mt-10 text-center text-xs font-medium text-gray-500">© 2026 Handbook PLC • Number Base Quiz — 10 questions • Difficulty 1–10 • Base 2/8/10/16 + All</footer>
      </main>
    </div>
  );
}
