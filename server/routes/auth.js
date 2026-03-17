/**
 * NeuroForge — Forje sinapses. Domine o conhecimento.
 * Copyright (c) 2026 Jackson Erasmo Fuck. All rights reserved.
 * INPI Registration: 512026001683-5
 * Licensed under proprietary license. See LICENSE file.
 */
const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const pool = require('../config/db');
const router = express.Router();

// In-memory store for password reset tokens (for simplicity; in production use DB table)
const resetTokens = new Map();

// ==========================================
// Email Transporter (SMTP via nodemailer)
// ==========================================
const createTransporter = () => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT || '587', 10),
        secure: parseInt(SMTP_PORT || '587', 10) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
};

// Helper para enviar email de ativação
const sendActivationEmail = async (email, activationToken) => {
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3005}`;
    const activationLink = `${baseUrl}/auth/activate/${activationToken}`;

    const transporter = createTransporter();

    if (!transporter) {
        // SMTP não configurado — log de fallback para que admin possa ativar manualmente
        console.warn('\n⚠️  [EMAIL] SMTP não configurado. Link de ativação (use para ativar manualmente):');
        console.warn(`📧  Para: ${email}`);
        console.warn(`🔗  Link: ${activationLink}\n`);
        return;
    }

    const fromName = process.env.SMTP_FROM_NAME || 'Neuroaprendizado Med';
    const fromEmail = process.env.SMTP_USER;

    await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: email,
        subject: 'Ative sua conta no Neuroaprendizado Med',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
                <h2 style="color: #6d28d9;">🧠 Bem-vindo ao Neuroaprendizado Med!</h2>
                <p>Seu cadastro foi realizado com sucesso. Para ativar sua conta, clique no botão abaixo:</p>
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${activationLink}"
                       style="background: #6d28d9; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold;">
                        ✅ Ativar Minha Conta
                    </a>
                </div>
                <p style="color: #6b7280; font-size: 14px;">
                    Este link expira em <strong>1 hora</strong>. Se você não criou esta conta, ignore este email.
                </p>
                <p style="color: #6b7280; font-size: 12px;">Ou copie e cole este link no navegador:<br/>${activationLink}</p>
            </div>
        `,
        text: `Bem-vindo ao Neuroaprendizado Med!\n\nPara ativar sua conta, acesse:\n${activationLink}\n\nEste link expira em 1 hora.`,
    });

    console.log(`[EMAIL] ✅ Email de ativação enviado para: ${email}`);
};

// ==========================================
// Google OAuth Routes
// ==========================================
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    async (req, res) => {
        // Automatically activate Google users and set LGPD if not set
        await pool.query('UPDATE users SET is_active = TRUE WHERE id = $1', [req.user.id]);
        res.redirect('/app');
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

        await sendActivationEmail(email, activationToken);

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
        is_active: req.user.is_active,
        plan: req.user.plan || 'free',
        plan_expires_at: req.user.plan_expires_at || null
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

// ==========================================
// Password Reset
// ==========================================
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'E-mail é obrigatório.' });

    try {
        const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        // Always return success to avoid email enumeration
        if (rows.length === 0) {
            return res.json({ success: true, message: 'Se o e-mail estiver cadastrado, você receberá as instruções.' });
        }
        const token = crypto.randomBytes(32).toString('hex');
        const expires = Date.now() + 1000 * 60 * 60; // 1 hour
        resetTokens.set(token, { email, expires });

        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3005}`;
        const resetLink = `${baseUrl}/reset-password.html?token=${token}`;

        console.log(`[RESET PASSWORD] Link para ${email}: ${resetLink}`);

        const transporter = createTransporter();
        if (transporter) {
            const fromName = process.env.SMTP_FROM_NAME || 'Neuroaprendizado Med';
            const fromEmail = process.env.SMTP_USER;
            try {
                await transporter.sendMail({
                    from: `"${fromName}" <${fromEmail}>`,
                    to: email,
                    subject: 'Redefinição de Senha - Neuroaprendizado Med',
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
                            <h2 style="color: #6d28d9;">🧠 Redefinição de Senha</h2>
                            <p>Você solicitou a redefinição de sua senha. Clique no botão abaixo para criar uma nova senha:</p>
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${resetLink}"
                                   style="background: #6d28d9; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold;">
                                    🔑 Redefinir Senha
                                </a>
                            </div>
                            <p style="color: #6b7280; font-size: 14px;">
                                Este link expira em <strong>1 hora</strong>. Se você não solicitou, ignore este email.
                            </p>
                            <p style="color: #6b7280; font-size: 12px;">Ou copie e cole este link:<br/>${resetLink}</p>
                        </div>
                    `,
                    text: `Você solicitou a redefinição de sua senha.\n\nAcesse:\n${resetLink}\n\nEste link expira em 1 hora.`
                });
                console.log(`[EMAIL] ✅ Email de redefinição enviado para: ${email}`);
            } catch (err) {
                console.error('[EMAIL ERROR] Erro ao enviar redefinição:', err.message);
            }
        }

        // Never return reset_link to client — it is sent via email only
        res.json({
            success: true,
            message: 'Se o e-mail estiver cadastrado, voce recebera as instrucoes.'
        });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });
    if (password.length < 8) return res.status(400).json({ error: 'A senha deve ter no minimo 8 caracteres.' });

    const record = resetTokens.get(token);
    if (!record || Date.now() > record.expires) {
        resetTokens.delete(token);
        return res.status(400).json({ error: 'Link expirado ou inválido. Solicite um novo link.' });
    }

    try {
        const password_hash = await bcrypt.hash(password, 10);
        await pool.query('UPDATE users SET password_hash = $1, is_active = TRUE WHERE email = $2', [password_hash, record.email]);
        resetTokens.delete(token);
        res.json({ success: true, message: 'Senha redefinida com sucesso! Você já pode fazer login.' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: 'Erro interno ao redefinir senha.' });
    }
});

// Admin: generate reset link for any user
router.post('/admin-reset-link', async (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'E-mail é obrigatório.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 1000 * 60 * 60 * 24; // 24 hours for admin-generated links
    resetTokens.set(token, { email, expires });

    const baseUrl = process.env.BASE_URL || `https://neuroaprendizado.unipar.jacksonuti.cloud`;
    const resetLink = `${baseUrl}/reset-password.html?token=${token}`;
    console.log(`[ADMIN RESET] Link para ${email}: ${resetLink}`);

    res.json({ success: true, reset_link: resetLink });
});

module.exports = router;
