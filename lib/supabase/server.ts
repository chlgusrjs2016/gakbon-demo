/**
 * 서버에서 사용하는 Supabase 클라이언트.
 *
 * - Server Component, Server Action, Route Handler 등 서버 코드에서 사용합니다.
 * - Next.js의 cookies()를 통해 사용자 세션(로그인 상태)을 읽고 쓸 수 있습니다.
 *
 * 주의: 이 함수는 반드시 서버 환경에서만 호출해야 합니다.
 * "use client" 컴포넌트에서는 client.ts의 createClient()를 사용하세요.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서 호출 시 쿠키를 설정할 수 없습니다.
            // 미들웨어에서 세션 갱신이 처리되므로 무시해도 됩니다.
          }
        },
      },
    }
  );
}
