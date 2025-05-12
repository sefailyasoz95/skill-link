// app/auth/callback/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function AuthCallback() {
  const supabase = await createServerSupabaseClient();

  // Forces Supabase to exchange the code for a session and set cookies
  const { data, error } = await supabase.auth.getSession();

  console.log("OAuth session:", data.session);
  console.log("OAuth error:", error);

  // Redirect somewhere once session is set
  redirect("/dashboard"); // or "/"
}
