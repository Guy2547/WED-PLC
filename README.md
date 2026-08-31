# Handbook PLC — เครื่องคำนวณเลขฐาน (Base Calculator)

โปรเจค Next.js + Tailwind CSS สำหรับคำนวณเลขฐาน 2–36 โดย **เริ่มที่การลบเลขฐาน (Borrow)** พร้อมแสดงวิธีทำทีละหลัก เหมาะสำหรับงาน PLC, ระบบดิจิทัล และการเรียนการสอน

🌐 **Live Demo (Vercel)**: จะได้หลัง deploy — ดูวิธี deploy ด้านล่าง  
📦 **GitHub**: https://github.com/Guy2547/WED-PLC

## ✨ ฟีเจอร์

- ✅ เลือกฐาน 2–36 (ปุ่มลัด 2/8/10/16 + slider + ช่องกำหนดเอง)
- ➖ **ลบเลขฐานแบบยืมค่า** แสดงตารางตั้งลบ + อธิบายทุกหลัก (borrow in/out, effective value)
- ➕ บวก / ✖️ คูณ / ➗ หาร (คำนวณผ่านฐาน 10 แล้วแปลงกลับ)
- 🔢 ตรวจความถูกต้องของตัวเลขตามฐาน (เช่น ฐาน 2 อนุญาตแค่ 0,1)
- 🔄 แปลงผลลัพธ์เป็นฐาน 2, 8, 10, 16 อัตโนมัติ + เทียบฐาน 10
- 📋 คัดลอกผลลัพธ์ + ประวัติ 8 รายการ (localStorage)
- 🎨 UI ภาษาไทย, Responsive, Dark mode
- ⚡ รองรับเลขยาวด้วย `BigInt` (ไม่จำกัด safe integer)

## 🧮 ตัวอย่าง

- ฐาน 8: `752 − 364 = 366₈` (ตรวจ: 490 − 244 = 246₁₀ = 366₈)
- ฐาน 2: `1010 − 0110 = 0100₂` (10 − 6 = 4)
- ฐาน 16: `1A3F − FF = 1940₁₆`

## 🚀 เริ่มพัฒนา

```bash
npm install
npm run dev
# เปิด http://localhost:3000
```

```bash
npm run build
npm start
```

## 📁 โครงสร้าง

```
src/
  app/
    page.tsx      # หน้าหลัก - ตัวคำนวณ
    layout.tsx    # font + metadata (Sarabun)
    globals.css   # tailwind
  lib/
    baseMath.ts   # logic เลขฐาน (validate, borrow steps, BigInt convert)
```

## 🔧 เทคนิคการลบแบบยืม

- ยืม 1 ครั้ง = ได้ `ฐาน` หน่วย (เช่น ฐาน 8 ยืม 1 ได้ 8)
- อัลกอริทึมไล่จากขวาไปซ้าย: `effective = aVal - borrowIn`, ถ้า `effective < bVal` ให้ `effective += base` และ `borrowOut = 1`
- ถ้า `A < B` จะสลับคำนวณ `B−A` แล้วเติม `-`

## 🌍 Deploy บน Vercel

1. Push โค้ดขึ้น GitHub: `https://github.com/Guy2547/WED-PLC.git` (ทำแล้ว)
2. ไป https://vercel.com/new → Import Project → เลือก `Guy2547/WED-PLC`
3. Framework preset: **Next.js** (auto) → Deploy
4. ไม่ต้องตั้ง env เพิ่มเติม

หรือใช้ Vercel CLI:

```bash
npm i -g vercel
vercel --prod
```

## 📝 License

MIT — ใช้ได้อิสระสำหรับงานสอนและ PLC handbook

---
สร้างด้วย Next.js 16 + Tailwind CSS 4 + TypeScript
