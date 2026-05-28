import type { Metadata } from "next";
import "./globals.css";
import "./jobstock-extra.css";

export const metadata: Metadata = {
  title: "JobStock AI",
  description: "IT職志望者向けの就活回答ストック管理アプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
