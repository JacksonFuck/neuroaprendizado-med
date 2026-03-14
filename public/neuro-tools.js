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
            timer.textContent = `${seconds}s — Mantenha o foco. Pisque o minimo.`;
        } else {
            stopAnchorExercise();
            timer.textContent = '✅ LC-NE ativado. Noradrenalina liberada. Comece a estudar.';
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


// ─── 3. HIPERVENTILACAO CONTROLADA (20 respiracoes) ───
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

    const INHALE_TIME = 5.0; // segundos — inspiracao profunda
    const EXHALE_TIME = 5.0; // segundos — expiracao controlada
    const TOTAL_BREATHS = 20;

    counter.textContent = `0 / ${TOTAL_BREATHS} respiracoes`;

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
                counter.textContent = `${breathsDone} / ${TOTAL_BREATHS} respiracoes`;
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
            progress.textContent = '✅ NSDR completo. Dopamina restaurada. Adenosina limpa.';
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
            document.getElementById('stroopArea').innerHTML = '<p class="empty-state">Sessao encerrada. Clique para jogar novamente.</p>';
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


// ─── 6. DUAL N-BACK (with server persistence & auto-level) ───
const NBACK_LETTERS = 'BCDFGHJKLMNPQRSTVWXYZ';
let nbackInterval = null;
let nbackN = 2;
let nbackHistory = []; // {pos, letter}
let nbackRound = 0;
let nbackTotal = 20; // rounds
let nbackScore = { posHit: 0, posMiss: 0, letHit: 0, letMiss: 0, posFalse: 0, letFalse: 0 };
let nbackUserResponse = { pos: false, let: false };

// --- Server persistence helpers ---

async function loadNBackProgress() {
    try {
        const res = await fetch('/api/nback/progress');
        if (!res.ok) return;
        const prog = await res.json();
        nbackN = prog.current_level || 2;
        renderNBackLevelSelector(prog.max_unlocked_level || 2);
        document.getElementById('nbackStartBtn').textContent = `Iniciar ${nbackN}-Back`;
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
        if (data.level_up) {
            showNBackLevelUp(data.new_level);
        }
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
    for (let i = 2; i <= Math.max(maxLevel, 2); i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `${i}-Back`;
        if (i === nbackN) opt.selected = true;
        sel.appendChild(opt);
    }
    sel.onchange = (e) => {
        nbackN = parseInt(e.target.value);
        document.getElementById('nbackStartBtn').textContent = `Iniciar ${nbackN}-Back`;
    };
}

function showNBackLevelUp(newLevel) {
    const el = document.getElementById('nbackScore');
    if (el) {
        el.innerHTML = `<div class="level-up-flash">🎉 NIVEL ${newLevel}-BACK DESBLOQUEADO! 🧬</div>`;
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
            if (el) el.innerHTML = '<p class="empty-state">Nenhuma sessao registrada</p>';
            return;
        }
        el.innerHTML = '<table class="nback-history-table"><thead><tr><th>Data</th><th>Nivel</th><th>Precisao</th></tr></thead><tbody>' +
            sessions.slice(0, 10).map(s => `<tr><td>${formatDate(s.completed_at)}</td><td>${s.n_level}-Back</td><td>${s.accuracy_pct}%</td></tr>`).join('') +
            '</tbody></table>';
    } catch (e) { console.error('NBack history error:', e); }
}

// --- Core N-Back game logic ---

function startNBack() {
    if (nbackInterval) { stopNBack(); return; }

    nbackHistory = [];
    nbackRound = 0;
    nbackScore = { posHit: 0, posMiss: 0, letHit: 0, letMiss: 0, posFalse: 0, letFalse: 0 };

    document.getElementById('nbackStartBtn').textContent = '⏹ Parar';
    document.getElementById('nbackPosBtn').disabled = false;
    document.getElementById('nbackLetBtn').disabled = false;
    document.getElementById('nbackScore').textContent = `Rodada 0/${nbackTotal} | N=${nbackN}`;

    showNBackRound();
}

function showNBackRound() {
    if (nbackRound >= nbackTotal) {
        finishNBack();
        return;
    }

    nbackUserResponse = { pos: false, let: false };

    // Generate new stimulus
    const pos = Math.floor(Math.random() * 9);
    const letter = NBACK_LETTERS[Math.floor(Math.random() * NBACK_LETTERS.length)];

    // 30% chance of matching position or letter for playability
    let finalPos = pos;
    let finalLetter = letter;
    if (nbackRound >= nbackN) {
        if (Math.random() < 0.3) finalPos = nbackHistory[nbackRound - nbackN].pos;
        if (Math.random() < 0.3) finalLetter = nbackHistory[nbackRound - nbackN].letter;
    }

    nbackHistory.push({ pos: finalPos, letter: finalLetter });
    nbackRound++;

    // Display
    const cells = document.querySelectorAll('.nback-cell');
    cells.forEach(c => c.classList.remove('active'));
    cells[finalPos]?.classList.add('active');
    document.getElementById('nbackLetter').textContent = finalLetter;
    document.getElementById('nbackScore').textContent = `Rodada ${nbackRound}/${nbackTotal} | N=${nbackN}`;

    // Reset buttons visual
    document.getElementById('nbackPosBtn').classList.remove('btn-correct', 'btn-wrong');
    document.getElementById('nbackLetBtn').classList.remove('btn-correct', 'btn-wrong');

    // After display time, score and move to next
    nbackInterval = setTimeout(() => {
        // Score this round
        if (nbackRound > nbackN) {
            const target = nbackHistory[nbackRound - 1 - nbackN];
            const current = nbackHistory[nbackRound - 1];

            const posMatch = target.pos === current.pos;
            const letMatch = target.letter === current.letter;

            if (posMatch && nbackUserResponse.pos) nbackScore.posHit++;
            else if (posMatch && !nbackUserResponse.pos) nbackScore.posMiss++;
            else if (!posMatch && nbackUserResponse.pos) nbackScore.posFalse++;

            if (letMatch && nbackUserResponse.let) nbackScore.letHit++;
            else if (letMatch && !nbackUserResponse.let) nbackScore.letMiss++;
            else if (!letMatch && nbackUserResponse.let) nbackScore.letFalse++;
        }

        cells.forEach(c => c.classList.remove('active'));
        document.getElementById('nbackLetter').textContent = '';

        setTimeout(() => showNBackRound(), 500); // brief pause between rounds
    }, 2500); // stimulus display time
}

function nbackMatch(type) {
    if (type === 'position') {
        nbackUserResponse.pos = true;
        document.getElementById('nbackPosBtn').classList.add('btn-correct');
    } else {
        nbackUserResponse.let = true;
        document.getElementById('nbackLetBtn').classList.add('btn-correct');
    }
}

function finishNBack() {
    const hits = nbackScore.posHit + nbackScore.letHit;
    const possible = nbackScore.posHit + nbackScore.posMiss + nbackScore.letHit + nbackScore.letMiss;
    const pct = possible > 0 ? Math.round((hits / possible) * 100) : 0;

    document.getElementById('nbackScore').textContent =
        `Resultado: ${hits}/${possible} acertos (${pct}%) — Pos: ${nbackScore.posHit}✓ ${nbackScore.posMiss}✗ | Let: ${nbackScore.letHit}✓ ${nbackScore.letMiss}✗`;

    stopNBack();
    saveNBackSession();
}

function stopNBack() {
    clearTimeout(nbackInterval);
    nbackInterval = null;
    document.getElementById('nbackStartBtn').textContent = `Iniciar ${nbackN}-Back`;
    document.getElementById('nbackPosBtn').disabled = true;
    document.getElementById('nbackLetBtn').disabled = true;
    document.querySelectorAll('.nback-cell').forEach(c => c.classList.remove('active'));
    document.getElementById('nbackLetter').textContent = '';
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
        rec.textContent = 'Cortex pre-frontal com reservas plenas. Ideal para tarefas dificeis.';
    } else if (mins < 90) {
        fill.style.background = 'var(--synapse-gold)';
        status.textContent = `🟡 Aquecido — ${mins} min hoje`;
        status.style.color = 'var(--synapse-gold)';
        rec.textContent = 'Adenosina acumulando. Considere uma micro-pausa de 5min com panoramic vision.';
    } else if (mins < 180) {
        fill.style.background = 'var(--synapse-red)';
        status.textContent = `🟠 Alerta — ${mins} min hoje`;
        status.style.color = '#ff8c00';
        rec.textContent = 'Fadiga significativa. NSDR de 15min recomendado para clearance glinfatico.';
    } else {
        fill.style.background = 'var(--synapse-red)';
        status.textContent = `🔴 Fadiga Critica — ${mins} min hoje`;
        status.style.color = 'var(--synapse-red)';
        rec.textContent = 'ACC sobrecarregado. Pare agora. NSDR obrigatorio + sono de qualidade esta noite.';
    }
}

// Update fatigue + N-Back data on tab switch
const _originalSwitchTab = window.switchTab;
if (_originalSwitchTab) {
    window.switchTab = function (tabName) {
        _originalSwitchTab(tabName);
        if (tabName === 'neurotools') {
            updateFatigueMonitor();
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
