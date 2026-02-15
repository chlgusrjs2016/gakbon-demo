/**
 * 브라우저(클라이언트)에서 사용하는 Supabase 클라이언트.
 *
 * - React 컴포넌트 안에서 Supabase를 호출할 때 이 함수를 사용합니다.
 * - 예: 로그인 폼에서 supabase.auth.signInWithPassword() 호출 시
 *
 * "use client" 가 붙은 컴포넌트, 또는 브라우저에서 실행되는 코드에서만 사용하세요.
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
