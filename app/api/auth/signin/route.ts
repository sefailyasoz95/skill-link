import { createServer } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
	try {
		// Parse and validate request body
		const supabase = await createServer({ cookies });
		const { error, data } = await supabase.auth.signInWithOAuth({
			provider: "google",
		});
		if (error) {
			return NextResponse.json({ success: false, message: error.message });
		}
		NextResponse.redirect("/dashboard");
	} catch (error) {
		return NextResponse.json({ error: "Internal server error", success: false }, { status: 500 });
	}
}
