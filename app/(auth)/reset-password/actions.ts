"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
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

  // Use admin client to bypass Supabase "Secure password change" flow.
  // supabase.auth.updateUser() via recovery session can mark the change as
  // PENDING until the user clicks a confirmation email, causing signInWithPassword
  // to fail after logout. Admin updateUserById sets the password immediately.
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
  });
  console.log("[reset-password] updateUserById error:", error?.message ?? "none");

  if (error) {
    return { error: error.message };
  }

  // Sign in immediately with the new password to swap the recovery session for a
  // regular password-based session. Without this the browser holds a recovery
  // token; after sign-out Supabase rejects the next signInWithPassword.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password,
  });
  if (signInError) {
    console.error("[reset-password] signInWithPassword error:", signInError.message);
    return { error: signInError.message };
  }

  redirect("/dashboard");
}
