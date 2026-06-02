-- Migration: 00003_companies_push_tokens
-- Description: Add missing columns, RPC functions, seed data for existing companies/push_tokens

-- Add missing columns to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS past_questions TEXT[] DEFAULT '{}';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS hiring_process TEXT[] DEFAULT '{}';

-- Add unique constraint on push_tokens.user_id
ALTER TABLE push_tokens ADD CONSTRAINT IF NOT EXISTS push_tokens_user_id_key UNIQUE (user_id);

-- Updated at trigger for push_tokens
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_push_tokens ON push_tokens;
CREATE TRIGGER set_updated_at_push_tokens
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- INCREMENT DOWNLOADS FUNCTIONS
CREATE OR REPLACE FUNCTION increment_note_downloads(note_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE notes SET downloads = downloads + 1 WHERE id = note_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_paper_downloads(paper_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE question_papers SET downloads = downloads + 1 WHERE id = paper_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed companies (if not already seeded)
INSERT INTO companies (name, roles, salary_range, about, hiring_process, past_questions, culture)
SELECT 'Google', '["SDE","Data Engineer","PM"]'::jsonb, '₹20-45 LPA',
  'Google is a multinational technology company specializing in Internet-related services and products.',
  ARRAY['Online Assessment', 'Technical Phone Screen', 'On-site Interviews (4 rounds)', 'Hiring Committee'],
  ARRAY['Design a distributed cache', 'Implement LRU cache', 'System design: Google Docs'],
  'Innovation-first, collaborative, 20% time policy'
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE name = 'Google');

INSERT INTO companies (name, roles, salary_range, about, hiring_process, past_questions, culture)
SELECT 'Microsoft', '["SDE","PM","Data Scientist"]'::jsonb, '₹18-40 LPA',
  'Microsoft is a leading technology company that develops software, services, and hardware.',
  ARRAY['Online Coding Test', 'Technical Interviews', 'System Design', 'Hiring Manager Round'],
  ARRAY['Design a URL shortener', 'Implement a thread-safe singleton', 'Design distributed file system'],
  'Growth mindset, collaborative, work-life balance'
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE name = 'Microsoft');

INSERT INTO companies (name, roles, salary_range, about, hiring_process, past_questions, culture)
SELECT 'Amazon', '["SDE","Cloud Engineer","Data Analyst"]'::jsonb, '₹16-35 LPA',
  'Amazon is a multinational technology company focused on e-commerce, cloud computing, and AI.',
  ARRAY['Online Assessment', 'Technical Phone Screen', '4-5 On-site Rounds', 'Bar Raiser Round'],
  ARRAY['Design a scalable e-commerce cart', 'LRU cache implementation', 'Design a load balancer'],
  'Customer-obsessed, ownership, high standards'
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE name = 'Amazon');

INSERT INTO companies (name, roles, salary_range, about, hiring_process, past_questions, culture)
SELECT 'Flipkart', '["SDE","Data Analyst"]'::jsonb, '₹12-28 LPA',
  'Flipkart is an Indian e-commerce company, headquartered in Bangalore.',
  ARRAY['Coding Test', 'Technical Round 1', 'Technical Round 2', 'HR Round'],
  ARRAY['Design a recommendation system', 'Implement a search autocomplete', 'Design a shopping cart'],
  'Fast-paced, innovative, customer-first'
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE name = 'Flipkart');
