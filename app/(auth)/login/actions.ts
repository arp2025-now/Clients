"use server";

import { createClient } from "@/lib/supabase/server";

export async function getLoginRedirect(): Promise<"/admin" | "/dashboard"> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email === process.env.ADMIN_EMAIL) return "/admin";
  return "/dashboard";
}
