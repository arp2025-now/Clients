import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  // Determine where to send the user after auth
  const destination =
    type === "recovery" ? "/reset-password" :
    type === "invite" ? "/onboarding" :
    next;

  const redirectTo = new URL(destination, origin);

  const createSupabase = (response: NextResponse) =>
    createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

  // PKCE flow (code exchange)
  if (code) {
    const response = NextResponse.redirect(redirectTo);
    const supabase = createSupabase(response);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return response;
  }

  // OTP / token_hash flow (invite, recovery, email confirmation)
  if (tokenHash && type) {
    const response = NextResponse.redirect(redirectTo);
    const supabase = createSupabase(response);
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return response;
  }

  return NextResponse.redirect(new URL("/login?error=auth", origin));
}
