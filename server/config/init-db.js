/**
 * NeuroForge — Forje sinapses. Domine o conhecimento.
 * Copyright (c) 2026 Jackson Erasmo Fuck. All rights reserved.
 * INPI Registration: 512026001683-5
 * Licensed under proprietary license. See LICENSE file.
 */
const pool = require('./db');

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT FALSE,
  accepted_lgpd_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP DEFAULT NOW()
);

-- Migration for existing databases
ALTER TABLE users ALTER COLUMN google_id DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS accepted_lgpd_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS diary_entries (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  content TEXT NOT NULL,
  mood VARCHAR(20) DEFAULT 'neutral',
  hours_studied NUMERIC(4,1) DEFAULT 0,
  topics_studied JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spaced_topics (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(500) NOT NULL,
  category VARCHAR(255) DEFAULT 'Geral',
  study_date TIMESTAMP DEFAULT NOW(),
  next_review DATE NOT NULL,
  stage INT DEFAULT 0,
  reviews JSONB DEFAULT '[]',
  difficulty REAL DEFAULT 5.0,
  stability REAL DEFAULT 1.0,
  last_review DATE,
  reps INT DEFAULT 0,
  lapses INT DEFAULT 0
);

-- FSRS migration for existing databases
ALTER TABLE spaced_topics ADD COLUMN IF NOT EXISTS difficulty REAL DEFAULT 5.0;
ALTER TABLE spaced_topics ADD COLUMN IF NOT EXISTS stability REAL DEFAULT 1.0;
ALTER TABLE spaced_topics ADD COLUMN IF NOT EXISTS last_review DATE;
ALTER TABLE spaced_topics ADD COLUMN IF NOT EXISTS reps INT DEFAULT 0;
ALTER TABLE spaced_topics ADD COLUMN IF NOT EXISTS lapses INT DEFAULT 0;

CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  focus_minutes INT NOT NULL,
  completed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_sections (
  id SERIAL PRIMARY KEY,
  tab_key VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diary_user ON diary_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_date ON diary_entries(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_spaced_user ON spaced_topics(user_id);
CREATE INDEX IF NOT EXISTS idx_spaced_review ON spaced_topics(user_id, next_review);
CREATE INDEX IF NOT EXISTS idx_pomodoro_user ON pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_content_tab ON content_sections(tab_key);

-- Session store table required by connect-pg-simple
CREATE TABLE IF NOT EXISTS "session" (
  "sid" VARCHAR NOT NULL COLLATE "default",
  "sess" JSON NOT NULL,
  "expire" TIMESTAMP(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

CREATE TABLE IF NOT EXISTS invitation_tokens (
  id SERIAL PRIMARY KEY,
  token VARCHAR(255) UNIQUE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_by_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suggestions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Phase 2: Study Planner
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

-- Phase 2: N-Back
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

-- Phase 2: Gamification
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

-- Phase 2: User gamification columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_xp INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);

-- Phase 3: Flashcard system
CREATE TABLE IF NOT EXISTS flashcard_decks (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255) DEFAULT 'Geral',
  color VARCHAR(7) DEFAULT '#00f0ff',
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_user ON flashcard_decks(user_id);

CREATE TABLE IF NOT EXISTS flashcards (
  id SERIAL PRIMARY KEY,
  deck_id INT NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  difficulty REAL DEFAULT 5.0,
  stability REAL DEFAULT 1.0,
  next_review DATE,
  last_review DATE,
  reps INT DEFAULT 0,
  lapses INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_flashcards_deck ON flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_review ON flashcards(user_id, next_review);

-- Phase 4: Onboarding Survey & Messages
CREATE TABLE IF NOT EXISTS user_goals (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  target_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  achieved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_goals_user ON user_goals(user_id);

CREATE TABLE IF NOT EXISTS survey_responses (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  survey_type VARCHAR(50) NOT NULL,
  responses JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_survey_user ON survey_responses(user_id);

ALTER TABLE users ADD COLUMN IF NOT EXISTS allow_tracking BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Phase 5: Freemium plan system
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);

-- Phone & personalized coaching consent (LGPD Art. 8 — granular consent)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_consent BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_consent_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS user_messages (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender VARCHAR(20) NOT NULL DEFAULT 'system',
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  priority VARCHAR(10) DEFAULT 'normal',
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_user ON user_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON user_messages(user_id, read_at) WHERE read_at IS NULL;

-- Phase 6: Neurocognitive Baseline Assessments
CREATE TABLE IF NOT EXISTS assessments (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_type VARCHAR(20) NOT NULL,
  week_marker INT NOT NULL DEFAULT 0,
  pvt_avg_rt NUMERIC(8,2),
  pvt_best_rt NUMERIC(8,2),
  pvt_worst_rt NUMERIC(8,2),
  pvt_variability NUMERIC(8,2),
  pvt_lapses INT DEFAULT 0,
  nback_level INT,
  nback_accuracy NUMERIC(5,2),
  nback_pos_hits INT,
  nback_let_hits INT,
  nback_total_possible INT,
  stroop_accuracy NUMERIC(5,2),
  stroop_avg_rt NUMERIC(8,2),
  stroop_total INT,
  stroop_correct INT,
  subj_focus INT,
  subj_retention INT,
  subj_fatigue INT,
  subj_motivation INT,
  subj_organization INT,
  composite_score NUMERIC(5,2),
  completed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assessments_user ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(user_id, assessment_type);

ALTER TABLE users ADD COLUMN IF NOT EXISTS next_assessment_due DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS assessments_completed INT DEFAULT 0;

-- Phase 7: Neurobica (Brain Gymnastics)
CREATE TABLE IF NOT EXISTS neurobica_progress (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id INT NOT NULL,
  completed_at TIMESTAMP DEFAULT NOW(),
  rating INT DEFAULT 3 CHECK (rating BETWEEN 1 AND 5),
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_neurobica_user ON neurobica_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_neurobica_card ON neurobica_progress(user_id, card_id);

CREATE TABLE IF NOT EXISTS neurobica_daily (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id INT NOT NULL,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  UNIQUE(user_id, assigned_date)
);
CREATE INDEX IF NOT EXISTS idx_neurobica_daily_user ON neurobica_daily(user_id, assigned_date);

ALTER TABLE users ADD COLUMN IF NOT EXISTS neurobica_streak INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS neurobica_total INT DEFAULT 0;
`;

async function initDB() {
  try {
    await pool.query(schema);
    console.log('✅ Database schema initialized');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to initialize database:', err.message);
    process.exit(1);
  }
}

initDB();
