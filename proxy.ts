/**
 * Next.js Proxy - 모든 페이지 요청 시 자동으로 실행됩니다.
 * (Next.js 16: 기존 middleware → proxy 컨벤션으로 변경)
 *
 * 하는 일:
 * 1. Supabase 세션 토큰이 만료되었으면 자동으로 갱신합니다.
 * 2. 로그인이 필요한 페이지에 비로그인 사용자가 접근하면 /login 으로 보냅니다.
 * 3. 이미 로그인된 사용자가 /login 에 접근하면 / (메인)으로 보냅니다.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// #region agent log
function debugLog(payload: {
  location: string;
  message: string;
  data?: Record<string, unknown>;
  hypothesisId?: string;
}) {
  fetch("http://127.0.0.1:7242/ingest/3f680c09-979a-4159-8796-0d669b386f5f", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
}
// #endregion

export async function proxy(request: NextRequest) {
  // API 라우트는 각 Route Handler에서 인증/권한을 직접 처리합니다.
  // 여기서 리다이렉트하면(JSON 대신 HTML 응답) 바이너리 다운로드가 깨질 수 있습니다.
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next({ request });
  }

  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasSupabaseAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // #region agent log
  debugLog({
    location: "proxy.ts:entry",
    message: "proxy invoked",
    data: {
      hasSupabaseUrl,
      hasSupabaseAnonKey,
      pathname: request.nextUrl.pathname,
    },
    hypothesisId: "H1",
  });
  // #endregion

  try {
    // env 없으면 Supabase 호출 없이 보호된 경로만 로그인으로 보냄 (H1: createServerClient(undefined) 방지)
    const publicPaths = ["/login", "/auth/callback"];
    const isPublicPath = publicPaths.some((path) =>
      request.nextUrl.pathname.startsWith(path)
    );
    if (!hasSupabaseUrl || !hasSupabaseAnonKey) {
      if (!isPublicPath) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }
      return NextResponse.next({ request });
    }

    // 1. 응답 객체를 하나 만듭니다 (쿠키 수정을 위해 필요).
    let supabaseResponse = NextResponse.next({
      request,
    });

    // 2. Proxy 전용 Supabase 클라이언트를 만듭니다.
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
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && !isPublicPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (user && request.nextUrl.pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  } catch (err) {
    // #region agent log
    const error = err instanceof Error ? err : new Error(String(err));
    debugLog({
      location: "proxy.ts:catch",
      message: "proxy error",
      data: {
        name: error.name,
        message: error.message,
        stack: error.stack?.slice(0, 500),
      },
      hypothesisId: "H2",
    });
    // #endregion
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
}

/**
 * Proxy가 실행될 경로를 설정합니다.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
