const express = require('express');
const pool = require('../config/db');
const { ensureAuth } = require('../middleware/auth');
const { checkAndGrantAchievements } = require('../lib/xp-engine');
const router = express.Router();

// GET /subjects — list subjects with topic count and progress %
router.get('/subjects', ensureAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT s.*,
                COALESCE(tc.total, 0) AS topic_count,
                COALESCE(tc.completed, 0) AS completed_count,
                CASE WHEN COALESCE(tc.total, 0) = 0 THEN 0
                     ELSE ROUND((COALESCE(tc.completed, 0)::numeric / tc.total) * 100)
                END AS progress_pct
             FROM study_subjects s
             LEFT JOIN (
                 SELECT subject_id,
                        COUNT(*) AS total,
                        COUNT(*) FILTER (WHERE status = 'completed') AS completed
                 FROM study_topics
                 GROUP BY subject_id
             ) tc ON tc.subject_id = s.id
             WHERE s.user_id = $1
             ORDER BY s.created_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('Planner error:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /subjects — create subject
router.post('/subjects', ensureAuth, async (req, res) => {
    const { name, color, target_hours } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome da materia e obrigatorio' });
    try {
        const { rows } = await pool.query(
            'INSERT INTO study_subjects (user_id, name, color, target_hours) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user.id, name, color || '#3a86ff', target_hours || 0]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Planner error:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PUT /subjects/:id — update subject
router.put('/subjects/:id', ensureAuth, async (req, res) => {
    const { name, color, target_hours } = req.body;
    try {
        const { rows, rowCount } = await pool.query(
            `UPDATE study_subjects SET
                name = COALESCE($1, name),
                color = COALESCE($2, color),
                target_hours = COALESCE($3, target_hours)
             WHERE id = $4 AND user_id = $5 RETURNING *`,
            [name, color, target_hours, req.params.id, req.user.id]
        );
        if (!rowCount) return res.status(404).json({ error: 'Materia nao encontrada' });
        res.json(rows[0]);
    } catch (err) {
        console.error('Planner error:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// DELETE /subjects/:id — delete subject (cascades topics)
router.delete('/subjects/:id', ensureAuth, async (req, res) => {
    try {
        const { rowCount } = await pool.query(
            'DELETE FROM study_subjects WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );
        if (!rowCount) return res.status(404).json({ error: 'Materia nao encontrada' });
        res.json({ success: true });
    } catch (err) {
        console.error('Planner error:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /topics — list topics, optionally filtered by subject_id
router.get('/topics', ensureAuth, async (req, res) => {
    try {
        const { subject_id } = req.query;
        let query = 'SELECT * FROM study_topics WHERE user_id = $1';
        const params = [req.user.id];
        if (subject_id) {
            query += ' AND subject_id = $2';
            params.push(subject_id);
        }
        query += ' ORDER BY created_at DESC';
        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error('Planner error:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /topics — create topic
router.post('/topics', ensureAuth, async (req, res) => {
    const { name, subject_id, estimated_hours, target_date, add_to_spaced } = req.body;
    if (!name || !subject_id) return res.status(400).json({ error: 'Nome e materia sao obrigatorios' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let spacedTopicId = null;

        if (add_to_spaced) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const nextReview = tomorrow.toISOString().split('T')[0];

            const { rows: spacedRows } = await client.query(
                `INSERT INTO spaced_topics (user_id, name, category, next_review, stage, reviews, difficulty, stability, reps, lapses)
                 VALUES ($1, $2, 'Planner', $3, 0, '[]', 5.0, 1.0, 0, 0) RETURNING id`,
                [req.user.id, name, nextReview]
            );
            spacedTopicId = spacedRows[0].id;
        }

        const { rows } = await client.query(
            `INSERT INTO study_topics (user_id, subject_id, name, estimated_hours, target_date, spaced_topic_id)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [req.user.id, subject_id, name, estimated_hours || 0, target_date || null, spacedTopicId]
        );

        await client.query('COMMIT');
        res.status(201).json(rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Planner error:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    } finally {
        client.release();
    }
});

// PUT /topics/:id — update topic
router.put('/topics/:id', ensureAuth, async (req, res) => {
    const { name, status, estimated_hours, actual_hours, target_date } = req.body;
    try {
        // Check current status to detect completion transition
        const { rows: existing } = await pool.query(
            'SELECT * FROM study_topics WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );
        if (!existing.length) return res.status(404).json({ error: 'Topico nao encontrado' });

        const completedAt = (status === 'completed' && existing[0].status !== 'completed')
            ? 'NOW()'
            : null;

        const { rows } = await pool.query(
            `UPDATE study_topics SET
                name = COALESCE($1, name),
                status = COALESCE($2, status),
                estimated_hours = COALESCE($3, estimated_hours),
                actual_hours = COALESCE($4, actual_hours),
                target_date = COALESCE($5, target_date),
                completed_at = CASE WHEN $6::boolean THEN NOW() ELSE completed_at END
             WHERE id = $7 AND user_id = $8 RETURNING *`,
            [name, status, estimated_hours, actual_hours, target_date, completedAt !== null, req.params.id, req.user.id]
        );

        let achievements_earned = [];
        if (status === 'completed' && existing[0].status !== 'completed') {
            achievements_earned = await checkAndGrantAchievements(pool, req.user.id);
        }

        res.json({ ...rows[0], achievements_earned });
    } catch (err) {
        console.error('Planner error:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// DELETE /topics/:id — delete topic
router.delete('/topics/:id', ensureAuth, async (req, res) => {
    try {
        const { rowCount } = await pool.query(
            'DELETE FROM study_topics WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );
        if (!rowCount) return res.status(404).json({ error: 'Topico nao encontrado' });
        res.json({ success: true });
    } catch (err) {
        console.error('Planner error:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /stats — summary stats
router.get('/stats', ensureAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT
                (SELECT COUNT(*) FROM study_subjects WHERE user_id = $1) AS total_subjects,
                (SELECT COUNT(*) FROM study_topics WHERE user_id = $1) AS total_topics,
                (SELECT COUNT(*) FROM study_topics WHERE user_id = $1 AND status = 'completed') AS completed_topics,
                CASE WHEN (SELECT COUNT(*) FROM study_topics WHERE user_id = $1) = 0 THEN 0
                     ELSE ROUND(
                         (SELECT COUNT(*) FROM study_topics WHERE user_id = $1 AND status = 'completed')::numeric /
                         (SELECT COUNT(*) FROM study_topics WHERE user_id = $1) * 100
                     )
                END AS pct_complete,
                (SELECT COALESCE(SUM(estimated_hours - actual_hours), 0)
                 FROM study_topics WHERE user_id = $1 AND status != 'completed') AS hours_remaining`,
            [req.user.id]
        );
        res.json(rows[0]);
    } catch (err) {
        console.error('Planner error:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
