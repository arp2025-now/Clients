"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/crypto";
import { revalidatePath } from "next/cache";

export async function setPassword(password: string) {
  // Get user ID from the invite session (user is authenticated at this point)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Use admin client ONLY — bypasses Supabase "Secure password change" flow.
  // updateUser() via user session marks the change as PENDING until the user
  // clicks a confirmation email, so signInWithPassword fails after logout.
  // Admin updateUserById sets the password immediately with no pending state,
  // and email_confirm:true ensures email_confirmed_at is set.
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, { password, email_confirm: true });
  if (error) throw new Error(error.message);

  // Sign in immediately with the new password to swap the invite session for a
  // regular password-based session. Without this, the browser holds an invite
  // token; after sign-out Supabase may reject the next signInWithPassword.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password,
  });
  if (signInError) throw new Error(signInError.message);

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
