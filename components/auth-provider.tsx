"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-client";
import { User } from "@/lib/types";

type AuthContextType = {
	user: User | null;
	session: Session | null;
	signUp: (email: string, password: string) => Promise<{ error: any }>;
	signIn: (email: string, password: string, redirectTo?: string) => Promise<{ error: any }>;
	signOut: () => Promise<void>;
	loading: boolean;
	googleSignIn: (redirectTo?: string) => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType>({
	user: null,
	session: null,
	signUp: async () => ({ error: null }),
	signIn: async () => ({ error: null }),
	signOut: async () => {},
	loading: true,
	googleSignIn: async () => ({ error: null }),
});

export const useAuth = () => useContext(AuthContext);

type AuthProviderProps = {
	children: ReactNode;
	redirectIfUnauthenticated?: boolean;
};

const PUBLIC_ROUTES = [
	"/",
	"/auth/signin",
	"/auth/callback",
	"/how-it-works",
	"/auth/signup",
	"/privacy-and-terms",
	"/support",
];

const AuthProvider = ({ children, redirectIfUnauthenticated = true }: AuthProviderProps) => {
	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		const getSession = async () => {
			try {
				const { data, error } = await supabase.auth.getSession();
				setSession(data.session);
				if (!data.session) {
					setUser(null);
				} else {
					const { data: userData } = await supabase.from("users").select("*").eq("id", data.session.user.id).single();
					setUser(userData ?? null);
				}
			} finally {
				setLoading(false);
			}
		};
		getSession();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (_event, newSession) => {
			setSession(newSession);
			if (!newSession) {
				setUser(null);
			} else {
				const { data: userData } = await supabase.from("users").select("*").eq("id", newSession.user.id).single();
				setUser(userData ?? null);
			}
			setLoading(false);
		});
		return () => subscription.unsubscribe();
	}, []);

	// Only redirect if not loading, not on a public route, and user is not authenticated
	useEffect(() => {
		if (
			!loading &&
			!user &&
			redirectIfUnauthenticated &&
			!PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"))
		) {
			router.replace("/auth/signin?redirectTo=" + encodeURIComponent(pathname));
		}
	}, [user, loading, pathname, redirectIfUnauthenticated, router]);

	const signUp = async (email: string, password: string) => {
		try {
			const { error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					emailRedirectTo: `${window.location.origin}/auth/callback`,
				},
			});
			return { error };
		} catch (error) {
			console.error("Error in signUp:", error);
			return { error };
		}
	};

	const signIn = async (email: string, password: string, redirectTo?: string) => {
		try {
			const { error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});
			if (!error && redirectTo) {
				router.push(redirectTo);
			}
			return { error };
		} catch (error) {
			console.error("Error in signIn:", error);
			return { error };
		}
	};

	const signOut = async () => {
		try {
			await supabase.auth.signOut();
			setUser(null);
			setSession(null);
			router.push("/");
		} catch (error) {
			console.error("Error in signOut:", error);
		}
	};

	const googleSignIn = async (redirectTo?: string) => {
		try {
			if (redirectTo) {
				sessionStorage.setItem("redirectAfterAuth", redirectTo);
			}
			const { error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo: `${window.location.origin}/auth/callback`,
				},
			});
			return { error };
		} catch (error) {
			console.error("Error in googleSignIn:", error);
			return { error };
		}
	};

	const value = {
		user,
		session,
		signUp,
		signIn,
		signOut,
		loading,
		googleSignIn,
	};
	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
