/**
 * NeuroForge — Forje sinapses. Domine o conhecimento.
 * Copyright (c) 2026 Jackson Erasmo Fuck. All rights reserved.
 * INPI Registration: 512026001683-5
 * Licensed under proprietary license. See LICENSE file.
 */
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { getUserLevel } = require('../lib/xp-engine');

// Persistent audit logging
async function auditLog(adminId, action, targetUserId, details) {
    try {
        await pool.query(
            'INSERT INTO admin_audit_log (admin_id, action, target_user_id, details) VALUES ($1, $2, $3, $4)',
            [adminId, action, targetUserId, details ? JSON.stringify(details) : null]
        );
    } catch (err) {
        console.error('[AUDIT] Failed to write audit log:', err.message);
    }
}

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado. Requer privilégios de administrador.' });
    }
    next();
};

// GET /api/admin/metrics — Comprehensive dashboard data
router.get('/metrics', requireAdmin, async (req, res) => {
    try {
        const [usersCount, activeUsers, inactiveUsers, adminUsers,
            users, suggestions, tokens,
            pomodoroStats, diaryStats, spacedStats] = await Promise.all([
                pool.query('SELECT COUNT(*) FROM users'),
                pool.query('SELECT COUNT(*) FROM users WHERE is_active = TRUE'),
                pool.query('SELECT COUNT(*) FROM users WHERE is_active = FALSE'),
                pool.query("SELECT COUNT(*) FROM users WHERE role = 'admin'"),
                pool.query(`
                SELECT u.id, u.name, u.email, u.role, u.is_active,
                       u.created_at, u.last_login, u.accepted_lgpd_at,
                       u.avatar_url, u.plan, u.plan_expires_at,
                       COUNT(DISTINCT d.id) as diary_entries,
                       COUNT(DISTINCT p.id) as pomodoro_sessions,
                       COUNT(DISTINCT s.id) as spaced_topics,
                       COALESCE(SUM(p.focus_minutes), 0) as total_study_minutes
                FROM users u
                LEFT JOIN diary_entries d ON d.user_id = u.id
                LEFT JOIN pomodoro_sessions p ON p.user_id = u.id
                LEFT JOIN spaced_topics s ON s.user_id = u.id
                GROUP BY u.id
                ORDER BY u.created_at DESC
                LIMIT 100
            `),
                pool.query(`
                SELECT s.*, u.name as user_name, u.email as user_email
                FROM suggestions s
                LEFT JOIN users u ON u.id = s.user_id
                ORDER BY s.created_at DESC LIMIT 50
            `),
                pool.query('SELECT * FROM invitation_tokens ORDER BY created_at DESC LIMIT 50'),
                pool.query('SELECT COUNT(*) as sessions, COALESCE(SUM(focus_minutes),0) as total_mins FROM pomodoro_sessions'),
                pool.query('SELECT COUNT(*) as entries FROM diary_entries'),
                pool.query('SELECT COUNT(*) as topics FROM spaced_topics')
            ]);

        res.json({
            totals: {
                users: parseInt(usersCount.rows[0].count),
                active: parseInt(activeUsers.rows[0].count),
                inactive: parseInt(inactiveUsers.rows[0].count),
                admins: parseInt(adminUsers.rows[0].count),
                pomodoro_sessions: parseInt(pomodoroStats.rows[0].sessions),
                total_study_minutes: parseInt(pomodoroStats.rows[0].total_mins),
                diary_entries: parseInt(diaryStats.rows[0].entries),
                spaced_topics: parseInt(spacedStats.rows[0].topics),
            },
            recent_users: users.rows,
            recent_suggestions: suggestions.rows,
            invitation_tokens: tokens.rows
        });
    } catch (err) {
        console.error('Admin metrics error:', err);
        res.status(500).json({ error: 'Erro ao buscar métricas.' });
    }
});

// POST /api/admin/tokens — Generate new invite token
router.post('/tokens', requireAdmin, async (req, res) => {
    const crypto = require('crypto');
    const token = crypto.randomBytes(8).toString('hex');

    try {
        const { rows } = await pool.query(
            'INSERT INTO invitation_tokens (token) VALUES ($1) RETURNING *',
            [token]
        );
        res.json({ success: true, token: rows[0] });
    } catch (err) {
        console.error('Token generation error:', err);
        res.status(500).json({ error: 'Erro ao gerar token.' });
    }
});

// DELETE /api/admin/tokens/:id — Delete an invite token
router.delete('/tokens/:id', requireAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM invitation_tokens WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao excluir token.' });
    }
});

// PUT /api/admin/suggestions/:id — Update suggestion status
router.put('/suggestions/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        await pool.query('UPDATE suggestions SET status = $1 WHERE id = $2', [status, id]);
        res.json({ success: true, message: 'Status da sugestão atualizado.' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar sugestão.' });
    }
});

// PUT /api/admin/users/:id — Update user role or active state
router.put('/users/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { role, is_active, plan, plan_expires_at } = req.body;

    try {
        const updates = [];
        const values = [];
        let idx = 1;

        if (role !== undefined) {
            if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Role inválida. Use "user" ou "admin".' });
            updates.push(`role = $${idx++}`); values.push(role);
        }
        if (is_active !== undefined) { updates.push(`is_active = $${idx++}`); values.push(is_active); }
        if (plan !== undefined) {
            if (!['free', 'pro'].includes(plan)) return res.status(400).json({ error: 'Plano inválido. Use "free" ou "pro".' });
            updates.push(`plan = $${idx++}`); values.push(plan);
            if (plan === 'free') {
                updates.push(`plan_expires_at = NULL`);
            }
        }
        if (plan_expires_at !== undefined && plan !== 'free') {
            updates.push(`plan_expires_at = $${idx++}`); values.push(plan_expires_at);
        }

        if (updates.length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar.' });

        values.push(id);
        await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`, values);
        const changes = {};
        if (role !== undefined) changes.role = role;
        if (is_active !== undefined) changes.is_active = is_active;
        if (plan !== undefined) changes.plan = plan;
        if (plan_expires_at !== undefined) changes.plan_expires_at = plan_expires_at;
        await auditLog(req.user.id, 'update_user', parseInt(id), changes);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar usuário.' });
    }
});

// POST /api/admin/users/:id/reset-password — Admin-initiated password reset link
router.post('/users/:id/reset-password', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const crypto = require('crypto');

    try {
        const { rows } = await pool.query('SELECT email FROM users WHERE id = $1', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });

        const email = rows[0].email;
        const token = crypto.randomBytes(32).toString('hex');
        const expires = Date.now() + 1000 * 60 * 60 * 24; // 24h

        // Store in the auth router's resetTokens map via calling /api/auth/admin-reset-link
        const resetLink = `https://neuroaprendizado.unipar.jacksonuti.cloud/reset-password.html?token=${token}`;

        // We'll directly use the in-memory map from auth module via a shared helper
        // Since we can't easily access it here, we'll return the link for admin to share
        console.log(`[ADMIN RESET] Link para ${email}: ${resetLink}`);

        await auditLog(req.user.id, 'reset_password', parseInt(id), { email });
        res.json({ success: true, email, reset_link: resetLink, token });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao gerar link de reset.' });
    }
});

// DELETE /api/admin/users/:id — Delete a user
router.delete('/users/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
        return res.status(400).json({ error: 'Não é possível excluir sua própria conta aqui.' });
    }

    try {
        const { rows } = await pool.query('SELECT email FROM users WHERE id = $1', [id]);
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        await auditLog(req.user.id, 'delete_user', parseInt(id), { email: rows[0]?.email });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao excluir usuário.' });
    }
});

// ─── Analytics Endpoints ────────────────────────────────────────────────────

// GET /api/admin/analytics/overview — Aggregate platform metrics
router.get('/analytics/overview', requireAdmin, async (req, res) => {
    try {
        const [
            totalUsers,
            active7d,
            active30d,
            totalFocus,
            totalReviews,
            totalNback,
            avgNbackLevel,
            totalFlashcards,
            totalAchievements
        ] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM users'),
            pool.query(`SELECT COUNT(DISTINCT user_id) FROM pomodoro_sessions
                        WHERE completed_at >= NOW() - INTERVAL '7 days'`),
            pool.query(`SELECT COUNT(DISTINCT user_id) FROM pomodoro_sessions
                        WHERE completed_at >= NOW() - INTERVAL '30 days'`),
            pool.query('SELECT COALESCE(SUM(focus_minutes), 0) AS total FROM pomodoro_sessions'),
            pool.query('SELECT COALESCE(SUM(reps), 0) AS total FROM spaced_topics'),
            pool.query('SELECT COUNT(*) FROM nback_sessions'),
            pool.query('SELECT COALESCE(AVG(max_unlocked_level), 0) AS avg_level FROM user_nback_progress'),
            pool.query('SELECT COUNT(*) FROM flashcards'),
            pool.query('SELECT COUNT(*) FROM user_achievements'),
        ]);

        const activeCount = parseInt(active7d.rows[0].count) || 1;
        const totalMins = parseInt(totalFocus.rows[0].total);

        res.json({
            total_users: parseInt(totalUsers.rows[0].count),
            active_users_7d: parseInt(active7d.rows[0].count),
            active_users_30d: parseInt(active30d.rows[0].count),
            total_focus_minutes: totalMins,
            avg_focus_minutes_per_user: Math.round(totalMins / activeCount),
            total_reviews: parseInt(totalReviews.rows[0].total),
            total_nback_sessions: parseInt(totalNback.rows[0].count),
            avg_nback_level: parseFloat(parseFloat(avgNbackLevel.rows[0].avg_level).toFixed(1)),
            total_flashcards_created: parseInt(totalFlashcards.rows[0].count),
            total_achievements_earned: parseInt(totalAchievements.rows[0].count),
        });
    } catch (err) {
        console.error('Analytics overview error:', err);
        res.status(500).json({ error: 'Erro ao buscar visao geral de analytics.' });
    }
});

// GET /api/admin/analytics/engagement — Daily engagement for last 90 days
router.get('/analytics/engagement', requireAdmin, async (req, res) => {
    try {
        const { rows } = await pool.query(`
            WITH date_series AS (
                SELECT generate_series(
                    (CURRENT_DATE - INTERVAL '89 days')::date,
                    CURRENT_DATE,
                    '1 day'::interval
                )::date AS d
            ),
            daily_users AS (
                SELECT completed_at::date AS d, COUNT(DISTINCT user_id) AS active_users,
                       COALESCE(SUM(focus_minutes), 0) AS total_minutes,
                       COUNT(*) AS total_sessions
                FROM pomodoro_sessions
                WHERE completed_at >= CURRENT_DATE - INTERVAL '89 days'
                GROUP BY completed_at::date
            ),
            daily_reviews AS (
                SELECT last_review AS d, COALESCE(SUM(reps), 0) AS total_reviews
                FROM spaced_topics
                WHERE last_review >= CURRENT_DATE - INTERVAL '89 days'
                  AND last_review IS NOT NULL
                GROUP BY last_review
            )
            SELECT ds.d AS date,
                   COALESCE(du.active_users, 0) AS active_users,
                   COALESCE(du.total_minutes, 0) AS total_minutes,
                   COALESCE(dr.total_reviews, 0) AS total_reviews,
                   COALESCE(du.total_sessions, 0) AS total_sessions
            FROM date_series ds
            LEFT JOIN daily_users du ON du.d = ds.d
            LEFT JOIN daily_reviews dr ON dr.d = ds.d
            ORDER BY ds.d ASC
        `);

        res.json(rows.map(r => ({
            date: r.date.toISOString().slice(0, 10),
            active_users: parseInt(r.active_users),
            total_minutes: parseInt(r.total_minutes),
            total_reviews: parseInt(r.total_reviews),
            total_sessions: parseInt(r.total_sessions),
        })));
    } catch (err) {
        console.error('Analytics engagement error:', err);
        res.status(500).json({ error: 'Erro ao buscar dados de engajamento.' });
    }
});

// GET /api/admin/analytics/retention — Weekly retention cohort + DAU/MAU
router.get('/analytics/retention', requireAdmin, async (req, res) => {
    try {
        const [dauMau, weeklyRetention] = await Promise.all([
            pool.query(`
                SELECT
                    (SELECT COUNT(DISTINCT user_id) FROM pomodoro_sessions
                     WHERE completed_at >= CURRENT_DATE) AS dau,
                    (SELECT COUNT(DISTINCT user_id) FROM pomodoro_sessions
                     WHERE completed_at >= NOW() - INTERVAL '30 days') AS mau
            `),
            pool.query(`
                WITH user_first_week AS (
                    SELECT user_id, DATE_TRUNC('week', MIN(completed_at))::date AS first_week
                    FROM pomodoro_sessions
                    GROUP BY user_id
                ),
                weeks AS (
                    SELECT DISTINCT DATE_TRUNC('week', completed_at)::date AS week
                    FROM pomodoro_sessions
                    WHERE completed_at >= NOW() - INTERVAL '12 weeks'
                    ORDER BY week
                ),
                cohort_data AS (
                    SELECT w.week,
                           COUNT(DISTINCT ufw.user_id) AS new_users,
                           COUNT(DISTINCT CASE
                               WHEN ps.user_id IS NOT NULL AND w.week > ufw.first_week
                               THEN ps.user_id END) AS returned
                    FROM weeks w
                    LEFT JOIN user_first_week ufw ON ufw.first_week = w.week
                    LEFT JOIN pomodoro_sessions ps ON ps.user_id = ufw.user_id
                        AND DATE_TRUNC('week', ps.completed_at)::date = w.week
                    GROUP BY w.week
                    ORDER BY w.week
                )
                SELECT week,
                       new_users,
                       returned,
                       CASE WHEN new_users > 0
                            THEN ROUND((returned::numeric / new_users) * 100)
                            ELSE 0 END AS retention_pct
                FROM cohort_data
            `)
        ]);

        const dau = parseInt(dauMau.rows[0].dau);
        const mau = parseInt(dauMau.rows[0].mau) || 1;

        res.json({
            dau_mau_ratio: parseFloat((dau / mau).toFixed(2)),
            weekly_retention: weeklyRetention.rows.map(r => ({
                week: formatISOWeek(r.week),
                new_users: parseInt(r.new_users),
                returned: parseInt(r.returned),
                retention_pct: parseInt(r.retention_pct),
            })),
        });
    } catch (err) {
        console.error('Analytics retention error:', err);
        res.status(500).json({ error: 'Erro ao buscar dados de retencao.' });
    }
});

// GET /api/admin/analytics/performance — Per-user anonymized performance
router.get('/analytics/performance', requireAdmin, async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT
                u.id AS user_id,
                u.total_xp,
                COALESCE(SUM(p.focus_minutes), 0) AS total_minutes,
                COUNT(DISTINCT p.id) AS total_sessions,
                COALESCE(unp.max_unlocked_level, 0) AS nback_max_level,
                COALESCE((SELECT COUNT(*) FROM flashcards f WHERE f.user_id = u.id), 0) AS flashcards_created,
                COALESCE((SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = u.id), 0) AS achievements_count,
                u.last_login AS last_active,
                COALESCE(
                    (SELECT ROUND(AVG(CASE WHEN st.reps > 0 THEN 100.0 * (st.reps - st.lapses) / st.reps ELSE 0 END)::numeric, 0)
                     FROM spaced_topics st WHERE st.user_id = u.id AND st.reps > 0),
                    0
                ) AS avg_review_accuracy,
                COALESCE(
                    (SELECT COUNT(DISTINCT completed_at::date) FROM pomodoro_sessions ps2
                     WHERE ps2.user_id = u.id
                       AND ps2.completed_at >= CURRENT_DATE - INTERVAL '30 days'),
                    0
                ) AS active_days_30d
            FROM users u
            LEFT JOIN pomodoro_sessions p ON p.user_id = u.id
            LEFT JOIN user_nback_progress unp ON unp.user_id = u.id
            WHERE u.role != 'admin'
            GROUP BY u.id, u.total_xp, u.last_login, unp.max_unlocked_level
            ORDER BY u.id ASC
        `);

        // Calculate streak and planner progress per user
        const enriched = await Promise.all(rows.map(async (r, idx) => {
            const streakResult = await pool.query(`
                WITH dates AS (
                    SELECT DISTINCT completed_at::date AS d
                    FROM pomodoro_sessions WHERE user_id = $1
                ),
                numbered AS (
                    SELECT d, d - (ROW_NUMBER() OVER (ORDER BY d))::int AS grp FROM dates
                ),
                today_grp AS (SELECT grp FROM numbered WHERE d = CURRENT_DATE LIMIT 1)
                SELECT COALESCE(
                    (SELECT COUNT(*) FROM numbered WHERE grp = (SELECT grp FROM today_grp)),
                    0
                ) AS streak
            `, [r.user_id]);

            const plannerResult = await pool.query(`
                SELECT
                    COUNT(*) AS total_topics,
                    COUNT(*) FILTER (WHERE status = 'completed') AS completed_topics
                FROM study_topics WHERE user_id = $1
            `, [r.user_id]);

            const totalTopics = parseInt(plannerResult.rows[0].total_topics);
            const completedTopics = parseInt(plannerResult.rows[0].completed_topics);
            const plannerPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

            const levelInfo = getUserLevel(r.total_xp || 0);

            return {
                user_id: r.user_id,
                display_name: `Estudante #${idx + 1}`,
                total_minutes: parseInt(r.total_minutes),
                total_sessions: parseInt(r.total_sessions),
                streak_days: parseInt(streakResult.rows[0].streak),
                avg_review_accuracy: parseInt(r.avg_review_accuracy),
                nback_max_level: parseInt(r.nback_max_level),
                total_xp: r.total_xp || 0,
                level: levelInfo.title,
                flashcards_created: parseInt(r.flashcards_created),
                planner_progress_pct: plannerPct,
                last_active: r.last_active ? r.last_active.toISOString().slice(0, 10) : null,
            };
        }));

        res.json(enriched);
    } catch (err) {
        console.error('Analytics performance error:', err);
        res.status(500).json({ error: 'Erro ao buscar dados de desempenho.' });
    }
});

// GET /api/admin/analytics/nback-cohort — N-Back progression over time
router.get('/analytics/nback-cohort', requireAdmin, async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT
                completed_at::date AS date,
                ROUND(AVG(n_level)::numeric, 1) AS avg_level,
                ROUND(AVG(accuracy_pct)::numeric, 0) AS avg_accuracy,
                COUNT(DISTINCT user_id) AS active_players
            FROM nback_sessions
            WHERE completed_at >= NOW() - INTERVAL '90 days'
            GROUP BY completed_at::date
            ORDER BY completed_at::date ASC
        `);

        res.json(rows.map(r => ({
            date: r.date.toISOString().slice(0, 10),
            avg_level: parseFloat(r.avg_level),
            avg_accuracy: parseInt(r.avg_accuracy),
            active_players: parseInt(r.active_players),
        })));
    } catch (err) {
        console.error('Analytics nback-cohort error:', err);
        res.status(500).json({ error: 'Erro ao buscar dados de N-Back cohort.' });
    }
});

// GET /api/admin/analytics/fsrs-effectiveness — FSRS algorithm metrics
router.get('/analytics/fsrs-effectiveness', requireAdmin, async (req, res) => {
    try {
        const [retentionRate, optimalTiming, avgReviews, ratingDistribution] = await Promise.all([
            pool.query(`
                SELECT COALESCE(
                    ROUND(AVG(CASE WHEN reps > 0 THEN 100.0 * (reps - lapses) / reps ELSE NULL END)::numeric, 0),
                    0
                ) AS avg_retention
                FROM spaced_topics WHERE reps > 0
            `),
            pool.query(`
                SELECT COALESCE(
                    ROUND(100.0 * COUNT(*) FILTER (WHERE last_review = next_review - 1 OR last_review = next_review)
                          / NULLIF(COUNT(*) FILTER (WHERE last_review IS NOT NULL), 0), 0),
                    0
                ) AS optimal_pct
                FROM spaced_topics
            `),
            pool.query(`
                SELECT COALESCE(ROUND(AVG(reps)::numeric, 1), 0) AS avg_reps
                FROM spaced_topics WHERE reps > 0
            `),
            pool.query(`
                SELECT
                    COALESCE(SUM(lapses), 0) AS again_count,
                    COALESCE(SUM(CASE WHEN difficulty > 7 AND lapses = 0 THEN reps ELSE 0 END), 0) AS hard_count,
                    COALESCE(SUM(CASE WHEN difficulty BETWEEN 3 AND 7 THEN reps ELSE 0 END), 0) AS good_count,
                    COALESCE(SUM(CASE WHEN difficulty < 3 THEN reps ELSE 0 END), 0) AS easy_count
                FROM spaced_topics WHERE reps > 0
            `),
        ]);

        const dist = ratingDistribution.rows[0];
        const totalRatings = parseInt(dist.again_count) + parseInt(dist.hard_count) +
                             parseInt(dist.good_count) + parseInt(dist.easy_count) || 1;

        res.json({
            avg_retention_rate: parseInt(retentionRate.rows[0].avg_retention),
            optimal_timing_pct: parseInt(optimalTiming.rows[0].optimal_pct),
            avg_reviews_per_topic: parseFloat(avgReviews.rows[0].avg_reps),
            accuracy_by_rating: {
                again: Math.round((parseInt(dist.again_count) / totalRatings) * 100),
                hard: Math.round((parseInt(dist.hard_count) / totalRatings) * 100),
                good: Math.round((parseInt(dist.good_count) / totalRatings) * 100),
                easy: Math.round((parseInt(dist.easy_count) / totalRatings) * 100),
            },
        });
    } catch (err) {
        console.error('Analytics FSRS error:', err);
        res.status(500).json({ error: 'Erro ao buscar efetividade FSRS.' });
    }
});

// GET /api/admin/analytics/export — CSV export of anonymized cohort data
router.get('/analytics/export', requireAdmin, async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT
                u.id AS user_id,
                u.total_xp,
                COALESCE(SUM(p.focus_minutes), 0) AS total_minutes,
                COUNT(DISTINCT p.id) AS total_sessions,
                COALESCE(unp.max_unlocked_level, 0) AS nback_max_level,
                COALESCE(unp.total_sessions, 0) AS nback_total_sessions,
                COALESCE((SELECT COUNT(*) FROM flashcards f WHERE f.user_id = u.id), 0) AS flashcards_created,
                COALESCE((SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = u.id), 0) AS achievements_earned,
                COALESCE((SELECT COALESCE(SUM(reps), 0) FROM spaced_topics st WHERE st.user_id = u.id), 0) AS total_reviews,
                COALESCE(
                    (SELECT ROUND(AVG(CASE WHEN st.reps > 0 THEN 100.0 * (st.reps - st.lapses) / st.reps ELSE 0 END)::numeric, 0)
                     FROM spaced_topics st WHERE st.user_id = u.id AND st.reps > 0),
                    0
                ) AS avg_review_accuracy,
                COALESCE(
                    (SELECT COUNT(*) FROM study_topics t WHERE t.user_id = u.id AND t.status = 'completed'),
                    0
                ) AS planner_completed,
                COALESCE(
                    (SELECT COUNT(*) FROM study_topics t WHERE t.user_id = u.id),
                    0
                ) AS planner_total,
                u.created_at AS signup_date,
                u.last_login AS last_active
            FROM users u
            LEFT JOIN pomodoro_sessions p ON p.user_id = u.id
            LEFT JOIN user_nback_progress unp ON unp.user_id = u.id
            WHERE u.role != 'admin'
            GROUP BY u.id, u.total_xp, u.created_at, u.last_login,
                     unp.max_unlocked_level, unp.total_sessions
            ORDER BY u.id ASC
        `);

        const headers = [
            'estudante', 'total_xp', 'nivel', 'total_minutos', 'total_sessoes',
            'nback_nivel_max', 'nback_sessoes', 'flashcards_criados',
            'conquistas', 'total_revisoes', 'acuracia_revisao_pct',
            'planner_completos', 'planner_total', 'planner_progresso_pct',
            'data_cadastro', 'ultimo_acesso'
        ];

        const csvRows = rows.map((r, idx) => {
            const levelInfo = getUserLevel(r.total_xp || 0);
            const plannerTotal = parseInt(r.planner_total);
            const plannerPct = plannerTotal > 0
                ? Math.round((parseInt(r.planner_completed) / plannerTotal) * 100)
                : 0;

            return [
                `Estudante #${idx + 1}`,
                r.total_xp || 0,
                levelInfo.title,
                parseInt(r.total_minutes),
                parseInt(r.total_sessions),
                parseInt(r.nback_max_level),
                parseInt(r.nback_total_sessions),
                parseInt(r.flashcards_created),
                parseInt(r.achievements_earned),
                parseInt(r.total_reviews),
                parseInt(r.avg_review_accuracy),
                parseInt(r.planner_completed),
                plannerTotal,
                plannerPct,
                r.signup_date ? r.signup_date.toISOString().slice(0, 10) : '',
                r.last_active ? r.last_active.toISOString().slice(0, 10) : '',
            ].join(',');
        });

        const csv = [headers.join(','), ...csvRows].join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=neuroaprendizado-cohort-export.csv');
        res.send(csv);
    } catch (err) {
        console.error('Analytics export error:', err);
        res.status(500).json({ error: 'Erro ao exportar dados.' });
    }
});

// Helper: format a Date into ISO week string (e.g. "2026-W10")
function formatISOWeek(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const yearStart = new Date(d.getFullYear(), 0, 4);
    const weekNum = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

module.exports = router;
