/* ═══════════════════════════════════════════════════════════════
   NEUROAPRENDIZADO MED — Onboarding Survey + Goals
   ═══════════════════════════════════════════════════════════════ */

const SURVEY_TOTAL_STEPS = 5;
let surveyData = {
    experience_level: '',
    goal_immediate: '',
    goal_medium: '',
    goal_long: '',
    hours_per_day: '',
    main_challenge: '',
    opt_in_tracking: false,
    opt_in_tips: false
};
let surveyStep = 1;

// ─── CHECK IF SURVEY NEEDED ───
async function checkOnboardingSurvey() {
    try {
        const res = await fetch('/auth/me');
        if (!res.ok) return;
        const user = await res.json();
        if (!user.onboarding_completed) {
            showOnboardingSurvey();
        }
    } catch (e) { /* silent */ }
}

// ─── SHOW SURVEY MODAL ───
function showOnboardingSurvey() {
    if (document.getElementById('surveyOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'surveyOverlay';
    overlay.className = 'survey-overlay';
    overlay.innerHTML = `<div class="survey-container" id="surveyContainer"></div>`;
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        renderSurveyStep(1);
    });
}

// ─── RENDER STEP ───
function renderSurveyStep(step) {
    surveyStep = step;
    const container = document.getElementById('surveyContainer');
    if (!container) return;

    const progressPct = ((step - 1) / (SURVEY_TOTAL_STEPS - 1)) * 100;

    let content = `
        <div class="survey-progress"><div class="survey-progress-fill" style="width:${progressPct}%"></div></div>
        <div class="survey-step-indicator">Passo ${step} de ${SURVEY_TOTAL_STEPS}</div>
    `;

    switch (step) {
        case 1:
            content += renderStep1();
            break;
        case 2:
            content += renderStep2();
            break;
        case 3:
            content += renderStep3();
            break;
        case 4:
            content += renderStep4();
            break;
        case 5:
            content += renderStep5();
            break;
    }

    container.innerHTML = content;

    // Restore selections
    if (step === 1 && surveyData.experience_level) {
        const card = container.querySelector(`[data-level="${surveyData.experience_level}"]`);
        if (card) card.classList.add('selected');
    }
    if (step === 3) {
        const hoursInput = document.getElementById('surveyHours');
        if (hoursInput && surveyData.hours_per_day) hoursInput.value = surveyData.hours_per_day;
        const challengeSelect = document.getElementById('surveyChallenge');
        if (challengeSelect && surveyData.main_challenge) challengeSelect.value = surveyData.main_challenge;
    }
    if (step === 4) {
        const trackingCb = document.getElementById('surveyTracking');
        const tipsCb = document.getElementById('surveyTips');
        if (trackingCb) trackingCb.checked = surveyData.opt_in_tracking;
        if (tipsCb) tipsCb.checked = surveyData.opt_in_tips;
    }
}

function renderStep1() {
    return `
        <div class="survey-title">Qual e o seu nivel?</div>
        <div class="survey-desc">Isso nos ajuda a personalizar dicas e protocolos para voce.</div>
        <div class="survey-level-cards">
            <div class="survey-level-card" data-level="iniciante" onclick="selectSurveyLevel('iniciante')">
                <div class="level-emoji">🌱</div>
                <div class="level-name">Iniciante</div>
                <div class="level-desc">Comecando a estudar para concursos ou provas. Menos de 1 ano de preparacao.</div>
            </div>
            <div class="survey-level-card" data-level="intermediario" onclick="selectSurveyLevel('intermediario')">
                <div class="level-emoji">🔬</div>
                <div class="level-name">Intermediario</div>
                <div class="level-desc">Ja tem rotina de estudo. 1-3 anos de preparacao. Busca otimizar.</div>
            </div>
            <div class="survey-level-card" data-level="avancado" onclick="selectSurveyLevel('avancado')">
                <div class="level-emoji">🧠</div>
                <div class="level-name">Avancado</div>
                <div class="level-desc">Veterano com rotina consolidada. Busca performance de ponta e edge cognitivo.</div>
            </div>
        </div>
        <div class="survey-buttons">
            <button class="survey-btn-next" onclick="surveyNext()" id="surveyNextBtn1">Proximo &rarr;</button>
        </div>
    `;
}

function renderStep2() {
    return `
        <div class="survey-title">Quais sao seus objetivos?</div>
        <div class="survey-desc">Definir metas claras aumenta em 42% a chance de alcanca-las (Locke & Latham, 2002).</div>
        <div class="survey-field">
            <label class="survey-label">Objetivo imediato (este mes)</label>
            <textarea class="survey-textarea" id="surveyGoalImmediate" rows="2" placeholder="Ex: Revisar todo o conteudo de Cardiologia">${surveyData.goal_immediate}</textarea>
        </div>
        <div class="survey-field">
            <label class="survey-label">Objetivo medio prazo (este semestre)</label>
            <textarea class="survey-textarea" id="surveyGoalMedium" rows="2" placeholder="Ex: Terminar o ciclo basico de Clinica Medica">${surveyData.goal_medium}</textarea>
        </div>
        <div class="survey-field">
            <label class="survey-label">Objetivo longo prazo (este ano)</label>
            <textarea class="survey-textarea" id="surveyGoalLong" rows="2" placeholder="Ex: Passar na prova de residencia">${surveyData.goal_long}</textarea>
        </div>
        <div class="survey-buttons">
            <button class="survey-btn-back" onclick="surveyBack()">&larr; Voltar</button>
            <button class="survey-btn-next" onclick="surveyNext()">Proximo &rarr;</button>
        </div>
    `;
}

function renderStep3() {
    return `
        <div class="survey-title">Seus habitos de estudo</div>
        <div class="survey-desc">Entender seu perfil atual nos permite sugerir protocolos mais eficientes.</div>
        <div class="survey-field">
            <label class="survey-label">Quantas horas por dia voce estuda?</label>
            <input type="number" class="survey-input" id="surveyHours" min="0" max="16" step="0.5" placeholder="Ex: 4" value="${surveyData.hours_per_day}">
        </div>
        <div class="survey-field">
            <label class="survey-label">Qual seu maior desafio?</label>
            <select class="survey-select" id="surveyChallenge">
                <option value="">Selecione...</option>
                <option value="foco" ${surveyData.main_challenge === 'foco' ? 'selected' : ''}>Foco — Dificuldade em manter concentracao</option>
                <option value="memoria" ${surveyData.main_challenge === 'memoria' ? 'selected' : ''}>Memoria — Esqueco rapido o que estudo</option>
                <option value="motivacao" ${surveyData.main_challenge === 'motivacao' ? 'selected' : ''}>Motivacao — Falta de energia para comecar</option>
                <option value="organizacao" ${surveyData.main_challenge === 'organizacao' ? 'selected' : ''}>Organizacao — Nao sei priorizar conteudos</option>
                <option value="fadiga" ${surveyData.main_challenge === 'fadiga' ? 'selected' : ''}>Fadiga — Cansaco mental excessivo</option>
            </select>
        </div>
        <div class="survey-buttons">
            <button class="survey-btn-back" onclick="surveyBack()">&larr; Voltar</button>
            <button class="survey-btn-next" onclick="surveyNext()">Proximo &rarr;</button>
        </div>
    `;
}

function renderStep4() {
    return `
        <div class="survey-title">Acompanhamento personalizado</div>
        <div class="survey-desc">Seu professor pode acompanhar seu progresso para oferecer feedback direcionado.</div>
        <div class="survey-opt-in">
            <input type="checkbox" id="surveyTracking" onchange="surveyData.opt_in_tracking = this.checked">
            <div>
                <strong style="color:var(--text-bright)">Permitir que o professor acompanhe meu progresso</strong>
                <p style="font-size:12px;color:var(--text-dim);margin-top:4px">Anonimo por padrao. Seus dados sao protegidos conforme a LGPD (Lei 13.709/2018). Voce pode revogar a qualquer momento nas configuracoes.</p>
            </div>
        </div>
        <div class="survey-opt-in">
            <input type="checkbox" id="surveyTips" onchange="surveyData.opt_in_tips = this.checked">
            <div>
                <strong style="color:var(--text-bright)">Quero receber dicas e feedback personalizados</strong>
                <p style="font-size:12px;color:var(--text-dim);margin-top:4px">Mensagens com sugestoes baseadas no seu perfil de estudo, conquistas e dificuldades identificadas.</p>
            </div>
        </div>
        <div class="survey-lgpd-note">
            <span style="color:var(--synapse-gold)">&#9888;</span>
            <span>Seus dados sao armazenados de forma segura e nunca compartilhados com terceiros. Voce tem direito de acesso, correcao e exclusao a qualquer momento.</span>
        </div>
        <div class="survey-buttons">
            <button class="survey-btn-back" onclick="surveyBack()">&larr; Voltar</button>
            <button class="survey-btn-next" onclick="surveyNext()">Ver resumo &rarr;</button>
        </div>
    `;
}

function renderStep5() {
    const levelLabels = { iniciante: '🌱 Iniciante', intermediario: '🔬 Intermediario', avancado: '🧠 Avancado' };
    const challengeLabels = { foco: 'Foco', memoria: 'Memoria', motivacao: 'Motivacao', organizacao: 'Organizacao', fadiga: 'Fadiga' };

    return `
        <div class="survey-title">Tudo pronto!</div>
        <div class="survey-desc">Confira suas respostas antes de comecar.</div>
        <div class="survey-summary">
            <div class="summary-row">
                <span class="summary-label">Nivel</span>
                <span class="summary-value">${levelLabels[surveyData.experience_level] || '—'}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Objetivo imediato</span>
                <span class="summary-value">${surveyData.goal_immediate || '—'}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Objetivo medio prazo</span>
                <span class="summary-value">${surveyData.goal_medium || '—'}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Objetivo longo prazo</span>
                <span class="summary-value">${surveyData.goal_long || '—'}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Horas/dia</span>
                <span class="summary-value">${surveyData.hours_per_day || '—'}h</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Maior desafio</span>
                <span class="summary-value">${challengeLabels[surveyData.main_challenge] || '—'}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Acompanhamento</span>
                <span class="summary-value">${surveyData.opt_in_tracking ? '&#10003; Ativo' : '&#10007; Desativado'}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Dicas personalizadas</span>
                <span class="summary-value">${surveyData.opt_in_tips ? '&#10003; Ativo' : '&#10007; Desativado'}</span>
            </div>
        </div>
        <div class="survey-buttons">
            <button class="survey-btn-back" onclick="surveyBack()">&larr; Voltar</button>
            <button class="survey-btn-start" onclick="submitOnboardingSurvey()">Comecar minha jornada &#9889;</button>
        </div>
    `;
}

// ─── LEVEL SELECTION ───
function selectSurveyLevel(level) {
    surveyData.experience_level = level;
    document.querySelectorAll('.survey-level-card').forEach(c => c.classList.remove('selected'));
    document.querySelector(`[data-level="${level}"]`)?.classList.add('selected');
}

// ─── NAVIGATION ───
function surveyNext() {
    // Save current step data
    saveSurveyStepData();

    if (surveyStep < SURVEY_TOTAL_STEPS) {
        renderSurveyStep(surveyStep + 1);
    }
}

function surveyBack() {
    saveSurveyStepData();
    if (surveyStep > 1) {
        renderSurveyStep(surveyStep - 1);
    }
}

function saveSurveyStepData() {
    switch (surveyStep) {
        case 2: {
            const gi = document.getElementById('surveyGoalImmediate');
            const gm = document.getElementById('surveyGoalMedium');
            const gl = document.getElementById('surveyGoalLong');
            if (gi) surveyData.goal_immediate = gi.value.trim();
            if (gm) surveyData.goal_medium = gm.value.trim();
            if (gl) surveyData.goal_long = gl.value.trim();
            break;
        }
        case 3: {
            const hours = document.getElementById('surveyHours');
            const challenge = document.getElementById('surveyChallenge');
            if (hours) surveyData.hours_per_day = hours.value;
            if (challenge) surveyData.main_challenge = challenge.value;
            break;
        }
        case 4: {
            const tracking = document.getElementById('surveyTracking');
            const tips = document.getElementById('surveyTips');
            if (tracking) surveyData.opt_in_tracking = tracking.checked;
            if (tips) surveyData.opt_in_tips = tips.checked;
            break;
        }
    }
}

// ─── SUBMIT ───
async function submitOnboardingSurvey() {
    const btn = document.querySelector('.survey-btn-start');
    if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }

    // Transform surveyData to match backend format
    const goals = [];
    if (surveyData.goal_immediate) goals.push({ type: 'immediate', description: surveyData.goal_immediate });
    if (surveyData.goal_medium) goals.push({ type: 'medium_term', description: surveyData.goal_medium });
    if (surveyData.goal_long) goals.push({ type: 'long_term', description: surveyData.goal_long });

    // Ensure at least one goal
    if (!goals.length) {
        alert('Defina pelo menos um objetivo para continuar.');
        if (btn) { btn.disabled = false; btn.textContent = 'Começar minha jornada ⚡'; }
        return;
    }

    const payload = {
        goals,
        study_hours_per_day: parseFloat(surveyData.hours_per_day) || 2,
        main_challenge: surveyData.main_challenge || 'foco',
        experience_level: surveyData.experience_level || 'iniciante',
        allow_tracking: !!surveyData.opt_in_tracking
    };

    try {
        const res = await fetch('/api/survey/onboarding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            closeSurvey();
            if (typeof loadXPInfo === 'function') loadXPInfo();
            if (typeof loadUnreadCount === 'function') loadUnreadCount();
        } else {
            const data = await res.json().catch(() => ({}));
            console.error('Survey error:', data);
            alert('Erro ao salvar: ' + (data.error || 'Tente novamente.'));
            if (btn) { btn.disabled = false; btn.textContent = 'Começar minha jornada ⚡'; }
        }
    } catch (e) {
        console.error('Survey submit error:', e);
        alert('Erro de conexão. Tente novamente.');
        if (btn) { btn.disabled = false; btn.textContent = 'Começar minha jornada ⚡'; }
    }
}

function closeSurvey() {
    const overlay = document.getElementById('surveyOverlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 400);
    }
}

// ─── GOALS MANAGEMENT ───
async function loadGoals() {
    const el = document.getElementById('goalsList');
    if (!el) return;

    try {
        const res = await fetch('/api/survey/goals');
        if (!res.ok) {
            el.innerHTML = '<p class="empty-state">Nenhum objetivo definido. Complete o onboarding para definir seus objetivos.</p>';
            return;
        }
        const goals = await res.json();
        renderGoals(goals);
    } catch (e) {
        el.innerHTML = '<p class="empty-state">Erro ao carregar objetivos.</p>';
    }
}

function renderGoals(goals) {
    const el = document.getElementById('goalsList');
    if (!el) return;

    if (!goals || !goals.length) {
        el.innerHTML = '<p class="empty-state">Nenhum objetivo definido ainda.</p>';
        return;
    }

    const typeLabels = { immediate: 'Este mes', medium: 'Este semestre', long: 'Este ano' };
    const typeIcons = { immediate: '&#128197;', medium: '&#128218;', long: '&#127942;' };

    el.innerHTML = goals.map(g => {
        const isAchieved = g.status === 'achieved';
        return `
        <div class="goal-item ${isAchieved ? 'achieved' : ''}">
            <button class="goal-status-btn" onclick="updateGoalStatus(${g.id}, '${isAchieved ? 'active' : 'achieved'}')" title="${isAchieved ? 'Reabrir' : 'Marcar como alcancado'}">
                ${isAchieved ? '&#9989;' : '&#9723;'}
            </button>
            <div class="goal-text">
                <div class="goal-type">${typeIcons[g.type] || ''} ${typeLabels[g.type] || g.type}</div>
                <div class="goal-desc">${g.description}</div>
                ${g.target_date ? `<div class="goal-target">Meta: ${formatDate(g.target_date)}</div>` : ''}
            </div>
        </div>`;
    }).join('');
}

async function updateGoalStatus(goalId, status) {
    try {
        await fetch(`/api/goals/${goalId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        loadGoals();
    } catch (e) { console.error('Goal update error:', e); }
}

// ─── MONTHLY CHECK-IN ───
async function showMonthlyCheckin() {
    try {
        const res = await fetch('/api/survey/checkin/needed');
        if (!res.ok) return;
        const { needed } = await res.json();
        if (!needed) return;

        const overlay = document.createElement('div');
        overlay.id = 'checkinOverlay';
        overlay.className = 'survey-overlay';
        overlay.innerHTML = `
            <div class="survey-container">
                <div class="survey-title">Check-in Mensal</div>
                <div class="survey-desc">Como foi seu mes? Reavalie seus objetivos e ajuste sua rota.</div>
                <div class="survey-field">
                    <label class="survey-label">Como voce avalia seu progresso este mes?</label>
                    <select class="survey-select" id="checkinProgress">
                        <option value="otimo">&#128640; Otimo — Superei expectativas</option>
                        <option value="bom">&#128516; Bom — Cumpri a maioria das metas</option>
                        <option value="regular">&#128528; Regular — Poderia ter sido melhor</option>
                        <option value="ruim">&#128553; Ruim — Muito abaixo do esperado</option>
                    </select>
                </div>
                <div class="survey-field">
                    <label class="survey-label">O que funcionou bem?</label>
                    <textarea class="survey-textarea" id="checkinPositive" rows="2" placeholder="Ex: Consegui manter a rotina de revisoes"></textarea>
                </div>
                <div class="survey-field">
                    <label class="survey-label">O que precisa melhorar?</label>
                    <textarea class="survey-textarea" id="checkinImprove" rows="2" placeholder="Ex: Preciso dormir melhor"></textarea>
                </div>
                <div class="survey-buttons">
                    <button class="survey-btn-back" onclick="closeCheckin()">Pular</button>
                    <button class="survey-btn-next" onclick="submitCheckin()">Salvar check-in</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => { overlay.style.opacity = '1'; });
    } catch (e) { /* silent */ }
}

async function submitCheckin() {
    const data = {
        progress: document.getElementById('checkinProgress')?.value,
        positive: document.getElementById('checkinPositive')?.value.trim(),
        improve: document.getElementById('checkinImprove')?.value.trim()
    };

    try {
        await fetch('/api/survey/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        closeCheckin();
    } catch (e) { console.error('Checkin error:', e); }
}

function closeCheckin() {
    const overlay = document.getElementById('checkinOverlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 400);
    }
}
