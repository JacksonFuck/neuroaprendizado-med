const express = require('express');
const pool = require('../config/db');
const { ensureAuth } = require('../middleware/auth');
const { requirePro } = require('../middleware/plan-gate');
const router = express.Router();

// GET /csv?type=focus|reviews|topics|all
router.get('/csv', ensureAuth, requirePro, async (req, res) => {
    const type = req.query.type || 'all';
    const validTypes = ['focus', 'reviews', 'topics', 'all'];
    if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Tipo invalido. Use: focus, reviews, topics, all' });
    }

    try {
        let csv = '';

        if (type === 'focus' || type === 'all') {
            if (type === 'all') csv += '=== SESSOES DE FOCO ===\n';
            csv += await buildFocusCsv(req.user.id);
            if (type === 'all') csv += '\n';
        }

        if (type === 'reviews' || type === 'all') {
            if (type === 'all') csv += '=== REVISOES ESPACADAS ===\n';
            csv += await buildReviewsCsv(req.user.id);
            if (type === 'all') csv += '\n';
        }

        if (type === 'topics' || type === 'all') {
            if (type === 'all') csv += '=== TOPICOS DE ESTUDO ===\n';
            csv += await buildTopicsCsv(req.user.id);
        }

        const filename = `neuroaprendizado-${type}-${new Date().toISOString().split('T')[0]}.csv`;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send('\uFEFF' + csv); // BOM for Excel UTF-8
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

async function buildFocusCsv(userId) {
    const { rows } = await pool.query(
        'SELECT completed_at, focus_minutes FROM pomodoro_sessions WHERE user_id = $1 ORDER BY completed_at DESC',
        [userId]
    );
    let csv = 'Data,Minutos\n';
    for (const row of rows) {
        csv += `${formatDate(row.completed_at)},${row.focus_minutes}\n`;
    }
    return csv;
}

async function buildReviewsCsv(userId) {
    const { rows } = await pool.query(
        'SELECT name, category, stage, reps, stability, next_review, reviews FROM spaced_topics WHERE user_id = $1 ORDER BY next_review ASC',
        [userId]
    );
    let csv = 'Topico,Categoria,Estagio,Revisoes,Estabilidade,Proxima Revisao,Historico\n';
    for (const row of rows) {
        const reviews = row.reviews || [];
        const history = reviews.map(r => `${r.date?.split('T')[0] || ''}:R${r.rating}`).join('; ');
        csv += `"${escapeCsv(row.name)}","${escapeCsv(row.category)}",${row.stage},${row.reps},${row.stability},${row.next_review || ''},${escapeCsv(history)}\n`;
    }
    return csv;
}

async function buildTopicsCsv(userId) {
    const { rows } = await pool.query(
        `SELECT t.name AS topic, s.name AS subject, t.status, t.estimated_hours, t.actual_hours, t.target_date, t.completed_at
         FROM study_topics t
         JOIN study_subjects s ON s.id = t.subject_id
         WHERE t.user_id = $1
         ORDER BY s.name, t.created_at`,
        [userId]
    );
    let csv = 'Topico,Materia,Status,Horas Estimadas,Horas Reais,Data Alvo,Concluido Em\n';
    for (const row of rows) {
        csv += `"${escapeCsv(row.topic)}","${escapeCsv(row.subject)}",${row.status},${row.estimated_hours},${row.actual_hours},${row.target_date || ''},${formatDate(row.completed_at)}\n`;
    }
    return csv;
}

function escapeCsv(str) {
    if (!str) return '';
    return str.replace(/"/g, '""');
}

function formatDate(d) {
    if (!d) return '';
    return new Date(d).toISOString().split('T')[0];
}

module.exports = router;
