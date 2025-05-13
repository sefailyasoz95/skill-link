"use client";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AuthCallback() {
  const router = useRouter();
  const { toast } = useToast();

  // Forces Supabase to exchange the code for a session and set cookies
  const handleAuth = async () => {
    const { data, error } = await supabase.auth.getSession();

    if (!error) {
      toast({
        title: "YES!",
        description: "Sign in success!",
      });
      const { user } = data.session!;

      const { error: userError, data: userData } = await supabase
        .from("users")
        .insert({
          full_name: user.user_metadata.full_name,
          username: user.user_metadata.email,
          profile_picture: user.user_metadata.avatar_url,
          id: user.id,
        });
      if (userError) {
        toast({
          title: "Attention!",
          description:
            "You signed in but you need to fill out your profile info!",
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
