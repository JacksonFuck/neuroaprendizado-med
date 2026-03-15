const express = require('express');
const pool = require('../config/db');
const { ensureAuth } = require('../middleware/auth');
const { grantXP, checkAndGrantAchievements } = require('../lib/xp-engine');
const { sendSystemMessage } = require('./messages');
const router = express.Router();

// Assessment schedule: week markers
const SCHEDULE = [
    { type: 'baseline', week: 0, label: 'Baseline (Ponto Zero)' },
    { type: 'T1', week: 4, label: 'Avaliacao T1 (4 semanas)' },
    { type: 'T2', week: 8, label: 'Avaliacao T2 (8 semanas)' },
    { type: 'T3', week: 12, label: 'Avaliacao T3 (12 semanas)' },
    { type: 'T4', week: 26, label: 'Avaliacao T4 (6 meses)' },
    { type: 'T5', week: 52, label: 'Avaliacao T5 (1 ano)' }
];

// GET /api/assessment/status — Check if user has pending assessment
router.get('/status', ensureAuth, async (req, res) => {
    try {
        const { rows: assessments } = await pool.query(
            'SELECT assessment_type, week_marker, completed_at FROM assessments WHERE user_id = $1 ORDER BY week_marker ASC',
            [req.user.id]
        );

        const completed = assessments.map(a => a.assessment_type);
        const userCreated = new Date(req.user.created_at);
        const weeksActive = Math.floor((Date.now() - userCreated.getTime()) / (7 * 24 * 60 * 60 * 1000));

        // Find next due assessment
        let nextDue = null;
        for (const s of SCHEDULE) {
            if (!completed.includes(s.type) && weeksActive >= s.week) {
                nextDue = s;
                break;
            }
        }

        // If no baseline done yet, always show it
        if (!completed.includes('baseline')) {
            nextDue = SCHEDULE[0];
        }

        res.json({
            assessments_completed: assessments,
            weeks_active: weeksActive,
            next_due: nextDue,
            has_baseline: completed.includes('baseline'),
            total_completed: completed.length
        });
    } catch (err) {
        console.error('Assessment status error:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /api/assessment — Save completed assessment
router.post('/', ensureAuth, async (req, res) => {
    const {
        assessment_type, week_marker,
        pvt_avg_rt, pvt_best_rt, pvt_worst_rt, pvt_variability, pvt_lapses,
        nback_level, nback_accuracy, nback_pos_hits, nback_let_hits, nback_total_possible,
        stroop_accuracy, stroop_avg_rt, stroop_total, stroop_correct,
        subj_focus, subj_retention, subj_fatigue, subj_motivation, subj_organization
    } = req.body;

    if (!assessment_type) {
        return res.status(400).json({ error: 'Tipo de avaliacao e obrigatorio.' });
    }

    // Compute composite score (0-100)
    // Weighted: PVT 25%, N-Back 25%, Stroop 20%, Subjective 30%

    // PVT: lower RT = better. Score: 100 if RT < 250ms, 0 if RT > 600ms
    const pvtScore = pvt_avg_rt ? Math.max(0, Math.min(100, (600 - pvt_avg_rt) / 3.5)) : 50;

    // N-Back: higher accuracy = better
    const nbackScore = nback_accuracy || 50;

    // Stroop: higher accuracy = better
    const stroopScore = stroop_accuracy || 50;

    // Subjective: average of 5 questions (1-5 scale, normalized to 0-100)
    const subjScores = [subj_focus, subj_retention, subj_fatigue, subj_motivation, subj_organization].filter(Boolean);
    const subjAvg = subjScores.length ? (subjScores.reduce((a, b) => a + b, 0) / subjScores.length) : 3;
    const subjScore = ((subjAvg - 1) / 4) * 100; // 1->0, 5->100

    const composite = Math.round(pvtScore * 0.25 + nbackScore * 0.25 + stroopScore * 0.20 + subjScore * 0.30);

    try {
        // Check if this assessment type already exists
        const { rows: existing } = await pool.query(
            'SELECT id FROM assessments WHERE user_id = $1 AND assessment_type = $2',
            [req.user.id, assessment_type]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Esta avaliacao ja foi realizada.' });
        }

        const { rows } = await pool.query(
            `INSERT INTO assessments (
                user_id, assessment_type, week_marker,
                pvt_avg_rt, pvt_best_rt, pvt_worst_rt, pvt_variability, pvt_lapses,
                nback_level, nback_accuracy, nback_pos_hits, nback_let_hits, nback_total_possible,
                stroop_accuracy, stroop_avg_rt, stroop_total, stroop_correct,
                subj_focus, subj_retention, subj_fatigue, subj_motivation, subj_organization,
                composite_score
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
            RETURNING *`,
            [
                req.user.id, assessment_type, week_marker || 0,
                pvt_avg_rt, pvt_best_rt, pvt_worst_rt, pvt_variability, pvt_lapses || 0,
                nback_level, nback_accuracy, nback_pos_hits, nback_let_hits, nback_total_possible,
                stroop_accuracy, stroop_avg_rt, stroop_total, stroop_correct,
                subj_focus, subj_retention, subj_fatigue, subj_motivation, subj_organization,
                composite
            ]
        );

        // Update user stats
        await pool.query(
            'UPDATE users SET assessments_completed = assessments_completed + 1 WHERE id = $1',
            [req.user.id]
        );

        // Grant XP
        await grantXP(pool, req.user.id, 25, 'assessment', rows[0].id);
        await checkAndGrantAchievements(pool, req.user.id);

        // Send message
        const isBaseline = assessment_type === 'baseline';
        await sendSystemMessage(pool, req.user.id, 'milestone',
            isBaseline
                ? 'Baseline registrado! Seu ponto zero foi definido.'
                : `Avaliacao ${assessment_type} concluida! Score: ${composite}/100`,
            isBaseline
                ? `Seu score inicial e ${composite}/100. Nas proximas semanas, vamos acompanhar sua evolucao em tempo de reacao, memoria de trabalho, controle inibitorio e percepcao subjetiva. Continue treinando!`
                : `Seu score composto e ${composite}/100. Compare com seu baseline para ver o progresso.`,
            'high'
        );

        res.json({
            assessment: rows[0],
            composite_score: composite,
            xp_earned: 25,
            is_baseline: isBaseline
        });
    } catch (err) {
        console.error('Assessment save error:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/assessment/history — All assessments for comparison
router.get('/history', ensureAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM assessments WHERE user_id = $1 ORDER BY week_marker ASC',
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('Assessment history error:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/assessment/comparison — Compare baseline vs latest
router.get('/comparison', ensureAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM assessments WHERE user_id = $1 ORDER BY week_marker ASC',
            [req.user.id]
        );

        if (rows.length < 1) {
            return res.json({ has_data: false });
        }

        const baseline = rows[0];
        const latest = rows[rows.length - 1];
        const isSame = baseline.id === latest.id;

        // Calculate deltas
        const deltas = {};
        if (!isSame) {
            deltas.pvt_rt = baseline.pvt_avg_rt && latest.pvt_avg_rt
                ? Math.round(((latest.pvt_avg_rt - baseline.pvt_avg_rt) / baseline.pvt_avg_rt) * 100) : null;
            deltas.nback_accuracy = baseline.nback_accuracy && latest.nback_accuracy
                ? Math.round(latest.nback_accuracy - baseline.nback_accuracy) : null;
            deltas.stroop_accuracy = baseline.stroop_accuracy && latest.stroop_accuracy
                ? Math.round(latest.stroop_accuracy - baseline.stroop_accuracy) : null;
            deltas.composite = Math.round(latest.composite_score - baseline.composite_score);
        }

        res.json({
            has_data: true,
            baseline,
            latest: isSame ? null : latest,
            deltas,
            total_assessments: rows.length,
            all: rows
        });
    } catch (err) {
        console.error('Assessment comparison error:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
