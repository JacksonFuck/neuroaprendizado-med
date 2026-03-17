/**
 * NeuroForge — Forje sinapses. Domine o conhecimento.
 * Copyright (c) 2026 Jackson Erasmo Fuck. All rights reserved.
 * INPI Registration: 512026001683-5
 * Licensed under proprietary license. See LICENSE file.
 */
const express = require('express');
const { ensureAuth } = require('../middleware/auth');
const { getUserPlan, getPlanLimits } = require('../middleware/plan-gate');
const pool = require('../config/db');
const router = express.Router();

// GET /api/plan — Get current user plan and limits
router.get('/', ensureAuth, async (req, res) => {
    try {
        const plan = getUserPlan(req.user);
        const limits = getPlanLimits(plan);

        const today = new Date().toISOString().split('T')[0];

        const [flashcardsToday, spacedCount, plannerCount] = await Promise.all([
            pool.query(
                'SELECT COUNT(*) as c FROM flashcards WHERE user_id = $1 AND created_at::date = $2',
                [req.user.id, today]
            ),
            pool.query(
                'SELECT COUNT(*) as c FROM spaced_topics WHERE user_id = $1',
                [req.user.id]
            ),
            pool.query(
                'SELECT COUNT(*) as c FROM study_subjects WHERE user_id = $1',
                [req.user.id]
            )
        ]);

        res.json({
            plan,
            limits,
            usage: {
                flashcards_today: parseInt(flashcardsToday.rows[0].c),
                spaced_topics: parseInt(spacedCount.rows[0].c),
                planner_subjects: parseInt(plannerCount.rows[0].c)
            },
            expires_at: req.user.plan_expires_at,
            has_stripe: !!req.user.stripe_customer_id
        });
    } catch (err) {
        console.error('Plan fetch error:', err);
        res.status(500).json({ error: 'Erro ao buscar plano.' });
    }
});

// POST /api/plan/upgrade — Redirect to Stripe checkout
router.post('/upgrade', ensureAuth, async (req, res) => {
    // Frontend should call /api/stripe/checkout directly for Stripe integration.
    // This endpoint kept for backwards compatibility.
    try {
        const response = await fetch(`${req.protocol}://${req.get('host')}/api/stripe/checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': req.headers.cookie
            }
        });
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao iniciar checkout.' });
    }
});

module.exports = router;
