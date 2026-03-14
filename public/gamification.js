/* ═══════════════════════════════════════════════════════════════
   GAMIFICATION — XP, Achievements & Rankings
   ═══════════════════════════════════════════════════════════════ */

let _xpLoaded = false;
let _achievementsLoaded = false;
let _rankingsLoaded = false;

// ─── XP & LEVEL ───

async function loadXPInfo() {
    if (_xpLoaded) return;
    try {
        const res = await fetch('/api/gamification/xp');
        if (!res.ok) throw new Error('Failed to load XP');
        const data = await res.json();
        renderXPBar(data);
        renderSidebarLevel(data);
        _xpLoaded = true;
    } catch (err) {
        console.error('loadXPInfo:', err);
        const bar = document.getElementById('xpBar');
        if (bar) bar.innerHTML = '<p style="color:var(--synapse-red);font-size:13px">Erro ao carregar XP</p>';
    }
}

function renderXPBar(data) {
    const container = document.getElementById('xpBar');
    const badge = document.getElementById('xpLevelBadge');
    const totalEl = document.getElementById('xpTotal');
    if (!container) return;

    const level = data.level || {};
    const currentXp = level.currentXp || 0;
    const nextLevelXp = level.nextLevelXp || 1;
    const pct = Math.min((currentXp / nextLevelXp) * 100, 100);

    if (totalEl) totalEl.textContent = (data.total_xp || 0).toLocaleString('pt-BR');

    if (badge) {
        badge.innerHTML = `<span class="level-icon">${level.icon || '🧠'}</span>`
            + `<span class="level-title">${level.title || 'Iniciante'}</span>`;
    }

    container.innerHTML =
        '<div class="xp-bar-track">'
        + `<div class="xp-bar-fill" style="width:${pct}%"></div>`
        + '</div>'
        + `<div class="xp-bar-labels">`
        + `<span>${currentXp.toLocaleString('pt-BR')} XP</span>`
        + `<span>${nextLevelXp.toLocaleString('pt-BR')} XP — ${level.nextLevelTitle || ''}</span>`
        + '</div>';

    // Recent XP entries
    if (data.recent_xp && data.recent_xp.length > 0) {
        const recentHtml = data.recent_xp.map(function (entry) {
            return '<div class="xp-recent-item">'
                + `<span class="xp-recent-source">${sanitize(entry.source || '')}</span>`
                + `<span class="xp-recent-amount">+${entry.amount} XP</span>`
                + '</div>';
        }).join('');
        container.innerHTML += '<div class="xp-recent-list">' + recentHtml + '</div>';
    }
}

function renderSidebarLevel(data) {
    const el = document.getElementById('sidebarLevel');
    if (!el) return;
    const level = data.level || {};
    el.innerHTML = `<span class="sidebar-level-icon">${level.icon || '🧠'}</span>`
        + `<span class="sidebar-level-text">${level.title || 'Iniciante'}</span>`
        + `<span class="sidebar-level-xp">${(data.total_xp || 0).toLocaleString('pt-BR')} XP</span>`;
}


// ─── ACHIEVEMENTS ───

async function loadAchievements() {
    if (_achievementsLoaded) return;
    try {
        const res = await fetch('/api/gamification/achievements');
        if (!res.ok) throw new Error('Failed to load achievements');
        const achievements = await res.json();
        renderAchievementGrid(achievements);
        _achievementsLoaded = true;
    } catch (err) {
        console.error('loadAchievements:', err);
        const grid = document.getElementById('achievementGrid');
        if (grid) grid.innerHTML = '<p style="color:var(--synapse-red);font-size:13px">Erro ao carregar conquistas</p>';
    }
}

function renderAchievementGrid(achievements) {
    const grid = document.getElementById('achievementGrid');
    if (!grid) return;

    if (!achievements || achievements.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-secondary);font-size:14px">Nenhuma conquista disponível ainda.</p>';
        return;
    }

    const cards = achievements.map(function (a) {
        const earned = !!a.earned_at;
        const cls = earned ? 'achievement-card earned' : 'achievement-card locked';
        const desc = earned ? sanitize(a.description || '') : '???';
        const dateStr = earned
            ? '<span class="achievement-date">' + formatDate(a.earned_at) + '</span>'
            : '';
        const xpBadge = a.xp_reward
            ? `<span class="achievement-xp">+${a.xp_reward} XP</span>`
            : '';

        return `<div class="${cls}">`
            + `<div class="achievement-icon">${a.icon || '🏆'}</div>`
            + `<div class="achievement-info">`
            + `<h4 class="achievement-name">${sanitize(a.name || '')}</h4>`
            + `<p class="achievement-desc">${desc}</p>`
            + `<div class="achievement-meta">${xpBadge}${dateStr}</div>`
            + '</div></div>';
    }).join('');

    grid.innerHTML = cards;
}


// ─── RANKINGS ───

async function loadRankings(period, metric) {
    period = period || (document.getElementById('rankingPeriod') || {}).value || 'weekly';
    metric = metric || (document.getElementById('rankingMetric') || {}).value || 'xp';

    const table = document.getElementById('rankingTable');
    if (table) table.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:24px;color:var(--text-secondary)">Carregando...</td></tr>';

    try {
        const res = await fetch(`/api/gamification/rankings?period=${encodeURIComponent(period)}&metric=${encodeURIComponent(metric)}`);
        if (!res.ok) throw new Error('Failed to load rankings');
        const rankings = await res.json();
        renderLeaderboard(rankings);
        _rankingsLoaded = true;
    } catch (err) {
        console.error('loadRankings:', err);
        if (table) table.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:24px;color:var(--synapse-red)">Erro ao carregar ranking</td></tr>';
    }
}

function renderLeaderboard(rankings) {
    const table = document.getElementById('rankingTable');
    if (!table) return;

    if (!rankings || rankings.length === 0) {
        table.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:24px;color:var(--text-secondary)">Nenhum dado de ranking disponível.</td></tr>';
        return;
    }

    const MEDAL_MAP = { 1: '🥇', 2: '🥈', 3: '🥉' };

    const rows = rankings.map(function (r) {
        const isCurrent = r.is_current_user;
        const rowCls = isCurrent ? 'ranking-row current-user' : 'ranking-row';
        const positionCls = r.rank <= 3 ? 'ranking-position top-' + r.rank : 'ranking-position';
        const medal = MEDAL_MAP[r.rank] || '';
        const displayName = isCurrent
            ? sanitize(r.name || 'Você')
            : sanitize(r.name || 'Estudante #' + r.rank);
        const formattedValue = formatRankingValue(r.value, getCurrentMetric());

        return `<tr class="${rowCls}">`
            + `<td class="${positionCls}">${medal} ${r.rank}</td>`
            + `<td class="ranking-name">${displayName}</td>`
            + `<td class="ranking-value">${formattedValue}</td>`
            + '</tr>';
    }).join('');

    table.innerHTML = rows;
}

function getCurrentMetric() {
    return (document.getElementById('rankingMetric') || {}).value || 'xp';
}

function formatRankingValue(value, metric) {
    if (value == null) return '—';
    switch (metric) {
        case 'xp': return Number(value).toLocaleString('pt-BR') + ' XP';
        case 'minutes': return Number(value).toLocaleString('pt-BR') + ' min';
        case 'streak': return value + ' dias';
        default: return String(value);
    }
}


// ─── XP POPUP ───

function showXPPopup(amount, source) {
    const container = document.getElementById('xpPopupContainer');
    if (!container) return;

    const popup = document.createElement('div');
    popup.className = 'xp-popup';
    popup.textContent = '+' + amount + ' XP';
    if (source) popup.setAttribute('title', source);

    container.appendChild(popup);

    // Force reflow so the animation triggers
    popup.offsetHeight; // eslint-disable-line no-unused-expressions

    popup.classList.add('xp-popup-animate');

    setTimeout(function () {
        if (popup.parentNode) popup.parentNode.removeChild(popup);
    }, 2200);
}


// ─── UTILITIES ───

function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    } catch {
        return '';
    }
}


// ─── TAB LAZY LOADING ───

const _origSwitchTab2 = window.switchTab;
window.switchTab = function (tabName) {
    _origSwitchTab2(tabName);
    if (tabName === 'achievements') {
        loadXPInfo();
        loadAchievements();
    }
    if (tabName === 'ranking') {
        loadRankings();
    }
};


// ─── RANKING SELECTORS ───

document.addEventListener('DOMContentLoaded', function () {
    const periodSelect = document.getElementById('rankingPeriod');
    const metricSelect = document.getElementById('rankingMetric');

    if (periodSelect) {
        periodSelect.addEventListener('change', function () {
            _rankingsLoaded = false;
            loadRankings(periodSelect.value, (metricSelect || {}).value);
        });
    }

    if (metricSelect) {
        metricSelect.addEventListener('change', function () {
            _rankingsLoaded = false;
            loadRankings((periodSelect || {}).value, metricSelect.value);
        });
    }
});


// ─── INJECT STYLES ───

(function injectGamificationStyles() {
    const style = document.createElement('style');
    style.textContent = `
/* XP Bar */
.xp-bar-track {
    width: 100%;
    height: 14px;
    background: rgba(255,255,255,0.06);
    border-radius: 7px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.08);
}
.xp-bar-fill {
    height: 100%;
    border-radius: 7px;
    background: linear-gradient(90deg, var(--synapse-cyan), var(--synapse-magenta));
    transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
.xp-bar-labels {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 6px;
}

/* Level Badge */
.level-icon { font-size: 22px; margin-right: 6px; }
.level-title { font-weight: 700; font-size: 15px; color: var(--synapse-gold); }

/* Sidebar Level */
#sidebarLevel {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    font-size: 12px;
    color: var(--text-secondary);
}
.sidebar-level-icon { font-size: 16px; }
.sidebar-level-text { font-weight: 600; color: var(--synapse-gold); }
.sidebar-level-xp { margin-left: auto; opacity: 0.7; }

/* XP Recent */
.xp-recent-list { margin-top: 12px; display: flex; flex-direction: column; gap: 4px; }
.xp-recent-item {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 4px;
    background: rgba(255,255,255,0.03);
}
.xp-recent-source { color: var(--text-secondary); }
.xp-recent-amount { color: var(--synapse-gold); font-weight: 600; }

/* Achievement Grid */
#achievementGrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
}
.achievement-card {
    display: flex;
    gap: 12px;
    padding: 16px;
    border-radius: 8px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.achievement-card.earned {
    border-color: var(--synapse-gold);
    box-shadow: 0 0 12px rgba(255,190,11,0.15);
}
.achievement-card.locked {
    opacity: 0.5;
    filter: grayscale(0.6);
}
.achievement-card.locked .achievement-icon { opacity: 0.4; }
.achievement-icon { font-size: 28px; flex-shrink: 0; line-height: 1; }
.achievement-info { min-width: 0; }
.achievement-name {
    font-size: 14px;
    font-weight: 700;
    margin: 0 0 4px;
    color: var(--text-primary);
}
.achievement-desc {
    font-size: 12px;
    color: var(--text-secondary);
    margin: 0 0 6px;
    line-height: 1.4;
}
.achievement-meta { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.achievement-xp {
    font-size: 11px;
    font-weight: 700;
    color: var(--synapse-gold);
    background: rgba(255,190,11,0.12);
    padding: 2px 6px;
    border-radius: 4px;
}
.achievement-date { font-size: 11px; color: var(--text-secondary); }

/* Ranking Table */
#rankingTable tr { transition: background 0.2s ease; }
#rankingTable tr:hover { background: rgba(255,255,255,0.03); }
.ranking-row.current-user {
    background: rgba(0,240,255,0.06);
    border-left: 3px solid var(--synapse-cyan);
}
.ranking-row.current-user td { font-weight: 700; }
.ranking-position { text-align: center; width: 60px; font-weight: 600; }
.ranking-position.top-1 { color: #ffd700; }
.ranking-position.top-2 { color: #c0c0c0; }
.ranking-position.top-3 { color: #cd7f32; }
.ranking-name { padding-left: 8px; }
.ranking-value { text-align: right; font-variant-numeric: tabular-nums; color: var(--synapse-cyan); font-weight: 600; }

/* XP Popup */
#xpPopupContainer {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    pointer-events: none;
    display: flex;
    flex-direction: column-reverse;
    gap: 8px;
}
.xp-popup {
    padding: 8px 16px;
    font-size: 15px;
    font-weight: 800;
    color: var(--synapse-gold);
    background: rgba(0,0,0,0.75);
    border: 1px solid var(--synapse-gold);
    border-radius: 6px;
    opacity: 0;
    transform: translateY(20px);
    pointer-events: none;
}
.xp-popup-animate {
    animation: xpFlyUp 2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
@keyframes xpFlyUp {
    0%   { opacity: 0; transform: translateY(20px); }
    15%  { opacity: 1; transform: translateY(0); }
    70%  { opacity: 1; transform: translateY(-10px); }
    100% { opacity: 0; transform: translateY(-30px); }
}
@media (prefers-reduced-motion: reduce) {
    .xp-popup-animate { animation: none; opacity: 1; transform: none; }
    .xp-bar-fill { transition: none; }
}
`;
    document.head.appendChild(style);
})();
