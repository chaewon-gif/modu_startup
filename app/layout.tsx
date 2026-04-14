import type { Metadata } from "next";
import "./globals.css";
import ClientBody from "./ClientBody";

export const metadata: Metadata = {
  title: "Wonn Factory MES - 스마트 제조 실행 시스템",
  description: "Wonn Factory MES는 중소기업을 위한 스마트 제조 실행 시스템입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body suppressHydrationWarning className="antialiased">
        <ClientBody>{children}</ClientBody>
      </body>
    </html>
  );
}
