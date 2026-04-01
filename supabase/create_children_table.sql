-- Create children table
-- Run this in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS children (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_space_id UUID NOT NULL REFERENCES family_spaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade TEXT,
  school TEXT,
  activities JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add child_name column to messages table for AI-assigned child routing
ALTER TABLE messages ADD COLUMN IF NOT EXISTS child_name TEXT;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_children_family_space ON children(family_space_id);
CREATE INDEX IF NOT EXISTS idx_messages_child_name ON messages(child_name);
