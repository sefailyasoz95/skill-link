export interface User {
  id: string; // UUID, from auth.users
  full_name: string | null;
  username: string | null;
  bio: string | null;
  profile_picture: string | null; // URL to Supabase storage
  location: string | null;
  availability: "part-time" | "full-time" | "weekends" | null;
  created_at: string; // ISO date string (TIMESTAMPTZ)
}
export interface Skill {
  id: number;
  name: string;
}
export interface UserSkill {
  user_id: string; // UUID
  skill_id: number;
}
export interface Project {
  id: string; // UUID
  user_id: string;
  title: string;
  description: string;
  url: string | null;
  created_at: string;
}
export interface CollabNeed {
  id: string;
  user_id: string;
  looking_for: string;
  description: string;
  conditions: string | null;
  created_at: string;
}
export type ConnectionStatus = "pending" | "accepted" | "rejected";

export interface Connection {
  id: string;
  user_a: string;
  user_b: string;
  status: ConnectionStatus;
  created_at: string;
}
export interface ProfileView {
  id: string;
  viewer_id: string;
  viewed_user_id: string;
  viewed_at: string;
}
export interface Chat {
  id: string;
  is_group: boolean;
  name: string | null;
  created_at: string;
}
export interface ChatMember {
  chat_id: string;
  user_id: string;
  joined_at: string;
}
export interface Message {
  id: string;
  chat_id: string;
  sender_id: string | null;
  content: string;
  sent_at: string;
}
