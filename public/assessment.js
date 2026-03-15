/* ═══════════════════════════════════════════════════════════════
   NEUROCOGNITIVE BASELINE ASSESSMENT
   Multi-step wizard: PVT, N-Back, Stroop, Subjective
   ═══════════════════════════════════════════════════════════════ */

let _assessmentData = {};
let _assessmentStep = 0;

// ─── Check if assessment is due ───
async function checkAssessmentDue() {
    try {
        const res = await fetch('/api/assessment/status');
        if (!res.ok) return;
        const data = await res.json();

        if (data.next_due) {
            showAssessmentPrompt(data.next_due, data.has_baseline);
        }
    } catch (e) { /* silent */ }
}

// ─── Show friendly prompt ───
function showAssessmentPrompt(nextDue, hasBaseline) {
    const dismissKey = 'neuroforge_assessment_dismissed_' + new Date().toISOString().split('T')[0];
    if (localStorage.getItem(dismissKey)) return;

    const isBaseline = !hasBaseline;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'assessmentPrompt';
    overlay.innerHTML = `
        <div class="neuro-greeting" style="max-width:480px">
            <div class="greeting-brain-icon">\u{1F4CA}</div>
            <h2 class="greeting-title">${isBaseline ? 'Avalia\u00E7\u00E3o Inicial \u2014 Seu Ponto Zero' : nextDue.label}</h2>
            <p class="greeting-subtitle" style="color:var(--synapse-cyan);margin-bottom:16px">
                ${isBaseline
                    ? 'Antes de come\u00E7ar a treinar, precisamos medir onde voc\u00EA est\u00E1 agora.'
                    : '\u00C9 hora de medir seu progresso!'}
            </p>
            <div style="text-align:left;margin:0 0 20px;font-size:14px;color:#c5d0e6;line-height:1.7">
                ${isBaseline ? `
                <p>Esta avalia\u00E7\u00E3o r\u00E1pida (~5 minutos) registra seu <strong style="color:var(--synapse-gold)">ponto zero</strong> em:</p>
                <ul style="margin:12px 0 0 20px">
                    <li><strong>Tempo de rea\u00E7\u00E3o</strong> \u2014 velocidade do seu sistema de alerta</li>
                    <li><strong>Mem\u00F3ria de trabalho</strong> \u2014 capacidade de reter informa\u00E7\u00E3o ativa</li>
                    <li><strong>Controle inibit\u00F3rio</strong> \u2014 resist\u00EAncia a distra\u00E7\u00F5es</li>
                    <li><strong>Autopercep\u00E7\u00E3o</strong> \u2014 como voc\u00EA avalia seu foco e motiva\u00E7\u00E3o</li>
                </ul>
                <p style="margin-top:12px;color:var(--synapse-gold)">\u{1F4C8} Nas pr\u00F3ximas semanas, vamos repetir essa avalia\u00E7\u00E3o para mostrar sua evolu\u00E7\u00E3o real \u2014 com n\u00FAmeros, n\u00E3o achismo.</p>
                ` : `
                <p>Vamos repetir as mesmas medi\u00E7\u00F5es do baseline para comparar com seu ponto zero.</p>
                <p style="margin-top:8px">Dura\u00E7\u00E3o: <strong>~3 minutos</strong></p>
                `}
            </div>
            <button onclick="startAssessment('${nextDue.type}', ${nextDue.week})" class="greeting-option" style="justify-content:center;border:none;cursor:pointer;width:100%;margin-bottom:12px">
                <span style="font-size:20px">\u{1F3AF}</span>
                <span class="option-label">${isBaseline ? 'Iniciar Minha Avalia\u00E7\u00E3o Inicial' : 'Fazer Avalia\u00E7\u00E3o Agora'}</span>
            </button>
            <button class="greeting-skip" onclick="dismissAssessment()">
                ${isBaseline ? 'Fazer depois (recomendamos fazer agora!)' : 'Lembrar mais tarde'}
            </button>
        </div>
    `;
    document.body.appendChild(overlay);
}

function dismissAssessment() {
    const dismissKey = 'neuroforge_assessment_dismissed_' + new Date().toISOString().split('T')[0];
    localStorage.setItem(dismissKey, 'true');
    document.getElementById('assessmentPrompt')?.remove();
}

// ─── Start assessment wizard ───
function startAssessment(type, weekMarker) {
    document.getElementById('assessmentPrompt')?.remove();

    _assessmentData = {
        assessment_type: type,
        week_marker: weekMarker,
        pvt_trials: [],
        nback_results: null,
        stroop_results: null,
        subjective: {}
    };
    _assessmentStep = 0;

    showAssessmentStep();
}

function showAssessmentStep() {
    document.getElementById('assessmentWizard')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'assessmentWizard';

    const steps = [renderIntroStep, renderPVTStep, renderNBackStep, renderStroopStep, renderSubjectiveStep, renderResultsStep];
    const totalSteps = steps.length;

    overlay.innerHTML = `
        <div class="assessment-container">
            <div class="assessment-progress">
                <div class="assessment-progress-fill" style="width:${((_assessmentStep + 1) / totalSteps) * 100}%"></div>
            </div>
            <div class="assessment-step-label">Etapa ${_assessmentStep + 1} de ${totalSteps}</div>
            <div id="assessmentContent"></div>
        </div>
    `;

    document.body.appendChild(overlay);
    steps[_assessmentStep]();
}

function nextAssessmentStep() {
    _assessmentStep++;
    showAssessmentStep();
}

// ─── STEP 0: Introduction ───
function renderIntroStep() {
    const el = document.getElementById('assessmentContent');
    const isBaseline = _assessmentData.assessment_type === 'baseline';
    el.innerHTML = `
        <div style="text-align:center;padding:20px 0">
            <div style="font-size:48px;margin-bottom:16px">\u{1F9E0}</div>
            <h2 style="font-family:'Quicksand',sans-serif;color:#fff;margin-bottom:12px">
                ${isBaseline ? 'Avalia\u00E7\u00E3o Neurocognitiva Inicial' : 'Avalia\u00E7\u00E3o de Progresso'}
            </h2>
            <p style="color:#94a3c0;font-size:15px;line-height:1.6;max-width:400px;margin:0 auto 24px">
                ${isBaseline
                    ? 'Esta avalia\u00E7\u00E3o define seu ponto zero. D\u00EA o seu melhor \u2014 mas seja honesto. N\u00E3o existe resposta certa ou errada. O que importa \u00E9 a fotografia real de como voc\u00EA est\u00E1 HOJE.'
                    : 'Vamos ver como voc\u00EA evoluiu! Fa\u00E7a com a mesma dedica\u00E7\u00E3o do baseline.'}
            </p>
            <div style="background:rgba(0,240,255,0.05);border:1px solid rgba(0,240,255,0.15);border-radius:12px;padding:16px;text-align:left;max-width:360px;margin:0 auto 24px">
                <p style="font-size:13px;color:#c5d0e6;line-height:1.6">
                    <strong style="color:#00f0ff">O que vamos medir:</strong><br>
                    \u26A1 Tempo de rea\u00E7\u00E3o (PVT) \u2014 ~1 min<br>
                    \u{1F522} Mem\u00F3ria de trabalho (N-Back) \u2014 ~2 min<br>
                    \u{1F9E9} Controle inibit\u00F3rio (Stroop) \u2014 ~30s<br>
                    \u{1F4DD} Autopercep\u00E7\u00E3o \u2014 5 perguntas<br>
                    <br>
                    <strong style="color:#ffbe0b">Total: ~5 minutos</strong>
                </p>
            </div>
            <button class="assessment-btn-primary" onclick="nextAssessmentStep()">Come\u00E7ar Avalia\u00E7\u00E3o \u2192</button>
        </div>
    `;
}

// ─── STEP 1: PVT (5 trials) ───
let _pvtAssessState = 'idle';
let _pvtAssessStart = 0;
let _pvtAssessTimeout = null;

function renderPVTStep() {
    const el = document.getElementById('assessmentContent');
    _assessmentData.pvt_trials = [];
    _pvtAssessState = 'idle';

    el.innerHTML = `
        <div style="text-align:center">
            <h3 style="color:#fff;margin-bottom:8px">\u26A1 Teste de Tempo de Rea\u00E7\u00E3o (PVT)</h3>
            <p style="color:#94a3c0;font-size:14px;margin-bottom:20px">Quando o n\u00FAmero aparecer, clique o mais r\u00E1pido poss\u00EDvel. 5 tentativas.</p>
            <div id="pvtAssessArea" class="pvt-area" style="min-height:200px;cursor:pointer">
                <div id="pvtAssessDisplay" class="pvt-display waiting" style="font-size:20px">Clique aqui para come\u00E7ar</div>
            </div>
            <div id="pvtAssessProgress" style="margin-top:12px;font-family:'Space Mono',monospace;color:#94a3c0;font-size:13px">0 de 5 tentativas</div>
        </div>
    `;

    document.getElementById('pvtAssessArea').onclick = function () {
        if (_pvtAssessState === 'idle') {
            _pvtAssessState = 'waiting';
            this.onclick = pvtAssessResponse;
            startPVTAssessTrial();
        }
    };
}

function startPVTAssessTrial() {
    const display = document.getElementById('pvtAssessDisplay');
    if (!display) return;

    _pvtAssessState = 'waiting';
    display.textContent = 'Aguarde...';
    display.className = 'pvt-display waiting';
    display.style.fontSize = '20px';

    const delay = 2000 + Math.random() * 5000;
    _pvtAssessTimeout = setTimeout(() => {
        _pvtAssessState = 'stimulus';
        _pvtAssessStart = performance.now();
        display.textContent = '0';
        display.className = 'pvt-display stimulus';
        display.style.fontSize = '48px';

        const counterInterval = setInterval(() => {
            if (_pvtAssessState !== 'stimulus') { clearInterval(counterInterval); return; }
            const elapsed = Math.floor(performance.now() - _pvtAssessStart);
            if (display) display.textContent = elapsed;
        }, 16);
    }, delay);
}

function pvtAssessResponse() {
    if (_pvtAssessState !== 'stimulus') return;

    const rt = Math.round(performance.now() - _pvtAssessStart);
    _pvtAssessState = 'responded';
    _assessmentData.pvt_trials.push(rt);

    const display = document.getElementById('pvtAssessDisplay');
    const progress = document.getElementById('pvtAssessProgress');

    if (display) {
        display.textContent = rt + ' ms';
        display.className = 'pvt-display';
        display.style.fontSize = '36px';
        display.style.color = rt < 300 ? '#00e676' : rt < 500 ? '#ffbe0b' : '#ff3366';
    }
    if (progress) progress.textContent = _assessmentData.pvt_trials.length + ' de 5 tentativas';

    if (_assessmentData.pvt_trials.length >= 5) {
        setTimeout(nextAssessmentStep, 1500);
    } else {
        setTimeout(startPVTAssessTrial, 1500);
    }
}

// ─── STEP 2: N-Back (10 rounds, 2-back) ───
let _nbackAssessHistory = [];
let _nbackAssessRound = 0;
let _nbackAssessScore = { posHit: 0, posMiss: 0, letHit: 0, letMiss: 0 };
let _nbackAssessResponse = { pos: false, let: false };
let _nbackAssessTimer = null;
const NBACK_ASSESS_LETTERS = 'BCDFGHJKLMNPQRSTVWXYZ';

function renderNBackStep() {
    const el = document.getElementById('assessmentContent');

    el.innerHTML = `
        <div style="text-align:center">
            <h3 style="color:#fff;margin-bottom:8px">\u{1F522} Mem\u00F3ria de Trabalho (2-Back)</h3>
            <p style="color:#94a3c0;font-size:14px;margin-bottom:16px">Observe a posi\u00E7\u00E3o e a letra. Pressione <strong style="color:#00f0ff">A</strong> se a posi\u00E7\u00E3o \u00E9 igual a 2 rodadas atr\u00E1s, <strong style="color:#e040fb">L</strong> se a letra \u00E9 igual.</p>
            <div class="nback-container" style="margin-bottom:12px">
                <div id="nbackAssessGrid" class="nback-game">
                    <div class="nback-cell" data-pos="0"></div>
                    <div class="nback-cell" data-pos="1"></div>
                    <div class="nback-cell" data-pos="2"></div>
                    <div class="nback-cell" data-pos="3"></div>
                    <div class="nback-cell" data-pos="4"></div>
                    <div class="nback-cell" data-pos="5"></div>
                    <div class="nback-cell" data-pos="6"></div>
                    <div class="nback-cell" data-pos="7"></div>
                    <div class="nback-cell" data-pos="8"></div>
                </div>
                <div id="nbackAssessLetter" class="nback-letter"></div>
            </div>
            <div class="nback-buttons">
                <button class="btn-action btn-nback" id="nbackAssessPosBtn" onclick="nbackAssessMatch('pos')" disabled>(A) Posi\u00E7\u00E3o</button>
                <button class="btn-action btn-nback" id="nbackAssessLetBtn" onclick="nbackAssessMatch('let')" disabled>(L) Letra</button>
            </div>
            <div id="nbackAssessProgress" style="margin-top:12px;font-family:'Space Mono',monospace;color:#94a3c0;font-size:13px">Clique Iniciar</div>
            <button class="assessment-btn-primary" id="nbackAssessStartBtn" onclick="startNBackAssess()" style="margin-top:16px">Iniciar 2-Back (10 rodadas)</button>
        </div>
    `;
}

function startNBackAssess() {
    document.getElementById('nbackAssessStartBtn').style.display = 'none';
    document.getElementById('nbackAssessPosBtn').disabled = false;
    document.getElementById('nbackAssessLetBtn').disabled = false;
    _nbackAssessHistory = [];
    _nbackAssessRound = 0;
    _nbackAssessScore = { posHit: 0, posMiss: 0, letHit: 0, letMiss: 0 };
    showNBackAssessRound();
}

function showNBackAssessRound() {
    if (_nbackAssessRound >= 10) {
        finishNBackAssess();
        return;
    }

    _nbackAssessResponse = { pos: false, let: false };

    let pos = Math.floor(Math.random() * 9);
    let letter = NBACK_ASSESS_LETTERS[Math.floor(Math.random() * NBACK_ASSESS_LETTERS.length)];

    // 30% chance of match for playability
    if (_nbackAssessRound >= 2) {
        if (Math.random() < 0.3) pos = _nbackAssessHistory[_nbackAssessRound - 2].pos;
        if (Math.random() < 0.3) letter = _nbackAssessHistory[_nbackAssessRound - 2].letter;
    }

    _nbackAssessHistory.push({ pos, letter });
    _nbackAssessRound++;

    // Display
    const cells = document.querySelectorAll('#nbackAssessGrid .nback-cell');
    cells.forEach(c => c.classList.remove('active'));
    cells[pos]?.classList.add('active');
    document.getElementById('nbackAssessLetter').textContent = letter;
    document.getElementById('nbackAssessProgress').textContent = `Rodada ${_nbackAssessRound}/10`;

    _nbackAssessTimer = setTimeout(() => {
        // Score this round
        if (_nbackAssessRound > 2) {
            const target = _nbackAssessHistory[_nbackAssessRound - 1 - 2];
            const current = _nbackAssessHistory[_nbackAssessRound - 1];

            if (target.pos === current.pos && _nbackAssessResponse.pos) _nbackAssessScore.posHit++;
            else if (target.pos === current.pos && !_nbackAssessResponse.pos) _nbackAssessScore.posMiss++;
            if (target.letter === current.letter && _nbackAssessResponse.let) _nbackAssessScore.letHit++;
            else if (target.letter === current.letter && !_nbackAssessResponse.let) _nbackAssessScore.letMiss++;
        }

        cells.forEach(c => c.classList.remove('active'));
        document.getElementById('nbackAssessLetter').textContent = '';
        setTimeout(showNBackAssessRound, 500);
    }, 2500);
}

function nbackAssessMatch(type) {
    if (type === 'pos') _nbackAssessResponse.pos = true;
    else _nbackAssessResponse.let = true;
}

// Keyboard support for N-Back assessment
document.addEventListener('keydown', function (e) {
    if (!document.getElementById('nbackAssessGrid')) return;
    if (e.key === 'a' || e.key === 'A') nbackAssessMatch('pos');
    if (e.key === 'l' || e.key === 'L') nbackAssessMatch('let');
});

function finishNBackAssess() {
    const hits = _nbackAssessScore.posHit + _nbackAssessScore.letHit;
    const possible = hits + _nbackAssessScore.posMiss + _nbackAssessScore.letMiss;
    const accuracy = possible > 0 ? Math.round((hits / possible) * 100) : 0;

    _assessmentData.nback_results = {
        level: 2,
        accuracy: accuracy,
        pos_hits: _nbackAssessScore.posHit,
        let_hits: _nbackAssessScore.letHit,
        total_possible: possible
    };

    document.getElementById('nbackAssessPosBtn').disabled = true;
    document.getElementById('nbackAssessLetBtn').disabled = true;
    document.getElementById('nbackAssessProgress').textContent = `Resultado: ${accuracy}% de acerto`;

    setTimeout(nextAssessmentStep, 1500);
}

// ─── STEP 3: Stroop (15 seconds) ───
function renderStroopStep() {
    const el = document.getElementById('assessmentContent');
    const COLORS = [
        { name: 'VERMELHO', hex: '#ff3366' },
        { name: 'AZUL', hex: '#3a86ff' },
        { name: 'VERDE', hex: '#00e676' },
        { name: 'AMARELO', hex: '#ffbe0b' }
    ];

    let stroopScore = 0;
    let stroopTotal = 0;
    let stroopTimer = null;
    let stroopTimeLeft = 15;
    let currentAnswer = null;

    el.innerHTML = `
        <div style="text-align:center">
            <h3 style="color:#fff;margin-bottom:8px">\u{1F9E9} Controle Inibit\u00F3rio (Stroop)</h3>
            <p style="color:#94a3c0;font-size:14px;margin-bottom:16px">Clique na <strong style="color:#00f0ff">COR da fonte</strong>, n\u00E3o na palavra! 15 segundos.</p>
            <div id="stroopAssessArea" style="min-height:160px;display:flex;flex-direction:column;align-items:center;justify-content:center">
                <button class="assessment-btn-primary" onclick="window._startStroopAssess()">Iniciar Stroop (15s)</button>
            </div>
            <div id="stroopAssessScore" style="margin-top:12px;font-family:'Space Mono',monospace;color:#94a3c0;font-size:14px"></div>
        </div>
    `;

    function showStroopWord() {
        const area = document.getElementById('stroopAssessArea');
        if (!area) return;

        const wordIdx = Math.floor(Math.random() * COLORS.length);
        let colorIdx;
        do { colorIdx = Math.floor(Math.random() * COLORS.length); } while (colorIdx === wordIdx);

        currentAnswer = colorIdx;

        const options = new Set([colorIdx]);
        while (options.size < 3) options.add(Math.floor(Math.random() * COLORS.length));
        const shuffled = [...options].sort(() => Math.random() - 0.5);

        let html = `<div style="font-size:36px;font-weight:700;color:${COLORS[colorIdx].hex};letter-spacing:3px;margin-bottom:20px">${COLORS[wordIdx].name}</div>`;
        html += '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">';
        shuffled.forEach(i => {
            html += `<button style="padding:10px 20px;border-radius:8px;border:none;background:${COLORS[i].hex};color:#000;font-weight:700;font-size:14px;cursor:pointer;transition:transform 0.1s" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform=''" onclick="window._answerStroopAssess(${i})">${COLORS[i].name}</button>`;
        });
        html += '</div>';
        area.innerHTML = html;
    }

    window._startStroopAssess = function () {
        stroopTimer = setInterval(() => {
            stroopTimeLeft--;
            const scoreEl = document.getElementById('stroopAssessScore');
            if (scoreEl) scoreEl.textContent = `${stroopTimeLeft}s | Acertos: ${stroopScore}/${stroopTotal}`;
            if (stroopTimeLeft <= 0) {
                clearInterval(stroopTimer);
                const accuracy = stroopTotal > 0 ? Math.round((stroopScore / stroopTotal) * 100) : 0;
                _assessmentData.stroop_results = {
                    accuracy: accuracy,
                    total: stroopTotal,
                    correct: stroopScore,
                    avg_rt: 0
                };
                const scoreEl2 = document.getElementById('stroopAssessScore');
                if (scoreEl2) scoreEl2.textContent = `Resultado: ${stroopScore}/${stroopTotal} (${accuracy}%)`;
                const area = document.getElementById('stroopAssessArea');
                if (area) area.innerHTML = '<p style="color:#00e676;font-size:18px">\u2705 Conclu\u00EDdo!</p>';
                setTimeout(nextAssessmentStep, 1500);
            }
        }, 1000);
        showStroopWord();
    };

    window._answerStroopAssess = function (idx) {
        stroopTotal++;
        if (idx === currentAnswer) stroopScore++;
        showStroopWord();
    };
}

// ─── STEP 4: Subjective Questions ───
function renderSubjectiveStep() {
    const el = document.getElementById('assessmentContent');
    const questions = [
        { key: 'focus', icon: '\u{1F441}\uFE0F', text: 'Quanto tempo consigo estudar sem perder o foco?', labels: ['< 15min', '15-30min', '30-60min', '1-2h', '> 2h'] },
        { key: 'retention', icon: '\u{1F9E0}', text: 'Quanto lembro do que estudei na semana passada?', labels: ['Quase nada', 'Pouco', 'Metade', 'Boa parte', 'Quase tudo'] },
        { key: 'fatigue', icon: '\u{1F50B}', text: 'Qu\u00E3o cansado fico ap\u00F3s 1 hora de estudo?', labels: ['Exausto', 'Muito cansado', 'Moderado', 'Pouco cansado', 'Sem cansa\u00E7o'] },
        { key: 'motivation', icon: '\u{1F525}', text: 'Qu\u00E3o motivado estou para estudar hoje?', labels: ['Zero', 'Baixa', 'Neutra', 'Boa', 'M\u00E1xima'] },
        { key: 'organization', icon: '\u{1F4CB}', text: 'Qu\u00E3o organizado \u00E9 meu plano de estudos?', labels: ['Inexistente', 'Ca\u00F3tico', 'Razo\u00E1vel', 'Organizado', 'Excelente'] }
    ];

    el.innerHTML = `
        <div style="text-align:center">
            <h3 style="color:#fff;margin-bottom:8px">\u{1F4DD} Autopercep\u00E7\u00E3o</h3>
            <p style="color:#94a3c0;font-size:14px;margin-bottom:20px">Responda com honestidade. N\u00E3o existe certo ou errado.</p>
            <div id="subjQuestions" style="text-align:left;max-width:440px;margin:0 auto"></div>
            <button class="assessment-btn-primary" onclick="submitSubjective()" style="margin-top:20px">Finalizar Avalia\u00E7\u00E3o \u2192</button>
        </div>
    `;

    const container = document.getElementById('subjQuestions');
    questions.forEach(q => {
        const div = document.createElement('div');
        div.style.cssText = 'margin-bottom:20px;padding:16px;background:rgba(0,240,255,0.03);border:1px solid rgba(0,240,255,0.1);border-radius:10px';
        div.innerHTML = `
            <p style="color:#fff;font-size:14px;margin-bottom:10px">${q.icon} ${q.text}</p>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
                ${q.labels.map((label, i) => `
                    <button class="subj-option" data-key="${q.key}" data-value="${i + 1}"
                        style="padding:8px 12px;border-radius:6px;border:1px solid rgba(0,240,255,0.15);background:transparent;color:#94a3c0;font-size:12px;cursor:pointer;transition:all 0.2s"
                        onclick="selectSubjective(this, '${q.key}', ${i + 1})">
                        ${i + 1}. ${label}
                    </button>
                `).join('')}
            </div>
        `;
        container.appendChild(div);
    });
}

function selectSubjective(btn, key, value) {
    _assessmentData.subjective[key] = value;
    const siblings = btn.parentElement.querySelectorAll('.subj-option');
    siblings.forEach(b => {
        b.style.background = 'transparent';
        b.style.color = '#94a3c0';
        b.style.borderColor = 'rgba(0,240,255,0.15)';
    });
    btn.style.background = 'rgba(0,240,255,0.15)';
    btn.style.color = '#00f0ff';
    btn.style.borderColor = 'rgba(0,240,255,0.4)';
}

function submitSubjective() {
    const required = ['focus', 'retention', 'fatigue', 'motivation', 'organization'];
    const missing = required.filter(k => !_assessmentData.subjective[k]);
    if (missing.length > 0) {
        alert('Responda todas as 5 perguntas antes de finalizar.');
        return;
    }
    nextAssessmentStep();
}

// ─── STEP 5: Results + Save ───
function renderResultsStep() {
    const el = document.getElementById('assessmentContent');
    el.innerHTML = '<div style="text-align:center;padding:20px"><p style="color:#00f0ff">Calculando resultados...</p></div>';

    const pvt = _assessmentData.pvt_trials;
    const pvtAvg = pvt.length ? Math.round(pvt.reduce((a, b) => a + b, 0) / pvt.length) : 0;
    const pvtBest = pvt.length ? Math.min(...pvt) : 0;
    const pvtWorst = pvt.length ? Math.max(...pvt) : 0;
    const pvtStd = pvt.length ? Math.round(Math.sqrt(pvt.reduce((s, v) => s + Math.pow(v - pvtAvg, 2), 0) / pvt.length)) : 0;
    const pvtLapses = pvt.filter(r => r > 500).length;

    const nb = _assessmentData.nback_results || {};
    const st = _assessmentData.stroop_results || {};
    const subj = _assessmentData.subjective;

    const payload = {
        assessment_type: _assessmentData.assessment_type,
        week_marker: _assessmentData.week_marker,
        pvt_avg_rt: pvtAvg,
        pvt_best_rt: pvtBest,
        pvt_worst_rt: pvtWorst,
        pvt_variability: pvtStd,
        pvt_lapses: pvtLapses,
        nback_level: nb.level || 2,
        nback_accuracy: nb.accuracy || 0,
        nback_pos_hits: nb.pos_hits || 0,
        nback_let_hits: nb.let_hits || 0,
        nback_total_possible: nb.total_possible || 0,
        stroop_accuracy: st.accuracy || 0,
        stroop_avg_rt: st.avg_rt || 0,
        stroop_total: st.total || 0,
        stroop_correct: st.correct || 0,
        subj_focus: subj.focus,
        subj_retention: subj.retention,
        subj_fatigue: subj.fatigue,
        subj_motivation: subj.motivation,
        subj_organization: subj.organization
    };

    fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(r => r.json())
        .then(data => {
            const score = data.composite_score || 0;
            const isBaseline = _assessmentData.assessment_type === 'baseline';

            el.innerHTML = `
            <div style="text-align:center;padding:20px 0">
                <div style="font-size:48px;margin-bottom:12px">${score >= 70 ? '\u{1F31F}' : score >= 50 ? '\u{1F4AA}' : '\u{1F680}'}</div>
                <h2 style="font-family:'Quicksand',sans-serif;color:#fff;margin-bottom:8px">
                    ${isBaseline ? 'Baseline Registrado!' : 'Avalia\u00E7\u00E3o Conclu\u00EDda!'}
                </h2>
                <div style="font-size:64px;font-weight:800;font-family:'Space Mono',monospace;background:linear-gradient(90deg,#00f0ff,#e040fb);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:16px 0">${score}/100</div>
                <p style="color:#94a3c0;font-size:14px;margin-bottom:24px">Score Neurocognitivo Composto</p>

                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;max-width:360px;margin:0 auto 24px;text-align:center">
                    <div style="padding:14px;background:rgba(0,240,255,0.05);border-radius:10px;border:1px solid rgba(0,240,255,0.1)">
                        <div style="font-size:24px;font-weight:700;color:#00f0ff;font-family:'Space Mono'">${pvtAvg}ms</div>
                        <div style="font-size:12px;color:#94a3c0">Tempo de Rea\u00E7\u00E3o</div>
                    </div>
                    <div style="padding:14px;background:rgba(224,64,251,0.05);border-radius:10px;border:1px solid rgba(224,64,251,0.1)">
                        <div style="font-size:24px;font-weight:700;color:#e040fb;font-family:'Space Mono'">${nb.accuracy || 0}%</div>
                        <div style="font-size:12px;color:#94a3c0">N-Back Accuracy</div>
                    </div>
                    <div style="padding:14px;background:rgba(255,190,11,0.05);border-radius:10px;border:1px solid rgba(255,190,11,0.1)">
                        <div style="font-size:24px;font-weight:700;color:#ffbe0b;font-family:'Space Mono'">${st.accuracy || 0}%</div>
                        <div style="font-size:12px;color:#94a3c0">Stroop Accuracy</div>
                    </div>
                    <div style="padding:14px;background:rgba(0,230,118,0.05);border-radius:10px;border:1px solid rgba(0,230,118,0.1)">
                        <div style="font-size:24px;font-weight:700;color:#00e676;font-family:'Space Mono'">+${data.xp_earned || 25}</div>
                        <div style="font-size:12px;color:#94a3c0">XP Ganho</div>
                    </div>
                </div>

                <p style="color:#ffbe0b;font-size:14px;margin-bottom:20px">
                    ${isBaseline
                    ? '\u{1F4C8} Este \u00E9 seu ponto zero. Nas pr\u00F3ximas semanas, vamos acompanhar sua evolu\u00E7\u00E3o!'
                    : '\u{1F4CA} Compare com seu baseline na aba Mensagens.'}
                </p>
                <button class="assessment-btn-primary" onclick="closeAssessment()">Continuar para o Dashboard \u2192</button>
            </div>
        `;
        })
        .catch(err => {
            console.error('Assessment save error:', err);
            el.innerHTML = '<p style="color:#ff3366;text-align:center;padding:20px">Erro ao salvar avalia\u00E7\u00E3o. Tente novamente.</p>';
        });
}

function closeAssessment() {
    document.getElementById('assessmentWizard')?.remove();
    if (typeof loadUnreadCount === 'function') loadUnreadCount();
}
