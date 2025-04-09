-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create game_stats table
CREATE TABLE game_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  games_played INTEGER DEFAULT 0 NOT NULL,
  games_won INTEGER DEFAULT 0 NOT NULL,
  games_lost INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create games table
CREATE TABLE games (
  id TEXT PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  players UUID[] NOT NULL,
  deck JSONB NOT NULL,
  table JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_turn UUID,
  status TEXT NOT NULL CHECK (status IN ('waiting', 'playing', 'finished')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create game_hands table
CREATE TABLE game_hands (
  game_id TEXT REFERENCES games ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  cards JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (game_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_hands ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Game stats policies
CREATE POLICY "Users can view their own stats"
  ON game_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
  ON game_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- Games policies
CREATE POLICY "Game creators can manage their games"
  ON games FOR ALL
  USING (auth.uid() = creator_id);

CREATE POLICY "Game players can view their games"
  ON games FOR SELECT
  USING (auth.uid() = ANY(players));

CREATE POLICY "Users can join waiting games"
  ON games FOR UPDATE
  USING (
    status = 'waiting' AND
    NOT (auth.uid() = ANY(players))
  );

-- Game hands policies
CREATE POLICY "Players can view their own hands"
  ON game_hands FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Game server can manage hands"
  ON game_hands FOR ALL
  USING (auth.role() = 'service_role');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_stats_updated_at
  BEFORE UPDATE ON game_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_hands_updated_at
  BEFORE UPDATE ON game_hands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 