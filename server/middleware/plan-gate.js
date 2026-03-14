const PLAN_LIMITS = {
    free: {
        flashcards_per_day: 3,
        spaced_topics_max: 5,
        planner_subjects_max: 1,
        nback_max_level: 2,
        tools_allowed: ['anchor'],
        has_charts: false,
        has_ranking: false,
        has_export: false,
    },
    pro: {
        flashcards_per_day: Infinity,
        spaced_topics_max: Infinity,
        planner_subjects_max: Infinity,
        nback_max_level: Infinity,
        tools_allowed: 'all',
        has_charts: true,
        has_ranking: true,
        has_export: true,
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
