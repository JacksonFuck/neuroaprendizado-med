const express = require('express');
const pool = require('../config/db');
const { ensureAuth } = require('../middleware/auth');
const { sendSystemMessage } = require('./messages');
const router = express.Router();

// POST /api/survey/onboarding — Save initial onboarding survey + create user_goals
router.post('/onboarding', ensureAuth, async (req, res) => {
    const { goals, study_hours_per_day, main_challenge, experience_level, allow_tracking } = req.body;
    const userId = req.user.id;

    if (!goals || !Array.isArray(goals) || goals.length === 0) {
        return res.status(400).json({ error: 'Pelo menos um objetivo e obrigatorio.' });
    }

    if (!study_hours_per_day || !main_challenge || !experience_level) {
        return res.status(400).json({ error: 'Campos study_hours_per_day, main_challenge e experience_level sao obrigatorios.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Save survey responses
        await client.query(
            'INSERT INTO survey_responses (user_id, survey_type, responses) VALUES ($1, $2, $3)',
            [userId, 'onboarding', JSON.stringify({
                study_hours_per_day,
                main_challenge,
                experience_level,
                allow_tracking: !!allow_tracking,
                goals_count: goals.length
            })]
        );

        // Create user goals
        const createdGoals = [];
        for (const goal of goals) {
            if (!goal.type || !goal.description) continue;

            const validTypes = ['immediate', 'medium_term', 'long_term'];
            const goalType = validTypes.includes(goal.type) ? goal.type : 'immediate';

            const { rows } = await client.query(
                'INSERT INTO user_goals (user_id, goal_type, description, target_date) VALUES ($1, $2, $3, $4) RETURNING *',
                [userId, goalType, goal.description, goal.target_date || null]
            );
            createdGoals.push(rows[0]);
        }

        // Update user preferences
        await client.query(
            'UPDATE users SET onboarding_completed = TRUE, allow_tracking = $1 WHERE id = $2',
            [!!allow_tracking, userId]
        );

        await client.query('COMMIT');

        // Send welcome message (outside transaction)
        try {
            await sendSystemMessage(pool, userId, 'welcome',
                'Bem-vindo ao NeuroForge!',
                `Seus ${createdGoals.length} objetivo(s) foram registrados. Comece pela aba "Comece Aqui" para entender cada ferramenta. Dica: faca a Ancoragem Visual de 60s antes de cada sessao para ativar o Locus Coeruleus!`);
        } catch (msgErr) {
            console.error('Welcome message error (non-fatal):', msgErr);
        }

        res.status(201).json({
            success: true,
            goals: createdGoals,
            onboarding_completed: true
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Onboarding survey error:', err);
        res.status(500).json({ error: 'Erro ao salvar pesquisa de onboarding.' });
    } finally {
        client.release();
    }
});

// GET /api/survey/goals — Get user's goals with status
router.get('/goals', ensureAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM user_goals WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('Goals fetch error:', err);
        res.status(500).json({ error: 'Erro ao buscar objetivos.' });
    }
});

// PUT /api/survey/goals/:id — Update goal status (achieved/abandoned)
router.put('/goals/:id', ensureAuth, async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['active', 'achieved', 'abandoned'];

    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Status invalido. Use: active, achieved ou abandoned.' });
    }

    try {
        const achievedAt = status === 'achieved' ? 'NOW()' : 'NULL';
        const { rowCount } = await pool.query(
            `UPDATE user_goals SET status = $1, achieved_at = ${achievedAt} WHERE id = $2 AND user_id = $3`,
            [status, req.params.id, req.user.id]
        );

        if (rowCount === 0) {
            return res.status(404).json({ error: 'Objetivo nao encontrado.' });
        }

        // Send achievement message if goal was achieved
        if (status === 'achieved') {
            try {
                await sendSystemMessage(pool, req.user.id, 'achievement',
                    'Objetivo alcancado!',
                    'Parabens! Voce marcou um objetivo como alcancado. Defina novos objetivos para continuar evoluindo.',
                    'high');
            } catch (msgErr) {
                console.error('Goal achievement message error (non-fatal):', msgErr);
            }
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Goal update error:', err);
        res.status(500).json({ error: 'Erro ao atualizar objetivo.' });
    }
});

// POST /api/survey/checkin — Monthly check-in survey
router.post('/checkin', ensureAuth, async (req, res) => {
    const { goals_progress, app_helped, how_helped, suggestions } = req.body;
    const userId = req.user.id;

    if (!goals_progress || !Array.isArray(goals_progress)) {
        return res.status(400).json({ error: 'Campo goals_progress e obrigatorio (array).' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Save survey response
        await client.query(
            'INSERT INTO survey_responses (user_id, survey_type, responses) VALUES ($1, $2, $3)',
            [userId, 'monthly_checkin', JSON.stringify({
                goals_progress,
                app_helped: !!app_helped,
                how_helped: how_helped || null,
                suggestions: suggestions || null
            })]
        );

        // Update goal statuses from progress report
        for (const gp of goals_progress) {
            if (!gp.goal_id || !gp.status) continue;

            const validStatuses = ['active', 'achieved', 'abandoned'];
            if (!validStatuses.includes(gp.status)) continue;

            const achievedAt = gp.status === 'achieved' ? 'NOW()' : 'NULL';
            await client.query(
                `UPDATE user_goals SET status = $1, achieved_at = ${achievedAt} WHERE id = $2 AND user_id = $3`,
                [gp.status, gp.goal_id, userId]
            );
        }

        await client.query('COMMIT');

        // Send feedback thank-you message
        try {
            await sendSystemMessage(pool, userId, 'feedback',
                'Obrigado pelo check-in!',
                'Seu feedback nos ajuda a melhorar o NeuroForge. Continue acompanhando seus objetivos para maximizar seus resultados.');
        } catch (msgErr) {
            console.error('Checkin message error (non-fatal):', msgErr);
        }

        res.status(201).json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Checkin survey error:', err);
        res.status(500).json({ error: 'Erro ao salvar check-in.' });
    } finally {
        client.release();
    }
});

module.exports = router;
