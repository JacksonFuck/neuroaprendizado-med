const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { sendSystemMessage } = require('./messages');
const router = express.Router();

// POST /api/register-free — Public free account creation (no invitation token)
router.post('/', async (req, res) => {
    const { name, email, password, accept_lgpd } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nome, email e senha sao obrigatorios.' });
    }
    if (!accept_lgpd) {
        return res.status(400).json({ error: 'Aceite da politica de privacidade e obrigatorio.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Senha deve ter no minimo 6 caracteres.' });
    }

    try {
        const { rows: existing } = await pool.query(
            'SELECT id FROM users WHERE email = $1', [email]
        );
        if (existing.length > 0) {
            return res.status(400).json({ error: 'E-mail ja cadastrado. Faca login.' });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const { rows } = await pool.query(
            `INSERT INTO users (email, name, password_hash, accepted_lgpd_at, is_active, plan)
             VALUES ($1, $2, $3, NOW(), TRUE, 'free') RETURNING id, name, email`,
            [email, name, password_hash]
        );

        // Send welcome message (non-blocking)
        try {
            await sendSystemMessage(pool, rows[0].id, 'welcome',
                'Bem-vindo ao NeuroForge!',
                'Sua conta gratuita esta ativa! Voce tem acesso ao Pomodoro, Ancoragem Visual e 3 flashcards por dia. Para desbloquear todas as 9 ferramentas, flashcards ilimitados, graficos e ranking, conheca o plano Pro.');
        } catch (_e) { /* non-blocking */ }

        // Auto-login the user
        req.login(rows[0], (err) => {
            if (err) {
                return res.json({ success: true, message: 'Conta criada! Faca login para acessar.' });
            }
            res.json({ success: true, message: 'Conta criada com sucesso!', redirect: '/index.html' });
        });
    } catch (err) {
        console.error('Free register error:', err);
        res.status(500).json({ error: 'Erro interno. Tente novamente.' });
    }
});

module.exports = router;
