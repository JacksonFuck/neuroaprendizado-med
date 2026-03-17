/**
 * NeuroForge — Forje sinapses. Domine o conhecimento.
 * Copyright (c) 2026 Jackson Erasmo Fuck. All rights reserved.
 * INPI Registration: 512026001683-5
 * Licensed under proprietary license. See LICENSE file.
 */
const express = require('express');
const pool = require('../config/db');
const { ensureAuth } = require('../middleware/auth');
const router = express.Router();

// Initialize Stripe (will be null if key not configured)
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? require('stripe')(stripeKey) : null;

// POST /api/stripe/checkout — Create Checkout Session for Pro subscription
router.post('/checkout', ensureAuth, async (req, res) => {
    if (!stripe) {
        return res.status(503).json({ error: 'Pagamentos ainda não configurados. Entre em contato.' });
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
        return res.status(503).json({ error: 'Plano Pro ainda não configurado.' });
    }

    try {
        const baseUrl = process.env.BASE_URL || 'https://neuroaprendizado.unipar.jacksonuti.cloud';

        // Check if user already has a Stripe customer
        let customerId = req.user.stripe_customer_id;

        if (!customerId) {
            // Create Stripe customer
            const customer = await stripe.customers.create({
                email: req.user.email,
                name: req.user.name,
                metadata: {
                    neuroforge_user_id: String(req.user.id)
                }
            });
            customerId = customer.id;
            await pool.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customerId, req.user.id]);
        }

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            line_items: [{
                price: priceId,
                quantity: 1
            }],
            success_url: `${baseUrl}/index.html?upgraded=true`,
            cancel_url: `${baseUrl}/landing.html#pricing`,
            subscription_data: {
                trial_period_days: 7,
                metadata: {
                    neuroforge_user_id: String(req.user.id)
                }
            },
            allow_promotion_codes: true,
            billing_address_collection: 'auto',
            locale: 'pt-BR'
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error('Stripe checkout error:', err);
        res.status(500).json({ error: 'Erro ao criar sessão de pagamento.' });
    }
});

// POST /api/stripe/webhook — Handle Stripe webhook events
// IMPORTANT: This route must use raw body parser, not JSON
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe) return res.sendStatus(400);

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`[Stripe] Event: ${event.type}`);

    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;
            const userId = session.subscription
                ? (await getNeuroforgeUserId(session.customer))
                : null;

            if (userId) {
                await pool.query(
                    `UPDATE users SET plan = 'pro', stripe_subscription_id = $1, plan_expires_at = NULL WHERE id = $2`,
                    [session.subscription, userId]
                );
                console.log(`[Stripe] User ${userId} upgraded to Pro`);

                // Send celebration message
                try {
                    const { sendSystemMessage } = require('./messages');
                    await sendSystemMessage(pool, userId, 'achievement',
                        '🚀 Bem-vindo ao NeuroForge Pro!',
                        'Todas as ferramentas estão desbloqueadas! Flashcards ilimitados, 9 ferramentas de foco, gráficos completos, ranking e exportação. Forje sinapses sem limites!',
                        'high'
                    );
                } catch (e) { /* non-blocking */ }
            }
            break;
        }

        case 'invoice.paid': {
            const invoice = event.data.object;
            const userId = await getNeuroforgeUserId(invoice.customer);
            if (userId) {
                // Renew pro on each successful payment
                await pool.query(
                    `UPDATE users SET plan = 'pro', plan_expires_at = NULL WHERE id = $1`,
                    [userId]
                );
                console.log(`[Stripe] User ${userId} payment confirmed`);
            }
            break;
        }

        case 'invoice.payment_failed': {
            const invoice = event.data.object;
            const userId = await getNeuroforgeUserId(invoice.customer);
            if (userId) {
                try {
                    const { sendSystemMessage } = require('./messages');
                    await sendSystemMessage(pool, userId, 'reminder',
                        '⚠️ Falha no pagamento',
                        'Seu pagamento do NeuroForge Pro falhou. Atualize seu método de pagamento para continuar com acesso completo.',
                        'high'
                    );
                } catch (e) { /* non-blocking */ }
                console.log(`[Stripe] User ${userId} payment failed`);
            }
            break;
        }

        case 'customer.subscription.deleted': {
            const subscription = event.data.object;
            const userId = await getNeuroforgeUserId(subscription.customer);
            if (userId) {
                await pool.query(
                    `UPDATE users SET plan = 'free', stripe_subscription_id = NULL, plan_expires_at = NOW() WHERE id = $1`,
                    [userId]
                );
                try {
                    const { sendSystemMessage } = require('./messages');
                    await sendSystemMessage(pool, userId, 'reminder',
                        '📋 Assinatura cancelada',
                        'Seu plano Pro foi cancelado. Você ainda pode usar o NeuroForge com o plano gratuito. Volte quando quiser!',
                        'normal'
                    );
                } catch (e) { /* non-blocking */ }
                console.log(`[Stripe] User ${userId} downgraded to free`);
            }
            break;
        }

        case 'customer.subscription.updated': {
            const subscription = event.data.object;
            const userId = await getNeuroforgeUserId(subscription.customer);
            if (userId && subscription.status === 'active') {
                await pool.query(
                    `UPDATE users SET plan = 'pro', plan_expires_at = NULL WHERE id = $1`,
                    [userId]
                );
            } else if (userId && ['past_due', 'unpaid'].includes(subscription.status)) {
                // Grace period — keep pro but warn
                try {
                    const { sendSystemMessage } = require('./messages');
                    await sendSystemMessage(pool, userId, 'reminder',
                        '⏳ Pagamento pendente',
                        'Sua assinatura está com pagamento pendente. Atualize seu método de pagamento para evitar perda de acesso.',
                        'high'
                    );
                } catch (e) { /* non-blocking */ }
            }
            break;
        }
    }

    res.json({ received: true });
});

// GET /api/stripe/portal — Customer portal for managing subscription
router.get('/portal', ensureAuth, async (req, res) => {
    if (!stripe) return res.status(503).json({ error: 'Stripe não configurado.' });

    const customerId = req.user.stripe_customer_id;
    if (!customerId) {
        return res.status(400).json({ error: 'Você não tem uma assinatura ativa.' });
    }

    try {
        const baseUrl = process.env.BASE_URL || 'https://neuroaprendizado.unipar.jacksonuti.cloud';
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${baseUrl}/index.html`
        });
        res.json({ url: portalSession.url });
    } catch (err) {
        console.error('Portal error:', err.message);
        if (err.code === 'resource_missing') {
            // Customer was created in test mode or deleted — clear invalid data
            await pool.query(
                'UPDATE users SET stripe_customer_id = NULL, stripe_subscription_id = NULL WHERE id = $1',
                [req.user.id]
            );
            return res.status(400).json({ error: 'Seu plano Pro está ativo, mas não há assinatura Stripe vinculada. Contate o administrador.' });
        }
        res.status(500).json({ error: 'Erro ao abrir portal de pagamentos.' });
    }
});

// Helper: get neuroforge user ID from Stripe customer ID
async function getNeuroforgeUserId(stripeCustomerId) {
    try {
        const { rows } = await pool.query(
            'SELECT id FROM users WHERE stripe_customer_id = $1',
            [stripeCustomerId]
        );
        return rows[0]?.id || null;
    } catch (e) {
        console.error('Error finding user:', e);
        return null;
    }
}

module.exports = router;
