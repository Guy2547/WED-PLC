"use client";
import { useEffect, useMemo, useState } from "react";
import {
  calcSubtraction,
  calcAdd,
  calcMul,
  calcDiv,
  isValidForBase,
  toDecimalBigInt,
  fromDecimalBigInt,
  charToVal,
  valToChar,
} from "@/lib/baseMath";

type Op = "sub" | "add" | "mul" | "div";

const BASE_PRESETS = [2, 8, 10, 16] as const;

function digitsForBase(base: number): string {
  let s = "";
  for (let i = 0; i < base; i++) s += valToChar(i) + (i < base - 1 ? " " : "");
  return s;
}

export default function Home() {
  const [base, setBase] = useState<number>(8);
  const [a, setA] = useState<string>("752");
  const [b, setB] = useState<string>("364");
  const [op, setOp] = useState<Op>("sub");
  const [history, setHistory] = useState<string[]>([]);

  // load history
  useEffect(() => {
    try {
      const h = localStorage.getItem("plc-base-history");
      if (h) setHistory(JSON.parse(h));
    } catch {}
  }, []);
  const saveHistory = (entry: string) => {
    const next = [entry, ...history].slice(0, 8);
    setHistory(next);
    try {
      localStorage.setItem("plc-base-history", JSON.stringify(next));
    } catch {}
  };

  const validA = isValidForBase(a, base);
  const validB = isValidForBase(b, base);
  const canCompute = validA && validB && a.trim() !== "" && b.trim() !== "";

  const calc = useMemo(() => {
    if (!canCompute) return null;
    try {
      if (op === "sub") return { kind: "sub" as const, data: calcSubtraction(a, b, base) };
      if (op === "add") {
        const r = calcAdd(a, b, base);
        return { kind: "add" as const, data: r, steps: [] as never[] };
      }
      if (op === "mul") {
        const r = calcMul(a, b, base);
        return { kind: "mul" as const, data: r, steps: [] as never[] };
      }
      if (op === "div") {
        const r = calcDiv(a, b, base);
        return { kind: "div" as const, data: r };
      }
    } catch (e: unknown) {
      return { kind: "error" as const, msg: (e as Error).message };
    }
    return null;
  }, [a, b, base, op, canCompute]);

  const decimalA = useMemo(() => {
    if (!validA) return null;
    try {
      return toDecimalBigInt(a, base);
    } catch {
      return null;
    }
  }, [a, base, validA]);
  const decimalB = useMemo(() => {
    if (!validB) return null;
    try {
      return toDecimalBigInt(b, base);
    } catch {
      return null;
    }
  }, [b, base, validB]);

  const resultStr = useMemo(() => {
    if (!calc) return "—";
    if (calc.kind === "error") return calc.msg;
    if (calc.kind === "sub") return calc.data.result;
    return calc.data.result;
  }, [calc]);

  const handleSwap = () => {
    setA(b);
    setB(a);
  };

  const handleCopy = async () => {
    if (!calc || calc.kind === "error") return;
    const txt = `${a} ${opSymbol(op)} ${b} = ${resultStr} (ฐาน ${base})`;
    await navigator.clipboard.writeText(txt);
    saveHistory(txt);
  };

  const opSymbol = (o: Op) => {
    if (o === "add") return "+";
    if (o === "sub") return "−";
    if (o === "mul") return "×";
    return "÷";
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 dark:bg-zinc-900/70 border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow">
              PLC
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-semibold leading-none tracking-tight">
                Handbook PLC
              </h1>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                คำนวณเลขฐาน • Base Calculator 2–36
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <a
              href="https://github.com/Guy2547/WED-PLC"
              target="_blank"
              className="px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              GitHub
            </a>
            <span className="px-3 py-1.5 rounded-full bg-amber-500 text-white font-medium">
              เริ่มที่การลบเลขฐาน
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        {/* Hero */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            เครื่องคำนวณ<span className="text-amber-600">เลขฐาน</span> — เน้นการลบ (Borrow)
          </h2>
          <p className="mt-2 text-sm sm:text-[15px] leading-6 text-zinc-600 dark:text-zinc-400 max-w-3xl">
            รองรับฐาน 2 ถึง 36 (2=Binary, 8=Octal, 10=Decimal, 16=Hex) — พิมพ์เลขฐานแล้วเลือก
            <span className="font-semibold text-zinc-900 dark:text-zinc-100"> ลบเลขฐาน </span>
            ระบบจะแสดง <span className="font-medium">วิธียืมค่าทีละหลัก</span> พร้อมตรวจฐานและแปลงเป็นฐานอื่นอัตโนมัติ เหมาะสำหรับงาน PLC, ไมโครคอนโทรลเลอร์ และวิชาดิจิทัล
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Controls */}
          <div className="lg:col-span-3 space-y-4">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 space-y-5">
                {/* Base selector */}
                <div>
                  <label className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
                    เลือกฐาน (Base)
                  </label>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {BASE_PRESETS.map((v) => (
                      <button
                        key={v}
                        onClick={() => setBase(v)}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                          base === v
                            ? "bg-amber-500 border-amber-500 text-white shadow"
                            : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                        }`}
                      >
                        ฐาน {v}
                        <span className="ml-1 text-xs opacity-70">
                          {v === 2 ? "(Bin)" : v === 8 ? "(Oct)" : v === 16 ? "(Hex)" : "(Dec)"}
                        </span>
                      </button>
                    ))}
                    <div className="flex items-center gap-2 ml-1">
                      <span className="text-xs text-zinc-500">กำหนดเอง</span>
                      <input
                        type="number"
                        min={2}
                        max={36}
                        value={base}
                        onChange={(e) => {
                          const v = parseInt(e.target.value || "10", 10);
                          if (!isNaN(v) && v >= 2 && v <= 36) setBase(v);
                        }}
                        className="w-20 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    ตัวเลขที่ใช้ได้: <span className="font-mono">{digitsForBase(base)}</span>
                    {base > 10 ? " (A=10, B=11, ... Z=35)" : ""}
                  </p>
                  <div className="mt-2">
                    <input
                      type="range"
                      min={2}
                      max={36}
                      value={base}
                      onChange={(e) => setBase(parseInt(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span>2</span>
                      <span>16</span>
                      <span>36</span>
                    </div>
                  </div>
                </div>

                {/* Operation */}
                <div>
                  <label className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
                    เลือกการคำนวณ
                  </label>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {[
                      { id: "sub", label: "ลบ (−)", desc: "Borrow", highlight: true },
                      { id: "add", label: "บวก (+)", desc: "Add" },
                      { id: "mul", label: "คูณ (×)", desc: "Mul" },
                      { id: "div", label: "หาร (÷)", desc: "Div" },
                    ].map((o) => (
                      <button
                        key={o.id}
                        onClick={() => setOp(o.id as Op)}
                        className={`rounded-xl border p-3 text-center transition ${
                          op === o.id
                            ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white shadow"
                            : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-700"
                        } ${o.highlight && op !== o.id ? "ring-1 ring-amber-200" : ""}`}
                      >
                        <div className="text-sm font-semibold">{o.label}</div>
                        <div className={`text-[11px] ${op === o.id ? "opacity-70" : "text-zinc-500"}`}>{o.desc}</div>
                        {o.highlight && op === "sub" ? (
                          <div className="mt-1 text-[10px] font-medium text-amber-500">● แนะนำ</div>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
                  <div>
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      ตัวตั้ง {op === "sub" ? "(ลบออก)" : op === "add" ? "(บวก)" : op === "mul" ? "(คูณ)" : "(หาร)"} — A
                    </label>
                    <input
                      value={a}
                      onChange={(e) => setA(e.target.value.toUpperCase())}
                      placeholder={base === 16 ? "เช่น 1A3F" : base === 2 ? "1011" : "752"}
                      className={`mt-1 w-full rounded-xl border px-4 py-3 font-mono text-lg tracking-widest uppercase focus:outline-none focus:ring-2 ${
                        validA || a === ""
                          ? "border-zinc-200 dark:border-zinc-700 focus:ring-amber-500 bg-white dark:bg-zinc-800"
                          : "border-red-300 bg-red-50 dark:bg-red-950/30 focus:ring-red-400"
                      }`}
                    />
                    {!validA && a !== "" ? (
                      <p className="mt-1 text-xs text-red-600">มีตัวอักษรที่ไม่ตรงกับฐาน {base}</p>
                    ) : (
                      <p className="mt-1 text-xs text-zinc-500 font-mono">= {decimalA !== null ? decimalA.toString() + " (ฐาน 10)" : "—"}</p>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center justify-center gap-2 pb-1">
                    <div className="h-10 w-10 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-lg font-bold">
                      {opSymbol(op)}
                    </div>
                    <button
                      onClick={handleSwap}
                      className="text-xs px-2 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                      title="สลับ A ↔ B"
                    >
                      ⇄ สลับ
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">ตัวลบ / ตัวบวก — B</label>
                    <input
                      value={b}
                      onChange={(e) => setB(e.target.value.toUpperCase())}
                      placeholder={base === 16 ? "เช่น FF" : "364"}
                      className={`mt-1 w-full rounded-xl border px-4 py-3 font-mono text-lg tracking-widest uppercase focus:outline-none focus:ring-2 ${
                        validB || b === ""
                          ? "border-zinc-200 dark:border-zinc-700 focus:ring-amber-500 bg-white dark:bg-zinc-800"
                          : "border-red-300 bg-red-50 dark:bg-red-950/30 focus:ring-red-400"
                      }`}
                    />
                    {!validB && b !== "" ? (
                      <p className="mt-1 text-xs text-red-600">มีตัวอักษรที่ไม่ตรงกับฐาน {base}</p>
                    ) : (
                      <p className="mt-1 text-xs text-zinc-500 font-mono">= {decimalB !== null ? decimalB.toString() + " (ฐาน 10)" : "—"}</p>
                    )}
                  </div>
                </div>

                {/* Example chips */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-zinc-500">ตัวอย่าง:</span>
                  {base === 8
                    ? [
                        ["752", "364"],
                        ["1000", "1"],
                        ["777", "123"],
                      ].map(([x, y]) => (
                        <button
                          key={x + y}
                          onClick={() => {
                            setA(x);
                            setB(y);
                            setOp("sub");
                          }}
                          className="text-xs px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 hover:bg-amber-100"
                        >
                          {x} − {y}
                        </button>
                      ))
                    : base === 2
                    ? [
                        ["1010", "0110"],
                        ["10000", "1"],
                      ].map(([x, y]) => (
                        <button
                          key={x + y}
                          onClick={() => {
                            setA(x);
                            setB(y);
                            setOp("sub");
                          }}
                          className="text-xs px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 hover:bg-amber-100"
                        >
                          {x} − {y}
                        </button>
                      ))
                    : base === 16
                    ? [
                        ["1A3F", "FF"],
                        ["100", "1"],
                      ].map(([x, y]) => (
                        <button
                          key={x + y}
                          onClick={() => {
                            setA(x);
                            setB(y);
                            setOp("sub");
                          }}
                          className="text-xs px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 hover:bg-amber-100"
                        >
                          {x} − {y}
                        </button>
                      ))
                    : [
                        ["1000", "1"],
                        ["500", "123"],
                      ].map(([x, y]) => (
                        <button
                          key={x + y}
                          onClick={() => {
                            setA(x);
                            setB(y);
                            setOp("sub");
                          }}
                          className="text-xs px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 hover:bg-amber-100"
                        >
                          {x} − {y}
                        </button>
                      ))}
                  <button
                    onClick={() => {
                      setA("");
                      setB("");
                    }}
                    className="text-xs px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50"
                  >
                    ล้าง
                  </button>
                </div>
              </div>
            </div>

            {/* Result Card */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 sm:px-6 py-4 text-white flex items-center justify-between">
                <div>
                  <div className="text-xs opacity-90 tracking-widest uppercase">ผลลัพธ์ (ฐาน {base})</div>
                  <div className="font-mono text-2xl sm:text-3xl font-bold tracking-widest mt-1 break-all">
                    {canCompute ? resultStr : "—"}
                  </div>
                  {calc && calc.kind === "sub" && calc.data.swapped ? (
                    <div className="text-xs mt-1 bg-white/20 inline-block px-2 py-0.5 rounded-full">
                      ค่าติดลบ: สลับคำนวณ {b} − {a} แล้วเติมเครื่องหมายลบ
                    </div>
                  ) : null}
                </div>
                <button
                  onClick={handleCopy}
                  disabled={!canCompute || !calc || calc.kind === "error"}
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-zinc-900 text-sm font-medium disabled:opacity-50 hover:bg-zinc-100"
                >
                  ⎙ คัดลอก
                </button>
              </div>

              {canCompute && calc && calc.kind !== "error" ? (
                <div className="p-5 sm:p-6 space-y-4">
                  {/* decimal verification */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 p-3">
                      <div className="text-xs text-zinc-500">A ฐาน 10</div>
                      <div className="font-mono font-medium">{calc.kind === "sub" ? calc.data.decimalA.toString() : calc.data.decimalA.toString()}</div>
                    </div>
                    <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 p-3">
                      <div className="text-xs text-zinc-500">B ฐาน 10</div>
                      <div className="font-mono font-medium">{calc.kind === "sub" ? calc.data.decimalB.toString() : calc.data.decimalB.toString()}</div>
                    </div>
                    <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
                      <div className="text-xs text-amber-700 dark:text-amber-300">
                        ผลลัพธ์ ฐาน 10 {calc.kind === "div" ? "(หารลงตัว)" : ""}
                      </div>
                      <div className="font-mono font-bold">
                        {calc.kind === "sub"
                          ? calc.data.decimalResult.toString()
                          : calc.kind === "div"
                          ? `${calc.data.decimalResult.toString()} เศษ ${calc.data.decimalRemainder.toString()}`
                          : calc.data.decimalResult.toString()}
                      </div>
                    </div>
                  </div>

                  {/* conversions */}
                  <div>
                    <div className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">แปลงผลลัพธ์เป็นฐานอื่น</div>
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[2, 8, 10, 16].map((b2) => {
                        const dec = calc.kind === "sub" ? calc.data.decimalResult : calc.kind === "div" ? calc.data.decimalResult : calc.data.decimalResult;
                        const v = fromDecimalBigInt(dec, b2);
                        return (
                          <div key={b2} className={`rounded-xl border p-3 ${b2 === base ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"}`}>
                            <div className="text-[11px] text-zinc-500">
                              ฐาน {b2} {b2 === 2 ? "BIN" : b2 === 8 ? "OCT" : b2 === 10 ? "DEC" : "HEX"}
                            </div>
                            <div className="font-mono text-sm font-semibold break-all">{v}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {calc.kind === "div" ? (
                    <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 p-3 text-sm">
                      <div className="font-medium">
                        เศษเหลือ: {calc.data.remainder} (ฐาน {base}) = {calc.data.decimalRemainder.toString()} (ฐาน 10)
                      </div>
                    </div>
                  ) : null}
                  <button
                    onClick={handleCopy}
                    className="sm:hidden w-full py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium"
                  >
                    คัดลอกผลลัพธ์
                  </button>
                </div>
              ) : (
                <div className="p-6 text-sm text-zinc-500 text-center">
                  {canCompute ? "กำลังคำนวณ..." : "กรอกตัวเลขให้ถูกต้องตามฐานที่เลือกเพื่อคำนวณ"}
                </div>
              )}
            </div>
          </div>

          {/* Right: Steps */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
              <div className="px-5 sm:px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">≡</span>
                  วิธีคิดแบบยืมค่า (Borrow) — ทีละหลัก
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  {op === "sub" ? "แสดงการลบฐาน " + base + " แบบตั้งลบ เหมือนคิดด้วยมือ" : "วิธีทำทีละหลักจะแสดงเฉพาะการลบ (Borrow) — การบวก/คูณ/หาร แสดงผลลัพธ์ตรง"}
                </p>
              </div>

              {op === "sub" && canCompute && calc && calc.kind === "sub" ? (
                calc.data.steps.length === 0 && calc.data.swapped ? (
                  <div className="p-6 text-sm text-zinc-600 dark:text-zinc-400">
                    <p>
                      เนื่องจาก {a} {"<"} {b} ในฐาน {base} ผลลัพธ์จึงติดลบ ระบบคำนวณ <span className="font-mono font-semibold">{b} − {a}</span> = {calc.data.result.slice(1)} แล้วเติมเครื่องหมายลบ
                    </p>
                    <div className="mt-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 p-4 font-mono text-xs">
                      <div>ฐาน 10: {calc.data.decimalA.toString()} − {calc.data.decimalB.toString()} = {calc.data.decimalResult.toString()}</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Visual subtraction */}
                    <div className="overflow-x-auto">
                      <div className="min-w-[280px] font-mono text-sm sm:text-base leading-7">
                        {/* borrow row */}
                        <div className="flex justify-end gap-1 text-[11px] text-red-600 pr-1">
                          <span className="w-6 text-right text-zinc-400">ยืม→</span>
                          {calc.data.paddedA.split("").map((_, i) => {
                            // borrow generated at i? Actually borrows[i] is borrow out from i to left
                            // For display, show borrow indicator above next digit?
                            // Show dot if borrows[i] ===1 then borrow goes to i-1, so indicator at i-1?
                            // Simpler: show borrows[i] at column i as tiny ¹ if borrow into this column was 1
                            const stepsAtI = calc.data.steps.find((s) => s.indexFromLeft === i);
                            const borrowIn = stepsAtI?.borrowIn ?? 0;
                            return (
                              <span key={i} className="w-6 sm:w-7 text-center">
                                {borrowIn ? "¹" : ""}
                              </span>
                            );
                          })}
                        </div>
                        <div className="flex justify-end gap-1">
                          <span className="w-6 text-right text-zinc-400 text-xs py-1"> </span>
                          {calc.data.paddedA.split("").map((ch, i) => {
                            const s = calc.data.steps.find((x) => x.indexFromLeft === i);
                            const borrowed = s?.borrowIn ? "text-red-600 line-through decoration-red-600" : "";
                            return (
                              <span key={i} className={`w-6 sm:w-7 text-center py-1 rounded ${borrowed} ${s?.borrowOut ? "bg-amber-50 dark:bg-amber-950/30" : ""}`}>
                                {ch}
                              </span>
                            );
                          })}
                        </div>
                        <div className="flex justify-end gap-1">
                          <span className="w-6 text-right text-zinc-500">−</span>
                          {calc.data.paddedB.split("").map((ch) => (
                            <span key={ch + Math.random()} className="w-6 sm:w-7 text-center py-1">
                              {ch}
                            </span>
                          ))}
                        </div>
                        <div className="border-t-2 border-zinc-900 dark:border-zinc-100 mt-1 flex justify-end gap-1 font-bold">
                          <span className="w-6 text-right"></span>
                          {calc.data.paddedResult.padStart(calc.data.paddedA.length, " ").split("").map((ch, i) => (
                            <span key={i} className="w-6 sm:w-7 text-center py-1 text-amber-600 dark:text-amber-400">
                              {ch.trim() === "" ? "" : ch}
                            </span>
                          ))}
                        </div>
                        <div className="flex justify-end gap-1 text-[10px] text-zinc-400 mt-1">
                          <span className="w-6 text-right"></span>
                          {calc.data.paddedA.split("").map((_, idx) => (
                            <span key={idx} className="w-6 sm:w-7 text-center">
                              {calc.data.paddedA.length - idx}
                            </span>
                          ))}
                        </div>
                        <div className="text-[10px] text-zinc-400 text-right">ตำแหน่งจากขวา →</div>
                      </div>
                    </div>

                    {/* step list */}
                    <div className="space-y-2">
                      {calc.data.steps
                        .slice()
                        .reverse()
                        .map((s, idx) => (
                          <div key={idx} className={`rounded-xl border p-3 text-sm ${s.borrowOut ? "border-amber-200 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-800" : "border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50"}`}>
                            <div className="flex items-start justify-between gap-2">
                              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${s.borrowOut ? "bg-amber-500 text-white" : "bg-zinc-900 dark:bg-zinc-700 text-white"}`}>
                                {calc.data.steps.length - idx}
                              </span>
                              <div className="flex-1">
                                <div className="font-medium">
                                  หลักที่ {s.pos + 1}:{" "}
                                  <span className="font-mono">
                                    {s.aChar} − {s.bChar}
                                  </span>{" "}
                                  {s.borrowIn ? (
                                    <span className="text-red-600">(หักยืม {s.borrowIn} → {s.aVal}−{s.borrowIn}={s.aVal - s.borrowIn})</span>
                                  ) : null}{" "}
                                  {s.borrowOut ? (
                                    <span className="text-amber-700 dark:text-amber-300">→ ยืม {base} ได้ {s.effectiveA}</span>
                                  ) : null}
                                  {" = "}
                                  <span className="font-mono font-bold text-amber-600">{s.resultChar}</span>
                                  <span className="text-zinc-500 font-mono text-xs"> ({s.effectiveA} − {s.bVal} = {s.resultVal})</span>
                                </div>
                                <div className="text-xs text-zinc-500 mt-1">{s.text}</div>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full font-mono ${s.borrowOut ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" : "bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"}`}>
                                {s.borrowOut ? "ยืม" : "ไม่ยืม"}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>

                    <div className="rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 p-4 text-sm">
                      <div className="font-semibold">สรุป</div>
                      <div className="font-mono mt-1 break-all">
                        {a} − {b} = {calc.data.result} <span className="opacity-70">(ฐาน {base})</span>
                      </div>
                      <div className="font-mono text-xs opacity-70 mt-1">
                        ตรวจฐาน 10: {calc.data.decimalA.toString()} − {calc.data.decimalB.toString()} = {calc.data.decimalResult.toString()} → ฐาน {base} = {calc.data.result}
                      </div>
                    </div>
                  </div>
                )
              ) : op !== "sub" ? (
                <div className="p-6 text-sm text-zinc-500">
                  โหมด <span className="font-semibold">{op === "add" ? "บวก" : op === "mul" ? "คูณ" : "หาร"}</span> จะคำนวณผ่านฐาน 10 แล้วแปลงกลับเป็นฐาน {base} — ดูผลลัพธ์ที่การ์ดซ้าย
                  {canCompute && calc && calc.kind !== "error" && calc.kind !== "sub" ? (
                    <div className="mt-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 p-4 font-mono text-xs space-y-1">
                      <div>{a} ({decimalA?.toString()}₁₀) {opSymbol(op)} {b} ({decimalB?.toString()}₁₀)</div>
                      <div>= {calc.data.decimalResult.toString()}₁₀ = {calc.data.result} (ฐาน {base})</div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="p-6 text-sm text-zinc-500 text-center">กรอกเลขฐานให้ถูกต้องเพื่อดูวิธียืมค่า</div>
              )}
            </div>

            {/* Info / Handbook */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6">
              <h4 className="text-sm font-semibold">คู่มือย่อ — การลบเลขฐาน</h4>
              <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400 list-disc pl-5">
                <li>
                  ยืม 1 ครั้ง = ได้ <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">{base}</span> ในฐาน {base} (เช่น ฐาน 8 ยืม 1 ได้ 8, ฐาน 16 ยืม 1 ได้ 16)
                </li>
                <li>ถ้าตัวตั้งน้อยกว่าตัวลบในหลักนั้น ต้องยืมจากหลักซ้ายถัดไป</li>
                <li>
                  ตัวอย่าง ฐาน 8: <span className="font-mono">752 − 364</span> → 2−4 ยืม 8 ได้ 10−4=6, 4(หลังยืม)−6 ยืมต่อ, ฯลฯ = <span className="font-mono font-semibold">366₈</span>
                </li>
                <li>งาน PLC: ใช้ตรวจ Address, Mask, และการคำนวณค่า Timer/Counter ที่เป็น Hex/Oct</li>
              </ul>
              {history.length > 0 ? (
                <div className="mt-4">
                  <div className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">ประวัติล่าสุด</div>
                  <div className="mt-2 space-y-1">
                    {history.map((h, i) => (
                      <div key={i} className="text-xs font-mono bg-zinc-50 dark:bg-zinc-800 rounded px-2 py-1.5 border border-zinc-100 dark:border-zinc-700">
                        {h}
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setHistory([]);
                        try {
                          localStorage.removeItem("plc-base-history");
                        } catch {}
                      }}
                      className="text-xs text-zinc-500 hover:text-zinc-700 mt-1"
                    >
                      ล้างประวัติ
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-800 dark:to-zinc-900 text-white p-5 sm:p-6">
              <h4 className="text-sm font-semibold">พร้อม Deploy บน Vercel</h4>
              <p className="text-sm opacity-80 mt-1">โปรเจคนี้เป็น Next.js + Tailwind — push ขึ้น GitHub แล้ว Import ใน Vercel ได้ทันที (Framework preset: Next.js)</p>
              <div className="mt-3 flex gap-2">
                <a href="https://github.com/Guy2547/WED-PLC" target="_blank" className="text-xs px-3 py-1.5 rounded-full bg-white text-zinc-900 font-medium">
                  ดู GitHub
                </a>
                <span className="text-xs px-3 py-1.5 rounded-full border border-white/20">npx next build ผ่านแล้ว ✓</span>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-10 pt-6 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500">
          © 2026 Handbook PLC — สร้างด้วย Next.js 16 + Tailwind CSS • รองรับฐาน 2–36 • เริ่มที่การลบเลขฐาน
        </footer>
      </main>
    </div>
  );
}
