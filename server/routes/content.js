const express = require('express');
const pool = require('../config/db');
const router = express.Router();

// Get content sections by tab key (public — no auth needed)
router.get('/:tab', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT id, tab_key, title, body, sort_order FROM content_sections WHERE tab_key = $1 AND is_active = TRUE ORDER BY sort_order ASC',
            [req.params.tab]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
