import { NextResponse, type NextRequest } from "next/server";
import { createMiddleware } from "./lib/supabase-server";

export async function middleware(req: NextRequest) {
	const publicRoutes = ["/", "/auth/signin", "/how-it-works", "/privacy-and-terms", "/support"];
	const res = NextResponse.next();
	const cookieStore = req.cookies;
	const supabase = await createMiddleware({ cookies: () => cookieStore });
	try {
		const {
			data: { session },
			error,
		} = await supabase.auth.getSession();

		res.headers.set("x-middleware-cache", "no-cache");
		res.headers.set("x-debug-session", session ? "exists" : "none");
		res.headers.set("x-debug-url", req.nextUrl.pathname);

		if (error) {
			if (!publicRoutes.includes(req.nextUrl.pathname)) {
				return res;
			}
			return NextResponse.redirect(new URL("/", req.url));
		}
		// Skip auth check for auth callback
		if (req.nextUrl.pathname.startsWith("/auth/callback")) {
			return res;
		}

		if (!session && !publicRoutes.includes(req.nextUrl.pathname)) {
			return NextResponse.redirect(new URL("/", req.url));
		}
		if (session && req.nextUrl.pathname === "/") {
			return NextResponse.redirect(new URL("/dashboard", req.url));
		}
		const requestUrl = new URL(req.url);
		const path = requestUrl.pathname;

		// Public routes that don't require auth

		// If the route is public, allow access without checking auth
		if (publicRoutes.includes(path)) {
			return NextResponse.next();
		}

		return NextResponse.next();
	} catch (error) {
		res.cookies.delete("sb-access-token");
		res.cookies.delete("sb-refresh-token");

		if (!req.nextUrl.pathname.startsWith("/dashboard")) {
			return res;
		}
		return NextResponse.redirect(new URL("/", req.url));
	}
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
