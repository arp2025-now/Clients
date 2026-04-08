"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

export type ResetState = { error: string } | { success: true; redirectTo: string } | null;

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

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[reset-password] SUPABASE_SERVICE_ROLE_KEY is not set");
    return { error: "שגיאת הגדרות שרת — פנה למנהל" };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
    });
    console.log("[reset-password] updateUserById error:", error?.message ?? "none");
    if (error) return { error: error.message };
  } catch (e: unknown) {
    console.error("[reset-password] admin error:", e);
    return { error: "שגיאה בעדכון הסיסמה — נסי שוב" };
  }

  return { success: true, redirectTo: "/dashboard" };
}
