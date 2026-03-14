const express = require('express');
const pool = require('../config/db');
const { ensureAuth } = require('../middleware/auth');
const router = express.Router();

// GET /focus-weekly — last 12 weeks of focus minutes (bar chart)
router.get('/focus-weekly', ensureAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT
                DATE_TRUNC('week', completed_at)::date AS week_start,
                SUM(focus_minutes) AS total_minutes,
                COUNT(*) AS session_count
             FROM pomodoro_sessions
             WHERE user_id = $1 AND completed_at >= NOW() - INTERVAL '12 weeks'
             GROUP BY week_start
             ORDER BY week_start ASC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /retention — average retrievability per week (line chart)
router.get('/retention', ensureAuth, async (req, res) => {
    try {
        const { rows: topics } = await pool.query(
            'SELECT reviews FROM spaced_topics WHERE user_id = $1',
            [req.user.id]
        );

        // Aggregate retrievability by week from review history
        const weekMap = {};
        for (const topic of topics) {
            const reviews = topic.reviews || [];
            for (const rev of reviews) {
                if (!rev.date || rev.R === undefined) continue;
                const weekStart = getWeekStart(new Date(rev.date));
                const key = weekStart.toISOString().split('T')[0];
                if (!weekMap[key]) weekMap[key] = { sum: 0, count: 0 };
                weekMap[key].sum += rev.R;
                weekMap[key].count += 1;
            }
        }

        const result = Object.entries(weekMap)
            .map(([week, data]) => ({
                week,
                avg_retrievability: Math.round((data.sum / data.count) * 100)
            }))
            .sort((a, b) => a.week.localeCompare(b.week));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /nback-progression — N-Back level over time (line chart)
router.get('/nback-progression', ensureAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT completed_at::date AS date, n_level, accuracy_pct
             FROM nback_sessions
             WHERE user_id = $1
             ORDER BY completed_at ASC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /review-accuracy — rating distribution from reviews JSONB (doughnut)
router.get('/review-accuracy', ensureAuth, async (req, res) => {
    try {
        const { rows: topics } = await pool.query(
            'SELECT reviews FROM spaced_topics WHERE user_id = $1',
            [req.user.id]
        );

        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0 };
        const labels = { 1: 'Again', 2: 'Hard', 3: 'Good', 4: 'Easy' };

        for (const topic of topics) {
            const reviews = topic.reviews || [];
            for (const rev of reviews) {
                const r = rev.rating;
                if (r >= 1 && r <= 4) distribution[r]++;
            }
        }

        const result = Object.entries(distribution).map(([rating, count]) => ({
            rating: parseInt(rating),
            label: labels[rating],
            count
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /streak-heatmap — daily activity for last 365 days (heatmap grid)
router.get('/streak-heatmap', ensureAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT completed_at::date AS date, SUM(focus_minutes) AS minutes, COUNT(*) AS sessions
             FROM pomodoro_sessions
             WHERE user_id = $1 AND completed_at >= NOW() - INTERVAL '365 days'
             GROUP BY date
             ORDER BY date ASC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

module.exports = router;
