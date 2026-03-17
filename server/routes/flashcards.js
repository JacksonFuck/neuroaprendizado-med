/**
 * NeuroForge — Forje sinapses. Domine o conhecimento.
 * Copyright (c) 2026 Jackson Erasmo Fuck. All rights reserved.
 * INPI Registration: 512026001683-5
 * Licensed under proprietary license. See LICENSE file.
 */
const express = require('express');
const pool = require('../config/db');
const { ensureAuth } = require('../middleware/auth');
const { review, retrievability } = require('../lib/fsrs');
const { XP_VALUES, grantXP, checkAndGrantAchievements } = require('../lib/xp-engine');

const router = express.Router();

// --------------- DECKS ---------------

// GET / — List all decks with card count and due count
router.get('/', ensureAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT d.*,
                    COUNT(f.id)::int AS card_count,
                    COUNT(CASE WHEN f.next_review <= CURRENT_DATE OR f.next_review IS NULL THEN 1 END)::int AS due_count
             FROM flashcard_decks d
             LEFT JOIN flashcards f ON f.deck_id = d.id
             WHERE d.user_id = $1
             GROUP BY d.id
             ORDER BY d.created_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('Error listing decks:', err);
        res.status(500).json({ error: 'Erro ao listar baralhos' });
    }
});

// POST / — Create deck
router.post('/', ensureAuth, async (req, res) => {
    const { name, category, color } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Nome do baralho e obrigatorio' });
    }

    try {
        const { rows } = await pool.query(
            `INSERT INTO flashcard_decks (user_id, name, category, color)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [req.user.id, name.trim(), category || 'Geral', color || '#00f0ff']
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error creating deck:', err);
        res.status(500).json({ error: 'Erro ao criar baralho' });
    }
});

// PUT /:id — Update deck
router.put('/:id', ensureAuth, async (req, res) => {
    const { name, category, color } = req.body;

    try {
        const { rows } = await pool.query(
            `UPDATE flashcard_decks
             SET name = COALESCE($1, name),
                 category = COALESCE($2, category),
                 color = COALESCE($3, color)
             WHERE id = $4 AND user_id = $5
             RETURNING *`,
            [name || null, category || null, color || null, req.params.id, req.user.id]
        );

        if (!rows.length) {
            return res.status(404).json({ error: 'Baralho nao encontrado' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Error updating deck:', err);
        res.status(500).json({ error: 'Erro ao atualizar baralho' });
    }
});

// DELETE /:id — Delete deck (cascades cards)
router.delete('/:id', ensureAuth, async (req, res) => {
    try {
        const { rowCount } = await pool.query(
            'DELETE FROM flashcard_decks WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        if (!rowCount) {
            return res.status(404).json({ error: 'Baralho nao encontrado' });
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting deck:', err);
        res.status(500).json({ error: 'Erro ao deletar baralho' });
    }
});

// --------------- CARDS ---------------

// GET /:deckId/cards — List all cards in deck with current retrievability
router.get('/:deckId/cards', ensureAuth, async (req, res) => {
    try {
        // Verify deck belongs to user
        const { rows: deckRows } = await pool.query(
            'SELECT id FROM flashcard_decks WHERE id = $1 AND user_id = $2',
            [req.params.deckId, req.user.id]
        );

        if (!deckRows.length) {
            return res.status(404).json({ error: 'Baralho nao encontrado' });
        }

        const { rows } = await pool.query(
            `SELECT * FROM flashcards WHERE deck_id = $1 AND user_id = $2 ORDER BY created_at DESC`,
            [req.params.deckId, req.user.id]
        );

        const now = new Date();
        const enriched = rows.map(card => {
            const lastReview = card.last_review ? new Date(card.last_review) : null;
            const daysSince = lastReview ? Math.max(0, (now - lastReview) / 86400000) : 0;
            const R = lastReview ? retrievability(daysSince, card.stability || 1) : null;

            return {
                ...card,
                retrievability: R !== null ? Math.round(R * 100) / 100 : null
            };
        });

        res.json(enriched);
    } catch (err) {
        console.error('Error listing cards:', err);
        res.status(500).json({ error: 'Erro ao listar flashcards' });
    }
});

// POST /:deckId/cards — Create card
router.post('/:deckId/cards', ensureAuth, async (req, res) => {
    const { front, back } = req.body;

    if (!front || !front.trim() || !back || !back.trim()) {
        return res.status(400).json({ error: 'Frente e verso sao obrigatorios' });
    }

    try {
        // Verify deck belongs to user
        const { rows: deckRows } = await pool.query(
            'SELECT id FROM flashcard_decks WHERE id = $1 AND user_id = $2',
            [req.params.deckId, req.user.id]
        );

        if (!deckRows.length) {
            return res.status(404).json({ error: 'Baralho nao encontrado' });
        }

        const { rows } = await pool.query(
            `INSERT INTO flashcards (deck_id, user_id, front, back, next_review)
             VALUES ($1, $2, $3, $4, CURRENT_DATE) RETURNING *`,
            [req.params.deckId, req.user.id, front.trim(), back.trim()]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error creating card:', err);
        res.status(500).json({ error: 'Erro ao criar flashcard' });
    }
});

// PUT /cards/:id — Update card text
router.put('/cards/:id', ensureAuth, async (req, res) => {
    const { front, back } = req.body;

    try {
        const { rows } = await pool.query(
            `UPDATE flashcards
             SET front = COALESCE($1, front),
                 back = COALESCE($2, back)
             WHERE id = $3 AND user_id = $4
             RETURNING *`,
            [front || null, back || null, req.params.id, req.user.id]
        );

        if (!rows.length) {
            return res.status(404).json({ error: 'Flashcard nao encontrado' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Error updating card:', err);
        res.status(500).json({ error: 'Erro ao atualizar flashcard' });
    }
});

// DELETE /cards/:id — Delete card
router.delete('/cards/:id', ensureAuth, async (req, res) => {
    try {
        const { rowCount } = await pool.query(
            'DELETE FROM flashcards WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        if (!rowCount) {
            return res.status(404).json({ error: 'Flashcard nao encontrado' });
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting card:', err);
        res.status(500).json({ error: 'Erro ao deletar flashcard' });
    }
});

// --------------- REVIEW SESSION ---------------

// GET /review/due — Get all due cards across all decks
router.get('/review/due', ensureAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT f.*, d.name AS deck_name, d.color AS deck_color
             FROM flashcards f
             JOIN flashcard_decks d ON d.id = f.deck_id
             WHERE f.user_id = $1
               AND (f.next_review <= CURRENT_DATE OR f.next_review IS NULL)
             ORDER BY f.next_review ASC NULLS FIRST
             LIMIT 50`,
            [req.user.id]
        );

        const now = new Date();
        const enriched = rows.map(card => {
            const lastReview = card.last_review ? new Date(card.last_review) : null;
            const daysSince = lastReview ? Math.max(0, (now - lastReview) / 86400000) : 0;
            const R = lastReview ? retrievability(daysSince, card.stability || 1) : null;

            return {
                ...card,
                retrievability: R !== null ? Math.round(R * 100) / 100 : null
            };
        });

        res.json(enriched);
    } catch (err) {
        console.error('Error fetching due cards:', err);
        res.status(500).json({ error: 'Erro ao buscar flashcards para revisao' });
    }
});

// PUT /cards/:id/review — Review a card with FSRS
router.put('/cards/:id/review', ensureAuth, async (req, res) => {
    const { rating } = req.body;
    const parsedRating = parseInt(rating);

    if (!parsedRating || parsedRating < 1 || parsedRating > 4) {
        return res.status(400).json({ error: 'Rating deve ser 1-4 (Again, Hard, Good, Easy)' });
    }

    try {
        // Fetch current card state
        const { rows: cardRows } = await pool.query(
            'SELECT * FROM flashcards WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        if (!cardRows.length) {
            return res.status(404).json({ error: 'Flashcard nao encontrado' });
        }

        const card = cardRows[0];

        // Calculate new FSRS parameters
        const result = review({
            difficulty: card.difficulty,
            stability: card.stability,
            last_review: card.last_review,
            reps: card.reps,
            lapses: card.lapses
        }, parsedRating);

        // Update card with new FSRS state
        const { rows: updated } = await pool.query(
            `UPDATE flashcards
             SET difficulty = $1,
                 stability = $2,
                 next_review = $3,
                 last_review = $4,
                 reps = $5,
                 lapses = $6
             WHERE id = $7 AND user_id = $8
             RETURNING *`,
            [
                result.difficulty,
                result.stability,
                result.next_review,
                result.last_review,
                result.reps,
                result.lapses,
                req.params.id,
                req.user.id
            ]
        );

        // Grant XP for review
        const xpAmount = parsedRating >= 3 ? XP_VALUES.review_optimal : XP_VALUES.review_complete;
        await grantXP(pool, req.user.id, xpAmount, 'flashcard_review', card.id);

        // Check achievements
        const newAchievements = await checkAndGrantAchievements(pool, req.user.id);

        res.json({
            card: updated[0],
            fsrs: result,
            xp_earned: xpAmount,
            new_achievements: newAchievements
        });
    } catch (err) {
        console.error('Error reviewing card:', err);
        res.status(500).json({ error: 'Erro ao revisar flashcard' });
    }
});

// --------------- IMPORT ---------------

// POST /:deckId/import — Import cards from CSV text (front;back per line)
router.post('/:deckId/import', ensureAuth, async (req, res) => {
    const { csv } = req.body;

    if (!csv || !csv.trim()) {
        return res.status(400).json({ error: 'Conteudo CSV e obrigatorio' });
    }

    try {
        // Verify deck belongs to user
        const { rows: deckRows } = await pool.query(
            'SELECT id FROM flashcard_decks WHERE id = $1 AND user_id = $2',
            [req.params.deckId, req.user.id]
        );

        if (!deckRows.length) {
            return res.status(404).json({ error: 'Baralho nao encontrado' });
        }

        const lines = csv.trim().split('\n').filter(line => line.trim());
        const cards = [];
        const errors = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Accept multiple separators: semicolon, tab, or pipe
            let parts;
            if (line.includes('\t')) {
                parts = line.split('\t');
            } else if (line.includes(';')) {
                parts = line.split(';');
            } else if (line.includes('|')) {
                parts = line.split('|');
            } else {
                // Try comma but only if there's exactly one comma (avoid splitting answers with commas)
                const commaCount = (line.match(/,/g) || []).length;
                if (commaCount === 1) {
                    parts = line.split(',');
                } else {
                    errors.push(`Linha ${i + 1}: separador nao encontrado (use ; ou tab ou |)`);
                    continue;
                }
            }
            if (parts.length < 2 || !parts[0].trim() || !parts[1].trim()) {
                errors.push(`Linha ${i + 1}: formato invalido (esperado: frente;verso)`);
                continue;
            }
            // Join remaining parts as "back" in case separator appears in the answer
            let front = parts[0].trim();
            let back = parts.slice(1).join(';').trim();
            // Clean citation markers from NotebookLM and other AI tools
            front = front.replace(/\[cite_start\]/gi, '').replace(/\[cite_end\]/gi, '').replace(/\[cite:\s*\d+\]/gi, '').replace(/\[\d+\]/g, '').trim();
            back = back.replace(/\[cite_start\]/gi, '').replace(/\[cite_end\]/gi, '').replace(/\[cite:\s*\d+\]/gi, '').replace(/\[\d+\]/g, '').trim();
            if (!front || !back) { errors.push(`Linha ${i + 1}: vazio apos limpeza`); continue; }
            cards.push({ front, back });
        }

        if (!cards.length) {
            return res.status(400).json({ error: 'Nenhum card valido encontrado', details: errors });
        }

        // Bulk insert using a single query with unnest
        const fronts = cards.map(c => c.front);
        const backs = cards.map(c => c.back);
        const deckIds = cards.map(() => parseInt(req.params.deckId));
        const userIds = cards.map(() => req.user.id);

        const { rows: inserted } = await pool.query(
            `INSERT INTO flashcards (deck_id, user_id, front, back, next_review)
             SELECT unnest($1::int[]), unnest($2::int[]), unnest($3::text[]), unnest($4::text[]), CURRENT_DATE
             RETURNING *`,
            [deckIds, userIds, fronts, backs]
        );

        res.status(201).json({
            imported: inserted.length,
            errors: errors.length > 0 ? errors : undefined,
            cards: inserted
        });
    } catch (err) {
        console.error('Error importing cards:', err);
        res.status(500).json({ error: 'Erro ao importar flashcards' });
    }
});

module.exports = router;
