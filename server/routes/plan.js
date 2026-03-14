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
            expires_at: req.user.plan_expires_at
        });
    } catch (err) {
        console.error('Plan fetch error:', err);
        res.status(500).json({ error: 'Erro ao buscar plano.' });
    }
});

// POST /api/plan/upgrade — Placeholder for Stripe webhook
router.post('/upgrade', ensureAuth, async (req, res) => {
    res.json({ message: 'Integracao Stripe em breve. Entre em contato para acesso Pro.' });
});

module.exports = router;
