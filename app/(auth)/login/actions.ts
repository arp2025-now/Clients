"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type LoginState = { error: string } | null;

export async function loginAction(_prev: LoginState, formData: FormData) {
  const email    = (formData.get("email")    as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "נא למלא אימייל וסיסמה" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("[login] error:", error.message, "for:", email);
    if (error.message.includes("Invalid login credentials")) {
      return { error: "אימייל או סיסמה שגויים" };
    }
    if (error.message.includes("Email not confirmed")) {
      return { error: "האימייל טרם אומת — פנה לענת" };
    }
    return { error: error.message };
  }

  // Session is set in cookies by the server client.
  // proxy.ts will now correctly read the session and redirect
  // admin → /admin, client → /dashboard.
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = user?.email === process.env.ADMIN_EMAIL;

  redirect(isAdmin ? "/admin" : "/dashboard");
}
