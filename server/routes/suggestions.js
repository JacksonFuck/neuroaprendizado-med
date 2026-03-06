const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Rota para o usuário enviar sugestões
router.post('/', async (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Não autenticado' });
    }

    const { title, description } = req.body;

    if (!title || !description) {
        return res.status(400).json({ error: 'Título e descrição são obrigatórios.' });
    }

    try {
        const { rows } = await pool.query(
            'INSERT INTO suggestions (user_id, title, description) VALUES ($1, $2, $3) RETURNING *',
            [req.user.id, title, description]
        );
        res.json({ success: true, suggestion: rows[0] });
    } catch (err) {
        console.error('Error creating suggestion:', err);
        res.status(500).json({ error: 'Erro interno ao salvar sugestão.' });
    }
});

module.exports = router;
