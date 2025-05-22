"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase-server";

export default function AuthCallback() {
	const router = useRouter();
	const { toast } = useToast();

	// Forces Supabase to exchange the code for a session and set cookies
	const handleAuth = async () => {
		const { data, error } = await supabase.auth.getSession();

		if (!error) {
			const { user } = data.session!;
			const isUserExist = await supabase.from("users").select("id").eq("id", user.id).single();
			if (isUserExist.data) {
				router.push("/dashboard");
				return;
			}
			const { error: userError, data: userData } = await supabase.from("users").insert({
				full_name: user.user_metadata.full_name,
				username: user.user_metadata.email,
				profile_picture: user.user_metadata.avatar_url,
				id: user.id,
			});
			if (userError) {
				toast({
					title: "Attention!",
					description: "You signed in but you need to fill out your profile info!",
				});
			}
			router.push("/dashboard");
		} else {
			toast({
				title: "Error!",
				description: "Sign in failed!",
			});
		}
	};
	useEffect(() => {
		handleAuth();
	}, []);
	return <div>Loading...</div>;
}
