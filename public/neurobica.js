/**
 * NeuroForge — Forje sinapses. Domine o conhecimento.
 * Copyright (c) 2026 Jackson Erasmo Fuck. All rights reserved.
 * INPI Registration: 512026001683-5
 * Licensed under proprietary license. See LICENSE file.
 */

/* ====== NEUROBICA MODULE ====== */

const Neurobica = (function () {

    /* ── constants ── */
    const CATEGORY_META = {
        motor:       { label: 'Motor',       color: '#00f0ff', icon: '🤸' },
        linguistica: { label: 'Linguística', color: '#e040fb', icon: '🗣️' },
        memoria:     { label: 'Memória',     color: '#ffbe0b', icon: '💾' },
        sensorial:   { label: 'Sensorial',   color: '#00e676', icon: '👁️' },
        atencao:     { label: 'Atenção',     color: '#448aff', icon: '🎯' },
        social:      { label: 'Social',      color: '#ea80fc', icon: '🤝' },
    };
    const XP_PER_CARD = 15;

    /* ── state ── */
    let dailyCard = null;
    let allCards = [];
    let completedIds = new Set();
    let streak = 0;
    let activeView = 'daily';

    /* ====== INITIALIZATION ====== */

    function init() {
        loadCompletedFromStorage();
        fetchDaily();
        fetchAllCards();
        bindViewToggle();
    }

    function loadCompletedFromStorage() {
        try {
            const raw = localStorage.getItem('neurobica_completed');
            if (raw) {
                const data = JSON.parse(raw);
                if (data.date === todayStr()) {
                    completedIds = new Set(data.ids || []);
                    streak = data.streak || 0;
                } else {
                    completedIds = new Set();
                    streak = data.streak || 0;
                }
            }
        } catch { /* ignore corrupt storage */ }
    }

    function saveCompletedToStorage() {
        localStorage.setItem('neurobica_completed', JSON.stringify({
            date: todayStr(),
            ids: [...completedIds],
            streak,
        }));
    }

    function todayStr() {
        return new Date().toISOString().slice(0, 10);
    }

    /* ====== API CALLS ====== */

    async function fetchDaily() {
        try {
            const res = await fetch('/api/neurobica/daily');
            if (!res.ok) throw new Error(res.statusText);
            const data = await res.json();
            dailyCard = data.card || data;
            streak = data.streak ?? streak;
            renderDaily();
        } catch (err) {
            console.error('Neurobica fetchDaily error:', err);
            renderDailyError();
        }
    }

    async function fetchAllCards() {
        try {
            const res = await fetch('/api/neurobica/cards');
            if (!res.ok) throw new Error(res.statusText);
            const data = await res.json();
            allCards = data.cards || data.categories?.flatMap(c => c.cards) || data;
            if (data.completedIds) {
                data.completedIds.forEach(id => completedIds.add(id));
            }
            renderDeck();
            renderStats();
        } catch (err) {
            console.error('Neurobica fetchAllCards error:', err);
        }
    }

    async function completeCard(cardId, rating) {
        try {
            const res = await fetch('/api/neurobica/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cardId, rating }),
            });
            if (!res.ok) throw new Error(res.statusText);
            const data = await res.json();
            completedIds.add(cardId);
            streak = data.streak ?? streak + 1;
            saveCompletedToStorage();
            showXpAnimation();
            renderDaily();
            renderDeck();
            renderStats();
            if (typeof showToast === 'function') {
                showToast(`+${XP_PER_CARD} XP — Desafio concluído!`, 'success');
            }
        } catch (err) {
            console.error('Neurobica complete error:', err);
            if (typeof showToast === 'function') {
                showToast('Erro ao completar desafio.', 'danger');
            }
        }
    }

    /* ====== VIEW TOGGLE ====== */

    function bindViewToggle() {
        const container = document.getElementById('neurobicaViewTabs');
        if (!container) return;
        container.addEventListener('click', (e) => {
            const tab = e.target.closest('[data-nview]');
            if (!tab) return;
            activeView = tab.dataset.nview;
            container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('neurobicaDailyView').style.display = activeView === 'daily' ? 'block' : 'none';
            document.getElementById('neurobicaDeckView').style.display = activeView === 'deck' ? 'block' : 'none';
        });
    }

    /* ====== RENDER: DAILY CARD ====== */

    function renderDaily() {
        const container = document.getElementById('neurobicaDailyView');
        if (!container || !dailyCard) return;

        const catKey = dailyCard.cat || dailyCard.category || 'motor';
        const cat = CATEGORY_META[catKey] || { label: '???', color: '#888', icon: '❓' };
        const isCompleted = completedIds.has(dailyCard.id);
        const diff = dailyCard.difficulty || 1;
        const difficultyBrains = '🧠'.repeat(diff);

        container.innerHTML = `
            <div class="nb-daily-card anim-fade-up" style="--cat-color:${cat.color}">
                <div class="nb-daily-header">
                    <span class="nb-cat-badge" style="background:${cat.color}15;color:${cat.color};border-color:${cat.color}40">
                        ${cat.icon} ${cat.label}
                    </span>
                    <span class="nb-difficulty" title="Dificuldade ${diff}">${difficultyBrains}</span>
                </div>

                <h3 class="nb-daily-title">Desafio do Dia</h3>
                <p class="nb-daily-challenge">${dailyCard.challenge}</p>

                ${dailyCard.duration ? `<span class="nb-duration-badge">⏱ ${dailyCard.duration}</span>` : ''}

                <details class="nb-neurobase">
                    <summary>🔬 Por que funciona?</summary>
                    <p>${dailyCard.neuroBase || dailyCard.neurobase || 'Exercícios neuróbicos fortalecem conexões sinápticas ao engajar circuitos neurais pouco utilizados.'}</p>
                </details>

                ${isCompleted ? renderCompletedState() : renderActionState(dailyCard.id)}
            </div>

            <div class="nb-streak-bar">
                <span class="nb-streak-flame">🔥</span>
                <span class="nb-streak-count">${streak}</span>
                <span class="nb-streak-label">dia${streak !== 1 ? 's' : ''} de sequência</span>
            </div>
        `;
    }

    function renderCompletedState() {
        return `
            <div class="nb-completed-state anim-scale-in">
                <span class="nb-check-icon">✅</span>
                <span>Concluído hoje!</span>
            </div>
        `;
    }

    function renderActionState(cardId) {
        return `
            <button class="btn btn-primary btn-lg nb-complete-btn" onclick="Neurobica.startComplete(${cardId})">
                ⚡ Completar Desafio
            </button>
            <div class="nb-rating-area" id="nbRating_${cardId}" style="display:none">
                <p class="nb-rating-prompt">Como foi o desafio?</p>
                <div class="nb-stars">
                    ${[1,2,3,4,5].map(n => `
                        <button class="nb-star" data-rating="${n}" onclick="Neurobica.submitRating(${cardId}, ${n})" aria-label="${n} estrela${n>1?'s':''}">
                            ★
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function startComplete(cardId) {
        const btn = document.querySelector('.nb-complete-btn');
        if (btn) btn.style.display = 'none';
        const ratingArea = document.getElementById(`nbRating_${cardId}`);
        if (ratingArea) {
            ratingArea.style.display = 'flex';
            ratingArea.classList.add('anim-fade-up');
        }
    }

    function submitRating(cardId, rating) {
        document.querySelectorAll('.nb-star').forEach((s, i) => {
            s.classList.toggle('active', i < rating);
        });
        completeCard(cardId, rating);
    }

    function renderDailyError() {
        const container = document.getElementById('neurobicaDailyView');
        if (!container) return;
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">🧩</div>
                <p>Não foi possível carregar o desafio do dia. Tente novamente.</p>
                <button class="btn btn-secondary btn-sm" onclick="Neurobica.init()" style="margin-top:16px">🔄 Tentar novamente</button>
            </div>
        `;
    }

    /* ====== RENDER: DECK BROWSER ====== */

    function renderDeck() {
        const container = document.getElementById('neurobicaDeckView');
        if (!container || !allCards.length) return;

        const byCategory = {};
        for (const card of allCards) {
            const key = card.cat || card.category || 'motor';
            if (!byCategory[key]) byCategory[key] = [];
            byCategory[key].push(card);
        }

        const totalCompleted = allCards.filter(c => completedIds.has(c.id)).length;

        container.innerHTML = `
            <div class="nb-overall-progress">
                <div class="nb-overall-bar">
                    <div class="progress-bar"><div class="progress-fill" style="width:${(totalCompleted / allCards.length * 100).toFixed(1)}%"></div></div>
                </div>
                <span class="nb-overall-label">${totalCompleted}/${allCards.length} desafios concluídos</span>
            </div>

            <div class="nb-category-grid">
                ${Object.entries(CATEGORY_META).map(([key, meta]) => {
                    const cards = byCategory[key] || [];
                    const done = cards.filter(c => completedIds.has(c.id)).length;
                    const pct = cards.length ? (done / cards.length * 100).toFixed(0) : 0;
                    return `
                        <div class="nb-category-tile" style="--cat-color:${meta.color}" onclick="Neurobica.toggleCategory('${key}')">
                            <div class="nb-tile-header">
                                <span class="nb-tile-icon">${meta.icon}</span>
                                <span class="nb-tile-name">${meta.label}</span>
                            </div>
                            <div class="nb-tile-progress">
                                <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${meta.color}"></div></div>
                                <span class="nb-tile-count">${done}/${cards.length}</span>
                            </div>
                            <div class="nb-tile-cards" id="nbCat_${key}" style="display:none">
                                ${cards.map(c => {
                                    const isDone = completedIds.has(c.id);
                                    return `
                                        <div class="nb-mini-card ${isDone ? 'completed' : ''}">
                                            <span class="nb-mini-check">${isDone ? '✅' : '⬜'}</span>
                                            <span class="nb-mini-text">${truncate(c.challenge, 60)}</span>
                                            <span class="nb-mini-diff">${'🧠'.repeat(c.difficulty || 1)}</span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function toggleCategory(key) {
        const el = document.getElementById(`nbCat_${key}`);
        if (!el) return;
        const isOpen = el.style.display !== 'none';
        el.style.display = isOpen ? 'none' : 'block';
        if (!isOpen) el.classList.add('anim-fade-up');
    }

    /* ====== RENDER: STATS ====== */

    function renderStats() {
        const container = document.getElementById('neurobicaStats');
        if (!container || !allCards.length) return;

        const byCategory = {};
        for (const card of allCards) {
            const key = card.cat || card.category || 'motor';
            if (!byCategory[key]) byCategory[key] = { total: 0, done: 0 };
            byCategory[key].total++;
            if (completedIds.has(card.id)) byCategory[key].done++;
        }

        const weekDots = buildWeekDots();

        container.innerHTML = `
            <div class="nb-stats-grid">
                <div class="nb-stat-block">
                    <div class="nb-stat-icon">🔥</div>
                    <div class="nb-stat-value">${streak}</div>
                    <div class="nb-stat-label">Sequência</div>
                </div>
                <div class="nb-stat-block">
                    <div class="nb-stat-icon">✅</div>
                    <div class="nb-stat-value">${completedIds.size}</div>
                    <div class="nb-stat-label">Concluídos</div>
                </div>
                <div class="nb-stat-block">
                    <div class="nb-stat-icon">🧠</div>
                    <div class="nb-stat-value">${allCards.filter(c => completedIds.has(c.id)).length}/${allCards.length}</div>
                    <div class="nb-stat-label">Total</div>
                </div>
            </div>

            <div class="nb-radar-section">
                <h4 class="nb-section-title">Progresso por Categoria</h4>
                <div class="nb-radar-bars">
                    ${Object.entries(CATEGORY_META).map(([key, meta]) => {
                        const info = byCategory[key] || { total: 0, done: 0 };
                        const pct = info.total ? (info.done / info.total * 100).toFixed(0) : 0;
                        return `
                            <div class="nb-radar-row">
                                <span class="nb-radar-label">${meta.icon} ${meta.label}</span>
                                <div class="nb-radar-bar">
                                    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${meta.color}"></div></div>
                                </div>
                                <span class="nb-radar-pct">${pct}%</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <div class="nb-week-section">
                <h4 class="nb-section-title">Atividade Semanal</h4>
                <div class="nb-week-dots">
                    ${weekDots}
                </div>
            </div>
        `;
    }

    function buildWeekDots() {
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const today = new Date();
        let html = '';
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dayName = days[d.getDay()];
            const dateStr = d.toISOString().slice(0, 10);
            const wasActive = dateStr === todayStr() ? completedIds.size > 0 : getHistoryDot(dateStr);
            html += `
                <div class="nb-week-day">
                    <div class="nb-dot ${wasActive ? 'active' : ''}"></div>
                    <span class="nb-day-label">${dayName}</span>
                </div>
            `;
        }
        return html;
    }

    function getHistoryDot(dateStr) {
        try {
            const history = JSON.parse(localStorage.getItem('neurobica_history') || '{}');
            return !!history[dateStr];
        } catch { return false; }
    }

    /* ====== XP ANIMATION ====== */

    function showXpAnimation() {
        const el = document.createElement('div');
        el.className = 'nb-xp-float';
        el.textContent = `+${XP_PER_CARD} XP`;
        const card = document.querySelector('.nb-daily-card');
        if (card) {
            card.appendChild(el);
        } else {
            document.body.appendChild(el);
        }
        setTimeout(() => el.remove(), 1500);
    }

    /* ====== HELPERS ====== */

    function truncate(str, max) {
        if (!str) return '';
        return str.length > max ? str.slice(0, max) + '…' : str;
    }

    /* ====== DASHBOARD WIDGET ====== */

    async function loadDashboardWidget() {
        const container = document.getElementById('nbDashCard');
        const streakEl = document.getElementById('nbDashStreak');
        if (!container) return;

        try {
            const res = await fetch('/api/neurobica/daily');
            if (!res.ok) {
                container.innerHTML = '<p style="color:var(--text-dim);font-size:13px">Faça login para ver o desafio do dia.</p>';
                return;
            }
            const data = await res.json();
            const card = data.card || data;
            const isCompleted = data.completed;

            if (streakEl && data.streak > 0) {
                streakEl.innerHTML = `🔥 ${data.streak} dia${data.streak !== 1 ? 's' : ''}`;
            }

            const catKey = card.cat || card.category || 'motor';
            const cat = CATEGORY_META[catKey] || { label: '???', color: '#888', icon: '❓' };

            container.innerHTML = `
                <div class="nb-dash-badge" style="background:${cat.color}15;color:${cat.color};border-color:${cat.color}40">
                    ${cat.icon} ${cat.label}
                </div>
                <p class="nb-dash-challenge">${card.challenge}</p>
                ${isCompleted ? '<span class="nb-dash-done">✅ Concluído hoje!</span>' : ''}
            `;
        } catch {
            container.innerHTML = '<p style="color:var(--text-dim);font-size:13px">Não foi possível carregar o desafio.</p>';
        }
    }

    /* ====== PUBLIC API ====== */

    return {
        init,
        startComplete,
        submitRating,
        toggleCategory,
        loadDashboardWidget,
    };

})();

/* ── auto-init when tab becomes visible ── */
document.addEventListener('DOMContentLoaded', () => {
    // Load dashboard widget immediately
    Neurobica.loadDashboardWidget();

    let initialized = false;
    const observer = new MutationObserver(() => {
        if (initialized) return;
        const sec = document.getElementById('tab-neurobica');
        if (sec && sec.classList.contains('active')) {
            initialized = true;
            Neurobica.init();
            observer.disconnect();
        }
    });
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
});
