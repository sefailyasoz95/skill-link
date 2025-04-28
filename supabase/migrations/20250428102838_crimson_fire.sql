/*
  # Create profiles, messages, and connections tables

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key) - References auth.users
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `full_name` (text)
      - `avatar_url` (text)
      - `bio` (text)
      - `skills` (text[])
      - `past_projects` (jsonb)
      - `collaboration_needs` (text[])
      - `collaboration_terms` (text[])
      - `availability` (text)
      - `location` (text)
  
    - `messages`
      - `id` (uuid, primary key)
      - `created_at` (timestamptz)
      - `sender_id` (uuid) - References profiles.id
      - `recipient_id` (uuid) - References profiles.id
      - `content` (text)
      - `read` (boolean)
  
    - `connections`
      - `id` (uuid, primary key)
      - `created_at` (timestamptz)
      - `user_id_1` (uuid) - References profiles.id
      - `user_id_2` (uuid) - References profiles.id
      - `status` (text) - Can be 'pending', 'connected', or 'rejected'
      - `initiator_id` (uuid) - References profiles.id

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
    - Set up storage bucket for avatars
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  skills TEXT[],
  past_projects JSONB,
  collaboration_needs TEXT[],
  collaboration_terms TEXT[],
  availability TEXT,
  location TEXT
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  recipient_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE
);

-- Create connections table
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id_1 UUID REFERENCES profiles(id) NOT NULL,
  user_id_2 UUID REFERENCES profiles(id) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'connected', 'rejected')),
  initiator_id UUID REFERENCES profiles(id) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can read any profile"
  ON profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create policies for messages
CREATE POLICY "Users can read messages they're part of"
  ON messages
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can insert messages they send"
  ON messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update messages they're part of"
  ON messages
  FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Create policies for connections
CREATE POLICY "Users can read connections they're part of"
  ON connections
  FOR SELECT
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

CREATE POLICY "Users can insert connections they initiate"
  ON connections
  FOR INSERT
  WITH CHECK (auth.uid() = initiator_id);

CREATE POLICY "Users can update connections they're part of"
  ON connections
  FOR UPDATE
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Create storage bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy to allow users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policy to allow public read access to avatars
CREATE POLICY "Anyone can read avatars"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- Create function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to create profile when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();