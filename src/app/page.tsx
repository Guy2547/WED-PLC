"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  calcSubtraction,
  calcAdd,
  calcMul,
  calcDiv,
  isValidForBase,
  toDecimalBigInt,
  fromDecimalBigInt,
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
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-800">
      {/* Header — Light, clean, shadow-sm */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
              PLC
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold leading-none tracking-tight text-gray-900">
                Handbook PLC
              </h1>
              <p className="text-xs sm:text-[13px] text-gray-500 font-medium">
                คำนวณเลขฐาน • Base Calculator 2–36
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <a
              href="https://github.com/Guy2547/WED-PLC"
              target="_blank"
              className="px-4 py-2 rounded-full border border-gray-200 bg-white text-gray-700 font-medium shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow transition"
            >
              GitHub
            </a>
            <Link
              href="/quiz"
              className="px-4 py-2 rounded-full bg-orange-500 text-white font-semibold shadow-md hover:bg-orange-600 hover:shadow-lg transition"
            >
              🎯 Quiz 10 ข้อ
            </Link>
            <span className="hidden lg:inline-flex px-3 py-1.5 rounded-full bg-gray-900 text-white text-xs font-semibold shadow-sm">
              ลบเลขฐาน
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 bg-gray-50">
        {/* Hero — larger, bolder, high contrast */}
        <div className="mb-8 sm:mb-10">
          <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold tracking-tight leading-tight text-gray-900">
            เครื่องคำนวณ<span className="text-orange-500">เลขฐาน</span> — เน้นการลบ
            <span className="text-gray-900"> (Borrow)</span>
          </h2>
          <p className="mt-3 text-[15px] sm:text-base leading-7 text-gray-600 max-w-3xl font-normal">
            รองรับฐาน 2 ถึง 36 (2=Binary, 8=Octal, 10=Decimal, 16=Hex) — พิมพ์เลขฐานแล้วเลือก
            <span className="font-bold text-gray-900"> ลบเลขฐาน </span>
            ระบบจะแสดง <span className="font-semibold text-gray-800">วิธียืมค่าทีละหลัก</span> พร้อมตรวจฐานและแปลงเป็นฐานอื่นอัตโนมัติ เหมาะสำหรับงาน PLC, ไมโครคอนโทรลเลอร์ และวิชาดิจิทัล
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Left: Controls — 3 cols */}
          <div className="lg:col-span-3 space-y-5">
            {/* Base + Operation Card */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="p-6 sm:p-7 space-y-7">
                {/* Base selector */}
                <div>
                  <label className="text-xs font-bold tracking-widest text-gray-500 uppercase">
                    เลือกฐาน (Base)
                  </label>
                  <div className="mt-3 flex flex-wrap items-center gap-2.5">
                    {BASE_PRESETS.map((v) => (
                      <button
                        key={v}
                        onClick={() => setBase(v)}
                        className={`px-5 py-2.5 rounded-full text-sm font-semibold border transition-all shadow-sm ${
                          base === v
                            ? "bg-orange-500 border-orange-500 text-white shadow-md scale-[1.02]"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md"
                        }`}
                      >
                        ฐาน {v}
                        <span className={`ml-1 text-xs ${base === v ? "text-white/80" : "text-gray-500"}`}>
                          {v === 2 ? "(Bin)" : v === 8 ? "(Oct)" : v === 16 ? "(Hex)" : "(Dec)"}
                        </span>
                      </button>
                    ))}
                    <div className="flex items-center gap-2 ml-1 bg-gray-50 border border-gray-200 rounded-full px-3 py-1 shadow-sm">
                      <span className="text-xs font-medium text-gray-600">กำหนดเอง</span>
                      <input
                        type="number"
                        min={2}
                        max={36}
                        value={base}
                        onChange={(e) => {
                          const v = parseInt(e.target.value || "10", 10);
                          if (!isNaN(v) && v >= 2 && v <= 36) setBase(v);
                        }}
                        className="w-16 rounded-full border border-gray-200 bg-white px-2 py-1.5 text-sm font-semibold text-center text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm"
                      />
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 inline-block shadow-sm">
                    ตัวเลขที่ใช้ได้: <span className="font-mono font-semibold text-gray-800">{digitsForBase(base)}</span>
                    {base > 10 ? " (A=10, B=11, ... Z=35)" : ""}
                  </p>
                  <div className="mt-4">
                    <input
                      type="range"
                      min={2}
                      max={36}
                      value={base}
                      onChange={(e) => setBase(parseInt(e.target.value))}
                      className="w-full accent-orange-500 h-2"
                    />
                    <div className="flex justify-between text-[11px] font-medium text-gray-400">
                      <span>2</span>
                      <span>16</span>
                      <span>36</span>
                    </div>
                  </div>
                </div>

                {/* Operation */}
                <div>
                  <label className="text-xs font-bold tracking-widest text-gray-500 uppercase">
                    เลือกการคำนวณ
                  </label>
                  <div className="mt-3 grid grid-cols-4 gap-3">
                    {[
                      { id: "sub", label: "ลบ (−)", desc: "Borrow", highlight: true },
                      { id: "add", label: "บวก (+)", desc: "Add" },
                      { id: "mul", label: "คูณ (×)", desc: "Mul" },
                      { id: "div", label: "หาร (÷)", desc: "Div" },
                    ].map((o) => (
                      <button
                        key={o.id}
                        onClick={() => setOp(o.id as Op)}
                        className={`rounded-xl border p-3.5 text-center transition-all shadow-sm ${
                          op === o.id
                            ? "bg-orange-500 text-white border-orange-500 shadow-md scale-[1.02]"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md"
                        } ${o.highlight && op !== o.id ? "ring-2 ring-orange-100" : ""}`}
                      >
                        <div className="text-sm font-bold">{o.label}</div>
                        <div className={`text-xs font-medium ${op === o.id ? "text-white/80" : "text-gray-500"}`}>{o.desc}</div>
                        {o.highlight && op === "sub" ? (
                          <div className="mt-1 text-[11px] font-bold text-white bg-white/20 rounded-full px-2 py-0.5 inline-block">● แนะนำ</div>
                        ) : o.highlight && op !== o.id ? (
                          <div className="mt-1 text-[11px] font-semibold text-orange-600">แนะนำ</div>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-end">
                  <div>
                    <label className="text-xs font-bold text-gray-700">
                      ตัวตั้ง {op === "sub" ? "(ลบออก)" : op === "add" ? "(บวก)" : op === "mul" ? "(คูณ)" : "(หาร)"} — A
                    </label>
                    <input
                      value={a}
                      onChange={(e) => setA(e.target.value.toUpperCase())}
                      placeholder={base === 16 ? "เช่น 1A3F" : base === 2 ? "1011" : "752"}
                      className={`mt-2 w-full rounded-xl border px-4 py-3.5 font-mono text-lg tracking-widest uppercase shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${
                        validA || a === ""
                          ? "border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:ring-orange-500 focus:shadow-md"
                          : "border-red-300 bg-red-50 text-red-900 focus:ring-red-400"
                      }`}
                    />
                    {!validA && a !== "" ? (
                      <p className="mt-1.5 text-xs font-medium text-red-600">มีตัวอักษรที่ไม่ตรงกับฐาน {base}</p>
                    ) : (
                      <p className="mt-1.5 text-xs font-mono text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1 inline-block">
                        = {decimalA !== null ? decimalA.toString() + " (ฐาน 10)" : "—"}
                      </p>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center justify-center gap-2.5 pb-1">
                    <div className="h-11 w-11 rounded-full bg-orange-500 text-white flex items-center justify-center text-xl font-extrabold shadow-md border-2 border-orange-400">
                      {opSymbol(op)}
                    </div>
                    <button
                      onClick={handleSwap}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition"
                      title="สลับ A ↔ B"
                    >
                      ⇄ สลับ
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700">ตัวลบ / ตัวบวก — B</label>
                    <input
                      value={b}
                      onChange={(e) => setB(e.target.value.toUpperCase())}
                      placeholder={base === 16 ? "เช่น FF" : "364"}
                      className={`mt-2 w-full rounded-xl border px-4 py-3.5 font-mono text-lg tracking-widest uppercase shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${
                        validB || b === ""
                          ? "border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:ring-orange-500 focus:shadow-md"
                          : "border-red-300 bg-red-50 text-red-900 focus:ring-red-400"
                      }`}
                    />
                    {!validB && b !== "" ? (
                      <p className="mt-1.5 text-xs font-medium text-red-600">มีตัวอักษรที่ไม่ตรงกับฐาน {base}</p>
                    ) : (
                      <p className="mt-1.5 text-xs font-mono text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1 inline-block">
                        = {decimalB !== null ? decimalB.toString() + " (ฐาน 10)" : "—"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Example chips */}
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">ตัวอย่าง:</span>
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
                          className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 shadow-sm hover:bg-orange-100 hover:border-orange-300 hover:shadow transition"
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
                          className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 shadow-sm hover:bg-orange-100 hover:border-orange-300 hover:shadow transition"
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
                          className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 shadow-sm hover:bg-orange-100 hover:border-orange-300 hover:shadow transition"
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
                          className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 shadow-sm hover:bg-orange-100 hover:border-orange-300 hover:shadow transition"
                        >
                          {x} − {y}
                        </button>
                      ))}
                  <button
                    onClick={() => {
                      setA("");
                      setB("");
                    }}
                    className="text-xs font-semibold px-3.5 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50 hover:text-gray-800 hover:shadow transition"
                  >
                    ล้าง
                  </button>
                </div>
              </div>
            </div>

            {/* Result Card — light high contrast */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 sm:px-7 py-5 text-white flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold opacity-90 tracking-widest uppercase">ผลลัพธ์ (ฐาน {base})</div>
                  <div className="font-mono text-2xl sm:text-3xl font-extrabold tracking-widest mt-1 break-all text-white drop-shadow-sm">
                    {canCompute ? resultStr : "—"}
                  </div>
                  {calc && calc.kind === "sub" && calc.data.swapped ? (
                    <div className="text-xs mt-1.5 bg-white/20 backdrop-blur inline-block px-2.5 py-1 rounded-full font-medium border border-white/20">
                      ค่าติดลบ: สลับคำนวณ {b} − {a} แล้วเติมเครื่องหมายลบ
                    </div>
                  ) : null}
                </div>
                <button
                  onClick={handleCopy}
                  disabled={!canCompute || !calc || calc.kind === "error"}
                  className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-gray-900 text-sm font-bold shadow-md hover:bg-gray-50 hover:shadow-lg disabled:opacity-50 transition border border-gray-100"
                >
                  ⎙ คัดลอก
                </button>
              </div>

              {canCompute && calc && calc.kind !== "error" ? (
                <div className="p-6 sm:p-7 space-y-5 bg-white">
                  {/* decimal verification */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div className="rounded-xl bg-gray-50 border border-gray-200 p-3.5 shadow-sm">
                      <div className="text-xs font-bold tracking-widest text-gray-500 uppercase">A ฐาน 10</div>
                      <div className="font-mono font-bold text-gray-900 text-base">{calc.kind === "sub" ? calc.data.decimalA.toString() : calc.data.decimalA.toString()}</div>
                    </div>
                    <div className="rounded-xl bg-gray-50 border border-gray-200 p-3.5 shadow-sm">
                      <div className="text-xs font-bold tracking-widest text-gray-500 uppercase">B ฐาน 10</div>
                      <div className="font-mono font-bold text-gray-900 text-base">{calc.kind === "sub" ? calc.data.decimalB.toString() : calc.data.decimalB.toString()}</div>
                    </div>
                    <div className="rounded-xl bg-orange-50 border border-orange-200 p-3.5 shadow-sm">
                      <div className="text-xs font-bold tracking-widest text-orange-700 uppercase">
                        ผลลัพธ์ ฐาน 10 {calc.kind === "div" ? "(หารลงตัว)" : ""}
                      </div>
                      <div className="font-mono font-extrabold text-orange-700 text-base">
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
                    <div className="text-xs font-bold tracking-widest text-gray-500 uppercase">แปลงผลลัพธ์เป็นฐานอื่น</div>
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[2, 8, 10, 16].map((b2) => {
                        const dec = calc.kind === "sub" ? calc.data.decimalResult : calc.kind === "div" ? calc.data.decimalResult : calc.data.decimalResult;
                        const v = fromDecimalBigInt(dec, b2);
                        const isActive = b2 === base;
                        return (
                          <div
                            key={b2}
                            className={`rounded-xl border p-3.5 shadow-sm transition ${
                              isActive ? "border-orange-500 bg-orange-50 shadow-md" : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                            }`}
                          >
                            <div className={`text-xs font-bold tracking-wide ${isActive ? "text-orange-700" : "text-gray-500"}`}>
                              ฐาน {b2} {b2 === 2 ? "BIN" : b2 === 8 ? "OCT" : b2 === 10 ? "DEC" : "HEX"}
                            </div>
                            <div className={`font-mono text-sm font-bold break-all mt-1 ${isActive ? "text-orange-700" : "text-gray-900"}`}>{v}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {calc.kind === "div" ? (
                    <div className="rounded-xl bg-gray-50 border border-gray-200 p-3.5 text-sm shadow-sm">
                      <div className="font-bold text-gray-900">
                        เศษเหลือ: <span className="font-mono text-orange-600">{calc.data.remainder}</span> (ฐาน {base}) = {calc.data.decimalRemainder.toString()} (ฐาน 10)
                      </div>
                    </div>
                  ) : null}
                  <button
                    onClick={handleCopy}
                    className="sm:hidden w-full py-3 rounded-xl bg-orange-500 text-white text-sm font-bold shadow-md hover:bg-orange-600 hover:shadow-lg transition"
                  >
                    คัดลอกผลลัพธ์
                  </button>
                </div>
              ) : (
                <div className="p-7 text-sm text-gray-500 text-center bg-gray-50/50 font-medium">
                  {canCompute ? "กำลังคำนวณ..." : "กรอกตัวเลขให้ถูกต้องตามฐานที่เลือกเพื่อคำนวณ"}
                </div>
              )}
            </div>
          </div>

          {/* Right: Steps — 2 cols, light cards */}
          <div className="lg:col-span-2 space-y-5">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-6 sm:px-7 py-5 border-b border-gray-200 bg-gray-50/50">
                <h3 className="text-base font-extrabold flex items-center gap-2.5 text-gray-900">
                  <span className="h-7 w-7 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">≡</span>
                  วิธีคิดแบบยืมค่า (Borrow) — ทีละหลัก
                </h3>
                <p className="text-xs font-medium text-gray-500 mt-1.5 leading-relaxed">
                  {op === "sub" ? "แสดงการลบฐาน " + base + " แบบตั้งลบ เหมือนคิดด้วยมือ" : "วิธีทำทีละหลักจะแสดงเฉพาะการลบ (Borrow) — การบวก/คูณ/หาร แสดงผลลัพธ์ตรง"}
                </p>
              </div>

              {op === "sub" && canCompute && calc && calc.kind === "sub" ? (
                calc.data.steps.length === 0 && calc.data.swapped ? (
                  <div className="p-7 text-sm text-gray-700 leading-relaxed">
                    <p className="font-medium">
                      เนื่องจาก <span className="font-mono font-bold text-gray-900">{a}</span> {"<"} <span className="font-mono font-bold text-gray-900">{b}</span> ในฐาน {base} ผลลัพธ์จึงติดลบ ระบบคำนวณ{" "}
                      <span className="font-mono font-bold text-orange-600">{b} − {a}</span> = {calc.data.result.slice(1)} แล้วเติมเครื่องหมายลบ
                    </p>
                    <div className="mt-4 rounded-xl bg-gray-50 border border-gray-200 p-4 font-mono text-xs shadow-sm text-gray-700">
                      <div>ฐาน 10: {calc.data.decimalA.toString()} − {calc.data.decimalB.toString()} = {calc.data.decimalResult.toString()}</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 sm:p-7 space-y-5 bg-white">
                    {/* Visual subtraction */}
                    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
                      <div className="min-w-[300px] font-mono text-sm sm:text-base leading-7">
                        {/* borrow row */}
                        <div className="flex justify-end gap-1 text-xs font-bold text-red-600 pr-1">
                          <span className="w-7 text-right text-gray-400 font-sans text-xs">ยืม→</span>
                          {calc.data.paddedA.split("").map((_, i) => {
                            const stepsAtI = calc.data.steps.find((s) => s.indexFromLeft === i);
                            const borrowIn = stepsAtI?.borrowIn ?? 0;
                            return (
                              <span key={i} className="w-7 sm:w-8 text-center">
                                {borrowIn ? "¹" : ""}
                              </span>
                            );
                          })}
                        </div>
                        <div className="flex justify-end gap-1">
                          <span className="w-7 text-right text-gray-400 text-xs py-1 font-sans"> </span>
                          {calc.data.paddedA.split("").map((ch, i) => {
                            const s = calc.data.steps.find((x) => x.indexFromLeft === i);
                            const borrowed = s?.borrowIn ? "text-red-600 line-through decoration-red-600 decoration-2" : "text-gray-900";
                            return (
                              <span key={i} className={`w-7 sm:w-8 text-center py-1.5 rounded-lg font-bold ${borrowed} ${s?.borrowOut ? "bg-orange-100 border border-orange-200" : ""}`}>
                                {ch}
                              </span>
                            );
                          })}
                        </div>
                        <div className="flex justify-end gap-1">
                          <span className="w-7 text-right text-gray-500 font-bold">−</span>
                          {calc.data.paddedB.split("").map((ch, idx) => (
                            <span key={idx} className="w-7 sm:w-8 text-center py-1.5 font-semibold text-gray-700">
                              {ch}
                            </span>
                          ))}
                        </div>
                        <div className="border-t-2 border-gray-900 mt-2 flex justify-end gap-1 font-extrabold">
                          <span className="w-7 text-right"></span>
                          {calc.data.paddedResult.padStart(calc.data.paddedA.length, " ").split("").map((ch, i) => (
                            <span key={i} className="w-7 sm:w-8 text-center py-1.5 text-orange-600">
                              {ch.trim() === "" ? "" : ch}
                            </span>
                          ))}
                        </div>
                        <div className="flex justify-end gap-1 text-xs font-medium text-gray-400 mt-1.5">
                          <span className="w-7 text-right"></span>
                          {calc.data.paddedA.split("").map((_, idx) => (
                            <span key={idx} className="w-7 sm:w-8 text-center">
                              {calc.data.paddedA.length - idx}
                            </span>
                          ))}
                        </div>
                        <div className="text-xs font-medium text-gray-400 text-right mt-1">ตำแหน่งจากขวา →</div>
                      </div>
                    </div>

                    {/* step list */}
                    <div className="space-y-3">
                      {calc.data.steps
                        .slice()
                        .reverse()
                        .map((s, idx) => (
                          <div
                            key={idx}
                            className={`rounded-xl border p-4 text-sm shadow-sm transition ${
                              s.borrowOut ? "border-orange-200 bg-orange-50" : "border-gray-200 bg-gray-50 hover:bg-white hover:shadow-md"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 shadow-sm ${s.borrowOut ? "bg-orange-500 text-white" : "bg-white border border-gray-200 text-gray-700"}`}>
                                {calc.data.steps.length - idx}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-gray-900 leading-relaxed">
                                  หลักที่ {s.pos + 1}:{" "}
                                  <span className="font-mono bg-white border border-gray-200 rounded px-1.5 py-0.5 text-sm">
                                    {s.aChar} − {s.bChar}
                                  </span>{" "}
                                  {s.borrowIn ? (
                                    <span className="text-red-600 font-semibold">(หักยืม {s.borrowIn} → {s.aVal}−{s.borrowIn}={s.aVal - s.borrowIn})</span>
                                  ) : null}{" "}
                                  {s.borrowOut ? (
                                    <span className="text-orange-700 font-bold">→ ยืม {base} ได้ {s.effectiveA}</span>
                                  ) : null}
                                  {" = "}
                                  <span className="font-mono font-extrabold text-orange-600 bg-white border border-orange-200 rounded px-1.5 py-0.5">{s.resultChar}</span>
                                  <span className="text-gray-500 font-mono text-xs font-medium"> ({s.effectiveA} − {s.bVal} = {s.resultVal})</span>
                                </div>
                                <div className="text-xs text-gray-600 mt-2 leading-relaxed bg-white border border-gray-200 rounded-lg px-3 py-2">{s.text}</div>
                              </div>
                              <span className={`text-xs px-2.5 py-1 rounded-full font-bold font-mono shadow-sm shrink-0 ${s.borrowOut ? "bg-red-100 text-red-700 border border-red-200" : "bg-white text-gray-600 border border-gray-200"}`}>
                                {s.borrowOut ? "ยืม" : "ไม่ยืม"}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>

                    <div className="rounded-xl bg-orange-50 border border-orange-200 p-5 text-sm shadow-sm">
                      <div className="font-extrabold text-orange-800 text-sm tracking-wide uppercase">สรุป</div>
                      <div className="font-mono mt-2 break-all text-gray-900 font-bold text-base">
                        {a} − {b} = <span className="text-orange-600 text-lg">{calc.data.result}</span> <span className="text-gray-500 font-sans text-sm font-medium">(ฐาน {base})</span>
                      </div>
                      <div className="font-mono text-xs font-medium text-gray-600 mt-2 bg-white border border-orange-100 rounded-lg px-3 py-2">
                        ตรวจฐาน 10: {calc.data.decimalA.toString()} − {calc.data.decimalB.toString()} = {calc.data.decimalResult.toString()} → ฐาน {base} = {calc.data.result}
                      </div>
                    </div>
                  </div>
                )
              ) : op !== "sub" ? (
                <div className="p-7 text-sm text-gray-600 leading-relaxed">
                  โหมด <span className="font-extrabold text-gray-900">{op === "add" ? "บวก" : op === "mul" ? "คูณ" : "หาร"}</span> จะคำนวณผ่านฐาน 10 แล้วแปลงกลับเป็นฐาน {base} — ดูผลลัพธ์ที่การ์ดซ้าย
                  {canCompute && calc && calc.kind !== "error" && calc.kind !== "sub" ? (
                    <div className="mt-4 rounded-xl bg-gray-50 border border-gray-200 p-4 font-mono text-xs space-y-1 shadow-sm">
                      <div className="text-gray-700">
                        {a} ({decimalA?.toString()}₁₀) {opSymbol(op)} {b} ({decimalB?.toString()}₁₀)
                      </div>
                      <div className="font-bold text-gray-900">= {calc.data.decimalResult.toString()}₁₀ = {calc.data.result} (ฐาน {base})</div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="p-7 text-sm text-gray-500 text-center font-medium">กรอกเลขฐานให้ถูกต้องเพื่อดูวิธียืมค่า</div>
              )}
            </div>

            {/* Info / Handbook — light card */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 sm:p-7">
              <h4 className="text-base font-extrabold text-gray-900">คู่มือย่อ — การลบเลขฐาน</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-gray-600 list-disc pl-5 leading-relaxed">
                <li>
                  ยืม 1 ครั้ง = ได้ <span className="font-mono font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5">{base}</span> ในฐาน {base} (เช่น ฐาน 8 ยืม 1 ได้ 8, ฐาน 16 ยืม 1 ได้ 16)
                </li>
                <li>ถ้าตัวตั้งน้อยกว่าตัวลบในหลักนั้น ต้องยืมจากหลักซ้ายถัดไป</li>
                <li>
                  ตัวอย่าง ฐาน 8: <span className="font-mono font-semibold text-gray-900 bg-orange-50 border border-orange-200 rounded px-1.5 py-0.5">752 − 364</span> → 2−4 ยืม 8 ได้ 10−4=6, 4(หลังยืม)−6 ยืมต่อ, ฯลฯ ={" "}
                  <span className="font-mono font-bold text-orange-600">366₈</span>
                </li>
                <li>งาน PLC: ใช้ตรวจ Address, Mask, และการคำนวณค่า Timer/Counter ที่เป็น Hex/Oct</li>
              </ul>
              {history.length > 0 ? (
                <div className="mt-6 pt-5 border-t border-gray-200">
                  <div className="text-xs font-bold tracking-widest text-gray-500 uppercase">ประวัติล่าสุด</div>
                  <div className="mt-3 space-y-2">
                    {history.map((h, i) => (
                      <div key={i} className="text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 shadow-sm text-gray-700 break-all">
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
                      className="text-xs font-semibold text-gray-500 hover:text-gray-700 mt-1 hover:underline"
                    >
                      ล้างประวัติ
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Deploy card — light with orange accent */}
            <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-sm p-6">
              <h4 className="text-sm font-extrabold text-gray-900">พร้อม Deploy บน Vercel</h4>
              <p className="text-sm text-gray-600 mt-1.5 leading-relaxed font-medium">โปรเจคนี้เป็น Next.js + Tailwind — push ขึ้น GitHub แล้ว Import ใน Vercel ได้ทันที (Framework preset: Next.js)</p>
              <div className="mt-4 flex gap-2.5">
                <a
                  href="https://github.com/Guy2547/WED-PLC"
                  target="_blank"
                  className="text-xs px-4 py-2 rounded-full bg-orange-500 text-white font-bold shadow-md hover:bg-orange-600 hover:shadow-lg transition border border-orange-500"
                >
                  ดู GitHub
                </a>
                <span className="text-xs px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 font-semibold shadow-sm">npx next build ผ่านแล้ว ✓</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/quiz"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold shadow-md hover:shadow-lg hover:scale-[1.02] transition"
          >
            🎯 ลองทำ Quiz แปลงเลขฐาน 10 ข้อ →
          </Link>
        </div>

        <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-xs font-medium text-gray-500">
          © 2026 Handbook PLC — สร้างด้วย Next.js 16 + Tailwind CSS • รองรับฐาน 2–36 • เริ่มที่การลบเลขฐาน • ธีมสว่างสะอาด
        </footer>
      </main>
    </div>
  );
}
