export interface User {
	id: string; // UUID, from auth.users
	full_name: string | null;
	username: string | null;
	bio: string | null;
	profile_picture: string | null; // URL to Supabase storage
	location: string | null;
	availability: "part-time" | "full-time" | "weekends" | null;
	created_at: string; // ISO date string (TIMESTAMPTZ)
	skills: string[] | null;
	projects?: Project[]; // one-to-many
	looking_for: string[] | null;
	conditions: string[] | null;
	profile_views_received?: ProfileView[]; // viewed_user_id = this user
	profile_views_made?: ProfileView[]; // viewer_id = this user
	chat_memberships?: ChatMember[]; // many-to-many via chat_members
	messages?: Message[]; // sent messages
	connections_as_a?: Connection[]; // user_a = this user
	connections_as_b?: Connection[]; // user_b = this user
	socail_links?: Array<{ key: string; value: string }> | null;
}

export interface Project {
	id: string; // UUID
	user_id: string;
	title: string;
	description: string;
	url: string | null;
	created_at: string;
	user?: User;
	is_current_project: boolean;
}
export interface CollabNeed {
	id: string;
	user_id: string;
	looking_for: string[];
	description: string;
	conditions: string[];
	created_at: string;
	user?: User;
}
export type ConnectionStatus = "pending" | "accepted" | "rejected";

export interface Connection {
	id: string;
	status: ConnectionStatus;
	created_at: string;
	user_a: string;
	user_b: string;
	userA?: User;
	userB?: User;
}
export interface ProfileView {
	id: string;
	viewer_id: string;
	viewed_user_id: string;
	viewed_at: string;
	viewer?: User;
	viewed_user?: User;
}
export interface Chat {
	id: string;
	is_group: boolean;
	name: string | null;
	created_at: string;
	members?: User[]; // via chat_members
	chat_members?: ChatMember[]; // for metadata like joined_at
	messages?: Message[];
}
export interface ChatMember {
	chat_id: string;
	user_id: string;
	joined_at: string;

	chat?: Chat;
	user?: User;
}
export interface Message {
	id: string;
	chat_id: string;
	sender_id: string | null;
	content: string;
	sent_at: string;
	chat?: Chat;
	sender?: User;
}
export interface ConversationDisplayItem {
	id: string; // Chat ID
	is_group: boolean;
	name: string | null; // Chat name (especially for groups or derived for 1-on-1)
	lastMessage: {
		id: string;
		content: string;
		sent_at: string;
		sender?: User | null; // The user object of the sender
		is_sender: boolean; // True if the currentUser sent this last message
	} | null;
	participants: User[]; // All participants in the chat
	otherParticipants: User[]; // Participants excluding the current user
	unreadCount: number; // Placeholder for unread messages logic
	created_at: string; // Chat creation timestamp
}
