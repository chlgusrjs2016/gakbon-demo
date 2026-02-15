/**
 * 루트 레이아웃 (Root Layout)
 *
 * 앱 전체를 감싸는 최상위 레이아웃입니다.
 * - HTML의 <html>, <body> 태그를 정의합니다.
 * - 모든 페이지에 공통으로 적용되는 폰트, 메타데이터 등을 설정합니다.
 * - 모든 페이지 컴포넌트는 {children} 자리에 들어갑니다.
 *
 * 폰트 체계:
 * - 기본 폰트: Pretendard (한국어 + 영문 모두 깔끔하게 보이는 폰트, CDN 로드)
 * - 타이틀 폰트: Courier Prime (시나리오/타자기 느낌의 세리프 폰트, Google Fonts)
 */

import type { Metadata } from "next";
import { Courier_Prime } from "next/font/google";
import "./globals.css";

/**
 * Courier Prime - 타이틀 전용 폰트
 * 시나리오 대본에서 전통적으로 사용되는 Courier 계열 폰트입니다.
 * CSS 변수 --font-title 로 등록되어, Tailwind에서 font-title 로 사용합니다.
 */
const courierPrime = Courier_Prime({
  variable: "--font-courier-prime",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Gakbon - AI 시나리오 에디터",
  description:
    "AI 에이전트와 함께 시나리오를 작성하고, 포맷팅하고, 출력하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* Pretendard - 기본 폰트 (CDN 로드)
            Google Fonts에 없어서 CDN으로 불러옵니다. */}
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className={`${courierPrime.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
