import type { Metadata } from "next";
import { Geist, Geist_Mono, Sarabun } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Handbook PLC — คำนวณเลขฐาน | Base Calculator",
  description:
    "เครื่องคำนวณเลขฐาน 2-36 เน้นการลบเลขฐาน พร้อมแสดงวิธียืมค่า (Borrow) ทีละหลัก — ธีมสว่างสะอาด ทันสมัย",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} ${sarabun.variable} h-full antialiased overflow-x-hidden scroll-smooth`}
    >
      <body className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-gray-50 text-gray-800 font-sans text-sm md:text-base antialiased">
        <div className="flex-1 flex flex-col w-full max-w-full overflow-x-hidden min-w-0">{children}</div>
        <footer className="w-full max-w-full overflow-x-hidden px-4 sm:px-6 py-4 md:py-6 text-center text-xs sm:text-sm text-gray-400 break-words">
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
            <span>จัดทำโดย อมรินทร์ ขวัญคีรี รหัสนักศึกษา 056860405008-4</span>
            <span className="hidden sm:inline">•</span>
            <span>ณัฐพล ล่องทอง รหัสนักศึกษา 056860405067-0</span>
            <span className="hidden sm:inline">•</span>
            <span>อินทัช เวนานนท์ รหัสนักศึกษา 056960405159-3</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
