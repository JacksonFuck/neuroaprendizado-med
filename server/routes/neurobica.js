/**
 * NeuroForge — Forje sinapses. Domine o conhecimento.
 * Copyright (c) 2026 Jackson Erasmo Fuck. All rights reserved.
 * INPI Registration: 512026001683-5
 * Licensed under proprietary license. See LICENSE file.
 */
const express = require('express');
const pool = require('../config/db');
const { ensureAuth } = require('../middleware/auth');
const { grantXP } = require('../lib/xp-engine');
const router = express.Router();

const NEUROBICA_XP = 15;
const cards = require('../../public/neurobica-cards.json');

const CATEGORY_BY_DAY = ['motor', 'linguistica', 'memoria', 'sensorial', 'atencao', 'social', 'random'];

function getCardsForCategory(categoryId) {
    if (categoryId === 'random') return cards.cards;
    return cards.cards.filter(c => c.cat === categoryId);
}

// GET /api/neurobica/daily
router.get('/daily', ensureAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        // Check if there's already a card assigned today
        const { rows: existing } = await pool.query(
            'SELECT card_id, completed FROM neurobica_daily WHERE user_id = $1 AND assigned_date = CURRENT_DATE',
            [userId]
        );

        if (existing.length > 0) {
            const card = cards.cards.find(c => c.id === existing[0].card_id) || null;
            const { rows: userRows } = await pool.query(
                'SELECT neurobica_streak FROM users WHERE id = $1',
                [userId]
            );
            return res.json({
                card,
                completed: existing[0].completed,
                streak: userRows[0]?.neurobica_streak || 0
            });
        }

        // Assign a new card based on day of week
        const dayOfWeek = new Date().getDay();
        const categoryId = CATEGORY_BY_DAY[dayOfWeek];

        // Get completed card IDs for this user
        const { rows: completedRows } = await pool.query(
            'SELECT DISTINCT card_id FROM neurobica_progress WHERE user_id = $1',
            [userId]
        );
        const completedIds = new Set(completedRows.map(r => r.card_id));

        // Pick from category, excluding completed
        let pool_cards = getCardsForCategory(categoryId).filter(c => !completedIds.has(c.id));

        // Fallback: if all in category done, pick from any uncompleted
        if (pool_cards.length === 0) {
            pool_cards = cards.cards.filter(c => !completedIds.has(c.id));
        }

        // If all 108 done, allow repeat from category
        if (pool_cards.length === 0) {
            pool_cards = getCardsForCategory(categoryId);
        }

        const selected = pool_cards[Math.floor(Math.random() * pool_cards.length)];

        await pool.query(
            'INSERT INTO neurobica_daily (user_id, card_id, assigned_date) VALUES ($1, $2, CURRENT_DATE) ON CONFLICT (user_id, assigned_date) DO NOTHING',
            [userId, selected.id]
        );

        const { rows: userRows } = await pool.query(
            'SELECT neurobica_streak FROM users WHERE id = $1',
            [userId]
        );

        res.json({
            card: selected,
            completed: false,
            streak: userRows[0]?.neurobica_streak || 0
        });
    } catch (err) {
        console.error('Neurobica daily error:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/neurobica/cards
router.get('/cards', ensureAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        const { rows: completedRows } = await pool.query(
            'SELECT DISTINCT card_id FROM neurobica_progress WHERE user_id = $1',
            [userId]
        );
        const completedIds = new Set(completedRows.map(r => r.card_id));

        const categories = cards.categories.map(cat => ({
            ...cat,
            cards: cards.cards
                .filter(c => c.cat === cat.id)
                .map(c => ({ ...c, completed: completedIds.has(c.id) }))
        }));

        res.json({
            categories,
            progress: {
                completed: completedIds.size,
                total: cards.totalCards
            }
        });
    } catch (err) {
        console.error('Neurobica cards error:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /api/neurobica/complete
router.post('/complete', ensureAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { cardId, rating, notes } = req.body;

        if (!cardId || typeof cardId !== 'number') {
            return res.status(400).json({ error: 'cardId obrigatorio (numero)' });
        }
        if (rating !== undefined && (rating < 1 || rating > 5)) {
            return res.status(400).json({ error: 'rating deve ser entre 1 e 5' });
        }

        // Verify card exists
        const card = cards.cards.find(c => c.id === cardId);
        if (!card) {
            return res.status(404).json({ error: 'Card nao encontrado' });
        }

        // Check if already completed today (avoid duplicates)
        const { rows: alreadyDone } = await pool.query(
            `SELECT id FROM neurobica_progress
             WHERE user_id = $1 AND card_id = $2 AND completed_at::date = CURRENT_DATE
             LIMIT 1`,
            [userId, cardId]
        );

        if (alreadyDone.length > 0) {
            // Update rating if re-submitting same day
            await pool.query(
                'UPDATE neurobica_progress SET rating = $1, notes = $2 WHERE id = $3',
                [rating || 3, notes || null, alreadyDone[0].id]
            );
        } else {
            await pool.query(
                `INSERT INTO neurobica_progress (user_id, card_id, rating, notes)
                 VALUES ($1, $2, $3, $4)`,
                [userId, cardId, rating || 3, notes || null]
            );
        }

        // Update neurobica_daily if it's today's card
        await pool.query(
            `UPDATE neurobica_daily SET completed = TRUE, completed_at = NOW()
             WHERE user_id = $1 AND assigned_date = CURRENT_DATE AND card_id = $2`,
            [userId, cardId]
        );

        // Grant XP via the existing engine
        await grantXP(pool, userId, NEUROBICA_XP, 'neurobica', cardId);

        // Calculate streak: check if user completed yesterday
        const { rows: yesterdayRows } = await pool.query(
            `SELECT 1 FROM neurobica_progress
             WHERE user_id = $1 AND completed_at::date = CURRENT_DATE - INTERVAL '1 day'
             LIMIT 1`,
            [userId]
        );

        let newStreak;
        if (yesterdayRows.length > 0) {
            // Completed yesterday — increment streak
            await pool.query(
                'UPDATE users SET neurobica_streak = neurobica_streak + 1 WHERE id = $1',
                [userId]
            );
            const { rows } = await pool.query('SELECT neurobica_streak FROM users WHERE id = $1', [userId]);
            newStreak = rows[0].neurobica_streak;
        } else {
            // No completion yesterday — reset to 1
            await pool.query(
                'UPDATE users SET neurobica_streak = 1 WHERE id = $1',
                [userId]
            );
            newStreak = 1;
        }

        // Update total completed
        await pool.query(
            'UPDATE users SET neurobica_total = neurobica_total + 1 WHERE id = $1',
            [userId]
        );

        const { rows: userRows } = await pool.query(
            'SELECT neurobica_total FROM users WHERE id = $1',
            [userId]
        );

        res.json({
            xpAwarded: NEUROBICA_XP,
            streak: newStreak,
            totalCompleted: userRows[0].neurobica_total
        });
    } catch (err) {
        console.error('Neurobica complete error:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/neurobica/stats
router.get('/stats', ensureAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        const { rows: userRows } = await pool.query(
            'SELECT neurobica_streak, neurobica_total FROM users WHERE id = $1',
            [userId]
        );

        // Count by category
        const { rows: byCategoryRows } = await pool.query(
            'SELECT card_id FROM neurobica_progress WHERE user_id = $1',
            [userId]
        );

        const byCategory = {};
        for (const cat of cards.categories) {
            byCategory[cat.id] = 0;
        }
        for (const row of byCategoryRows) {
            const card = cards.cards.find(c => c.id === row.card_id);
            if (card && byCategory[card.cat] !== undefined) {
                byCategory[card.cat]++;
            }
        }

        // Weekly progress (last 7 days)
        const { rows: weeklyRows } = await pool.query(
            `SELECT completed_at::date AS date, COUNT(*) AS count
             FROM neurobica_progress
             WHERE user_id = $1 AND completed_at >= CURRENT_DATE - INTERVAL '6 days'
             GROUP BY completed_at::date
             ORDER BY date`,
            [userId]
        );

        res.json({
            streak: userRows[0]?.neurobica_streak || 0,
            totalCompleted: userRows[0]?.neurobica_total || 0,
            byCategory,
            weeklyProgress: weeklyRows.map(r => ({ date: r.date, count: parseInt(r.count) }))
        });
    } catch (err) {
        console.error('Neurobica stats error:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
