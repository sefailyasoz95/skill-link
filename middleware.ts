import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "./lib/supabase-server";

export async function middleware(request: NextRequest) {
	const requestUrl = new URL(request.url);
	const path = requestUrl.pathname;

	// Public routes that don't require auth
	const publicRoutes = ["/", "/auth/signin", "/how-it-works", "/privacy-and-terms"];

	// If the route is public, allow access without checking auth
	if (publicRoutes.includes(path)) {
		return NextResponse.next();
	}

	// Initialize Supabase client
	const supabase = await createServerSupabaseClient();

	// Check if user is authenticated
	const {
		data: { session },
	} = await supabase.auth.getSession();
	console.log("session: ", session);

	// If no session and trying to access a protected route, redirect to signin
	// if (!session && !publicRoutes.includes(path)) {
	//   return NextResponse.redirect(new URL("/auth/signin", request.url));
	// }

	return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
	matcher: [
		/*
		 * Match all request paths except:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		"/((?!_next/static|_next/image|favicon.ico|public/).*)",
	],
};
