-- Phase 2 Tables: Study Planner, N-Back, Gamification
-- Run after 001-fsrs-columns.sql

-- Study Planner
CREATE TABLE IF NOT EXISTS study_subjects (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7) DEFAULT '#3a86ff',
  target_hours NUMERIC(6,1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_study_subjects_user ON study_subjects(user_id);

CREATE TABLE IF NOT EXISTS study_topics (
  id SERIAL PRIMARY KEY,
  subject_id INT NOT NULL REFERENCES study_subjects(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(500) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  estimated_hours NUMERIC(4,1) DEFAULT 0,
  actual_hours NUMERIC(4,1) DEFAULT 0,
  target_date DATE,
  completed_at TIMESTAMP,
  spaced_topic_id INT REFERENCES spaced_topics(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_study_topics_user ON study_topics(user_id);
CREATE INDEX IF NOT EXISTS idx_study_topics_subject ON study_topics(subject_id);

-- N-Back
CREATE TABLE IF NOT EXISTS nback_sessions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  n_level INT NOT NULL DEFAULT 2,
  total_rounds INT NOT NULL,
  pos_hits INT DEFAULT 0,
  pos_misses INT DEFAULT 0,
  pos_false_alarms INT DEFAULT 0,
  let_hits INT DEFAULT 0,
  let_misses INT DEFAULT 0,
  let_false_alarms INT DEFAULT 0,
  accuracy_pct NUMERIC(5,2) DEFAULT 0,
  completed_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_nback_user ON nback_sessions(user_id);

CREATE TABLE IF NOT EXISTS user_nback_progress (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_level INT DEFAULT 2,
  max_unlocked_level INT DEFAULT 2,
  consecutive_high_scores INT DEFAULT 0,
  total_sessions INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Gamification
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(10) NOT NULL,
  category VARCHAR(50) NOT NULL,
  xp_reward INT DEFAULT 0,
  condition_json JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id INT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

CREATE TABLE IF NOT EXISTS xp_log (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  source VARCHAR(50) NOT NULL,
  source_id INT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_xp_log_user ON xp_log(user_id);

-- User columns for gamification
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_xp INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);
