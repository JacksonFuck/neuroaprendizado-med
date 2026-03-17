/**
 * NeuroForge — Forje sinapses. Domine o conhecimento.
 * Copyright (c) 2026 Jackson Erasmo Fuck. All rights reserved.
 * INPI Registration: 512026001683-5
 * Licensed under proprietary license. See LICENSE file.
 */
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pgSession = require('connect-pg-simple')(session);
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const pool = require('./config/db');

const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3005;

// Security: require strong SESSION_SECRET in production
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'dev-secret-change-me') {
    console.error('FATAL: SESSION_SECRET must be set to a strong random value');
    if (process.env.NODE_ENV === 'production') process.exit(1);
}

// Trust nginx proxy for secure cookies
app.set('trust proxy', 1);

// Security & performance
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "*.googleusercontent.com"],
            connectSrc: ["'self'"]
        }
    }
}));
app.use(compression());

// Rate limiting — applied before routes to mitigate brute-force and abuse
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { error: 'Muitas tentativas. Aguarde 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: { error: 'Limite de cadastros atingido. Tente em 1 hora.' }
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Limite de requisicoes atingido.' }
});

app.use('/auth/login', authLimiter);
app.use('/auth/forgot-password', authLimiter);
app.use('/auth/register', registerLimiter);
app.use('/api/register-free', registerLimiter);
app.use('/api/', apiLimiter);

// Stripe webhook needs raw body — must come before express.json()
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Sessions stored in PostgreSQL
app.use(session({
    store: new pgSession({ pool, tableName: 'session' }),
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    }
}));

// Passport Google OAuth
app.use(passport.initialize());
app.use(passport.session());

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        proxy: true
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const { rows } = await pool.query(
                'SELECT * FROM users WHERE google_id = $1',
                [profile.id]
            );

            if (rows.length) {
                await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [rows[0].id]);
                return done(null, rows[0]);
            }

            const { rows: newUser } = await pool.query(
                `INSERT INTO users (google_id, email, name, avatar_url)
           VALUES ($1, $2, $3, $4) RETURNING *`,
                [
                    profile.id,
                    profile.emails[0].value,
                    profile.displayName,
                    profile.photos?.[0]?.value || null
                ]
            );
            done(null, newUser[0]);
        } catch (err) {
            done(err, null);
        }
    }));
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        done(null, rows[0] || null);
    } catch (err) {
        done(err, null);
    }
});

// Attach plan info to all requests after passport
const { attachPlan } = require('./middleware/plan-gate');
app.use(attachPlan);

// Static files (index: false prevents auto-serving index.html on /, so our route handles it)
app.use(express.static(path.join(__dirname, '..', 'public'), { index: false }));

// API routes
app.use('/auth', require('./routes/auth'));
app.use('/api/diary', require('./routes/diary'));
app.use('/api/spaced', require('./routes/spaced'));
app.use('/api/pomodoro', require('./routes/pomodoro'));
app.use('/api/content', require('./routes/content'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/suggestions', require('./routes/suggestions'));
app.use('/api/nback', require('./routes/nback'));
app.use('/api/planner', require('./routes/planner'));
app.use('/api/gamification', require('./routes/gamification'));
app.use('/api/charts', require('./routes/charts'));
app.use('/api/export', require('./routes/export'));
app.use('/api/flashcards', require('./routes/flashcards'));
app.use('/api/unified-review', require('./routes/unified-review'));
app.use('/api/survey', require('./routes/survey'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/register-free', require('./routes/register-free'));
app.use('/api/plan', require('./routes/plan'));
app.use('/api/stripe', require('./routes/stripe'));
app.use('/api/assessment', require('./routes/assessment'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/neurobica', require('./routes/neurobica'));

// Landing page — root serves landing for visitors, redirects logged users to /app
app.get('/', (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return res.redirect('/app');
    }
    res.sendFile(path.join(__dirname, '..', 'public', 'landing.html'));
});

// Login page — dedicated route
app.get('/login', (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return res.redirect('/app');
    }
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

// App dashboard — requires authentication
app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// SPA fallback — serve index.html (dashboard) for non-API routes
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
        return res.status(404).json({ error: 'Rota não encontrada' });
    }
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, _next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
    console.log(`🧠 Neuroaprendizado Med running on port ${PORT}`);
});
