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


// ─── 6. DUAL N-BACK (with server persistence, auto-level, audio, keyboard, feedback) ───
const NBACK_LETTERS = 'BCDFGHJKLMNPQRSTVWXYZ';
let nbackInterval = null;
let nbackN = 2;
let nbackHistory = []; // {pos, letter}
let nbackRound = 0;
let nbackTotal = 20; // rounds (configurable)
let nbackScore = { posHit: 0, posMiss: 0, letHit: 0, letMiss: 0, posFalse: 0, letFalse: 0 };
let nbackUserResponse = { pos: false, let: false };

// --- Audio: Speech Synthesis for letters ---

function speakLetter(letter) {
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(letter);
        utt.lang = 'pt-BR';
        utt.rate = 0.9;
        utt.volume = 0.7;
        speechSynthesis.speak(utt);
    }
}

// --- Visual feedback helpers ---

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

// --- Core N-Back game logic ---

function startNBack() {
    if (nbackInterval) { stopNBack(); return; }

    // Read configurable rounds
    const roundsSelect = document.getElementById('nbackRoundsSelect');
    if (roundsSelect) nbackTotal = parseInt(roundsSelect.value) || 20;

    nbackHistory = [];
    nbackRound = 0;
    nbackScore = { posHit: 0, posMiss: 0, letHit: 0, letMiss: 0, posFalse: 0, letFalse: 0 };

    document.getElementById('nbackStartBtn').textContent = '⏹ Parar';
    document.getElementById('nbackPosBtn').disabled = false;
    document.getElementById('nbackLetBtn').disabled = false;
    document.getElementById('nbackScore').textContent = `Rodada 0/${nbackTotal} | N=${nbackN}`;

    const feedbackEl = document.getElementById('nbackFeedback');
    if (feedbackEl) feedbackEl.innerHTML = '';

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
    cells.forEach(c => c.classList.remove('active', 'correct', 'wrong', 'missed'));
    cells[finalPos]?.classList.add('active');
    document.getElementById('nbackLetter').textContent = finalLetter;
    document.getElementById('nbackScore').textContent = `Rodada ${nbackRound}/${nbackTotal} | N=${nbackN}`;

    // Audio: speak the letter
    speakLetter(finalLetter);

    // Reset buttons visual
    document.getElementById('nbackPosBtn').classList.remove('btn-correct', 'btn-wrong');
    document.getElementById('nbackLetBtn').classList.remove('btn-correct', 'btn-wrong');

    // After display time, score and move to next
    nbackInterval = setTimeout(() => {
        const feedbackMessages = [];

        // Score this round
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
                feedbackMessages.push('<span style="color:#ff8c00">⚠ Posição falsa</span>');
            }

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

        if (feedbackMessages.length > 0) {
            showNBackFeedback(feedbackMessages);
        }

        cells.forEach(c => c.classList.remove('active'));
        document.getElementById('nbackLetter').textContent = '';

        setTimeout(() => showNBackRound(), 500); // brief pause between rounds
    }, 2500); // stimulus display time
}

function nbackMatch(type) {
    if (!nbackInterval) return;
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
    document.querySelectorAll('.nback-cell').forEach(c => c.classList.remove('active', 'correct', 'wrong', 'missed'));
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
    circle.style.opacity = '0';

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
    circle.style.opacity = '0';

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
            circle.style.opacity = '0';
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
        circle.style.opacity = '0';
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
    circle.style.opacity = '0';

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
    circle.style.opacity = '0';
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
        rec.textContent = 'Fadiga significativa. NSDR de 15min recomendado para clearance glinfático.';
    } else {
        fill.style.background = 'var(--synapse-red)';
        status.textContent = `🔴 Fadiga Crítica — ${mins} min hoje`;
        status.style.color = 'var(--synapse-red)';
        rec.textContent = 'ACC sobrecarregado. Pare agora. NSDR obrigatório + sono de qualidade esta noite.';
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

// ─── KEYBOARD SHORTCUTS (N-Back: A/Left=Position, L/Right=Letter) ───
function handleNBackKeyboard(e) {
    if (!nbackInterval) return;
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        e.preventDefault();
        nbackMatch('position');
    }
    if (e.key === 'l' || e.key === 'L' || e.key === 'ArrowRight') {
        e.preventDefault();
        nbackMatch('letter');
    }
}
document.addEventListener('keydown', handleNBackKeyboard);
