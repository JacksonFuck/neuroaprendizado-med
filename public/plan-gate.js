/* ═══════════════════════════════════════════════════════════════
   Plan Gate — Frontend feature locking for free/pro plans
   ═══════════════════════════════════════════════════════════════ */

let _userPlan = null;
let _planLimits = null;
let _planUsage = null;

async function loadUserPlan() {
    try {
        const res = await fetch('/api/plan');
        if (!res.ok) return;
        const data = await res.json();
        _userPlan = data.plan;
        _planLimits = data.limits;
        _planUsage = data.usage;
        applyPlanRestrictions();
    } catch (e) { /* silent */ }
}

function applyPlanRestrictions() {
    if (_userPlan === 'pro') return;

    // Add "PRO" badges to locked features in sidebar
    const proTabs = ['ranking'];
    proTabs.forEach(tab => {
        const navItem = document.querySelector(`.nav-item[data-tab="${tab}"]`);
        if (navItem && !navItem.querySelector('.pro-badge')) {
            const badge = document.createElement('span');
            badge.className = 'pro-badge';
            badge.textContent = 'PRO';
            navItem.appendChild(badge);
        }
    });

    // Show upgrade banner in dashboard
    const dashboard = document.getElementById('tab-dashboard');
    if (dashboard && !document.getElementById('upgradeBanner')) {
        const banner = document.createElement('div');
        banner.id = 'upgradeBanner';
        banner.className = 'upgrade-banner';
        banner.innerHTML = `
            <div class="upgrade-banner-content">
                <span class="upgrade-icon">\u26A1</span>
                <div>
                    <strong>Plano Gratuito</strong> \u2014 Desbloqueie todas as 9 ferramentas, flashcards ilimitados, graficos e ranking.
                </div>
                <a href="/landing.html#pricing" class="upgrade-btn">Conhecer Pro</a>
            </div>
        `;
        dashboard.insertBefore(banner, dashboard.firstChild.nextSibling);
    }
}

function checkPlanLimit(feature, current) {
    if (_userPlan === 'pro') return true;
    if (!_planLimits) return true;

    const limit = _planLimits[feature];
    if (limit === undefined || limit === null) return true;
    if (limit === Infinity) return true;

    return current < limit;
}

function showUpgradeModal(feature) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'upgradeModal';
    overlay.innerHTML = `
        <div class="neuro-greeting" style="max-width:420px">
            <div class="greeting-brain-icon">\u26A1</div>
            <h2 class="greeting-title">Recurso Pro</h2>
            <p class="greeting-subtitle">Este recurso esta disponivel no plano Pro.</p>
            <div style="text-align:left;margin:20px 0;font-size:14px;color:#c5d0e6">
                <p>Com o <strong style="color:#00f0ff">NeuroForge Pro</strong> voce desbloqueia:</p>
                <ul style="margin:12px 0 0 20px;line-height:2">
                    <li>9 ferramentas de foco neural</li>
                    <li>Flashcards ilimitados</li>
                    <li>Topicos e materias ilimitados</li>
                    <li>N-Back com auto-progressao</li>
                    <li>Graficos e heatmap de evolucao</li>
                    <li>Ranking entre estudantes</li>
                    <li>Exportacao de dados (CSV)</li>
                </ul>
            </div>
            <a href="/landing.html#pricing" class="greeting-option" style="justify-content:center;text-decoration:none;margin-bottom:12px">
                <span style="font-size:20px">\uD83D\uDE80</span>
                <span class="option-label">Assinar Pro \u2014 R$ 29,90/mes</span>
            </a>
            <button class="greeting-skip" onclick="document.getElementById('upgradeModal').remove()">Continuar no plano gratis</button>
        </div>
    `;
    document.body.appendChild(overlay);
}
