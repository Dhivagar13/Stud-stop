-- Migration: 00001_initial_schema
-- Description: Core database schema for Stud-Stop with RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES TABLE
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'faculty', 'admin')) DEFAULT 'student',
  name TEXT NOT NULL,
  dept TEXT NOT NULL,
  semester INTEGER NOT NULL DEFAULT 1,
  roll_no TEXT,
  skills JSONB DEFAULT '{}',
  placement_score INTEGER DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTES TABLE
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  semester INTEGER NOT NULL,
  topic TEXT,
  uploader_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  tags TEXT[] DEFAULT '{}',
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- QUESTION PAPERS TABLE
CREATE TABLE question_papers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject TEXT NOT NULL,
  year INTEGER NOT NULL,
  semester INTEGER NOT NULL,
  university TEXT,
  file_url TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DOUBTS TABLE
CREATE TABLE doubts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_resolved BOOLEAN DEFAULT FALSE,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DOUBT REPLIES TABLE
CREATE TABLE doubt_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doubt_id UUID REFERENCES doubts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  body TEXT NOT NULL,
  is_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ANNOUNCEMENTS TABLE
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  category TEXT,
  read_by UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CA MARKS TABLE
CREATE TABLE ca_marks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  ca_number INTEGER NOT NULL,
  marks_obtained NUMERIC(5,2) NOT NULL,
  max_marks NUMERIC(5,2) NOT NULL,
  semester INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PLACEMENT QUIZZES TABLE
CREATE TABLE placement_quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  domain TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  questions JSONB NOT NULL,
  time_limit_minutes INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- QUIZ ATTEMPTS TABLE
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  quiz_id UUID REFERENCES placement_quizzes(id) ON DELETE CASCADE NOT NULL,
  answers JSONB,
  score INTEGER DEFAULT 0,
  time_taken_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SKILLS TABLE
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')) DEFAULT 'beginner',
  verified BOOLEAN DEFAULT FALSE
);

-- INDEXES
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_dept ON profiles(dept);
CREATE INDEX idx_notes_subject ON notes(subject);
CREATE INDEX idx_notes_semester ON notes(semester);
CREATE INDEX idx_notes_approved ON notes(is_approved);
CREATE INDEX idx_doubts_subject ON doubts(subject);
CREATE INDEX idx_doubts_resolved ON doubts(is_resolved);
CREATE INDEX idx_announcements_priority ON announcements(priority);
CREATE INDEX idx_ca_marks_student ON ca_marks(student_id);
CREATE INDEX idx_quiz_attempts_student ON quiz_attempts(student_id);
CREATE INDEX idx_skills_student ON skills(student_id);

-- UPDATED AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE doubts ENABLE ROW LEVEL SECURITY;
ALTER TABLE doubt_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ca_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

-- PROFILES RLS
CREATE POLICY "Students read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'faculty' OR role = 'admin')
  ));

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admin insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- NOTES RLS
CREATE POLICY "Anyone can read approved notes"
  ON notes FOR SELECT
  USING (is_approved = true OR uploader_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Authenticated users can insert notes"
  ON notes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Uploader or admin can delete notes"
  ON notes FOR DELETE
  USING (uploader_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- QUESTION PAPERS RLS
CREATE POLICY "Anyone can read question papers"
  ON question_papers FOR SELECT
  USING (true);

-- DOUBTS RLS
CREATE POLICY "All authenticated users read doubts"
  ON doubts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Students create own doubts"
  ON doubts FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Authors can update own doubts"
  ON doubts FOR UPDATE
  USING (student_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'faculty' OR role = 'admin')
  ));

-- DOUBT REPLIES RLS
CREATE POLICY "All authenticated read replies"
  ON doubt_replies FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can reply"
  ON doubt_replies FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ANNOUNCEMENTS RLS
CREATE POLICY "All authenticated read announcements"
  ON announcements FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Faculty and admin insert announcements"
  ON announcements FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'faculty' OR role = 'admin')
  ));

-- CA MARKS RLS
CREATE POLICY "Students read own CA marks"
  ON ca_marks FOR SELECT
  USING (student_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'faculty' OR role = 'admin')
  ));

CREATE POLICY "Faculty insert CA marks"
  ON ca_marks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'faculty' OR role = 'admin')
  ));

-- PLACEMENT QUIZZES RLS
CREATE POLICY "All authenticated read quizzes"
  ON placement_quizzes FOR SELECT
  USING (auth.role() = 'authenticated');

-- QUIZ ATTEMPTS RLS
CREATE POLICY "Students read own attempts"
  ON quiz_attempts FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students insert own attempts"
  ON quiz_attempts FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- SKILLS RLS
CREATE POLICY "Students read own skills"
  ON skills FOR SELECT
  USING (student_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'faculty' OR role = 'admin')
  ));

CREATE POLICY "Students insert own skills"
  ON skills FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES
  ('notes-files', 'notes-files', FALSE),
  ('question-papers', 'question-papers', FALSE),
  ('avatars', 'avatars', TRUE),
  ('company-logos', 'company-logos', TRUE)
ON CONFLICT (id) DO NOTHING;

-- STORAGE POLICIES
CREATE POLICY "Authenticated users can read notes"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('notes-files', 'question-papers') AND auth.role() = 'authenticated');

CREATE POLICY "Users can upload notes"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('notes-files', 'question-papers') AND auth.role() = 'authenticated');

CREATE POLICY "Public read avatars and logos"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('avatars', 'company-logos'));
