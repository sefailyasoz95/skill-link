"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { User, Session } from "@supabase/supabase-js";

type AuthContextType = {
	user: User | null;
	session: Session | null;
	signUp: (email: string, password: string) => Promise<{ error: any }>;
	signIn: (email: string, password: string) => Promise<{ error: any }>;
	signOut: () => Promise<void>;
	loading: boolean;
	googleSignIn: () => Promise<{ error: any }>;
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
};

const AuthProvider = ({ children }: AuthProviderProps) => {
	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		// Get the current session
		const getSession = async () => {
			const { data, error } = await supabase.auth.getSession();
			if (error) {
				console.error(error);
			}
			setSession(data.session);
			setUser(data.session?.user ?? null);
			setLoading(false);
		};

		getSession();

		// Listen for auth state changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, newSession) => {
			setSession(newSession);
			setUser(newSession?.user ?? null);
			setLoading(false);
		});

		return () => {
			subscription.unsubscribe();
		};
	}, []);

	const signUp = async (email: string, password: string) => {
		const { error } = await supabase.auth.signUp({
			email,
			password,
		});
		return { error };
	};

	const signIn = async (email: string, password: string) => {
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});
		return { error };
	};
	const googleSignIn = async () => {
		const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
		return { error };
	};
	const signOut = async () => {
		await supabase.auth.signOut();
		router.push("/");
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
