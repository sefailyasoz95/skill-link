// app/messages/[userId]/page.tsx (Server Component)
import MessagesClient from "@/components/MessagesClient";
import { supabase } from "@/lib/supabase";

export default async function MessagesPage({ params }: { params: { userId: string } }) {
	const { userId } = params;

	// You can fetch initial data here if needed
	const { data: profile } = await supabase
		.from("profiles")
		.select("id, full_name, avatar_url")
		.eq("id", userId)
		.single();

	// Pass the data to the client component
	return <MessagesClient userId={userId} initialProfile={profile} />;
}
