/**
 * 로그인 폼 컴포넌트 (Client Component)
 *
 * "use client" = 브라우저에서 실행됩니다.
 * useSearchParams(), useState() 등 브라우저 전용 기능을 사용합니다.
 *
 * 이 컴포넌트는 page.tsx에서 <Suspense>로 감싸져 있습니다.
 */
"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { login, signup } from "./actions";

export default function LoginForm() {
  // 현재 모드: "login" 또는 "signup"
  const [mode, setMode] = useState<"login" | "signup">("login");

  // URL에서 에러 메시지나 안내 메시지를 읽어옵니다.
  // 예: /login?error=Invalid+credentials → errorMessage = "Invalid credentials"
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get("error");
  const infoMessage = searchParams.get("message");

  return (
    <>
      {/* 로고 / 타이틀 */}
      <div className="mb-8 text-center">
        <h1 className="font-title text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Gakbon
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          AI 시나리오 에디터
        </p>
      </div>

      {/* 모드 전환 탭 (로그인 / 회원가입) */}
      <div className="mb-6 flex rounded-2xl bg-black/[0.04] p-1 dark:bg-white/[0.06]">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={[
            "flex-1 rounded-xl py-2 text-sm font-medium transition-all duration-300",
            mode === "login"
              ? "bg-white/70 text-zinc-900 shadow-sm backdrop-blur-sm dark:bg-white/10 dark:text-white"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200",
          ].join(" ")}
        >
          로그인
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={[
            "flex-1 rounded-xl py-2 text-sm font-medium transition-all duration-300",
            mode === "signup"
              ? "bg-white/70 text-zinc-900 shadow-sm backdrop-blur-sm dark:bg-white/10 dark:text-white"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200",
          ].join(" ")}
        >
          회원가입
        </button>
      </div>

      {/* 에러 / 안내 메시지 */}
      {errorMessage && (
        <div className="mb-4 rounded-2xl border border-red-200/50 bg-red-50/50 px-4 py-3 text-sm text-red-600 backdrop-blur-sm dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          {errorMessage}
        </div>
      )}
      {infoMessage && (
        <div className="mb-4 rounded-2xl border border-zinc-200/50 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-600 backdrop-blur-sm dark:border-zinc-500/20 dark:bg-zinc-500/10 dark:text-zinc-400">
          {infoMessage}
        </div>
      )}

      {/* 로그인 / 회원가입 폼 */}
      <form action={mode === "login" ? login : signup}>
        <div className="space-y-4">
          {/* 이메일 입력 */}
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
            >
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="name@example.com"
              className={[
                "w-full rounded-xl px-4 py-3 text-sm",
                "bg-white/50 dark:bg-white/[0.06]",
                "border border-white/60 dark:border-white/[0.08]",
                "text-zinc-900 placeholder-zinc-400 dark:text-white dark:placeholder-zinc-500",
                "backdrop-blur-sm",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]",
                "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
                "outline-none transition-all duration-200",
                "focus:border-zinc-400/50 focus:ring-2 focus:ring-zinc-400/20",
                "dark:focus:border-zinc-400/30 dark:focus:ring-zinc-400/10",
              ].join(" ")}
            />
          </div>

          {/* 비밀번호 입력 */}
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
            >
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              minLength={6}
              className={[
                "w-full rounded-xl px-4 py-3 text-sm",
                "bg-white/50 dark:bg-white/[0.06]",
                "border border-white/60 dark:border-white/[0.08]",
                "text-zinc-900 placeholder-zinc-400 dark:text-white dark:placeholder-zinc-500",
                "backdrop-blur-sm",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]",
                "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
                "outline-none transition-all duration-200",
                "focus:border-zinc-400/50 focus:ring-2 focus:ring-zinc-400/20",
                "dark:focus:border-zinc-400/30 dark:focus:ring-zinc-400/10",
              ].join(" ")}
            />
          </div>
        </div>

        {/* 제출 버튼 - Liquid Glass 스타일 */}
        <button
          type="submit"
          className={[
            "mt-6 w-full rounded-xl py-3 text-sm font-semibold",
            "bg-zinc-900/90 text-white dark:bg-white/90 dark:text-zinc-900",
            "backdrop-blur-sm",
            "border border-zinc-800/50 dark:border-white/50",
            "shadow-[0_4px_16px_rgba(0,0,0,0.1)]",
            "dark:shadow-[0_4px_16px_rgba(255,255,255,0.05)]",
            "transition-all duration-200",
            "hover:scale-[1.01] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)]",
            "dark:hover:shadow-[0_6px_20px_rgba(255,255,255,0.08)]",
            "active:scale-[0.99]",
          ].join(" ")}
        >
          {mode === "login" ? "로그인" : "회원가입"}
        </button>
      </form>
    </>
  );
}
