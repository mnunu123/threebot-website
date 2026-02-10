import type { Metadata } from "next";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "빗물받이 현황 | 쓰리봇",
  description: "빗물받이 현황 지도 - CRI 위험지수 기반 우선 방문·최적 동선 지원",
  robots: "index, follow",
};

/** GS 인증(우수소프트웨어) 대비: 접근성·시맨틱 구조 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen">
        {/* WCAG 2.1: 스킵 링크 - 키보드 사용자 본문 바로가기 */}
        <a
          href="#main-content"
          className="sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:w-auto focus:h-auto focus:p-4 focus:m-0 focus:overflow-visible focus:[clip:auto] focus:bg-teal-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          본문 바로가기
        </a>
        {children}
      </body>
    </html>
  );
}
