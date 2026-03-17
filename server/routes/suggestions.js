/**
 * NeuroForge — Forje sinapses. Domine o conhecimento.
 * Copyright (c) 2026 Jackson Erasmo Fuck. All rights reserved.
 * INPI Registration: 512026001683-5
 * Licensed under proprietary license. See LICENSE file.
 */
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { ensureAuth } = require('../middleware/auth');

// Get user's own suggestions
router.get('/', ensureAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT id, title, description, status, created_at FROM suggestions WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('Error fetching suggestions:', err);
        res.status(500).json({ error: 'Erro ao buscar sugestões.' });
    }
});

// Submit a new suggestion
router.post('/', ensureAuth, async (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        return res.status(400).json({ error: 'Título e descrição são obrigatórios.' });
    }

    try {
        const { rows } = await pool.query(
            'INSERT INTO suggestions (user_id, title, description) VALUES ($1, $2, $3) RETURNING *',
            [req.user.id, title, description]
        );
        res.json({ success: true, suggestion: rows[0] });
    } catch (err) {
        console.error('Error creating suggestion:', err);
        res.status(500).json({ error: 'Erro interno ao salvar sugestão.' });
    }
});

module.exports = router;
