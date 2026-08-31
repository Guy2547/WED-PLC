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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} ${sarabun.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-800 font-sans">
        {children}
      </body>
    </html>
  );
}
