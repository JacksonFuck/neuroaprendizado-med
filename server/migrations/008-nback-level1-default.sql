-- Migration 008: Change N-Back default starting level from 2 to 1
-- Supports N-Back Evolution progressive system (Single 1-Back as entry point)

ALTER TABLE user_nback_progress ALTER COLUMN current_level SET DEFAULT 1;
ALTER TABLE user_nback_progress ALTER COLUMN max_unlocked_level SET DEFAULT 1;
