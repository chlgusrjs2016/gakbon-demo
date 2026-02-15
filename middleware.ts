/**
 * Next.js 미들웨어 - 모든 페이지 요청 시 자동으로 실행됩니다.
 *
 * 하는 일:
 * 1. Supabase 세션 토큰이 만료되었으면 자동으로 갱신합니다.
 * 2. 로그인이 필요한 페이지에 비로그인 사용자가 접근하면 /login 으로 보냅니다.
 * 3. 이미 로그인된 사용자가 /login 에 접근하면 / (메인)으로 보냅니다.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // 1. 응답 객체를 하나 만듭니다 (쿠키 수정을 위해 필요).
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 2. 미들웨어 전용 Supabase 클라이언트를 만듭니다.
  //    쿠키를 읽고 쓸 수 있도록 설정합니다.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // 요청 쿠키에 새 값을 설정합니다.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // 응답 객체도 새로 만들어서 쿠키를 반영합니다.
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 3. 세션 토큰을 갱신하고, 현재 로그인된 사용자 정보를 가져옵니다.
  //    중요: getUser()는 Supabase 서버에 직접 확인하므로 안전합니다.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 4. 보호가 필요 없는 경로를 정의합니다.
  //    /login, /auth/callback 은 로그인 없이도 접근 가능해야 합니다.
  const publicPaths = ["/login", "/auth/callback"];
  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // 5. 비로그인 사용자가 보호된 페이지에 접근하면 → /login 으로 이동
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 6. 로그인된 사용자가 /login 에 접근하면 → / (메인)으로 이동
  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

/**
 * 미들웨어가 실행될 경로를 설정합니다.
 * - _next/static, _next/image, favicon.ico 등 정적 파일은 제외합니다.
 * - 나머지 모든 페이지 요청에서 실행됩니다.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
