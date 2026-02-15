/**
 * 로그인/회원가입 페이지
 *
 * Apple의 Liquid Glass 디자인 언어를 적용한 로그인 폼입니다.
 *
 * 구조 설명:
 * - 이 page.tsx 파일은 Suspense 경계(boundary)를 제공하는 래퍼 역할입니다.
 * - 실제 폼 로직은 LoginForm 컴포넌트에 있습니다.
 *
 * 왜 Suspense가 필요한가요?
 * Next.js App Router에서 useSearchParams()를 사용하면,
 * 서버에서 미리 렌더링할 때 URL 파라미터를 알 수 없습니다.
 * Suspense로 감싸면 "서버에서는 로딩 UI를 보여주고,
 * 브라우저에서 URL 파라미터를 읽어 실제 내용을 보여주겠다"는 뜻입니다.
 */

import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* ── 배경: 그라데이션 + 움직이는 블롭 ── */}
      <div className="fixed inset-0 -z-10">
        {/* 기본 그라데이션 배경 (그레이스케일) */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950" />

        {/* 움직이는 블롭들 - Liquid Glass 배경에 유기적 움직임 제공 (그레이스케일) */}
        <div className="absolute -left-32 -top-32 h-96 w-96 animate-blob rounded-full bg-gray-200/60 mix-blend-multiply blur-3xl dark:bg-zinc-700/20" />
        <div className="animation-delay-2000 absolute -right-32 top-1/3 h-96 w-96 animate-blob rounded-full bg-gray-300/40 mix-blend-multiply blur-3xl dark:bg-zinc-600/20" />
        <div className="animation-delay-4000 absolute -bottom-32 left-1/3 h-96 w-96 animate-blob rounded-full bg-gray-200/50 mix-blend-multiply blur-3xl dark:bg-zinc-700/15" />
      </div>

      {/* ── Liquid Glass 카드 ── */}
      <div className="relative mx-4 w-full max-w-md">
        <div
          className={[
            // 유리 효과: 반투명 배경 + 블러
            "rounded-3xl",
            "bg-white/40 dark:bg-white/[0.06]",
            "backdrop-blur-2xl",
            // 테두리: 미묘한 반투명 흰색
            "border border-white/50 dark:border-white/[0.08]",
            // 그림자: 다층 그림자로 깊이감
            "shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.4)]",
            "dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]",
            // 패딩
            "px-8 py-10 sm:px-10 sm:py-12",
          ].join(" ")}
        >
          {/* 상단 하이라이트 레이어 - Liquid Glass의 빛 반사 효과 */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-3xl bg-gradient-to-b from-white/30 to-transparent dark:from-white/[0.04]" />

          {/* 콘텐츠 - Suspense로 감싸서 useSearchParams() 사용 가능하게 함 */}
          <div className="relative">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-600 dark:border-t-zinc-300" />
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
