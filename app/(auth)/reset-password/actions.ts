"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type ResetState = { error: string } | { success: true } | null;

export async function updatePasswordAction(
  _prev: ResetState,
  formData: FormData
): Promise<ResetState> {
  const password = formData.get("password") as string;
  const confirm  = formData.get("confirm")  as string;

  if (!password || password.length < 8) {
    return { error: "הסיסמה חייבת להכיל לפחות 8 תווים" };
  }
  if (password !== confirm) {
    return { error: "הסיסמאות אינן תואמות" };
  }

  const supabase = await createClient();

  // Verify there is an active session (set by auth callback via verifyOtp)
  const { data: { user } } = await supabase.auth.getUser();
  console.log("[reset-password] user in action:", user?.email ?? "null");

  if (!user) {
    return { error: "קישור האיפוס פג תוקף. בקשי קישור חדש." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  console.log("[reset-password] updateUser error:", error?.message ?? "none");

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}
