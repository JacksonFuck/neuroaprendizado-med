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

// Obter todos os usuários e métricas básicas
router.get('/metrics', requireAdmin, async (req, res) => {
    try {
        const usersCount = await pool.query('SELECT COUNT(*) FROM users');
        const activeUsers = await pool.query('SELECT COUNT(*) FROM users WHERE is_active = TRUE');
        const users = await pool.query('SELECT id, name, email, role, is_active, created_at, last_login FROM users ORDER BY created_at DESC LIMIT 50');
        const suggestions = await pool.query('SELECT * FROM suggestions ORDER BY created_at DESC LIMIT 20');
        const tokens = await pool.query('SELECT * FROM invitation_tokens ORDER BY created_at DESC LIMIT 20');

        res.json({
            totals: {
                users: parseInt(usersCount.rows[0].count),
                active: parseInt(activeUsers.rows[0].count)
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

// Gerar novo token de convite
router.post('/tokens', requireAdmin, async (req, res) => {
    const crypto = require('crypto');
    const token = crypto.randomBytes(8).toString('hex'); // 16 chars

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

// Atualizar status de sugestão
router.put('/suggestions/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // e.g. 'approved', 'rejected', 'done'

    try {
        await pool.query('UPDATE suggestions SET status = $1 WHERE id = $2', [status, id]);
        res.json({ success: true, message: 'Status da sugestão atualizado.' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar sugestão.' });
    }
});

module.exports = router;
