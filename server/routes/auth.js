const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../config/db');
const router = express.Router();

// Helper para enviar email de ativação (simulado no console)
const sendActivationEmail = (email, activationToken) => {
    console.log(`\n\n[EMAIL MOCK] Para: ${email}`);
    console.log(`Assunto: Ative sua conta no Neuroaprendizado`);
    console.log(`Link: http://localhost:${process.env.PORT || 3000}/auth/activate/${activationToken}\n\n`);
};

// ==========================================
// Google OAuth Routes
// ==========================================
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login.html' }),
    async (req, res) => {
        // Automatically activate Google users and set LGPD if not set
        await pool.query('UPDATE users SET is_active = TRUE WHERE id = $1', [req.user.id]);
        res.redirect('/');
    }
);

// ==========================================
// Local Auth: Register & Login
// ==========================================
router.post('/register', async (req, res) => {
    const { name, email, password, invitation_token, accept_lgpd } = req.body;

    if (!name || !email || !password || !invitation_token || !accept_lgpd) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios, incluindo aceite LGPD e token de convite.' });
    }

    try {
        // Verify Invitation Token
        const { rows: tokenRows } = await pool.query('SELECT * FROM invitation_tokens WHERE token = $1 AND used = FALSE', [invitation_token]);
        if (tokenRows.length === 0) {
            return res.status(400).json({ error: 'Token de convite inválido ou já utilizado.' });
        }

        // Check if user already exists
        const { rows: existingUsers } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'E-mail já está em uso.' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        // Em um sistema real, o activation token seria salvo no banco ou seria um JWT.
        // Simulando com JWT.
        const jwt = require('jsonwebtoken');
        const activationToken = jwt.sign({ email }, process.env.SESSION_SECRET || 'dev-secret-change-me', { expiresIn: '1h' });

        await pool.query('BEGIN');

        // Mark token as used
        await pool.query('UPDATE invitation_tokens SET used = TRUE, used_by_email = $1 WHERE token = $2', [email, invitation_token]);

        // Insert user
        const { rows: newUser } = await pool.query(
            `INSERT INTO users (email, name, password_hash, accepted_lgpd_at, is_active)
             VALUES ($1, $2, $3, NOW(), FALSE) RETURNING *`,
            [email, name, password_hash]
        );

        await pool.query('COMMIT');

        sendActivationEmail(email, activationToken);

        res.json({ success: true, message: 'Cadastro realizado com sucesso. Verifique seu e-mail para ativar a conta.' });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Erro interno ao processar o cadastro.' });
    }
});

router.post('/login', async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = rows[0];

        if (!user || !user.password_hash) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        if (!user.is_active) {
            return res.status(403).json({ error: 'Conta não ativada. Verifique seu e-mail.' });
        }

        await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

        req.login(user, (err) => {
            if (err) return next(err);
            return res.json({ success: true, message: 'Login realizado com sucesso.' });
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Erro interno no login.' });
    }
});

router.get('/activate/:token', async (req, res) => {
    const { token } = req.params;
    const jwt = require('jsonwebtoken');

    try {
        const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'dev-secret-change-me');
        const { rows } = await pool.query('UPDATE users SET is_active = TRUE WHERE email = $1 AND is_active = FALSE RETURNING id', [decoded.email]);

        if (rows.length > 0) {
            return res.send('<h1>Conta ativada com sucesso!</h1><p>Você já pode fechar esta aba e voltar para fazer login.</p>');
        } else {
            return res.status(400).send('<h1>Conta já ativada ou erro no processo.</h1>');
        }
    } catch (err) {
        return res.status(400).send('<h1>Link de ativação inválido ou expirado.</h1>');
    }
});

// ==========================================
// LGPD & Session Management
// ==========================================
router.get('/me', (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    res.json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        avatar_url: req.user.avatar_url,
        role: req.user.role,
        is_active: req.user.is_active
    });
});

router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ error: 'Erro ao fazer logout' });
        req.session.destroy(() => {
            res.json({ success: true });
        });
    });
});

// Implementação LGPD - Direito ao esquecimento (Remover todos os dados do usuário)
router.delete('/lgpd-delete', async (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Não autenticado' });
    }

    const userId = req.user.id;

    try {
        // Cascade DELETE will remove diary_entries, spaced_topics, pomodoro_sessions, suggestions
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);

        req.logout((err) => {
            req.session.destroy(() => {
                res.json({ success: true, message: 'Todos os seus dados foram permanentemente excluídos conforme a LGPD.' });
            });
        });
    } catch (err) {
        console.error('LGPD Delete Error:', err);
        res.status(500).json({ error: 'Erro ao excluir dados permanentemente.' });
    }
});

module.exports = router;
