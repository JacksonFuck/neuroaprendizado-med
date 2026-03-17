-- Migration 010: Neurobica (Brain Gymnastics) feature
-- Tracks user progress on 108 neurobica challenge cards

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
-- Unique per user + card + day (expression index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_neurobica_unique_day
  ON neurobica_progress (user_id, card_id, (completed_at::date));

-- Daily card tracking
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

-- User neurobica stats
ALTER TABLE users ADD COLUMN IF NOT EXISTS neurobica_streak INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS neurobica_total INT DEFAULT 0;
