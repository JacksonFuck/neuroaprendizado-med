const express = require('express');
const pool = require('../config/db');
const { ensureAuth } = require('../middleware/auth');
const { grantXP, XP_VALUES, checkAndGrantAchievements } = require('../lib/xp-engine');
const router = express.Router();

// POST / — Save N-Back session + handle auto-progression
router.post('/', ensureAuth, async (req, res) => {
    const { n_level, total_rounds, pos_hits, pos_misses, pos_false_alarms, let_hits, let_misses, let_false_alarms, accuracy_pct } = req.body;
    try {
        // Save session
        const { rows: session } = await pool.query(
            `INSERT INTO nback_sessions (user_id, n_level, total_rounds, pos_hits, pos_misses, pos_false_alarms, let_hits, let_misses, let_false_alarms, accuracy_pct)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
            [req.user.id, n_level, total_rounds, pos_hits || 0, pos_misses || 0, pos_false_alarms || 0, let_hits || 0, let_misses || 0, let_false_alarms || 0, accuracy_pct || 0]
        );

        // Ensure progress row exists
        await pool.query(
            'INSERT INTO user_nback_progress (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
            [req.user.id]
        );

        // Update progress + auto-level
        let levelUp = false;
        let newLevel = n_level;

        if (accuracy_pct >= 80) {
            const { rows: prog } = await pool.query(
                `UPDATE user_nback_progress SET
                    consecutive_high_scores = consecutive_high_scores + 1,
                    total_sessions = total_sessions + 1,
                    updated_at = NOW()
                 WHERE user_id = $1 RETURNING *`,
                [req.user.id]
            );
            if (prog[0].consecutive_high_scores >= 3) {
                newLevel = n_level + 1;
                await pool.query(
                    `UPDATE user_nback_progress SET
                        current_level = $1,
                        max_unlocked_level = GREATEST(max_unlocked_level, $1),
                        consecutive_high_scores = 0
                     WHERE user_id = $2`,
                    [newLevel, req.user.id]
                );
                levelUp = true;
                await grantXP(pool, req.user.id, XP_VALUES.nback_level_up, 'nback_level_up', session[0].id);
            }
        } else {
            await pool.query(
                `UPDATE user_nback_progress SET
                    consecutive_high_scores = 0,
                    total_sessions = total_sessions + 1,
                    updated_at = NOW()
                 WHERE user_id = $1`,
                [req.user.id]
            );
        }

        // Grant session XP
        await grantXP(pool, req.user.id, XP_VALUES.nback_session, 'nback', session[0].id);
        const earned = await checkAndGrantAchievements(pool, req.user.id);

        res.status(201).json({ session: session[0], level_up: levelUp, new_level: newLevel, achievements_earned: earned });
    } catch (err) {
        console.error('NBack error:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /sessions — History (last 20)
router.get('/sessions', ensureAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM nback_sessions WHERE user_id = $1 ORDER BY completed_at DESC LIMIT 20',
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('NBack error:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /progress — Current level and stats
router.get('/progress', ensureAuth, async (req, res) => {
    try {
        await pool.query(
            'INSERT INTO user_nback_progress (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
            [req.user.id]
        );
        const { rows } = await pool.query(
            'SELECT * FROM user_nback_progress WHERE user_id = $1',
            [req.user.id]
        );
        res.json(rows[0]);
    } catch (err) {
        console.error('NBack error:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
