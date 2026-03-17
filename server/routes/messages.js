/**
 * NeuroForge — Forje sinapses. Domine o conhecimento.
 * Copyright (c) 2026 Jackson Erasmo Fuck. All rights reserved.
 * INPI Registration: 512026001683-5
 * Licensed under proprietary license. See LICENSE file.
 */
const express = require('express');
const pool = require('../config/db');
const { ensureAuth } = require('../middleware/auth');
const router = express.Router();

// ─── Helper Functions (exported for use by other routes) ─────────────────────

async function sendSystemMessage(pool, userId, type, title, body, priority = 'normal') {
    await pool.query(
        'INSERT INTO user_messages (user_id, sender, type, title, body, priority) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, 'system', type, title, body, priority]
    );
}

async function generateAutoMessages(pool, userId) {
    const { rows: stats } = await pool.query(
        'SELECT COALESCE(SUM(focus_minutes),0) as mins, COUNT(*) as sessions FROM pomodoro_sessions WHERE user_id = $1',
        [userId]
    );
    const mins = parseInt(stats[0].mins);

    // Welcome message (if no messages exist yet)
    const { rows: msgCount } = await pool.query(
        'SELECT COUNT(*) as c FROM user_messages WHERE user_id = $1', [userId]
    );
    if (parseInt(msgCount[0].c) === 0) {
        await sendSystemMessage(pool, userId, 'welcome',
            'Bem-vindo ao NeuroForge!',
            'Comece pela aba "Comece Aqui" para entender como usar cada ferramenta. Dica: faca a Ancoragem Visual de 60s antes de cada sessao de estudo para ativar seu Locus Coeruleus!');
    }

    // Milestone messages
    const milestones = [
        { mins: 100, title: '100 minutos de foco!', body: 'Voce acumulou 100 minutos de foco. Seu cortex pre-frontal ja esta mais eficiente. Continue!' },
        { mins: 500, title: '500 minutos - Meio caminho!', body: 'Com 500 minutos de foco, mudancas estruturais no hipocampo ja sao mensuraveis. O BDNF esta trabalhando a seu favor.' },
        { mins: 1000, title: '1000 minutos - Elite!', body: 'Mil minutos de foco deliberado. Voce esta no top 5% dos estudantes que usam tecnicas baseadas em evidencia.' },
    ];

    for (const m of milestones) {
        if (mins >= m.mins) {
            const { rows: exists } = await pool.query(
                "SELECT 1 FROM user_messages WHERE user_id = $1 AND title = $2", [userId, m.title]
            );
            if (!exists.length) {
                await sendSystemMessage(pool, userId, 'milestone', m.title, m.body, 'high');
            }
        }
    }

    // Study tips (rotate based on day of month)
    const tips = [
        { title: 'Dica: Active Recall', body: 'Feche o livro e tente explicar o conceito em voz alta. A recuperacao ativa e 3x mais eficaz que releitura (Antony et al., 2017).' },
        { title: 'Dica: Espacamento', body: 'Revisar no momento certo (quando retrievability = 70%) maximiza o Erro de Predicao de Recompensa e a consolidacao sinaptica.' },
        { title: 'Dica: Interleaving', body: 'Misture temas diferentes na mesma sessao. O interleaving fortalece a discriminacao entre conceitos similares (Samani & Levesque, 2021).' },
        { title: 'Dica: NSDR', body: 'Apos 90 minutos de foco, 15 minutos de NSDR restauram 65% da dopamina estriatal. Nao pule a pausa!' },
        { title: 'Dica: Brown Noise', body: 'Use ruido marrom com fones durante o estudo. Reduz o custo de alternancia atencional em 30% (Rausch et al., 2014).' },
        { title: 'Dica: N-Back', body: 'Treinar Dual N-Back 3-5x por semana expande a memoria de trabalho em 15-20% apos 4 semanas (Jaeggi et al., 2008).' },
    ];

    const dayOfMonth = new Date().getDate();
    const tip = tips[dayOfMonth % tips.length];
    const today = new Date().toISOString().split('T')[0];
    const { rows: tipExists } = await pool.query(
        "SELECT 1 FROM user_messages WHERE user_id = $1 AND title = $2 AND created_at::date = $3",
        [userId, tip.title, today]
    );
    if (!tipExists.length) {
        await sendSystemMessage(pool, userId, 'tip', tip.title, tip.body);
    }
}

// ─── API Endpoints ───────────────────────────────────────────────────────────

// GET /api/messages — Get user's messages (newest first, limit 50)
router.get('/', ensureAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM user_messages WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('Messages fetch error:', err);
        res.status(500).json({ error: 'Erro ao buscar mensagens.' });
    }
});

// GET /api/messages/unread-count — Get count of unread messages
router.get('/unread-count', ensureAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT COUNT(*) as count FROM user_messages WHERE user_id = $1 AND read_at IS NULL',
            [req.user.id]
        );
        res.json({ count: parseInt(rows[0].count) });
    } catch (err) {
        console.error('Unread count error:', err);
        res.status(500).json({ error: 'Erro ao contar mensagens.' });
    }
});

// PUT /api/messages/read-all — Mark all as read (MUST come before /:id/read)
router.put('/read-all', ensureAuth, async (req, res) => {
    try {
        const { rowCount } = await pool.query(
            'UPDATE user_messages SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL',
            [req.user.id]
        );
        res.json({ success: true, marked: rowCount });
    } catch (err) {
        console.error('Mark all read error:', err);
        res.status(500).json({ error: 'Erro ao marcar mensagens como lidas.' });
    }
});

// PUT /api/messages/:id/read — Mark message as read
router.put('/:id/read', ensureAuth, async (req, res) => {
    try {
        const { rowCount } = await pool.query(
            'UPDATE user_messages SET read_at = NOW() WHERE id = $1 AND user_id = $2 AND read_at IS NULL',
            [req.params.id, req.user.id]
        );
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Mensagem nao encontrada ou ja lida.' });
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Mark read error:', err);
        res.status(500).json({ error: 'Erro ao marcar mensagem como lida.' });
    }
});

// POST /api/messages/send — Admin-only: send message to a user or all users
router.post('/send', ensureAuth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado. Requer privilegios de administrador.' });
    }

    const { user_id, title, body, type, priority } = req.body;

    if (!title || !body) {
        return res.status(400).json({ error: 'Titulo e corpo da mensagem sao obrigatorios.' });
    }

    const msgType = type || 'feedback';
    const msgPriority = priority || 'normal';

    try {
        if (user_id) {
            // Send to specific user
            await sendSystemMessage(pool, user_id, msgType, title, body, msgPriority);
            res.json({ success: true, sent_to: 1 });
        } else {
            // Send to all users
            const { rows: users } = await pool.query('SELECT id FROM users WHERE is_active = TRUE');
            for (const u of users) {
                await sendSystemMessage(pool, u.id, msgType, title, body, msgPriority);
            }
            res.json({ success: true, sent_to: users.length });
        }
    } catch (err) {
        console.error('Send message error:', err);
        res.status(500).json({ error: 'Erro ao enviar mensagem.' });
    }
});

module.exports = router;
module.exports.sendSystemMessage = sendSystemMessage;
module.exports.generateAutoMessages = generateAutoMessages;
