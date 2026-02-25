const express = require('express');
const pool = require('../config/db');
const { ensureAuth } = require('../middleware/auth');
const router = express.Router();

// List all diary entries for the authenticated user
router.get('/', ensureAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM diary_entries WHERE user_id = $1 ORDER BY entry_date DESC',
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get a single diary entry
router.get('/:id', ensureAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM diary_entries WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Entrada não encontrada' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a diary entry
router.post('/', ensureAuth, async (req, res) => {
    const { entry_date, content, mood, hours_studied, topics_studied } = req.body;
    if (!content || !entry_date) {
        return res.status(400).json({ error: 'Data e conteúdo são obrigatórios' });
    }
    try {
        const { rows } = await pool.query(
            `INSERT INTO diary_entries (user_id, entry_date, content, mood, hours_studied, topics_studied)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [req.user.id, entry_date, content, mood || 'neutral', hours_studied || 0, JSON.stringify(topics_studied || [])]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a diary entry
router.put('/:id', ensureAuth, async (req, res) => {
    const { content, mood, hours_studied, topics_studied } = req.body;
    try {
        const { rows } = await pool.query(
            `UPDATE diary_entries SET content=$1, mood=$2, hours_studied=$3, topics_studied=$4, updated_at=NOW()
       WHERE id=$5 AND user_id=$6 RETURNING *`,
            [content, mood, hours_studied, JSON.stringify(topics_studied || []), req.params.id, req.user.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Entrada não encontrada' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a diary entry
router.delete('/:id', ensureAuth, async (req, res) => {
    try {
        const { rowCount } = await pool.query(
            'DELETE FROM diary_entries WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );
        if (!rowCount) return res.status(404).json({ error: 'Entrada não encontrada' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
