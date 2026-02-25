const express = require('express');
const pool = require('../config/db');
const { ensureAuth } = require('../middleware/auth');
const router = express.Router();

// Log a completed pomodoro session
router.post('/', ensureAuth, async (req, res) => {
    const { focus_minutes } = req.body;
    if (!focus_minutes || focus_minutes < 1) {
        return res.status(400).json({ error: 'Tempo de foco inválido' });
    }
    try {
        const { rows } = await pool.query(
            'INSERT INTO pomodoro_sessions (user_id, focus_minutes) VALUES ($1, $2) RETURNING *',
            [req.user.id, focus_minutes]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get user stats
router.get('/stats', ensureAuth, async (req, res) => {
    try {
        const totalResult = await pool.query(
            'SELECT COALESCE(SUM(focus_minutes), 0) as total_minutes, COUNT(*) as total_sessions FROM pomodoro_sessions WHERE user_id = $1',
            [req.user.id]
        );

        const todayResult = await pool.query(
            `SELECT COALESCE(SUM(focus_minutes), 0) as today_minutes, COUNT(*) as today_sessions
       FROM pomodoro_sessions WHERE user_id = $1 AND completed_at::date = CURRENT_DATE`,
            [req.user.id]
        );

        // Calculate streak: consecutive days with at least 1 session
        const streakResult = await pool.query(
            `WITH dates AS (
         SELECT DISTINCT completed_at::date AS d FROM pomodoro_sessions WHERE user_id = $1
       ),
       numbered AS (
         SELECT d, d - (ROW_NUMBER() OVER (ORDER BY d))::int AS grp FROM dates
       )
       SELECT COUNT(*) as streak FROM numbered
       WHERE grp = (SELECT grp FROM numbered WHERE d = CURRENT_DATE LIMIT 1)`,
            [req.user.id]
        );

        res.json({
            total_minutes: parseInt(totalResult.rows[0].total_minutes),
            total_sessions: parseInt(totalResult.rows[0].total_sessions),
            today_minutes: parseInt(todayResult.rows[0].today_minutes),
            today_sessions: parseInt(todayResult.rows[0].today_sessions),
            streak_days: parseInt(streakResult.rows[0]?.streak || 0)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get recent sessions
router.get('/recent', ensureAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM pomodoro_sessions WHERE user_id = $1 ORDER BY completed_at DESC LIMIT 20',
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
