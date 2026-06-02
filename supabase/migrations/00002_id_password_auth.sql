-- Migration: 00002_id_password_auth
-- Description: Adds identifier+password auth, companies table, push_tokens table

-- Add new columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS identifier VARCHAR UNIQUE,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS staff_id VARCHAR;

-- Make roll_no UNIQUE
UPDATE profiles SET roll_no = id WHERE roll_no IS NULL;
ALTER TABLE profiles ADD CONSTRAINT profiles_roll_no_unique UNIQUE (roll_no);

-- COMPANIES TABLE
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  about TEXT,
  salary_range TEXT,
  roles JSONB DEFAULT '[]',
  hiring_process TEXT[] DEFAULT '{}',
  culture TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PUSH TOKENS TABLE
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'expo',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_identifier ON profiles(identifier);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);

-- RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- COMPANIES RLS
CREATE POLICY "Anyone can read companies"
  ON companies FOR SELECT
  USING (true);

CREATE POLICY "Admin can insert companies"
  ON companies FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admin can update companies"
  ON companies FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- PUSH TOKENS RLS
CREATE POLICY "Users read own push tokens"
  ON push_tokens FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own push tokens"
  ON push_tokens FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own push tokens"
  ON push_tokens FOR DELETE
  USING (user_id = auth.uid());
