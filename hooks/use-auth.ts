"use client";

import { supabase } from "@/lib/supabase-server";
import { User } from "@/lib/types";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
export function useAuth() {
	const [user, setUser] = useState<User | null>(null);
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(true);
	const googleSignIn = async (redirectTo?: string) => {
		try {
			if (redirectTo) {
				sessionStorage.setItem("redirectAfterAuth", redirectTo);
			}
			const _redirectTo =
				process.env.NEXT_PUBLIC_NODE_ENV === "development"
					? "http://localhost:3000/auth/callback"
					: "https://skilllink.co/auth/callback";

			const { error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo: _redirectTo,
				},
			});
			return { error };
		} catch (error) {
			return { error };
		}
	};

	useEffect(() => {
		async function getUser() {
			try {
				const {
					data: { session },
					error: sessionError,
				} = await supabase.auth.getSession();

				if (sessionError || !session) {
					setUser(null);
					setIsLoading(false);
					return;
				}

				const { data: profile, error: profileError } = await supabase
					.from("users")
					.select("*")
					.eq("id", session.user.id)
					.single();

				if (profileError) {
					setUser(null);
					setIsLoading(false);
					return;
				}
				setUser(profile);
			} catch (error) {
				setUser(null);
			} finally {
				setIsLoading(false);
			}
		}

		getUser();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(() => {
			getUser();
		});

		return () => {
			subscription.unsubscribe();
		};
	}, []);

	return {
		user,
		isLoading,
		signOut: () => supabase.auth.signOut(),
		googleSignIn,
	};
}
