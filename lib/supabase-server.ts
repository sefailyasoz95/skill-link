import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { type CookieOptions } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client with cookie handling
export const createClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
	cookies: {
		get(name: string) {
			if (typeof document === "undefined") return "";
			const cookie = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
			return cookie ? decodeURIComponent(cookie.split("=")[1]) : "";
		},
		set(name: string, value: string, options: CookieOptions) {
			if (typeof document === "undefined") return;
			let cookie = `${name}=${encodeURIComponent(value)}; path=/`;
			if (options.maxAge) cookie += `; max-age=${options.maxAge}`;
			if (options.domain) cookie += `; domain=${options.domain}`;
			if (options.secure) cookie += `; secure`;
			if (options.sameSite) cookie += `; samesite=${options.sameSite}`;
			document.cookie = cookie;
		},
		remove(name: string, options: CookieOptions) {
			if (typeof document === "undefined") return;
			document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; ${options.secure ? "secure; " : ""}${
				options.sameSite ? `samesite=${options.sameSite}; ` : ""
			}`;
		},
	},
	auth: {
		flowType: "pkce",
		detectSessionInUrl: true,
		autoRefreshToken: true,
		persistSession: true,
		storage: {
			getItem: (key) => {
				if (typeof window === "undefined") return null;
				try {
					return window.localStorage.getItem(key);
				} catch (error) {
					return null;
				}
			},
			setItem: (key, value) => {
				if (typeof window === "undefined") return;
				try {
					window.localStorage.setItem(key, value);
				} catch (error) {}
			},
			removeItem: (key) => {
				if (typeof window === "undefined") return;
				try {
					window.localStorage.removeItem(key);
				} catch (error) {}
			},
		},
	},
});

// Server client for server components/api routes
export const createServer = async (context: { cookies: any }) => {
	const cookieStore = await context.cookies();

	return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
		cookies: {
			get(name: string) {
				return cookieStore.get(name)?.value;
			},
			set(name: string, value: string, options: CookieOptions) {
				try {
					cookieStore.set(name, value, options);
				} catch (error) {}
			},
			remove(name: string, options: CookieOptions) {
				try {
					cookieStore.set(name, "", { ...options, maxAge: -1 });
				} catch (error) {}
			},
		},
	});
};

// Middleware client
export const createMiddleware = async (context: { cookies: any }) => {
	const cookieStore = context.cookies();

	return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
		cookies: {
			get(name: string) {
				return cookieStore.get(name)?.value;
			},
			set(name: string, value: string, options: CookieOptions) {
				try {
					cookieStore.set(name, value, options);
				} catch (error) {}
			},
			remove(name: string, options: CookieOptions) {
				try {
					cookieStore.set(name, "", { ...options, maxAge: -1 });
				} catch (error) {}
			},
		},
	});
};

// Export a pre-configured browser client instance
export const supabase = createClient;
