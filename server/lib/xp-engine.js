const XP_VALUES = {
    pomodoro_complete: 10,
    review_complete: 5,
    review_optimal: 15,
    nback_session: 8,
    nback_level_up: 50,
    diary_entry: 5
};

const LEVELS = [
    { min: 0, title: 'Iniciante', icon: '🌱' },
    { min: 500, title: 'Intermediario', icon: '🌿' },
    { min: 1500, title: 'Avancado', icon: '🌳' },
    { min: 4000, title: 'Elite', icon: '⚡' },
    { min: 10000, title: 'Neurocientista', icon: '🧬' }
];

async function grantXP(pool, userId, amount, source, sourceId = null) {
    await pool.query(
        'INSERT INTO xp_log (user_id, amount, source, source_id) VALUES ($1, $2, $3, $4)',
        [userId, amount, source, sourceId]
    );
    await pool.query(
        'UPDATE users SET total_xp = total_xp + $1 WHERE id = $2',
        [amount, userId]
    );
    return amount;
}

function getUserLevel(totalXp) {
    let level = LEVELS[0];
    for (const l of LEVELS) {
        if (totalXp >= l.min) level = l;
    }
    const nextLevel = LEVELS[LEVELS.indexOf(level) + 1];
    return {
        title: level.title,
        icon: level.icon,
        currentXp: totalXp,
        nextLevelXp: nextLevel ? nextLevel.min : null,
        nextLevelTitle: nextLevel ? nextLevel.title : null
    };
}

async function checkAndGrantAchievements(pool, userId) {
    const earned = [];

    const { rows: unearned } = await pool.query(
        `SELECT a.* FROM achievements a
         WHERE NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.achievement_id = a.id AND ua.user_id = $1)`,
        [userId]
    );

    for (const ach of unearned) {
        const cond = ach.condition_json;
        let met = false;

        switch (cond.type) {
            case 'pomodoro_count': {
                const { rows } = await pool.query('SELECT COUNT(*) as c FROM pomodoro_sessions WHERE user_id = $1', [userId]);
                met = parseInt(rows[0].c) >= cond.value;
                break;
            }
            case 'focus_minutes': {
                const { rows } = await pool.query('SELECT COALESCE(SUM(focus_minutes),0) as m FROM pomodoro_sessions WHERE user_id = $1', [userId]);
                met = parseInt(rows[0].m) >= cond.value;
                break;
            }
            case 'streak': {
                const { rows } = await pool.query(
                    `WITH dates AS (SELECT DISTINCT completed_at::date AS d FROM pomodoro_sessions WHERE user_id = $1),
                     numbered AS (SELECT d, d - (ROW_NUMBER() OVER (ORDER BY d))::int AS grp FROM dates),
                     today_grp AS (SELECT grp FROM numbered WHERE d = CURRENT_DATE LIMIT 1)
                     SELECT COALESCE((SELECT COUNT(*) FROM numbered WHERE grp = (SELECT grp FROM today_grp)), 0) as streak`,
                    [userId]
                );
                met = parseInt(rows[0].streak) >= cond.value;
                break;
            }
            case 'review_count': {
                const { rows } = await pool.query('SELECT COALESCE(SUM(reps),0) as r FROM spaced_topics WHERE user_id = $1', [userId]);
                met = parseInt(rows[0].r) >= cond.value;
                break;
            }
            case 'nback_level': {
                const { rows } = await pool.query('SELECT max_unlocked_level FROM user_nback_progress WHERE user_id = $1', [userId]);
                met = rows.length > 0 && rows[0].max_unlocked_level >= cond.value;
                break;
            }
            case 'nback_sessions': {
                const { rows } = await pool.query('SELECT COUNT(*) as c FROM nback_sessions WHERE user_id = $1', [userId]);
                met = parseInt(rows[0].c) >= cond.value;
                break;
            }
            case 'diary_count': {
                const { rows } = await pool.query('SELECT COUNT(*) as c FROM diary_entries WHERE user_id = $1', [userId]);
                met = parseInt(rows[0].c) >= cond.value;
                break;
            }
            case 'planner_subject_topics': {
                const { rows } = await pool.query(
                    `SELECT COUNT(*) as c FROM study_topics WHERE subject_id IN
                     (SELECT id FROM study_subjects WHERE user_id = $1) GROUP BY subject_id HAVING COUNT(*) >= $2 LIMIT 1`,
                    [userId, cond.value]
                );
                met = rows.length > 0;
                break;
            }
            case 'planner_subject_complete': {
                const { rows } = await pool.query(
                    `SELECT s.id FROM study_subjects s WHERE s.user_id = $1 AND
                     NOT EXISTS (SELECT 1 FROM study_topics t WHERE t.subject_id = s.id AND t.status != 'completed') AND
                     EXISTS (SELECT 1 FROM study_topics t WHERE t.subject_id = s.id) LIMIT 1`,
                    [userId]
                );
                met = rows.length > 0;
                break;
            }
        }

        if (met) {
            await pool.query(
                'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [userId, ach.id]
            );
            if (ach.xp_reward > 0) {
                await grantXP(pool, userId, ach.xp_reward, 'achievement', ach.id);
            }
            earned.push({ key: ach.key, name: ach.name, icon: ach.icon, xp: ach.xp_reward });
        }
    }

    return earned;
}

module.exports = { XP_VALUES, LEVELS, grantXP, getUserLevel, checkAndGrantAchievements };
