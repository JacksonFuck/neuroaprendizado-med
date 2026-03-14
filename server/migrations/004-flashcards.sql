-- Migration 004: Flashcard system tables
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
