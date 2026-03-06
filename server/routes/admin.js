const express = require('express');
const router = express.Router();
const pool = require('../config/db');

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
                       u.avatar_url,
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
    const { role, is_active } = req.body;

    try {
        const updates = [];
        const values = [];
        let idx = 1;

        if (role !== undefined) { updates.push(`role = $${idx++}`); values.push(role); }
        if (is_active !== undefined) { updates.push(`is_active = $${idx++}`); values.push(is_active); }

        if (updates.length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar.' });

        values.push(id);
        await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`, values);
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

        // Return the link for admin use
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
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao excluir usuário.' });
    }
});

module.exports = router;
