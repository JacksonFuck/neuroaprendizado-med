/**
 * NeuroForge — Forje sinapses. Domine o conhecimento.
 * Copyright (c) 2026 Jackson Erasmo Fuck. All rights reserved.
 * INPI Registration: 512026001683-5
 * Licensed under proprietary license. See LICENSE file.
 */
/**
 * FSRS-lite — Free Spaced Repetition Scheduler (simplified)
 * Based on FSRS-4.5 algorithm by Jarrett Ye
 *
 * Models memory with 3 variables:
 *   D (Difficulty) — intrinsic difficulty of the item (1-10)
 *   S (Stability) — days until recall probability drops to 90%
 *   R (Retrievability) — current probability of recall (0-1)
 *
 * Rating scale:
 *   1 = Again (forgot)
 *   2 = Hard (barely remembered)
 *   3 = Good (remembered with effort)
 *   4 = Easy (instant recall)
 */

// Default FSRS-4.5 parameters (can be personalized per user later)
const W = [
    0.4,    // w0: initial stability for Again
    0.6,    // w1: initial stability for Hard
    2.4,    // w2: initial stability for Good
    5.8,    // w3: initial stability for Easy
    4.93,   // w4: difficulty mean reversion
    0.94,   // w5: difficulty mean reversion weight
    0.86,   // w6: difficulty update rate
    0.01,   // w7: difficulty update weight
    1.49,   // w8: stability increase factor
    0.14,   // w9: stability decrease with difficulty
    0.94,   // w10: stability increase with retrievability gap
    2.18,   // w11: lapse stability decrease
    0.05,   // w12: lapse difficulty penalty
    0.34,   // w13: lapse stability history penalty
    1.26,   // w14: lapse retrievability penalty
    0.29,   // w15: hard penalty
    2.61    // w16: easy bonus
];

const DECAY = -0.5;
const FACTOR = Math.pow(0.9, 1 / DECAY) - 1; // ≈ 19/81

/**
 * Calculate current retrievability
 * R(t) = (1 + FACTOR * t / S) ^ DECAY
 * @param {number} daysSinceReview - days elapsed since last review
 * @param {number} stability - current stability
 * @returns {number} retrievability 0-1
 */
function retrievability(daysSinceReview, stability) {
    if (stability <= 0) return 0;
    return Math.pow(1 + (FACTOR * daysSinceReview) / stability, DECAY);
}

/**
 * Calculate next optimal interval for target retention
 * @param {number} stability - current stability
 * @param {number} targetR - desired retention (default 0.9)
 * @returns {number} interval in days
 */
function nextInterval(stability, targetR = 0.9) {
    return Math.max(1, Math.round(
        (stability / FACTOR) * (Math.pow(targetR, 1 / DECAY) - 1)
    ));
}

/**
 * Initial stability for first review (based on rating)
 */
function initStability(rating) {
    return Math.max(0.1, W[rating - 1]);
}

/**
 * Initial difficulty
 */
function initDifficulty(rating) {
    return Math.min(10, Math.max(1, W[4] - Math.exp(W[5] * (rating - 1)) + 1));
}

/**
 * Update difficulty after review
 * @param {number} D - current difficulty
 * @param {number} rating - 1-4
 * @returns {number} new difficulty
 */
function updateDifficulty(D, rating) {
    const deltD = -W[6] * (rating - 3);
    const newD = D + deltD;
    // Mean reversion toward initial difficulty
    return Math.min(10, Math.max(1, W[7] * initDifficulty(3) + (1 - W[7]) * newD));
}

/**
 * Update stability after successful review (rating 2-4)
 * @param {number} D - difficulty
 * @param {number} S - current stability
 * @param {number} R - current retrievability
 * @param {number} rating - 2, 3, or 4
 * @returns {number} new stability
 */
function updateStabilitySuccess(D, S, R, rating) {
    const hardPenalty = rating === 2 ? W[15] : 1;
    const easyBonus = rating === 4 ? W[16] : 1;

    return S * (1 +
        Math.exp(W[8]) *
        (11 - D) *
        Math.pow(S, -W[9]) *
        (Math.exp((1 - R) * W[10]) - 1) *
        hardPenalty *
        easyBonus
    );
}

/**
 * Update stability after lapse (rating 1 = Again)
 * @param {number} D - difficulty
 * @param {number} S - current stability
 * @param {number} R - current retrievability
 * @returns {number} new (reduced) stability
 */
function updateStabilityLapse(D, S, R) {
    return Math.max(0.1,
        S *
        Math.exp(W[11]) *
        Math.pow(D, -W[12]) *
        (Math.pow(S + 1, W[13]) - 1) *
        Math.exp((1 - R) * W[14])
    );
}

/**
 * Full review calculation
 * @param {object} topic - { difficulty, stability, last_review, reps, lapses }
 * @param {number} rating - 1-4
 * @returns {object} { difficulty, stability, nextReview (ISO date string), reps, lapses }
 */
function review(topic, rating) {
    const now = new Date();
    const lastReview = topic.last_review ? new Date(topic.last_review) : now;
    const daysSince = Math.max(0, (now - lastReview) / 86400000);

    let D = topic.difficulty || 5.0;
    let S = topic.stability || 1.0;
    const R = retrievability(daysSince, S);
    const isFirst = (topic.reps || 0) === 0;

    if (isFirst) {
        // First review
        D = initDifficulty(rating);
        S = initStability(rating);
    } else if (rating === 1) {
        // Lapse
        D = updateDifficulty(D, rating);
        S = updateStabilityLapse(D, S, R);
    } else {
        // Success (2-4)
        D = updateDifficulty(D, rating);
        S = updateStabilitySuccess(D, S, R, rating);
    }

    const interval = nextInterval(S);
    const nextReviewDate = new Date(now);
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    return {
        difficulty: Math.round(D * 100) / 100,
        stability: Math.round(S * 100) / 100,
        next_review: nextReviewDate.toISOString().split('T')[0],
        reps: (topic.reps || 0) + 1,
        lapses: rating === 1 ? (topic.lapses || 0) + 1 : (topic.lapses || 0),
        last_review: now.toISOString().split('T')[0],
        retrievability: Math.round(R * 100) / 100,
        interval
    };
}

module.exports = { review, retrievability, nextInterval, FACTOR, DECAY };
