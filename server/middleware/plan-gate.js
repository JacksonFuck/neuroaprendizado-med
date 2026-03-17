/**
 * NeuroForge — Forje sinapses. Domine o conhecimento.
 * Copyright (c) 2026 Jackson Erasmo Fuck. All rights reserved.
 * INPI Registration: 512026001683-5
 * Licensed under proprietary license. See LICENSE file.
 */
const PLAN_LIMITS = {
    free: {
        flashcards_per_day: 5,
        flashcard_decks_max: 1,
        spaced_topics_max: 10,
        planner_subjects_max: 1,
        nback_max_level: 2,
        tools_allowed: ['anchor', 'noise'],
        pomodoro_per_day: 2,
        diary_entries_max: 3,
        neurobica_deck: false,       // only daily card, no full deck
        unified_review_per_day: 5,
        has_charts: false,
        has_ranking: false,
        has_export: false,
        has_articles: false,
        has_assessment: false,
    },
    pro: {
        flashcards_per_day: Infinity,
        flashcard_decks_max: Infinity,
        spaced_topics_max: Infinity,
        planner_subjects_max: Infinity,
        nback_max_level: Infinity,
        tools_allowed: 'all',
        pomodoro_per_day: Infinity,
        diary_entries_max: Infinity,
        neurobica_deck: true,
        unified_review_per_day: Infinity,
        has_charts: true,
        has_ranking: true,
        has_export: true,
        has_articles: true,
        has_assessment: true,
    }
};

function getPlanLimits(plan) {
    return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

function getUserPlan(user) {
    if (!user) return 'free';
    if (user.plan === 'pro') {
        if (user.plan_expires_at && new Date(user.plan_expires_at) < new Date()) {
            return 'free';
        }
        return 'pro';
    }
    return 'free';
}

function attachPlan(req, res, next) {
    if (req.user) {
        req.userPlan = getUserPlan(req.user);
        req.planLimits = getPlanLimits(req.userPlan);
    }
    next();
}

function requirePro(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Nao autenticado' });
    const plan = getUserPlan(req.user);
    if (plan !== 'pro') {
        return res.status(403).json({
            error: 'Recurso exclusivo do plano Pro',
            upgrade_url: '/landing.html#pricing',
            plan: 'free'
        });
    }
    next();
}

module.exports = { PLAN_LIMITS, getPlanLimits, getUserPlan, attachPlan, requirePro };
