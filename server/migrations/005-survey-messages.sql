-- User Goals / Objectives Survey
CREATE TABLE IF NOT EXISTS user_goals (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_type VARCHAR(50) NOT NULL,  -- immediate, medium_term, long_term
  description TEXT NOT NULL,
  target_date DATE,
  status VARCHAR(20) DEFAULT 'active',  -- active, achieved, abandoned
  achieved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_goals_user ON user_goals(user_id);

-- Survey Responses (initial + follow-ups)
CREATE TABLE IF NOT EXISTS survey_responses (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  survey_type VARCHAR(50) NOT NULL,  -- onboarding, monthly_checkin, goal_review
  responses JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_survey_user ON survey_responses(user_id);

-- User Preferences (opt-in tracking + settings)
ALTER TABLE users ADD COLUMN IF NOT EXISTS allow_tracking BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Messages / Notifications
CREATE TABLE IF NOT EXISTS user_messages (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender VARCHAR(20) NOT NULL DEFAULT 'system',  -- system, ai, admin
  type VARCHAR(50) NOT NULL,  -- welcome, tip, achievement, milestone, reminder, feedback
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  priority VARCHAR(10) DEFAULT 'normal',  -- low, normal, high
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_user ON user_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON user_messages(user_id, read_at) WHERE read_at IS NULL;
