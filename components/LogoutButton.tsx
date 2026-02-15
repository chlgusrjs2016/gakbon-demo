/**
 * 로그아웃 버튼 컴포넌트
 *
 * "use client" = 브라우저에서 실행되는 컴포넌트입니다.
 * 버튼 클릭(onClick)은 브라우저에서만 동작하므로 클라이언트 컴포넌트여야 합니다.
 *
 * 로그아웃 과정:
 * 1. 사용자가 버튼을 클릭합니다.
 * 2. Supabase에 로그아웃 요청을 보냅니다.
 * 3. 세션 쿠키가 삭제됩니다.
 * 4. /login 페이지로 이동합니다.
 */
"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();

    // 로그아웃 후 로그인 페이지로 이동
    router.push("/login");
    router.refresh(); // 서버 컴포넌트의 캐시도 갱신합니다.
  };

  return (
    <button
      onClick={handleLogout}
      className={[
        "rounded-xl px-4 py-1.5 text-sm font-medium",
        "bg-white/50 dark:bg-white/[0.06]",
        "backdrop-blur-sm",
        "border border-white/60 dark:border-white/[0.08]",
        "text-zinc-600 dark:text-zinc-300",
        "shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.3)]",
        "dark:shadow-[0_2px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.04)]",
        "transition-all duration-200",
        "hover:bg-white/70 dark:hover:bg-white/[0.1]",
        "active:scale-[0.98]",
      ].join(" ")}
    >
      로그아웃
    </button>
  );
}
