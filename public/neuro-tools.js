/* ═══════════════════════════════════════════════════════════════
   NEURO-TOOLS — Neural Focus Engineering Toolkit
   7 ferramentas baseadas em protocolos neurocientificos
   ═══════════════════════════════════════════════════════════════ */

// ─── 1. ANCORAGEM VISUAL (60s Locus Coeruleus Activation) ───
let anchorInterval = null;

function startAnchorExercise() {
    if (anchorInterval) { stopAnchorExercise(); return; }
    let seconds = 60;
    const btn = document.getElementById('anchorBtn');
    const timer = document.getElementById('anchorTimer');
    const target = document.getElementById('anchorTarget');

    btn.textContent = '⏹ Parar';
    target.classList.add('active');
    timer.textContent = '60s — Fixe o olhar no ponto central';

    anchorInterval = setInterval(() => {
        seconds--;
        if (seconds > 0) {
            timer.textContent = `${seconds}s — Mantenha o foco. Pisque o mínimo.`;
        } else {
            stopAnchorExercise();
            timer.textContent = '✅ Centro de alerta ativado. Atenção preparada. Comece a estudar.';
            timer.style.color = 'var(--synapse-green)';
            setTimeout(() => { timer.style.color = ''; }, 5000);
        }
    }, 1000);
}

function stopAnchorExercise() {
    clearInterval(anchorInterval);
    anchorInterval = null;
    document.getElementById('anchorBtn').textContent = 'Iniciar Ancoragem';
    document.getElementById('anchorTarget').classList.remove('active');
}


// ─── 2. GERADOR DE RUIDO (Web Audio API — Brown/White/Pink) ───
let noiseNode = null;
let noiseGain = null;
let noiseCtx = null;

function toggleNoise() {
    if (noiseNode) { stopNoise(); return; }

    noiseCtx = new (window.AudioContext || window.webkitAudioContext)();
    const type = document.getElementById('noiseType').value;
    const bufferSize = 2 * noiseCtx.sampleRate;
    const buffer = noiseCtx.createBuffer(1, bufferSize, noiseCtx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'white') {
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    } else if (type === 'brown') {
        // Random walk integrado: cada sample = (anterior + 0.02 * white) / 1.02
        // Filtra frequencias altas, resultado: perfil que estabiliza LC em modo tonico
        let last = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (last + (0.02 * white)) / 1.02;
            last = data[i];
            data[i] *= 3.5;
        }
    } else {
        // Pink noise: Voss-McCartney algorithm
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            data[i] *= 0.11;
            b6 = white * 0.115926;
        }
    }

    noiseNode = noiseCtx.createBufferSource();
    noiseNode.buffer = buffer;
    noiseNode.loop = true;

    noiseGain = noiseCtx.createGain();
    noiseGain.gain.value = parseFloat(document.getElementById('noiseVolume').value);

    noiseNode.connect(noiseGain);
    noiseGain.connect(noiseCtx.destination);
    noiseNode.start();

    document.getElementById('noiseBtn').textContent = '⏹ Parar';

    // Live volume control
    document.getElementById('noiseVolume').oninput = (e) => {
        if (noiseGain) noiseGain.gain.value = parseFloat(e.target.value);
    };
}

function stopNoise() {
    if (noiseNode) { noiseNode.stop(); noiseNode = null; }
    if (noiseCtx) { noiseCtx.close(); noiseCtx = null; }
    noiseGain = null;
    document.getElementById('noiseBtn').textContent = '▶ Play';
}


// ─── 3. HIPERVENTILAÇÃO CONTROLADA (20 respirações) ───
let breathInterval = null;

function startBreathingExercise() {
    if (breathInterval) { stopBreathingExercise(); return; }

    const btn = document.getElementById('breathBtn');
    const circle = document.getElementById('breathingCircle');
    const label = document.getElementById('breathLabel');
    const counter = document.getElementById('breathCount');

    btn.textContent = '⏹ Parar';
    let breathsDone = 0;
    let phase = 'inhale'; // inhale → exhale → inhale ...
    let phaseTime = 0;

    const INHALE_TIME = 5.0; // segundos — inspiração profunda
    const EXHALE_TIME = 5.0; // segundos — expiração controlada
    const TOTAL_BREATHS = 20;

    counter.textContent = `0 / ${TOTAL_BREATHS} respirações`;

    breathInterval = setInterval(() => {
        phaseTime += 0.1;

        if (phase === 'inhale') {
            circle.classList.add('inhale');
            circle.classList.remove('exhale');
            label.textContent = 'INSPIRE 👃';
            label.style.color = 'var(--synapse-cyan)';

            if (phaseTime >= INHALE_TIME) {
                phase = 'exhale';
                phaseTime = 0;
            }
        } else {
            circle.classList.remove('inhale');
            circle.classList.add('exhale');
            label.textContent = 'EXPIRE 💨';
            label.style.color = 'var(--synapse-magenta)';

            if (phaseTime >= EXHALE_TIME) {
                breathsDone++;
                counter.textContent = `${breathsDone} / ${TOTAL_BREATHS} respirações`;
                phase = 'inhale';
                phaseTime = 0;

                if (breathsDone >= TOTAL_BREATHS) {
                    // Retention phase
                    stopBreathingExercise();
                    label.textContent = 'SEGURE 15s...';
                    label.style.color = 'var(--synapse-gold)';
                    circle.classList.remove('inhale', 'exhale');
                    circle.classList.add('hold');

                    let holdTime = 15;
                    const holdInterval = setInterval(() => {
                        holdTime--;
                        counter.textContent = `Segure: ${holdTime}s`;
                        if (holdTime <= 0) {
                            clearInterval(holdInterval);
                            label.textContent = '✅ Protocolo completo!';
                            label.style.color = 'var(--synapse-green)';
                            counter.textContent = 'Sistema Ativador Reticular ativado. Adrenalina liberada.';
                            circle.classList.remove('hold');
                        }
                    }, 1000);
                }
            }
        }
    }, 100);
}

function stopBreathingExercise() {
    clearInterval(breathInterval);
    breathInterval = null;
    document.getElementById('breathBtn').textContent = 'Iniciar Protocolo';
    const circle = document.getElementById('breathingCircle');
    circle.classList.remove('inhale', 'exhale', 'hold');
}


// ─── 4. NSDR — Non-Sleep Deep Rest ───
let nsdrInterval = null;

function startNSDR() {
    if (nsdrInterval) { stopNSDR(); return; }

    const duration = parseInt(document.getElementById('nsdrDuration').value) * 60;
    let remaining = duration;
    const btn = document.getElementById('nsdrBtn');
    const progress = document.getElementById('nsdrProgress');
    const guide = document.getElementById('nsdrGuide');

    btn.textContent = '⏹ Parar NSDR';

    // Start brown noise at low volume for NSDR
    if (!noiseNode) {
        document.getElementById('noiseType').value = 'brown';
        document.getElementById('noiseVolume').value = '0.15';
        toggleNoise();
    }

    nsdrInterval = setInterval(() => {
        remaining--;
        const m = Math.floor(remaining / 60);
        const s = remaining % 60;
        progress.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

        // Breathing guide: 4s in, 7s hold, 8s out (4-7-8 pattern)
        const cycle = remaining % 19; // 4+7+8 = 19s cycle
        if (cycle >= 15) {
            guide.textContent = '👃 Inspire (4s)';
            guide.style.color = 'var(--synapse-cyan)';
        } else if (cycle >= 8) {
            guide.textContent = '⏸ Segure (7s)';
            guide.style.color = 'var(--synapse-gold)';
        } else {
            guide.textContent = '💨 Expire lentamente (8s)';
            guide.style.color = 'var(--synapse-magenta)';
        }

        if (remaining <= 0) {
            stopNSDR();
            progress.textContent = '✅ Descanso profundo completo. Energia mental restaurada. Resíduos cerebrais removidos.';
            progress.style.color = 'var(--synapse-green)';
            guide.textContent = '';
            setTimeout(() => { progress.style.color = ''; }, 5000);
        }
    }, 1000);
}

function stopNSDR() {
    clearInterval(nsdrInterval);
    nsdrInterval = null;
    document.getElementById('nsdrBtn').textContent = 'Iniciar NSDR';
    document.getElementById('nsdrGuide').textContent = '';
    stopNoise();
}


// ─── 5. STROOP TASK — Brain Endurance Training ───
const STROOP_COLORS = [
    { name: 'VERMELHO', hex: '#ff3366' },
    { name: 'AZUL', hex: '#3a86ff' },
    { name: 'VERDE', hex: '#00e676' },
    { name: 'AMARELO', hex: '#ffbe0b' },
    { name: 'ROXO', hex: '#e040fb' },
    { name: 'LARANJA', hex: '#ff8c00' }
];
let stroopInterval = null;
let stroopScore = 0;
let stroopTotal = 0;
let stroopTimeLeft = 30;
let currentStroopAnswer = null;

function startStroop() {
    if (stroopInterval) { stopStroop(); return; }

    stroopScore = 0;
    stroopTotal = 0;
    stroopTimeLeft = 30;
    const btn = document.getElementById('stroopBtn');
    const scoreEl = document.getElementById('stroopScore');
    btn.textContent = '⏹ Parar';
    scoreEl.textContent = `30s | Acertos: 0/0`;

    showStroopWord();

    stroopInterval = setInterval(() => {
        stroopTimeLeft--;
        scoreEl.textContent = `${stroopTimeLeft}s | Acertos: ${stroopScore}/${stroopTotal}`;
        if (stroopTimeLeft <= 0) {
            stopStroop();
            const pct = stroopTotal > 0 ? Math.round((stroopScore / stroopTotal) * 100) : 0;
            scoreEl.textContent = `Resultado: ${stroopScore}/${stroopTotal} (${pct}%) — ${pct >= 80 ? 'Excelente!' : pct >= 60 ? 'Bom.' : 'Treine mais.'}`;
            document.getElementById('stroopArea').innerHTML = '<p class="empty-state">Sessão encerrada. Clique para jogar novamente.</p>';
        }
    }, 1000);
}

function showStroopWord() {
    const area = document.getElementById('stroopArea');
    // Pick a word and a DIFFERENT color for display
    const wordIdx = Math.floor(Math.random() * STROOP_COLORS.length);
    let colorIdx;
    do { colorIdx = Math.floor(Math.random() * STROOP_COLORS.length); } while (colorIdx === wordIdx);

    const word = STROOP_COLORS[wordIdx].name;
    const displayColor = STROOP_COLORS[colorIdx].hex;
    currentStroopAnswer = colorIdx; // The correct answer is the DISPLAY color

    // Show the word in wrong color
    let html = `<div class="stroop-word" style="color:${displayColor};font-size:36px;margin-bottom:20px">${word}</div>`;
    html += '<div class="stroop-options">';

    // Show 4 color options (including correct)
    const options = new Set([colorIdx]);
    while (options.size < 4) {
        options.add(Math.floor(Math.random() * STROOP_COLORS.length));
    }
    const shuffled = [...options].sort(() => Math.random() - 0.5);

    shuffled.forEach(i => {
        html += `<button class="stroop-option" style="background:${STROOP_COLORS[i].hex};color:#000;font-weight:700"
                  onclick="answerStroop(${i})">${STROOP_COLORS[i].name}</button>`;
    });
    html += '</div>';
    area.innerHTML = html;
}

function answerStroop(idx) {
    if (!stroopInterval) return;
    stroopTotal++;
    if (idx === currentStroopAnswer) {
        stroopScore++;
    }
    showStroopWord();
}

function stopStroop() {
    clearInterval(stroopInterval);
    stroopInterval = null;
    currentStroopAnswer = null;
    document.getElementById('stroopBtn').textContent = 'Iniciar (30s)';
}


// ─── 6. N-BACK EVOLUTION — Neural Working Memory Training ───
// Inspired by: N-Back Evolution app, WoumBoum (d-prime), Poc275 (adaptive),
// MickaelBergem (progressive), al0cam (AbortController), SoakYourHead
const NBACK_LETTERS = 'BCDFGHJKLMNPQRSTVWXYZ';
let nbackInterval = null;
let nbackAbort = null; // AbortController to prevent mid-game bugs
let nbackN = 1;
let nbackMode = 'single'; // single | dual
let nbackGameMode = 'training'; // training | standard | adaptive
let nbackHistory = [];
let nbackRound = 0;
let nbackTotal = 20;
let nbackStimulusTime = 3000; // ms — adjustable
let nbackShowHints = true;
let nbackSoundOn = true;
let nbackScore = { posHit: 0, posMiss: 0, letHit: 0, letMiss: 0, posFalse: 0, letFalse: 0 };
let nbackUserResponse = { pos: false, let: false };
let nbackTutorialSeen = false;
let nbackConsecutiveGood = 0; // for adaptive mode

// --- Audio ---
function speakLetter(letter) {
    if (!nbackSoundOn) return;
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(letter);
        utt.lang = 'pt-BR';
        utt.rate = 0.9;
        utt.volume = 0.7;
        speechSynthesis.speak(utt);
    }
}

// --- Visual feedback ---
function flashNBackCell(cellIndex, feedbackClass) {
    const cells = document.querySelectorAll('.nback-cell');
    const cell = cells[cellIndex];
    if (!cell) return;
    cell.classList.add(feedbackClass);
    setTimeout(() => cell.classList.remove(feedbackClass), 600);
}

function showNBackFeedback(messages) {
    const el = document.getElementById('nbackFeedback');
    if (!el) return;
    el.innerHTML = messages.join(' &nbsp;|&nbsp; ');
    setTimeout(() => { el.innerHTML = ''; }, 1500);
}

// --- D-prime calculation (WoumBoum-inspired) ---
function calcDPrime(hits, misses, falseAlarms, correctRejects) {
    const totalSignal = hits + misses;
    const totalNoise = falseAlarms + correctRejects;
    if (totalSignal === 0 || totalNoise === 0) return 0;
    let hitRate = hits / totalSignal;
    let faRate = falseAlarms / totalNoise;
    // Clamp to avoid infinite z-scores
    hitRate = Math.max(0.01, Math.min(0.99, hitRate));
    faRate = Math.max(0.01, Math.min(0.99, faRate));
    // Z-score approximation (Abramowitz & Stegun)
    function zScore(p) {
        const a1 = -1.0, a2 = 0.27061, a3 = 0.99229, a4 = 0.04481;
        const t = Math.sqrt(-2 * Math.log(p < 0.5 ? p : 1 - p));
        const z = t - (a2 + a3 * t) / (1 + a4 * t);
        return p < 0.5 ? -z : z;
    }
    return Math.round((zScore(hitRate) - zScore(faRate)) * 100) / 100;
}

// --- Tutorial System ---
function showNBackTutorial() {
    const container = document.getElementById('nbackTutorialOverlay');
    if (!container) return;
    container.style.display = 'flex';
    container.innerHTML = `
    <div class="nback-tutorial-content">
        <h3>Como funciona o N-Back?</h3>
        <div class="nback-tutorial-steps">
            <div class="nback-tutorial-step active" id="tutStep1">
                <div class="nback-tutorial-icon">🧠</div>
                <h4>O que é?</h4>
                <p>Um <strong>treino de memória de trabalho</strong>. Você vai ver quadrados aparecendo numa grade 3×3 e ouvir letras.</p>
                <p>Sua missão: lembrar o que apareceu <strong>N rodadas atrás</strong> e apertar o botão quando repetir.</p>
            </div>
            <div class="nback-tutorial-step" id="tutStep2">
                <div class="nback-tutorial-icon">1️⃣</div>
                <h4>Exemplo: 1-Back</h4>
                <p>No modo <strong>1-Back</strong>, compare com a <strong>rodada anterior</strong> (a mais recente).</p>
                <div class="nback-tutorial-demo">
                    <div class="nback-tutorial-demo-row">
                        <div class="nback-mini-grid"><div class="mini-cell"></div><div class="mini-cell active"></div><div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div></div>
                        <span class="tutorial-arrow">→</span>
                        <div class="nback-mini-grid"><div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell active"></div><div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div></div>
                        <span class="tutorial-arrow">→</span>
                        <div class="nback-mini-grid"><div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell match"></div><div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div></div>
                    </div>
                    <p class="tutorial-caption">Rodada 3: posição <strong>igual</strong> à rodada 2 → <strong>APERTE!</strong></p>
                </div>
            </div>
            <div class="nback-tutorial-step" id="tutStep3">
                <div class="nback-tutorial-icon">🎮</div>
                <h4>Controles</h4>
                <div class="nback-tutorial-controls">
                    <div><span class="nback-instr-key">A</span> ou <span class="nback-instr-key">←</span> = Posição igual</div>
                    <div><span class="nback-instr-key">L</span> ou <span class="nback-instr-key">→</span> = Letra/Som igual</div>
                </div>
                <p>Ou toque/clique nos botões na tela. No modo <strong>Single</strong>, só posição importa.</p>
            </div>
            <div class="nback-tutorial-step" id="tutStep4">
                <div class="nback-tutorial-icon">🚀</div>
                <h4>Progressão</h4>
                <p>Comece no <strong>1-Back Single</strong> (só posição). Quando dominar, passe para <strong>Dual</strong> (posição + som). Depois aumente para <strong>2-Back</strong>, <strong>3-Back</strong>...</p>
                <p>O modo <strong>Treino</strong> mostra dicas visuais. Sem pressão!</p>
                <p style="color:var(--synapse-gold);font-weight:600;margin-top:12px">Dica: 5-10 minutos por dia já gera resultados em 2-4 semanas.</p>
            </div>
        </div>
        <div class="nback-tutorial-nav">
            <button class="btn-action" id="tutPrev" onclick="nbackTutorialNav(-1)" disabled>← Anterior</button>
            <span id="tutDots" class="tutorial-dots">
                <span class="dot active"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </span>
            <button class="btn-action" id="tutNext" onclick="nbackTutorialNav(1)">Próximo →</button>
        </div>
    </div>`;
    window._tutStep = 0;
}

function nbackTutorialNav(dir) {
    const steps = document.querySelectorAll('.nback-tutorial-step');
    const dots = document.querySelectorAll('.tutorial-dots .dot');
    window._tutStep = Math.max(0, Math.min(steps.length - 1, (window._tutStep || 0) + dir));
    steps.forEach((s, i) => s.classList.toggle('active', i === window._tutStep));
    dots.forEach((d, i) => d.classList.toggle('active', i === window._tutStep));
    document.getElementById('tutPrev').disabled = window._tutStep === 0;
    const nextBtn = document.getElementById('tutNext');
    if (window._tutStep === steps.length - 1) {
        nextBtn.textContent = 'Entendi! Vamos jogar';
        nextBtn.onclick = () => closeNBackTutorial();
    } else {
        nextBtn.textContent = 'Próximo →';
        nextBtn.onclick = () => nbackTutorialNav(1);
    }
}

function closeNBackTutorial() {
    const overlay = document.getElementById('nbackTutorialOverlay');
    if (overlay) overlay.style.display = 'none';
    nbackTutorialSeen = true;
    localStorage.setItem('nbackTutorialSeen', 'true');
}

// --- Settings Panel ---
function toggleNBackSettings() {
    const panel = document.getElementById('nbackSettingsPanel');
    if (panel) panel.classList.toggle('open');
}

function applyNBackSettings() {
    const modeEl = document.getElementById('nbackModeSelect');
    const gameModeEl = document.getElementById('nbackGameModeSelect');
    const roundsEl = document.getElementById('nbackRoundsSelect');
    const stimEl = document.getElementById('nbackStimulusTimeSelect');
    const soundEl = document.getElementById('nbackSoundToggle');
    const hintsEl = document.getElementById('nbackHintsToggle');

    if (modeEl) nbackMode = modeEl.value;
    if (gameModeEl) nbackGameMode = gameModeEl.value;
    if (roundsEl) nbackTotal = parseInt(roundsEl.value) || 20;
    if (stimEl) nbackStimulusTime = parseInt(stimEl.value) || 3000;
    if (soundEl) nbackSoundOn = soundEl.checked;
    if (hintsEl) nbackShowHints = hintsEl.checked;

    // Update UI based on mode
    const letBtn = document.getElementById('nbackLetBtn');
    if (letBtn) letBtn.style.display = nbackMode === 'single' ? 'none' : '';

    updateNBackStartButton();
    toggleNBackSettings();
}

function updateNBackStartButton() {
    const btn = document.getElementById('nbackStartBtn');
    if (!btn) return;
    const modeLabel = nbackMode === 'single' ? 'Single' : 'Dual';
    btn.textContent = `Iniciar ${nbackN}-Back ${modeLabel}`;
}

// --- Server persistence ---
async function loadNBackProgress() {
    try {
        const res = await fetch('/api/nback/progress');
        if (!res.ok) return;
        const prog = await res.json();
        nbackN = prog.current_level || 1;
        renderNBackLevelSelector(prog.max_unlocked_level || 1);
        updateNBackStartButton();
        const levelDisplay = document.getElementById('nbackCurrentLevel');
        if (levelDisplay) {
            levelDisplay.querySelector('.nback-level-number').textContent = nbackN;
        }
    } catch (e) { console.error('NBack progress error:', e); }
}

async function saveNBackSession() {
    const possible = nbackScore.posHit + nbackScore.posMiss + nbackScore.letHit + nbackScore.letMiss;
    const hits = nbackScore.posHit + nbackScore.letHit;
    const pct = possible > 0 ? Math.round((hits / possible) * 100) : 0;

    try {
        const res = await fetch('/api/nback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                n_level: nbackN,
                total_rounds: nbackTotal,
                pos_hits: nbackScore.posHit,
                pos_misses: nbackScore.posMiss,
                pos_false_alarms: nbackScore.posFalse,
                let_hits: nbackScore.letHit,
                let_misses: nbackScore.letMiss,
                let_false_alarms: nbackScore.letFalse,
                accuracy_pct: pct
            })
        });
        const data = await res.json();
        if (data.level_up) showNBackLevelUp(data.new_level);
        if (data.achievements_earned?.length) {
            data.achievements_earned.forEach(a => {
                if (typeof showXPPopup === 'function') showXPPopup(a.xp, a.name);
            });
        }
        loadNBackHistory();
        loadNBackProgress();
    } catch (e) { console.error('Save NBack error:', e); }
}

function renderNBackLevelSelector(maxLevel) {
    const sel = document.getElementById('nbackLevelSelect');
    if (!sel) return;
    sel.innerHTML = '';
    for (let i = 1; i <= Math.max(maxLevel, 1); i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `${i}-Back`;
        if (i === nbackN) opt.selected = true;
        sel.appendChild(opt);
    }
    sel.onchange = (e) => {
        nbackN = parseInt(e.target.value);
        updateNBackStartButton();
        const levelDisplay = document.getElementById('nbackCurrentLevel');
        if (levelDisplay) levelDisplay.querySelector('.nback-level-number').textContent = nbackN;
    };
}

function showNBackLevelUp(newLevel) {
    const el = document.getElementById('nbackScore');
    if (el) {
        el.innerHTML = `<div class="level-up-flash">🎉 NÍVEL ${newLevel}-BACK DESBLOQUEADO! 🧬</div>`;
        setTimeout(() => { el.querySelector('.level-up-flash')?.classList.add('fade'); }, 3000);
    }
}

async function loadNBackHistory() {
    try {
        const res = await fetch('/api/nback/sessions');
        if (!res.ok) return;
        const sessions = await res.json();
        const el = document.getElementById('nbackHistory');
        if (!el || !sessions.length) {
            if (el) el.innerHTML = '<p class="empty-state">Nenhuma sessão registrada</p>';
            return;
        }
        el.innerHTML = '<table class="nback-history-table"><thead><tr><th>Data</th><th>Nível</th><th>Precisão</th></tr></thead><tbody>' +
            sessions.slice(0, 10).map(s => `<tr><td>${formatDate(s.completed_at)}</td><td>${s.n_level}-Back</td><td>${s.accuracy_pct}%</td></tr>`).join('') +
            '</tbody></table>';
    } catch (e) { console.error('NBack history error:', e); }
}

// --- Core Game Logic ---
function startNBack() {
    if (nbackInterval) { stopNBack(); return; }

    // Show tutorial on first time
    if (!nbackTutorialSeen && !localStorage.getItem('nbackTutorialSeen')) {
        showNBackTutorial();
        return;
    }

    nbackAbort = new AbortController();
    nbackHistory = [];
    nbackRound = 0;
    nbackConsecutiveGood = 0;
    nbackScore = { posHit: 0, posMiss: 0, letHit: 0, letMiss: 0, posFalse: 0, letFalse: 0 };

    document.getElementById('nbackStartBtn').textContent = '⏹ Parar';
    document.getElementById('nbackPosBtn').disabled = false;
    const letBtn = document.getElementById('nbackLetBtn');
    if (letBtn) letBtn.disabled = nbackMode === 'single';
    if (letBtn) letBtn.style.display = nbackMode === 'single' ? 'none' : '';

    document.getElementById('nbackScore').textContent = `Rodada 0/${nbackTotal} | ${nbackN}-Back ${nbackMode === 'single' ? 'Single' : 'Dual'}`;

    const feedbackEl = document.getElementById('nbackFeedback');
    if (feedbackEl) feedbackEl.innerHTML = '';

    // Show progress bar
    const progBar = document.getElementById('nbackProgressBar');
    if (progBar) { progBar.style.display = 'block'; progBar.querySelector('.nback-prog-fill').style.width = '0%'; }

    showNBackRound();
}

function showNBackRound() {
    if (nbackAbort?.signal.aborted) return;
    if (nbackRound >= nbackTotal) { finishNBack(); return; }

    nbackUserResponse = { pos: false, let: false };

    // Generate stimulus
    const pos = Math.floor(Math.random() * 9);
    const letter = NBACK_LETTERS[Math.floor(Math.random() * NBACK_LETTERS.length)];

    let finalPos = pos;
    let finalLetter = letter;
    if (nbackRound >= nbackN) {
        if (Math.random() < 0.3) finalPos = nbackHistory[nbackRound - nbackN].pos;
        if (Math.random() < 0.3 && nbackMode === 'dual') finalLetter = nbackHistory[nbackRound - nbackN].letter;
    }

    nbackHistory.push({ pos: finalPos, letter: finalLetter });
    nbackRound++;

    // Display
    const cells = document.querySelectorAll('.nback-cell');
    cells.forEach(c => { c.classList.remove('active', 'correct', 'wrong', 'missed', 'hint'); c.textContent = ''; });
    cells[finalPos]?.classList.add('active');

    const letterEl = document.getElementById('nbackLetter');
    if (nbackMode === 'dual') {
        letterEl.textContent = finalLetter;
        speakLetter(finalLetter);
    } else {
        letterEl.textContent = '';
    }

    document.getElementById('nbackScore').textContent = `Rodada ${nbackRound}/${nbackTotal} | ${nbackN}-Back ${nbackMode === 'single' ? 'Single' : 'Dual'}`;

    // Progress bar
    const progBar = document.getElementById('nbackProgressBar');
    if (progBar) progBar.querySelector('.nback-prog-fill').style.width = `${(nbackRound / nbackTotal) * 100}%`;

    // Training hints: highlight the N-back cell if it matches
    if (nbackShowHints && nbackGameMode === 'training' && nbackRound > nbackN) {
        const target = nbackHistory[nbackRound - 1 - nbackN];
        const current = nbackHistory[nbackRound - 1];
        if (target.pos === current.pos) {
            cells[current.pos]?.classList.add('hint');
        }
    }

    // Reset buttons
    document.getElementById('nbackPosBtn').classList.remove('btn-correct', 'btn-wrong');
    const letBtnEl = document.getElementById('nbackLetBtn');
    if (letBtnEl) letBtnEl.classList.remove('btn-correct', 'btn-wrong');

    // Score after stimulus display time
    nbackInterval = setTimeout(() => {
        if (nbackAbort?.signal.aborted) return;
        const feedbackMessages = [];

        if (nbackRound > nbackN) {
            const target = nbackHistory[nbackRound - 1 - nbackN];
            const current = nbackHistory[nbackRound - 1];
            const posMatch = target.pos === current.pos;
            const letMatch = target.letter === current.letter;

            if (posMatch && nbackUserResponse.pos) {
                nbackScore.posHit++;
                flashNBackCell(current.pos, 'correct');
                feedbackMessages.push('<span style="color:var(--synapse-green)">✓ Posição</span>');
            } else if (posMatch && !nbackUserResponse.pos) {
                nbackScore.posMiss++;
                flashNBackCell(current.pos, 'missed');
                feedbackMessages.push('<span style="color:var(--synapse-red)">✗ Posição perdida</span>');
            } else if (!posMatch && nbackUserResponse.pos) {
                nbackScore.posFalse++;
                flashNBackCell(current.pos, 'wrong');
                feedbackMessages.push('<span style="color:#ff8c00">⚠ Alarme falso</span>');
            }

            if (nbackMode === 'dual') {
                if (letMatch && nbackUserResponse.let) {
                    nbackScore.letHit++;
                    feedbackMessages.push('<span style="color:var(--synapse-green)">✓ Letra</span>');
                } else if (letMatch && !nbackUserResponse.let) {
                    nbackScore.letMiss++;
                    feedbackMessages.push('<span style="color:var(--synapse-red)">✗ Letra perdida</span>');
                } else if (!letMatch && nbackUserResponse.let) {
                    nbackScore.letFalse++;
                    feedbackMessages.push('<span style="color:#ff8c00">⚠ Letra falsa</span>');
                }
            }
        }

        if (feedbackMessages.length > 0) showNBackFeedback(feedbackMessages);

        cells.forEach(c => c.classList.remove('active', 'hint'));
        letterEl.textContent = '';

        setTimeout(() => showNBackRound(), 500);
    }, nbackStimulusTime);
}

function nbackMatch(type) {
    if (!nbackInterval) return;
    if (type === 'position') {
        nbackUserResponse.pos = true;
        document.getElementById('nbackPosBtn').classList.add('btn-correct');
    } else if (nbackMode === 'dual') {
        nbackUserResponse.let = true;
        document.getElementById('nbackLetBtn').classList.add('btn-correct');
    }
}

function finishNBack() {
    const hits = nbackScore.posHit + nbackScore.letHit;
    const misses = nbackScore.posMiss + nbackScore.letMiss;
    const falseAlarms = nbackScore.posFalse + nbackScore.letFalse;
    const possible = hits + misses;
    const pct = possible > 0 ? Math.round((hits / possible) * 100) : 0;

    // Calculate d-prime
    const totalTrials = nbackTotal - nbackN; // scoreable rounds
    const correctRejects = totalTrials * (nbackMode === 'dual' ? 2 : 1) - hits - misses - falseAlarms;
    const dPrime = calcDPrime(hits, misses, falseAlarms, Math.max(0, correctRejects));

    // Build result display
    let resultHTML = `<div class="nback-result">`;
    resultHTML += `<div class="nback-result-main">${pct}% de acurácia</div>`;
    resultHTML += `<div class="nback-result-detail">`;
    resultHTML += `Posição: ${nbackScore.posHit}✓ ${nbackScore.posMiss}✗ ${nbackScore.posFalse}⚠`;
    if (nbackMode === 'dual') {
        resultHTML += ` | Letra: ${nbackScore.letHit}✓ ${nbackScore.letMiss}✗ ${nbackScore.letFalse}⚠`;
    }
    resultHTML += `</div>`;
    resultHTML += `<div class="nback-result-dprime">d' = ${dPrime} — `;
    if (dPrime >= 3) resultHTML += `<span style="color:var(--synapse-green)">Excelente sensibilidade!</span>`;
    else if (dPrime >= 2) resultHTML += `<span style="color:var(--synapse-green)">Boa sensibilidade</span>`;
    else if (dPrime >= 1) resultHTML += `<span style="color:var(--synapse-gold)">Sensibilidade moderada</span>`;
    else resultHTML += `<span style="color:var(--synapse-red)">Continue treinando!</span>`;
    resultHTML += `</div>`;

    // Adaptive mode: auto-level feedback
    if (nbackGameMode === 'adaptive') {
        if (pct >= 80 && dPrime >= 2) {
            resultHTML += `<div class="nback-result-adapt" style="color:var(--synapse-green)">⬆ Próxima sessão: nível aumenta!</div>`;
        } else if (pct <= 50) {
            resultHTML += `<div class="nback-result-adapt" style="color:var(--synapse-red)">⬇ Próxima sessão: nível diminui</div>`;
        } else {
            resultHTML += `<div class="nback-result-adapt" style="color:var(--synapse-gold)">→ Mantenha o nível atual</div>`;
        }
    }
    resultHTML += `</div>`;

    document.getElementById('nbackScore').innerHTML = resultHTML;
    stopNBack();
    if (nbackGameMode !== 'training') saveNBackSession();
}

function stopNBack() {
    clearTimeout(nbackInterval);
    nbackInterval = null;
    if (nbackAbort) { nbackAbort.abort(); nbackAbort = null; }
    updateNBackStartButton();
    document.getElementById('nbackPosBtn').disabled = true;
    const letBtn = document.getElementById('nbackLetBtn');
    if (letBtn) letBtn.disabled = true;
    document.querySelectorAll('.nback-cell').forEach(c => c.classList.remove('active', 'correct', 'wrong', 'missed', 'hint'));
    document.getElementById('nbackLetter').textContent = '';
}


// ─── 8. GO/NO-GO TASK — Response Inhibition Training ───
let gonogoTimeout = null;
let gonogoTrials = [];
let gonogoIndex = 0;
let gonogoRT = [];
let gonogoScore = { hits: 0, correctRejects: 0, falseAlarms: 0, misses: 0 };
let gonogoStimulusTime = 0;
let gonogoResponded = false;
let gonogoActive = false;

function generateGoNoGoTrials(count) {
    const trials = [];
    const goCount = Math.round(count * 0.7);
    for (let i = 0; i < goCount; i++) trials.push('go');
    for (let i = goCount; i < count; i++) trials.push('nogo');
    // Fisher-Yates shuffle
    for (let i = trials.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [trials[i], trials[j]] = [trials[j], trials[i]];
    }
    return trials;
}

function startGoNoGo() {
    if (gonogoActive) { stopGoNoGo(); return; }

    gonogoTrials = generateGoNoGoTrials(30);
    gonogoIndex = 0;
    gonogoRT = [];
    gonogoScore = { hits: 0, correctRejects: 0, falseAlarms: 0, misses: 0 };
    gonogoActive = true;

    document.getElementById('gonogoBtn').textContent = '⏹ Parar';
    document.getElementById('gonogoScore').textContent = 'Prepare-se...';

    const circle = document.getElementById('gonogoCircle');
    circle.className = 'gonogo-circle';

    setTimeout(() => showGoNoGoTrial(), 1500);
}

function showGoNoGoTrial() {
    if (!gonogoActive || gonogoIndex >= gonogoTrials.length) {
        finishGoNoGo();
        return;
    }

    gonogoResponded = false;
    const type = gonogoTrials[gonogoIndex];
    const circle = document.getElementById('gonogoCircle');

    circle.className = 'gonogo-circle';

    document.getElementById('gonogoScore').textContent =
        `Estímulo ${gonogoIndex + 1}/${gonogoTrials.length} | Acertos: ${gonogoScore.hits} | Alarmes falsos: ${gonogoScore.falseAlarms}`;

    // Random inter-stimulus interval (1-3s)
    const delay = 1000 + Math.random() * 2000;

    gonogoTimeout = setTimeout(() => {
        if (!gonogoActive) return;

        circle.className = type === 'go' ? 'gonogo-circle go' : 'gonogo-circle nogo';
        gonogoStimulusTime = performance.now();

        // Auto-advance after stimulus display time (1.2s)
        gonogoTimeout = setTimeout(() => {
            if (!gonogoActive) return;

            if (type === 'go' && !gonogoResponded) {
                gonogoScore.misses++;
            } else if (type === 'nogo' && !gonogoResponded) {
                gonogoScore.correctRejects++;
            }

            circle.className = 'gonogo-circle';
            gonogoIndex++;
            showGoNoGoTrial();
        }, 1200);
    }, delay);
}

function gonogoResponse() {
    if (!gonogoActive || gonogoResponded) return;
    const circle = document.getElementById('gonogoCircle');
    if (!circle.classList.contains('go') && !circle.classList.contains('nogo')) return;

    gonogoResponded = true;
    const rt = performance.now() - gonogoStimulusTime;
    const type = gonogoTrials[gonogoIndex];

    if (type === 'go') {
        gonogoScore.hits++;
        gonogoRT.push(rt);
        circle.classList.add('flash-correct');
    } else {
        gonogoScore.falseAlarms++;
        circle.classList.add('flash-wrong');
    }

    // Clear current timeout and advance
    clearTimeout(gonogoTimeout);
    setTimeout(() => {
        if (!gonogoActive) return;
        circle.className = 'gonogo-circle';
        gonogoIndex++;
        showGoNoGoTrial();
    }, 400);
}

function finishGoNoGo() {
    gonogoActive = false;
    clearTimeout(gonogoTimeout);
    gonogoTimeout = null;

    const avgRT = gonogoRT.length > 0 ? Math.round(gonogoRT.reduce((a, b) => a + b, 0) / gonogoRT.length) : 0;
    const total = gonogoScore.hits + gonogoScore.correctRejects + gonogoScore.falseAlarms + gonogoScore.misses;
    const inhibitionRate = total > 0
        ? Math.round(((gonogoScore.correctRejects) / (gonogoScore.correctRejects + gonogoScore.falseAlarms)) * 100)
        : 0;

    let rating = '';
    if (inhibitionRate >= 90 && avgRT < 400) rating = 'Excelente controle inibitório!';
    else if (inhibitionRate >= 75) rating = 'Bom controle. Continue treinando.';
    else if (inhibitionRate >= 50) rating = 'Moderado. Foco na inibição de impulsos.';
    else rating = 'Impulsividade alta. Treine mais vezes.';

    const circle = document.getElementById('gonogoCircle');
    circle.className = 'gonogo-circle';

    document.getElementById('gonogoBtn').textContent = 'Iniciar (30 estímulos)';
    document.getElementById('gonogoScore').innerHTML =
        `<strong>Resultado:</strong> GO corretos: ${gonogoScore.hits} | NO-GO corretos: ${gonogoScore.correctRejects} | ` +
        `Alarmes falsos: ${gonogoScore.falseAlarms} | Perdidos: ${gonogoScore.misses}<br>` +
        `TR médio: ${avgRT}ms | Controle inibitório: ${inhibitionRate}%<br>` +
        `<em>${rating}</em>`;
}

function stopGoNoGo() {
    gonogoActive = false;
    clearTimeout(gonogoTimeout);
    gonogoTimeout = null;
    document.getElementById('gonogoBtn').textContent = 'Iniciar (30 estímulos)';
    const circle = document.getElementById('gonogoCircle');
    circle.className = 'gonogo-circle';
    document.getElementById('gonogoScore').textContent = '';
}


// ─── 9. PVT — Psychomotor Vigilance Task ───
let pvtTimeout = null;
let pvtCounterInterval = null;
let pvtTrials = [];
let pvtTrialIndex = 0;
let pvtState = 'idle'; // idle, waiting, stimulus, responded, tooEarly
let pvtStimulusTime = 0;
const PVT_TOTAL_TRIALS = 10;

function startPVT() {
    if (pvtState !== 'idle') { stopPVT(); return; }

    pvtTrials = [];
    pvtTrialIndex = 0;
    pvtState = 'waiting';

    document.getElementById('pvtBtn').textContent = '⏹ Parar';
    document.getElementById('pvtScore').textContent = `Tentativa 1/${PVT_TOTAL_TRIALS}`;

    const display = document.getElementById('pvtDisplay');
    display.className = 'pvt-display waiting';
    display.textContent = 'Aguarde o contador...';

    const area = document.getElementById('pvtArea');
    area.classList.add('active');

    schedulePVTStimulus();
}

function schedulePVTStimulus() {
    // Random delay 2-10 seconds
    const delay = 2000 + Math.random() * 8000;

    const display = document.getElementById('pvtDisplay');
    display.className = 'pvt-display waiting';
    display.textContent = 'Aguarde...';
    pvtState = 'waiting';

    pvtTimeout = setTimeout(() => {
        if (pvtState !== 'waiting') return;
        showPVTStimulus();
    }, delay);
}

function showPVTStimulus() {
    pvtState = 'stimulus';
    pvtStimulusTime = performance.now();

    const display = document.getElementById('pvtDisplay');
    display.className = 'pvt-display stimulus';

    // Start running counter
    let counterMs = 0;
    display.textContent = '000';

    pvtCounterInterval = setInterval(() => {
        counterMs = Math.round(performance.now() - pvtStimulusTime);
        display.textContent = String(counterMs).padStart(3, '0');

        // Auto-stop after 5 seconds (lapse)
        if (counterMs >= 5000) {
            clearInterval(pvtCounterInterval);
            pvtCounterInterval = null;
            pvtTrials.push(5000);
            pvtTrialIndex++;
            display.textContent = 'LAPSO (>5s)';
            display.className = 'pvt-display';
            display.style.color = 'var(--synapse-red)';
            setTimeout(() => {
                display.style.color = '';
                if (pvtTrialIndex < PVT_TOTAL_TRIALS) {
                    document.getElementById('pvtScore').textContent = `Tentativa ${pvtTrialIndex + 1}/${PVT_TOTAL_TRIALS}`;
                    schedulePVTStimulus();
                } else {
                    finishPVT();
                }
            }, 1000);
        }
    }, 10);
}

function pvtResponse() {
    if (pvtState === 'waiting') {
        // Clicked too early
        clearTimeout(pvtTimeout);
        pvtTimeout = null;
        const display = document.getElementById('pvtDisplay');
        display.className = 'pvt-display';
        display.textContent = 'Cedo demais!';
        display.style.color = 'var(--synapse-red)';
        pvtState = 'tooEarly';
        setTimeout(() => {
            display.style.color = '';
            if (pvtState === 'tooEarly') {
                schedulePVTStimulus();
            }
        }, 1000);
        return;
    }

    if (pvtState !== 'stimulus') return;

    const rt = Math.round(performance.now() - pvtStimulusTime);
    pvtState = 'responded';

    clearInterval(pvtCounterInterval);
    pvtCounterInterval = null;

    pvtTrials.push(rt);
    pvtTrialIndex++;

    const display = document.getElementById('pvtDisplay');
    display.className = 'pvt-display';
    display.textContent = `${rt} ms`;
    display.style.color = rt < 300 ? 'var(--synapse-green)' : rt < 500 ? 'var(--synapse-gold)' : 'var(--synapse-red)';

    document.getElementById('pvtScore').textContent = `Tentativa ${Math.min(pvtTrialIndex + 1, PVT_TOTAL_TRIALS)}/${PVT_TOTAL_TRIALS} | Último: ${rt}ms`;

    setTimeout(() => {
        display.style.color = '';
        if (pvtTrialIndex < PVT_TOTAL_TRIALS) {
            schedulePVTStimulus();
        } else {
            finishPVT();
        }
    }, 1200);
}

function finishPVT() {
    pvtState = 'idle';
    clearTimeout(pvtTimeout);
    clearInterval(pvtCounterInterval);
    pvtTimeout = null;
    pvtCounterInterval = null;

    const validTrials = pvtTrials.filter(t => t < 5000);
    const avg = validTrials.length > 0 ? Math.round(validTrials.reduce((a, b) => a + b, 0) / validTrials.length) : 0;
    const best = validTrials.length > 0 ? Math.min(...validTrials) : 0;
    const worst = validTrials.length > 0 ? Math.max(...validTrials) : 0;
    const lapses = pvtTrials.filter(t => t >= 5000).length;

    let rating = '';
    if (avg < 300) rating = 'Excelente — Alerta máximo!';
    else if (avg < 400) rating = 'Bom — Alerta adequado.';
    else if (avg < 500) rating = 'Moderado — Atenção caindo.';
    else rating = 'Fatigado — Recomenda-se descanso!';

    document.getElementById('pvtBtn').textContent = 'Iniciar (10 tentativas)';
    document.getElementById('pvtArea').classList.remove('active');
    document.getElementById('pvtDisplay').className = 'pvt-display waiting';
    document.getElementById('pvtDisplay').textContent = 'Concluído';

    document.getElementById('pvtScore').innerHTML =
        `<strong>Resultado:</strong> TR médio: ${avg}ms | Melhor: ${best}ms | Pior: ${worst}ms` +
        (lapses > 0 ? ` | Lapsos: ${lapses}` : '') +
        `<br><em>${rating}</em>`;
}

function stopPVT() {
    pvtState = 'idle';
    clearTimeout(pvtTimeout);
    clearInterval(pvtCounterInterval);
    pvtTimeout = null;
    pvtCounterInterval = null;

    document.getElementById('pvtBtn').textContent = 'Iniciar (10 tentativas)';
    document.getElementById('pvtArea').classList.remove('active');
    document.getElementById('pvtDisplay').className = 'pvt-display waiting';
    document.getElementById('pvtDisplay').textContent = 'Clique em Iniciar';
    document.getElementById('pvtScore').textContent = '';
}


// ─── 7. MONITOR DE FADIGA COGNITIVA ───
function updateFatigueMonitor() {
    const minutesEl = document.getElementById('todayMinutes');
    const mins = parseInt(minutesEl?.textContent) || 0;

    const fill = document.getElementById('fatigueFill');
    const status = document.getElementById('fatigueStatus');
    const rec = document.getElementById('fatigueRec');

    if (!fill || !status) return;

    // Map minutes to fatigue level (max bar at 180min)
    const pct = Math.min(100, (mins / 180) * 100);
    fill.style.width = pct + '%';

    if (mins < 45) {
        fill.style.background = 'var(--synapse-green)';
        status.textContent = `🟢 Fresco — ${mins} min hoje`;
        status.style.color = 'var(--synapse-green)';
        rec.textContent = 'Córtex pré-frontal com reservas plenas. Ideal para tarefas difíceis.';
    } else if (mins < 90) {
        fill.style.background = 'var(--synapse-gold)';
        status.textContent = `🟡 Aquecido — ${mins} min hoje`;
        status.style.color = 'var(--synapse-gold)';
        rec.textContent = 'Adenosina acumulando. Considere uma micro-pausa de 5min com visão panorâmica.';
    } else if (mins < 180) {
        fill.style.background = 'var(--synapse-red)';
        status.textContent = `🟠 Alerta — ${mins} min hoje`;
        status.style.color = '#ff8c00';
        rec.textContent = 'Fadiga significativa. Descanso profundo de 15min recomendado para limpeza cerebral.';
    } else {
        fill.style.background = 'var(--synapse-red)';
        status.textContent = `🔴 Fadiga Crítica — ${mins} min hoje`;
        status.style.color = 'var(--synapse-red)';
        rec.textContent = 'Controle atencional sobrecarregado. Pare agora. Descanso profundo obrigatório + sono de qualidade esta noite.';
    }
}

// Update fatigue + N-Back data on tab switch
const _originalSwitchTab = window.switchTab;
if (_originalSwitchTab) {
    window.switchTab = function (tabName) {
        _originalSwitchTab(tabName);
        if (tabName === 'neurotools') {
            updateFatigueMonitor();
            initNBackUI();
            loadNBackProgress();
            loadNBackHistory();
        }
    };
}

// Also update on page load after stats are fetched
const _origLoadStats = window.loadStats;
if (_origLoadStats) {
    window.loadStats = async function () {
        await _origLoadStats();
        updateFatigueMonitor();
    };
}

// ─── KEYBOARD SHORTCUTS (N-Back: A/Left=Position, L/Right=Letter) ───
function handleNBackKeyboard(e) {
    if (!nbackInterval) return;
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        e.preventDefault();
        nbackMatch('position');
    }
    if ((e.key === 'l' || e.key === 'L' || e.key === 'ArrowRight') && nbackMode === 'dual') {
        e.preventDefault();
        nbackMatch('letter');
    }
}
document.addEventListener('keydown', handleNBackKeyboard);

// Initialize N-Back on tab switch
function initNBackUI() {
    nbackTutorialSeen = !!localStorage.getItem('nbackTutorialSeen');
    const letBtn = document.getElementById('nbackLetBtn');
    if (letBtn) letBtn.style.display = nbackMode === 'single' ? 'none' : '';
    updateNBackStartButton();
}
