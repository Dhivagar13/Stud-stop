export type Role = 'student' | 'faculty' | 'admin';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface Profile {
  id: string;
  role: Role;
  name: string;
  dept: string;
  semester: number;
  roll_no: string;
  staff_id: string | null;
  identifier: string | null;
  password_hash: string | null;
  skills: Record<string, SkillLevel>;
  placement_score: number;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  title: string;
  subject: string;
  semester: number;
  topic: string;
  uploader_id: string;
  file_url: string;
  file_size: number;
  downloads: number;
  version: number;
  tags: string[];
  is_approved: boolean;
  created_at: string;
}

export interface QuestionPaper {
  id: string;
  subject: string;
  year: number;
  semester: number;
  university: string;
  file_url: string;
  difficulty: Difficulty;
  downloads: number;
  created_at: string;
}

export interface Doubt {
  id: string;
  student_id: string;
  subject: string;
  body: string;
  tags: string[];
  is_resolved: boolean;
  upvotes: number;
  created_at: string;
}

export interface DoubtReply {
  id: string;
  doubt_id: string;
  author_id: string;
  body: string;
  is_accepted: boolean;
  created_at: string;
}

export interface Announcement {
  id: string;
  author_id: string;
  title: string;
  body: string;
  priority: Priority;
  category: string;
  read_by: string[];
  created_at: string;
}

export interface CAMark {
  id: string;
  student_id: string;
  subject: string;
  ca_number: number;
  marks_obtained: number;
  max_marks: number;
  semester: number;
  created_at: string;
}

export interface PlacementQuiz {
  id: string;
  title: string;
  domain: string;
  difficulty: Difficulty;
  questions: QuizQuestion[];
  time_limit_minutes: number;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  student_id: string;
  quiz_id: string;
  answers: number[];
  score: number;
  time_taken_seconds: number;
  created_at: string;
}

export interface Skill {
  id: string;
  student_id: string;
  name: string;
  category: string;
  level: SkillLevel;
  verified: boolean;
}

export interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  about: string | null;
  salary_range: string | null;
  roles: any;
  hiring_process: string[];
  culture: string | null;
  created_at: string;
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: string;
  created_at: string;
}
