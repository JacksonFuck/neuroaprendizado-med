/**
 * NeuroForge — Forje sinapses. Domine o conhecimento.
 * Copyright (c) 2026 Jackson Erasmo Fuck. All rights reserved.
 * INPI Registration: 512026001683-5
 * Licensed under proprietary license. See LICENSE file.
 */
function ensureAuth(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) return next();
    res.status(401).json({ error: 'Não autenticado' });
}

module.exports = { ensureAuth };
