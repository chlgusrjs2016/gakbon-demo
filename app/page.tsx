/**
 * 메인 페이지 (/) - 프로젝트 대시보드
 *
 * 이 페이지는 "Server Component" 입니다.
 * 서버에서 Supabase를 통해 프로젝트 목록을 가져와서,
 * ProjectDashboard 클라이언트 컴포넌트에 전달합니다.
 *
 * 미들웨어(middleware.ts)가 비로그인 사용자를 /login 으로 보내므로,
 * 이 페이지에 도달한 사용자는 반드시 로그인 상태입니다.
 */

import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import ProjectDashboard from "@/components/ProjectDashboard";

export default async function Home() {
  const supabase = await createClient();

  // 현재 로그인된 사용자 정보
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 내 프로젝트 목록을 서버에서 가져옵니다.
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* ── 배경: 그레이스케일 ── */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950" />
        <div className="absolute -left-32 -top-32 h-96 w-96 animate-blob rounded-full bg-gray-200/60 mix-blend-multiply blur-3xl dark:bg-zinc-700/20" />
        <div className="animation-delay-2000 absolute -right-32 top-1/3 h-96 w-96 animate-blob rounded-full bg-gray-300/40 mix-blend-multiply blur-3xl dark:bg-zinc-600/20" />
        <div className="animation-delay-4000 absolute -bottom-32 left-1/3 h-96 w-96 animate-blob rounded-full bg-gray-200/50 mix-blend-multiply blur-3xl dark:bg-zinc-700/15" />
      </div>

      {/* ── 상단 헤더 바 (Liquid Glass 둥근 박스) ── */}
      <header className="sticky top-0 z-50 mx-3 mt-3 sm:mx-4 sm:mt-4">
        <nav
          className={[
            "flex items-center justify-between",
            "rounded-2xl px-5 py-3.5",
            "bg-white/30 dark:bg-white/[0.04]",
            "backdrop-blur-2xl",
            "border border-white/60 dark:border-white/[0.1]",
            "shadow-[0_4px_24px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.5)]",
            "dark:shadow-[0_4px_24px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)]",
          ].join(" ")}
        >
        <h1 className="font-title text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
          Gakbon
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {user?.email}
          </span>
          <LogoutButton />
        </div>
        </nav>
      </header>

      {/* ── 메인 콘텐츠 ── */}
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-12 sm:px-6">
        <ProjectDashboard projects={projects ?? []} />
      </main>
    </div>
  );
}
