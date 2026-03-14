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
                    <strong>Plano Gratuito</strong> — Desbloqueie todas as 9 ferramentas, flashcards ilimitados, gráficos e ranking.
                </div>
                <button class="upgrade-btn" onclick="startProCheckout()">Assinar Pro — R$ 29,90/mês</button>
            </div>
        `;
        dashboard.insertBefore(banner, dashboard.firstChild.nextSibling);
    }
}

// Go to Stripe Checkout
async function startProCheckout() {
    try {
        const btn = event?.target;
        if (btn) { btn.disabled = true; btn.textContent = 'Redirecionando...'; }

        const res = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();

        if (data.url) {
            window.location.href = data.url;
        } else {
            alert(data.error || 'Erro ao iniciar pagamento. Tente novamente.');
            if (btn) { btn.disabled = false; btn.textContent = 'Assinar Pro — R$ 29,90/mês'; }
        }
    } catch (e) {
        alert('Erro de conexão. Tente novamente.');
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
            <p class="greeting-subtitle">Este recurso está disponível no plano Pro.</p>
            <div style="text-align:left;margin:20px 0;font-size:14px;color:#c5d0e6">
                <p>Com o <strong style="color:#00f0ff">NeuroForge Pro</strong> você desbloqueia:</p>
                <ul style="margin:12px 0 0 20px;line-height:2">
                    <li>9 ferramentas de foco neural</li>
                    <li>Flashcards ilimitados</li>
                    <li>Tópicos e matérias ilimitados</li>
                    <li>N-Back com auto-progressão</li>
                    <li>Gráficos e heatmap de evolução</li>
                    <li>Ranking entre estudantes</li>
                    <li>Exportação de dados (CSV)</li>
                </ul>
            </div>
            <button onclick="startProCheckout();document.getElementById('upgradeModal').remove()" class="greeting-option" style="justify-content:center;border:none;cursor:pointer;margin-bottom:12px;width:100%">
                <span style="font-size:20px">🚀</span>
                <span class="option-label">Assinar Pro — R$ 29,90/mês</span>
            </button>
            <p style="text-align:center;font-size:12px;color:#5e6a8a;margin-bottom:12px">7 dias grátis para testar • Cancele quando quiser</p>
            <button class="greeting-skip" onclick="document.getElementById('upgradeModal').remove()">Continuar no plano grátis</button>
        </div>
    `;
    document.body.appendChild(overlay);
}
