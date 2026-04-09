"use server";

import { createClient } from "@/lib/supabase/server";

export type LoginState =
  | { error: string }
  | { redirectTo: string }
  | null;

// After client-side signInWithPassword succeeds, call this to determine
// where to redirect — server-only because ADMIN_EMAIL is a server env var.
export async function getLoginRedirect(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email === process.env.ADMIN_EMAIL ? "/admin" : "/dashboard";
}

// Kept for compatibility
export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email    = (formData.get("email")    as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "נא למלא אימייל וסיסמה" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("[login] error:", error.message);
    return { error: error.message };
  }

  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = user?.email === process.env.ADMIN_EMAIL;
  return { redirectTo: isAdmin ? "/admin" : "/dashboard" };
}
