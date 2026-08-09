import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ระบบจองเครื่องมือห้องปฏิบัติการวิทยาศาสตร์",
    template: "%s | SciLab Booking",
  },
  description:
    "ระบบจองเครื่องมือและอุปกรณ์ในห้องปฏิบัติการวิทยาศาสตร์สำหรับโรงเรียนมัธยม",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
