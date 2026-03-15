CREATE TABLE IF NOT EXISTS assessments (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_type VARCHAR(20) NOT NULL,  -- baseline, T1, T2, T3, T4, T5
  week_marker INT NOT NULL DEFAULT 0,     -- 0, 4, 8, 12, 26, 52

  -- PVT metrics
  pvt_avg_rt NUMERIC(8,2),
  pvt_best_rt NUMERIC(8,2),
  pvt_worst_rt NUMERIC(8,2),
  pvt_variability NUMERIC(8,2),
  pvt_lapses INT DEFAULT 0,

  -- N-Back metrics
  nback_level INT,
  nback_accuracy NUMERIC(5,2),
  nback_pos_hits INT,
  nback_let_hits INT,
  nback_total_possible INT,

  -- Stroop metrics
  stroop_accuracy NUMERIC(5,2),
  stroop_avg_rt NUMERIC(8,2),
  stroop_total INT,
  stroop_correct INT,

  -- Subjective (1-5 scale)
  subj_focus INT,
  subj_retention INT,
  subj_fatigue INT,
  subj_motivation INT,
  subj_organization INT,

  -- Computed
  composite_score NUMERIC(5,2),

  completed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assessments_user ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(user_id, assessment_type);

-- Track when next assessment is due
ALTER TABLE users ADD COLUMN IF NOT EXISTS next_assessment_due DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS assessments_completed INT DEFAULT 0;
