/**
 * 로그인/회원가입 서버 액션 (Server Actions)
 *
 * "use server" 는 이 파일의 함수들이 서버에서만 실행된다는 뜻입니다.
 * 브라우저에서 직접 실행되지 않고, 폼 제출 시 서버로 요청이 가서 실행됩니다.
 *
 * 왜 서버에서 실행하나요?
 * - 쿠키를 안전하게 설정하기 위해 (로그인 세션 저장)
 * - 민감한 로직을 서버에서 처리하기 위해
 */
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * 이메일 + 비밀번호로 로그인합니다.
 *
 * @param formData - 폼에서 제출된 데이터 (email, password 필드)
 */
export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    // 로그인 실패 시 에러 메시지와 함께 로그인 페이지로 돌아갑니다.
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  // 로그인 성공 → 캐시를 지우고 메인 페이지로 이동합니다.
  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * 이메일 + 비밀번호로 회원가입합니다.
 *
 * @param formData - 폼에서 제출된 데이터 (email, password 필드)
 */
export async function signup(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  // 회원가입 성공 → 이메일 인증 안내 메시지와 함께 로그인 페이지로 돌아갑니다.
  redirect(
    `/login?message=${encodeURIComponent("가입 완료! 이메일을 확인해주세요.")}`
  );
}
