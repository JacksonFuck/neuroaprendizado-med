/* ═══════════════════════════════════════════════════════════════
   Plan Gate — Frontend feature locking for free/pro plans
   ═══════════════════════════════════════════════════════════════ */

let _userPlan = null;
let _planLimits = null;
let _planUsage = null;
let _hasStripe = false;

async function loadUserPlan() {
    try {
        const res = await fetch('/api/plan');
        if (!res.ok) return;
        const data = await res.json();
        _userPlan = data.plan;
        _planLimits = data.limits;
        _planUsage = data.usage;
        _hasStripe = data.has_stripe || false;
        applyPlanRestrictions();
        // Show subscription button for all users (different text/action per plan)
        const manageBtn = document.getElementById('manageSubscriptionBtn');
        if (manageBtn) {
            manageBtn.style.display = 'flex';
            if (_userPlan === 'pro' && _hasStripe) {
                manageBtn.innerHTML = '<span class="nav-icon">💳</span> Gerenciar Assinatura';
                manageBtn.onclick = openSubscriptionPortal;
            } else if (_userPlan === 'pro' && !_hasStripe) {
                manageBtn.innerHTML = '<span class="nav-icon">✅</span> Pro Ativo';
                manageBtn.style.opacity = '0.7';
                manageBtn.style.cursor = 'default';
                manageBtn.onclick = () => alert('Seu plano Pro foi ativado manualmente pelo administrador.');
            } else {
                manageBtn.innerHTML = '<span class="nav-icon">⚡</span> Assinar Pro';
                manageBtn.onclick = startProCheckout;
            }
        }
    } catch (e) { /* silent */ }
}

function applyPlanRestrictions() {
    if (_userPlan === 'pro') return;

    // Add "PRO" badges to locked features in sidebar
    const proTabs = ['ranking', 'artigos'];
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
                    <strong>Plano Gratuito</strong> — Desbloqueie 10 ferramentas, flashcards ilimitados, 108 neuróbicas, gráficos e ranking.
                </div>
                <button class="upgrade-btn" onclick="startProCheckout()">7 dias grátis — R$ 29,90/mês</button>
            </div>
        `;
        dashboard.insertBefore(banner, dashboard.firstChild.nextSibling);
    }

    // Intercept clicks on Pro-only tools
    interceptProTools();
}

function interceptProTools() {
    // Tools that require Pro (all except anchor and noise)
    const proToolSections = [
        { selector: '[onclick*="startStroopDemo"], [onclick*="startStroop"]', feature: 'stroop' },
        { selector: '[onclick*="startNBack"]', feature: 'nback' },
    ];

    // Override switchTab to intercept Pro-only tabs
    const originalSwitchTab = window.switchTab;
    if (originalSwitchTab && !window._switchTabPatched) {
        window._switchTabPatched = true;
        window.switchTab = function(tabName) {
            if (_userPlan !== 'pro') {
                if (tabName === 'ranking') { showUpgradeModal('ranking'); return; }
                if (tabName === 'artigos') { showUpgradeModal('articles'); return; }
            }
            originalSwitchTab(tabName);
        };
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

// Open Stripe Customer Portal for subscription management
async function openSubscriptionPortal() {
    try {
        const btn = document.getElementById('manageSubscriptionBtn');
        if (btn) { btn.disabled = true; btn.innerHTML = '<span class="nav-icon">⏳</span> Abrindo...'; }

        const res = await fetch('/api/stripe/portal');
        const data = await res.json();

        if (data.url) {
            window.location.href = data.url;
        } else {
            alert(data.error || 'Erro ao abrir portal de assinatura.');
            if (btn) { btn.disabled = false; btn.innerHTML = '<span class="nav-icon">💳</span> Gerenciar Assinatura'; }
        }
    } catch (e) {
        alert('Erro de conexão. Tente novamente.');
        const btn = document.getElementById('manageSubscriptionBtn');
        if (btn) { btn.disabled = false; btn.innerHTML = '<span class="nav-icon">💳</span> Gerenciar Assinatura'; }
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

const PRO_FEATURE_NAMES = {
    flashcards: 'Flashcards Ilimitados',
    flashcard_decks: 'Baralhos Ilimitados',
    spaced_topics: 'Tópicos de Revisão Ilimitados',
    planner: 'Planejador Completo',
    nback: 'N-Back sem limite de nível',
    tools: 'Todas as Ferramentas de Foco',
    pomodoro: 'Pomodoro Ilimitado',
    diary: 'Diário de Estudos Completo',
    neurobica_deck: 'Neuróbica — 108 Desafios',
    unified_review: 'Revisão Unificada Ilimitada',
    charts: 'Gráficos e Análise de Progresso',
    ranking: 'Ranking entre Estudantes',
    export: 'Exportação de Dados (CSV)',
    articles: 'Biblioteca Científica (42+ artigos)',
    assessment: 'Avaliação Neurocognitiva',
    stroop: 'Teste Stroop — Resistência Cognitiva',
    nsdr: 'Descanso Profundo Guiado',
    gonogo: 'Controle Inibitório',
    pvt: 'Teste de Vigilância',
    breathing: 'Hiperventilação Controlada'
};

function showUpgradeModal(feature) {
    // Remove existing modal if any
    document.getElementById('upgradeModal')?.remove();

    const featureName = PRO_FEATURE_NAMES[feature] || 'Este recurso';

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'upgradeModal';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `
        <div class="neuro-greeting" style="max-width:440px">
            <div class="greeting-brain-icon">\u{1F512}</div>
            <h2 class="greeting-title" style="font-size:20px">${featureName}</h2>
            <p class="greeting-subtitle" style="margin-bottom:16px">Disponível no plano <strong style="color:#00f0ff">Pro</strong></p>

            <div style="background:rgba(0,240,255,0.04);border:1px solid rgba(0,240,255,0.12);border-radius:12px;padding:16px;text-align:left;margin-bottom:20px">
                <p style="font-size:14px;color:#c5d0e6;margin-bottom:12px"><strong style="color:#00f0ff">O que o Pro desbloqueia:</strong></p>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;font-size:13px;color:#94a3c0;line-height:1.8">
                    <span>✅ 10 ferramentas de foco</span>
                    <span>✅ Flashcards ilimitados</span>
                    <span>✅ Revisão unificada</span>
                    <span>✅ 108 desafios Neuróbica</span>
                    <span>✅ Gráficos de evolução</span>
                    <span>✅ 42+ artigos científicos</span>
                    <span>✅ Avaliação cognitiva</span>
                    <span>✅ Ranking e conquistas</span>
                    <span>✅ Planejador completo</span>
                    <span>✅ Exportação de dados</span>
                </div>
            </div>

            <button onclick="startProCheckout();document.getElementById('upgradeModal').remove()" class="upgrade-btn" style="width:100%;padding:14px;font-size:15px;border:none;cursor:pointer;margin-bottom:8px;border-radius:10px">
                Começar 7 dias grátis — R$ 29,90/mês
            </button>

            <div style="text-align:center;margin:12px 0;padding:10px;background:rgba(255,190,11,0.06);border:1px solid rgba(255,190,11,0.12);border-radius:8px">
                <p style="font-size:13px;color:#ffbe0b;margin:0;font-weight:600">\u{1F6E1}\uFE0F Garantia de 7 dias</p>
                <p style="font-size:12px;color:#94a3c0;margin:4px 0 0">Teste todas as funcionalidades. Se não gostar, cancele em até 7 dias e não será cobrado nada.</p>
            </div>

            <button class="greeting-skip" onclick="document.getElementById('upgradeModal').remove()" style="margin-top:8px">Continuar no plano grátis</button>
        </div>
    `;
    document.body.appendChild(overlay);
}
