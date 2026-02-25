const express = require('express');
const pool = require('../config/db');
const { ensureAuth } = require('../middleware/auth');
const router = express.Router();

const INTERVALS = [1, 3, 7, 14, 30];

function nextReviewDate(stage) {
    const days = INTERVALS[stage] || 30;
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

// List all spaced topics for user
router.get('/', ensureAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM spaced_topics WHERE user_id = $1 ORDER BY next_review ASC',
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new topic
router.post('/', ensureAuth, async (req, res) => {
    const { name, category } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
    try {
        const { rows } = await pool.query(
            `INSERT INTO spaced_topics (user_id, name, category, next_review, stage, reviews)
       VALUES ($1, $2, $3, $4, 0, '[]') RETURNING *`,
            [req.user.id, name, category || 'Geral', nextReviewDate(0)]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark topic as reviewed (advance stage)
router.put('/:id/review', ensureAuth, async (req, res) => {
    try {
        const { rows: existing } = await pool.query(
            'SELECT * FROM spaced_topics WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );
        if (!existing.length) return res.status(404).json({ error: 'Tópico não encontrado' });

        const topic = existing[0];
        const newStage = Math.min(topic.stage + 1, INTERVALS.length - 1);
        const reviews = topic.reviews || [];
        reviews.push(new Date().toISOString());

        const { rows } = await pool.query(
            `UPDATE spaced_topics SET stage=$1, next_review=$2, reviews=$3 WHERE id=$4 RETURNING *`,
            [newStage, nextReviewDate(newStage), JSON.stringify(reviews), req.params.id]
        );
        res.json(rows[0]);
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
