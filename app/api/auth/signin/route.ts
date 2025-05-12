import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Parse and validate request body
    const supabase = await createServerSupabaseClient();
    const { error, data } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) {
      return NextResponse.json({ success: false, message: error.message });
    }
    NextResponse.redirect("/dashboard");
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}
