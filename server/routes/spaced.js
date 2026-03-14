const express = require('express');
const pool = require('../config/db');
const { ensureAuth } = require('../middleware/auth');
const { review, retrievability, FACTOR, DECAY } = require('../lib/fsrs');
const router = express.Router();

// Legacy intervals (kept as fallback for backward compatibility)
const INTERVALS = [1, 3, 7, 14, 30];

// List all spaced topics for user (with live retrievability)
router.get('/', ensureAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM spaced_topics WHERE user_id = $1 ORDER BY next_review ASC',
            [req.user.id]
        );

        // Enrich with current retrievability
        const now = new Date();
        const enriched = rows.map(t => {
            const lastReview = t.last_review || t.study_date;
            const daysSince = lastReview ? Math.max(0, (now - new Date(lastReview)) / 86400000) : 0;
            const S = t.stability || 1.0;
            const R = retrievability(daysSince, S);
            return {
                ...t,
                retrievability: Math.round(R * 100),
                stage: Math.min(4, t.reps || t.stage || 0) // backward compat
            };
        });

        res.json(enriched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new topic
router.post('/', ensureAuth, async (req, res) => {
    const { name, category } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextReview = tomorrow.toISOString().split('T')[0];

    try {
        const { rows } = await pool.query(
            `INSERT INTO spaced_topics (user_id, name, category, next_review, stage, reviews, difficulty, stability, reps, lapses)
             VALUES ($1, $2, $3, $4, 0, '[]', 5.0, 1.0, 0, 0) RETURNING *`,
            [req.user.id, name, category || 'Geral', nextReview]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark topic as reviewed (FSRS-powered)
router.put('/:id/review', ensureAuth, async (req, res) => {
    try {
        const { rows: existing } = await pool.query(
            'SELECT * FROM spaced_topics WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );
        if (!existing.length) return res.status(404).json({ error: 'Tópico não encontrado' });

        const topic = existing[0];
        const rating = parseInt(req.body.rating) || 3; // default Good

        // FSRS calculation
        const result = review({
            difficulty: topic.difficulty || 5.0,
            stability: topic.stability || 1.0,
            last_review: topic.last_review || topic.study_date,
            reps: topic.reps || 0,
            lapses: topic.lapses || 0
        }, rating);

        // Update review history
        const reviews = topic.reviews || [];
        reviews.push({
            date: new Date().toISOString(),
            rating,
            R: result.retrievability,
            interval: result.interval
        });

        const { rows } = await pool.query(
            `UPDATE spaced_topics SET
                stage = $1,
                next_review = $2,
                reviews = $3,
                difficulty = $4,
                stability = $5,
                last_review = $6,
                reps = $7,
                lapses = $8
             WHERE id = $9 RETURNING *`,
            [
                Math.min(4, result.reps),       // stage for backward compat
                result.next_review,
                JSON.stringify(reviews),
                result.difficulty,
                result.stability,
                result.last_review,
                result.reps,
                result.lapses,
                req.params.id
            ]
        );
        res.json({ ...rows[0], retrievability: result.retrievability, interval: result.interval });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete topic
router.delete('/:id', ensureAuth, async (req, res) => {
    try {
        const { rowCount } = await pool.query(
            'DELETE FROM spaced_topics WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );
        if (!rowCount) return res.status(404).json({ error: 'Tópico não encontrado' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
