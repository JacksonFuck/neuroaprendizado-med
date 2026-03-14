const express = require('express');
const pool = require('../config/db');
const { ensureAuth } = require('../middleware/auth');
const { getUserLevel } = require('../lib/xp-engine');
const router = express.Router();

// GET /xp — total XP, level info, recent transactions
router.get('/xp', ensureAuth, async (req, res) => {
    try {
        const { rows: userRows } = await pool.query(
            'SELECT COALESCE(total_xp, 0) AS total_xp FROM users WHERE id = $1',
            [req.user.id]
        );
        const totalXp = parseInt(userRows[0].total_xp);
        const level = getUserLevel(totalXp);

        const { rows: recent } = await pool.query(
            'SELECT * FROM xp_log WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
            [req.user.id]
        );

        res.json({ total_xp: totalXp, level, recent_xp: recent });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /achievements — all achievements with earned status
router.get('/achievements', ensureAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT a.*, ua.earned_at
             FROM achievements a
             LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = $1
             ORDER BY a.category, a.id`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /rankings — leaderboard (anonymized)
router.get('/rankings', ensureAuth, async (req, res) => {
    const period = req.query.period || 'alltime';
    const metric = req.query.metric || 'xp';

    try {
        let query;
        let params = [];

        if (metric === 'xp') {
            if (period === 'weekly') {
                query = `
                    SELECT u.id, u.display_name, COALESCE(SUM(xl.amount), 0) AS value
                    FROM users u
                    LEFT JOIN xp_log xl ON xl.user_id = u.id AND xl.created_at >= NOW() - INTERVAL '7 days'
                    GROUP BY u.id
                    HAVING COALESCE(SUM(xl.amount), 0) > 0
                    ORDER BY value DESC
                    LIMIT 50`;
            } else {
                query = `
                    SELECT id, display_name, COALESCE(total_xp, 0) AS value
                    FROM users
                    WHERE COALESCE(total_xp, 0) > 0
                    ORDER BY value DESC
                    LIMIT 50`;
            }
        } else if (metric === 'minutes') {
            const dateFilter = period === 'weekly' ? "AND ps.completed_at >= NOW() - INTERVAL '7 days'" : '';
            query = `
                SELECT u.id, u.display_name, COALESCE(SUM(ps.focus_minutes), 0) AS value
                FROM users u
                LEFT JOIN pomodoro_sessions ps ON ps.user_id = u.id ${dateFilter}
                GROUP BY u.id
                HAVING COALESCE(SUM(ps.focus_minutes), 0) > 0
                ORDER BY value DESC
                LIMIT 50`;
        } else if (metric === 'streak') {
            query = `
                WITH user_streaks AS (
                    SELECT u.id, u.display_name,
                        COALESCE((
                            WITH dates AS (
                                SELECT DISTINCT completed_at::date AS d FROM pomodoro_sessions WHERE user_id = u.id
                            ),
                            numbered AS (
                                SELECT d, d - (ROW_NUMBER() OVER (ORDER BY d))::int AS grp FROM dates
                            ),
                            today_grp AS (
                                SELECT grp FROM numbered WHERE d = CURRENT_DATE LIMIT 1
                            )
                            SELECT COUNT(*) FROM numbered WHERE grp = (SELECT grp FROM today_grp)
                        ), 0) AS value
                    FROM users u
                )
                SELECT id, display_name, value
                FROM user_streaks
                WHERE value > 0
                ORDER BY value DESC
                LIMIT 50`;
        } else {
            return res.status(400).json({ error: 'Metrica invalida. Use: xp, minutes, streak' });
        }

        const { rows } = await pool.query(query, params);

        // Anonymize: show real name only for requesting user
        const anonymized = rows.map((row, idx) => ({
            rank: idx + 1,
            name: row.id === req.user.id
                ? (row.display_name || req.user.name || 'Voce')
                : `Estudante #${row.id % 1000}`,
            value: parseInt(row.value),
            is_you: row.id === req.user.id
        }));

        // If user not in top 50, find their position
        let userPosition = anonymized.find(r => r.is_you);
        if (!userPosition) {
            const userInRanking = rows.length > 0;
            if (!userInRanking) {
                userPosition = { rank: null, name: req.user.name || 'Voce', value: 0, is_you: true };
            }
        }

        res.json({ rankings: anonymized, your_position: userPosition || null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
