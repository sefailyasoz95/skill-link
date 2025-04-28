import { createClient } from '@supabase/supabase-js';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          skills: string[] | null;
          past_projects: {
            title: string;
            description: string;
            url: string;
          }[] | null;
          collaboration_needs: string[] | null;
          collaboration_terms: string[] | null;
          availability: string | null;
          location: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          created_at: string;
          sender_id: string;
          recipient_id: string;
          content: string;
          read: boolean;
        };
      };
      connections: {
        Row: {
          id: string;
          created_at: string;
          user_id_1: string;
          user_id_2: string;
          status: 'pending' | 'connected' | 'rejected';
          initiator_id: string;
        };
      };
    };
  };
};

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);