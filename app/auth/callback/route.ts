/**
 * Auth 콜백 라우트 (/auth/callback)
 *
 * 이 파일은 "Route Handler" 입니다.
 * 일반 페이지(.tsx)가 아니라, HTTP 요청을 직접 처리하는 API 같은 역할입니다.
 *
 * 언제 호출되나요?
 * - 회원가입 후 이메일 인증 링크를 클릭하면
 * - Supabase가 사용자를 이 URL로 보내면서 "code" 파라미터를 함께 전달합니다.
 *
 * 하는 일:
 * 1. URL에서 code 파라미터를 읽습니다.
 * 2. 이 code를 Supabase에 보내서 실제 로그인 세션(쿠키)으로 교환합니다.
 * 3. 메인 페이지(/)로 이동시킵니다.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  // URL에서 인증 코드를 읽습니다.
  // 예: /auth/callback?code=abc123 → code = "abc123"
  const code = searchParams.get("code");

  // 인증 후 이동할 페이지 (기본값: 메인 페이지)
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();

    // code를 세션으로 교환합니다.
    // 성공하면 사용자의 브라우저에 로그인 쿠키가 설정됩니다.
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 성공 → 메인 페이지로 이동
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 실패 → 에러 메시지와 함께 로그인 페이지로 이동
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("인증에 실패했습니다. 다시 시도해주세요.")}`
  );
}
