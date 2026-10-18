import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "云映 · AI 创作工作台",
  description: "视频、图片和音乐生成工作台",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
