"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/crypto";
import { revalidatePath } from "next/cache";

export async function setPassword(password: string) {
  // Get user ID from the invite session (user is authenticated at this point)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("שגיאת שרת: SUPABASE_SERVICE_ROLE_KEY חסר — הוסיפי אותו ב-Vercel");
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
  } catch (e: unknown) {
    throw new Error((e as Error).message ?? "שגיאה בעדכון הסיסמה");
  }

  // admin.updateUserById invalidates the invite session. Sign in with the new
  // password immediately to create a fresh valid session in the response cookies.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password,
  });
  if (signInError) {
    console.error("[onboarding] signInWithPassword error:", signInError.message);
    // Non-fatal: password was set, user can log in manually later
  }

  return { success: true };
}

export async function saveBasicInfo(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const businessName = formData.get("business_name") as string;
  const phone = formData.get("phone") as string;
  const websiteUrl = formData.get("website_url") as string;

  // Upsert client row
  const { error } = await supabase.from("clients").upsert(
    { user_id: user.id, business_name: businessName, phone, website_url: websiteUrl },
    { onConflict: "user_id" }
  );

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function saveCredentials(
  credentials: Array<{
    system_name: string;
    url: string;
    username: string;
    password: string;
    notes: string;
  }>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!client) throw new Error("Client record not found");

  const rows = credentials.map((c) => ({
    client_id: client.id,
    system_name: c.system_name,
    url: c.url,
    username: c.username,
    encrypted_password: c.password ? encrypt(c.password) : null,
    notes: c.notes,
  }));

  const { error } = await supabase.from("credentials").insert(rows);
  if (error) throw new Error(error.message);

  return { success: true };
}

export async function saveCustomFields(
  fields: Array<{ field_name: string; field_value: string; field_type: string }>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!client) throw new Error("Client record not found");

  const rows = fields.map((f, i) => ({
    client_id: client.id,
    field_name: f.field_name,
    field_value_encrypted: f.field_value ? encrypt(f.field_value) : null,
    field_type: f.field_type,
    sort_order: i,
  }));

  const { error } = await supabase.from("onboarding_custom_fields").insert(rows);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  return { success: true };
}
