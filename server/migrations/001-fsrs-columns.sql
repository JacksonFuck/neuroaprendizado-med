-- Migration 001: Add FSRS columns to spaced_topics
-- Run: psql -f server/migrations/001-fsrs-columns.sql

ALTER TABLE spaced_topics ADD COLUMN IF NOT EXISTS difficulty REAL DEFAULT 5.0;
ALTER TABLE spaced_topics ADD COLUMN IF NOT EXISTS stability REAL DEFAULT 1.0;
ALTER TABLE spaced_topics ADD COLUMN IF NOT EXISTS last_review DATE;
ALTER TABLE spaced_topics ADD COLUMN IF NOT EXISTS reps INT DEFAULT 0;
ALTER TABLE spaced_topics ADD COLUMN IF NOT EXISTS lapses INT DEFAULT 0;
