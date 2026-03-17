/**
 * NeuroForge — Forje sinapses. Domine o conhecimento.
 * Copyright (c) 2026 Jackson Erasmo Fuck. All rights reserved.
 * INPI Registration: 512026001683-5
 * Licensed under proprietary license. See LICENSE file.
 */
const express = require('express');
const pool = require('../config/db');
const { ensureAuth } = require('../middleware/auth');
const router = express.Router();

// GET /api/unified-review/due — Returns both spaced topics and flashcards due today
router.get('/due', ensureAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        // Spaced topics due today or overdue
        const { rows: topics } = await pool.query(
            `SELECT id, name, category, next_review, difficulty, stability, stage
             FROM spaced_topics
             WHERE user_id = $1 AND next_review <= CURRENT_DATE
             ORDER BY next_review ASC`,
            [userId]
        );

        // Flashcards due today or overdue
        const { rows: cards } = await pool.query(
            `SELECT f.id, f.front, f.back, f.deck_id, f.difficulty, f.stability, f.next_review,
                    d.name AS deck_name, d.color AS deck_color
             FROM flashcards f
             JOIN flashcard_decks d ON f.deck_id = d.id
             WHERE f.user_id = $1 AND f.next_review <= CURRENT_DATE
             ORDER BY f.next_review ASC`,
            [userId]
        );

        // Build unified queue — interleave topics and cards for variety
        const queue = [];

        for (const t of topics) {
            queue.push({
                type: 'topic',
                id: t.id,
                front: t.name,
                back: `Categoria: ${t.category || 'Geral'} | Estágio: ${t.stage || 0}`,
                category: t.category || 'Geral',
                color: null,
                difficulty: t.difficulty,
                next_review: t.next_review
            });
        }

        for (const c of cards) {
            queue.push({
                type: 'flashcard',
                id: c.id,
                front: c.front,
                back: c.back,
                category: c.deck_name,
                color: c.deck_color,
                deck_id: c.deck_id,
                difficulty: c.difficulty,
                next_review: c.next_review
            });
        }

        // Interleave: shuffle maintaining some grouping variety
        for (let i = queue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [queue[i], queue[j]] = [queue[j], queue[i]];
        }

        res.json({
            total: queue.length,
            topics_count: topics.length,
            flashcards_count: cards.length,
            items: queue
        });
    } catch (err) {
        console.error('Unified review error:', err);
        res.status(500).json({ error: 'Erro ao carregar revisão unificada' });
    }
});

module.exports = router;
