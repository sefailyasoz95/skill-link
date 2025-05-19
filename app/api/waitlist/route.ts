import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

export async function POST(req: NextRequest) {
	try {
		// Parse and validate request body
		const body = await req.json();

		return NextResponse.json({ caption: "caption" });
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 });
		}

		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
