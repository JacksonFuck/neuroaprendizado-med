/* ═══════════════════════════════════════════════════════════════
   NEUROAPRENDIZADO MED — Application Logic
   ═══════════════════════════════════════════════════════════════ */

let currentUser = null;
let currentMood = 'neutral';

// ─── INIT ───
const PREVIEW_MODE = window.location.protocol === 'file:'; // Disabled for localhost since backend is ready

document.addEventListener('DOMContentLoaded', async () => {
    if (PREVIEW_MODE) {
        // Mock data for preview
        currentUser = { id: 1, name: 'Estudante Preview', email: 'preview@med.com', avatar_url: null };
        renderUserInfo();
        setGreeting();
        document.getElementById('dashMinutes').textContent = '847';
        document.getElementById('dashSessions').textContent = '34';
        document.getElementById('dashStreak').textContent = '12';
        document.getElementById('dashReviews').textContent = '3';
        document.getElementById('todayMinutes').textContent = '75';
        document.getElementById('todaySessions').textContent = '3';
        document.getElementById('totalMinutesAll').textContent = '847';
        document.getElementById('dashUpcoming').innerHTML = `
      <div class="upcoming-item"><span class="upcoming-name">Insuficiência Cardíaca</span><span class="upcoming-date" style="color:#ef4444">⚠️ Hoje</span></div>
      <div class="upcoming-item"><span class="upcoming-name">Pneumonia Comunitária</span><span class="upcoming-date">27 fev</span></div>
      <div class="upcoming-item"><span class="upcoming-name">Diabetes Tipo 2</span><span class="upcoming-date">01 mar</span></div>`;
        document.getElementById('dashLastDiary').innerHTML = `
      <div class="diary-entry-card">
        <div class="diary-entry-header"><span class="diary-date">24 fev</span><span class="diary-mood">🤩</span></div>
        <p class="diary-content">Revisão intensa de Cardiologia usando active recall. Consegui lembrar 80% dos mecanismos de IC sem consultar. O interleaving com Pneumo ajudou a consolidar diagnósticos diferenciais.</p>
      </div>`;
        document.getElementById('spacedList').innerHTML = `
      <div class="spaced-topic-item"><div class="topic-info"><h4>Insuficiência Cardíaca</h4><p class="topic-meta">Cardiologia • Próxima: 25 fev</p></div><div style="display:flex;align-items:center;gap:16px"><div class="topic-stage"><div class="stage-dot filled"></div><div class="stage-dot filled"></div><div class="stage-dot filled"></div><div class="stage-dot"></div><div class="stage-dot"></div></div><div class="topic-actions"><button class="btn-review">Revisar ✓</button><button class="btn-delete">✕</button></div></div></div>
      <div class="spaced-topic-item"><div class="topic-info"><h4>Pneumonia Comunitária</h4><p class="topic-meta">Pneumologia • Próxima: 27 fev</p></div><div style="display:flex;align-items:center;gap:16px"><div class="topic-stage"><div class="stage-dot filled"></div><div class="stage-dot filled"></div><div class="stage-dot"></div><div class="stage-dot"></div><div class="stage-dot"></div></div><div class="topic-actions"><button class="btn-review">Revisar ✓</button><button class="btn-delete">✕</button></div></div></div>
      <div class="spaced-topic-item"><div class="topic-info"><h4>Diabetes Tipo 2</h4><p class="topic-meta">Endocrinologia • Próxima: 01 mar</p></div><div style="display:flex;align-items:center;gap:16px"><div class="topic-stage"><div class="stage-dot filled"></div><div class="stage-dot"></div><div class="stage-dot"></div><div class="stage-dot"></div><div class="stage-dot"></div></div><div class="topic-actions"><button class="btn-review">Revisar ✓</button><button class="btn-delete">✕</button></div></div></div>`;
        document.getElementById('pomodoroLog').innerHTML = `
      <div class="upcoming-item"><span>25min de foco</span><span class="upcoming-date">24 fev 22:30</span></div>
      <div class="upcoming-item"><span>25min de foco</span><span class="upcoming-date">24 fev 21:45</span></div>
      <div class="upcoming-item"><span>50min de foco</span><span class="upcoming-date">24 fev 20:00</span></div>`;
        document.getElementById('diaryList').innerHTML = `
      <div class="diary-entry-card"><div class="diary-entry-header"><span class="diary-date">24 fev 🤩</span><button class="diary-delete">Excluir</button></div><p class="diary-content">Revisão intensa de Cardiologia usando active recall. Consegui lembrar 80% dos mecanismos de IC sem consultar.</p><p class="diary-meta">4.5h estudadas • Cardiologia, Pneumologia</p></div>
      <div class="diary-entry-card"><div class="diary-entry-header"><span class="diary-date">23 fev 😊</span><button class="diary-delete">Excluir</button></div><p class="diary-content">Dia de simulado intercalado. 50 questões misturando todas as áreas. Acertei 72% — bom progresso em Nefro!</p><p class="diary-meta">3.0h estudadas • Simulado, Nefrologia</p></div>`;
        document.getElementById('loadingScreen').classList.add('hidden');
        document.getElementById('diaryDate').valueAsDate = new Date();
        return;
    }
    try {
        const res = await fetch('/auth/me');
        if (!res.ok) {
            window.location.href = '/login';
            return;
        }
        currentUser = await res.json();
        renderUserInfo();
        setGreeting();
        await Promise.all([loadStats(), loadUpcoming(), loadLastDiary(), loadSpacedTopics(), loadDiaryEntries(), loadPomodoroLog()]);
        // Initialize dashboard charts after data loads
        if (typeof initCharts === 'function') initCharts();
        // Load sidebar level badge
        if (typeof loadXPInfo === 'function') loadXPInfo();
        // Load plan info for feature gating
        if (typeof loadUserPlan === 'function') loadUserPlan();
    } catch {
        window.location.href = '/login';
        return;
    }
    document.getElementById('loadingScreen').classList.add('hidden');
    document.getElementById('diaryDate').valueAsDate = new Date();

    // Neuro-Architect Greeting (once per day)
    showNeuroGreeting();

    // Check for onboarding survey (after greeting closes)
    if (typeof checkOnboardingSurvey === 'function') setTimeout(checkOnboardingSurvey, 1000);
    // Check for neurocognitive assessment (after onboarding)
    if (typeof checkAssessmentDue === 'function') setTimeout(checkAssessmentDue, 2000);
    // Load unread message count
    if (typeof loadUnreadCount === 'function') loadUnreadCount();

    // Add SVG gradient for timer
    const svg = document.querySelector('.timer-ring svg');
    if (svg) {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        grad.id = 'timerGrad';
        const s1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#0d9488');
        const s2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#2563eb');
        grad.appendChild(s1); grad.appendChild(s2);
        defs.appendChild(grad); svg.prepend(defs);
    }
});

function renderUserInfo() {
    const el = document.getElementById('sidebarUser');
    if (!currentUser) return;
    el.innerHTML = `
    <div class="user-info">
      ${currentUser.avatar_url
            ? `<img src="${currentUser.avatar_url}" class="user-avatar" alt="">`
            : '<div class="user-avatar" style="background:linear-gradient(135deg,#0d9488,#2563eb);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#fff">' + (currentUser.name?.[0] || '?') + '</div>'}
      <div>
        <div class="user-name">${currentUser.name || 'Aluno'}</div>
        <div class="user-email">${currentUser.email}</div>
      </div>
    </div>`;

    if (currentUser.role === 'admin') {
        const adminBtn = document.getElementById('navAdminBtn');
        if (adminBtn) adminBtn.style.display = 'flex';
    }
}

function setGreeting() {
    const h = new Date().getHours();
    let g = 'Boa noite';
    if (h < 12) g = 'Bom dia';
    else if (h < 18) g = 'Boa tarde';
    const name = currentUser?.name?.split(' ')[0] || '';
    document.getElementById('greeting').textContent = `${g}, ${name}! 👋`;
}

// ─── NAVIGATION ───
function switchTab(tabName) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('tab-' + tabName)?.classList.add('active');
    document.querySelector(`.nav-item[data-tab="${tabName}"]`)?.classList.add('active');
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('open');
    }
    // Lazy load tabs
    if (tabName === 'artigos' && typeof loadArticles === 'function') loadArticles();
    if (tabName === 'suggestions') loadUserSuggestions();
    if (tabName === 'planner' && typeof loadPlannerData === 'function') loadPlannerData();
    if (tabName === 'flashcards' && typeof loadFlashcardData === 'function') loadFlashcardData();
    if (tabName === 'messages') { if (typeof loadMessages === 'function') loadMessages(); if (typeof loadGoals === 'function') loadGoals(); }
    if (tabName === 'neurobica' && typeof Neurobica !== 'undefined') Neurobica.init();
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function toggleExpand(el) {
    el.classList.toggle('expanded');
}

async function logout() {
    await fetch('/auth/logout', { method: 'POST' });
    window.location.href = '/login';
}

// ─── DASHBOARD ───
async function loadStats() {
    try {
        const res = await fetch('/api/pomodoro/stats');
        if (!res.ok) return;
        const s = await res.json();
        document.getElementById('dashMinutes').textContent = s.total_minutes;
        document.getElementById('dashSessions').textContent = s.total_sessions;
        document.getElementById('dashStreak').textContent = s.streak_days;
        document.getElementById('todayMinutes').textContent = s.today_minutes;
        document.getElementById('todaySessions').textContent = s.today_sessions;
        document.getElementById('totalMinutesAll').textContent = s.total_minutes;
    } catch (e) { console.error('Stats error:', e); }
}

async function loadUpcoming() {
    try {
        const res = await fetch('/api/spaced');
        if (!res.ok) return;
        const topics = await res.json();
        const today = new Date().toISOString().split('T')[0];
        const due = topics.filter(t => t.next_review <= today);
        document.getElementById('dashReviews').textContent = due.length;
        const upcoming = topics.filter(t => t.next_review > today).slice(0, 5);
        const el = document.getElementById('dashUpcoming');
        if (!due.length && !upcoming.length) {
            el.innerHTML = '<p class="empty-state">Nenhuma revisão agendada</p>';
            return;
        }
        el.innerHTML = [...due, ...upcoming].slice(0, 6).map(t => {
            const dateStr = String(t.next_review).includes('T') ? t.next_review.split('T')[0] : t.next_review;
            const isDue = dateStr <= today;
            return `
      <div class="upcoming-item">
        <span class="upcoming-name">${t.name}</span>
        <span class="upcoming-date" ${isDue ? 'style="color:#ef4444"' : ''}>${isDue ? '⚠️ Hoje' : formatDate(t.next_review)}</span>
      </div>`;
        }).join('');
    } catch (e) { console.error('Upcoming error:', e); }
}

async function loadLastDiary() {
    try {
        const res = await fetch('/api/diary');
        if (!res.ok) return;
        const entries = await res.json();
        const el = document.getElementById('dashLastDiary');
        if (!entries.length) {
            el.innerHTML = '<p class="empty-state">Nenhuma entrada ainda</p>';
            return;
        }
        const e = entries[0];
        el.innerHTML = `<div class="diary-entry-card">
      <div class="diary-entry-header"><span class="diary-date">${formatDate(e.entry_date)}</span><span class="diary-mood">${moodEmoji(e.mood)}</span></div>
      <p class="diary-content">${truncate(e.content, 150)}</p>
    </div>`;
    } catch (e) { console.error('Diary error:', e); }
}

// ─── POMODORO TIMER ───
const DEFAULT_FOCUS = 50;
const DEFAULT_BREAK = 10;
const MAX_FOCUS_MINUTES = 90; // Aviso científico: após 90min sem pausa, sem ganho de aprendizado

let timerInterval = null;
let alarmInterval = null;  // loop do alarme
let focusMinutes = DEFAULT_FOCUS;
let breakMinutes = DEFAULT_BREAK;
let timeLeft = DEFAULT_FOCUS * 60;
let isRunning = false;
let isFocusMode = true;
let focusAccumulator = 0;  // segundos de foco contínuo desde a última pausa
let warned90min = false;   // evitar múltiplos avisos na mesma sessão
let _focusElapsed = 0;     // segundos reais de foco na sessão atual

// ─── ALARME ───
function _playAlarmLoop() {
    const alarm = document.getElementById('pomodoroAlarm');
    if (!alarm) return;
    // Toca em loop até stopAlarm() ser chamado
    alarm.currentTime = 0;
    alarm.play().catch(() => { });
    alarmInterval = setInterval(() => {
        alarm.currentTime = 0;
        alarm.play().catch(() => { });
    }, 4000); // repete a cada 4s
    document.getElementById('stopAlarmBtn')?.classList.remove('hidden');
    document.getElementById('snoozeBtn')?.classList.remove('hidden');
}

function stopAlarm() {
    clearInterval(alarmInterval); alarmInterval = null;
    const alarm = document.getElementById('pomodoroAlarm');
    if (alarm) { alarm.pause(); alarm.currentTime = 0; }
    document.getElementById('stopAlarmBtn')?.classList.add('hidden');
    document.getElementById('snoozeBtn')?.classList.add('hidden');
}

// ─── SNOOZE: para o alarme e adiciona 10min ao timer atual ───
function snoozeTimer() {
    stopAlarm();
    // FIX: reverte o toggle de modo que aconteceu quando o timer zerou,
    // para que o snooze estenda o modo original (foco continua sendo foco)
    if (timeLeft === (isFocusMode ? focusMinutes * 60 : breakMinutes * 60)) {
        isFocusMode = !isFocusMode; // desfaz o toggle
        timeLeft = 10 * 60; // 10 minutos extras no modo original
        document.getElementById('timerModeDisplay').textContent = isFocusMode ? 'FOCO' : 'PAUSA';
    } else {
        timeLeft += 10 * 60;
    }
    updateTimerDisplay();
    if (!isRunning) startTimer();
}

// ─── AVISO 90 MINUTOS ───
function _show90MinWarning() {
    document.getElementById('warning90Modal')?.classList.remove('hidden');
    _playAlarmLoop();
    notify('⚠️ 90 minutos de foco!', 'Sem pausa não há ganho de aprendizado. Faça uma pausa mental agora.');
    warned90min = true;
}

function close90Warning() {
    document.getElementById('warning90Modal')?.classList.add('hidden');
    stopAlarm();
    // Força pausa: muda para modo de descanso
    pauseTimer();
    isFocusMode = false;
    focusAccumulator = 0;
    warned90min = false;
    timeLeft = breakMinutes * 60;
    document.getElementById('timerModeDisplay').textContent = 'PAUSA';
    document.getElementById('startBtn').textContent = '▶ Iniciar';
    updateTimerDisplay();
}

// ─── START / PAUSE / RESET ───
function startTimer() {
    if (isRunning) return;

    // Validação com clamp nos inputs
    let newFocus = parseInt(document.getElementById('focusInput').value) || DEFAULT_FOCUS;
    let newBreak = parseInt(document.getElementById('breakInput').value) || DEFAULT_BREAK;
    newFocus = Math.max(5, Math.min(90, newFocus));
    newBreak = Math.max(1, Math.min(30, newBreak));

    // Se ainda não iniciou, sincroniza com os inputs
    if (!timerInterval && timeLeft === focusMinutes * 60) {
        timeLeft = isFocusMode ? newFocus * 60 : newBreak * 60;
    }

    focusMinutes = newFocus;
    breakMinutes = newBreak;

    // FIX: sempre limpar interval anterior antes de criar novo (previne race condition)
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }

    isRunning = true;
    document.getElementById('startBtn').textContent = '▶ Rodando...';

    timerInterval = setInterval(() => {
        timeLeft--;

        // Acumula tempo de foco contínuo e verifica limite de 90min
        if (isFocusMode) {
            focusAccumulator++;
            _focusElapsed++;
            if (!warned90min && focusAccumulator >= MAX_FOCUS_MINUTES * 60) {
                _show90MinWarning();
            }
        }

        updateTimerDisplay();

        if (timeLeft <= 0) {
            clearInterval(timerInterval); timerInterval = null; isRunning = false;
            _playAlarmLoop();

            if (isFocusMode) {
                // FIX: loga tempo real de foco, não o configurado
                const realMinutes = Math.max(1, Math.round(_focusElapsed / 60));
                logPomodoroSession(realMinutes);
                _focusElapsed = 0;
                notify('Sessão concluída! 🎉', 'Hora do intervalo. Clique Silenciar para parar o alarme.');
                focusAccumulator = 0;
            } else {
                notify('Pausa encerrada! 🧠', 'Hora de focar. Clique Silenciar para parar o alarme.');
                warned90min = false;
                _focusElapsed = 0;
            }
            isFocusMode = !isFocusMode;
            timeLeft = isFocusMode ? focusMinutes * 60 : breakMinutes * 60;
            document.getElementById('timerModeDisplay').textContent = isFocusMode ? 'FOCO' : 'PAUSA';
            updateTimerDisplay();
            document.getElementById('startBtn').textContent = '▶ Iniciar';
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval); timerInterval = null; isRunning = false;
    document.getElementById('startBtn').textContent = '▶ Continuar';
}

// Reset SEMPRE volta para os padrões (50/10), ignorando o que está nos inputs
function resetTimer() {
    clearInterval(timerInterval); timerInterval = null; isRunning = false;
    stopAlarm();
    focusMinutes = DEFAULT_FOCUS;
    breakMinutes = DEFAULT_BREAK;
    isFocusMode = true;
    timeLeft = DEFAULT_FOCUS * 60;
    focusAccumulator = 0;
    warned90min = false;
    // Restaura os inputs também
    const fi = document.getElementById('focusInput');
    const bi = document.getElementById('breakInput');
    if (fi) fi.value = DEFAULT_FOCUS;
    if (bi) bi.value = DEFAULT_BREAK;
    document.getElementById('timerModeDisplay').textContent = 'FOCO';
    document.getElementById('startBtn').textContent = '▶ Iniciar';
    document.getElementById('warning90Modal')?.classList.add('hidden');
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    document.getElementById('timerDisplay').textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    const totalSec = isFocusMode ? focusMinutes * 60 : breakMinutes * 60;
    const pct = Math.max(0, Math.min(1, timeLeft / totalSec));
    const circ = 565.5;
    const circle = document.getElementById('timerCircle');
    if (circle) circle.style.strokeDashoffset = circ * (1 - pct);
}

async function logPomodoroSession(mins) {
    try {
        const res = await fetch('/api/pomodoro', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ focus_minutes: mins })
        });
        if (res.ok) {
            loadStats();
            loadPomodoroLog();
            if (typeof showToast === 'function') showToast(`+${mins}min de foco registrado!`, 'success');
        } else {
            console.error('Pomodoro log failed:', res.status);
        }
    } catch (e) { console.error('Pomodoro log error:', e); }
}

async function loadPomodoroLog() {
    try {
        const res = await fetch('/api/pomodoro/recent');
        if (!res.ok) return;
        const sessions = await res.json();
        const el = document.getElementById('pomodoroLog');
        if (!sessions.length) { el.innerHTML = '<p class="empty-state">Nenhuma sessão registrada</p>'; return; }
        el.innerHTML = sessions.map(s => `
      <div class="upcoming-item">
        <span>${s.focus_minutes}min de foco</span>
        <span class="upcoming-date">${formatDateTime(s.completed_at)}</span>
      </div>`).join('');
    } catch (e) { console.error('Log error:', e); }
}

// ─── SPACED REPETITION ───
async function loadSpacedTopics() {
    try {
        const res = await fetch('/api/spaced');
        if (!res.ok) return;
        const topics = await res.json();
        const today = new Date().toISOString().split('T')[0];

        // Alerts
        const due = topics.filter(t => t.next_review <= today);
        const alertsEl = document.getElementById('spacedAlerts');
        if (due.length) {
            alertsEl.innerHTML = due.map(t => `
        <div class="spaced-alert">
          <span class="spaced-alert-text">⚠️ <strong>${t.name}</strong> precisa de revisão!</span>
          <button class="btn-review" onclick="reviewTopic(${t.id})">Revisar ✓</button>
        </div>`).join('');
        } else {
            alertsEl.innerHTML = '';
        }

        // List
        const listEl = document.getElementById('spacedList');
        if (!topics.length) { listEl.innerHTML = '<p class="empty-state">Nenhum tópico adicionado</p>'; return; }
        listEl.innerHTML = topics.map(t => {
            const dots = Array(5).fill(0).map((_, i) => `<div class="stage-dot ${i < t.stage ? 'filled' : ''}"></div>`).join('');
            const R = t.retrievability ?? 100;
            const rClass = R > 90 ? 'r-high' : R > 70 ? 'r-mid' : 'r-low';
            return `
      <div class="spaced-topic-item">
        <div class="topic-info">
          <h4>${t.name}</h4>
          <p class="topic-meta">${t.category} • Próxima: ${formatDate(t.next_review)}</p>
          <div class="retrievability-bar">
            <div class="r-track"><div class="r-fill ${rClass}" style="width:${R}%"></div></div>
            <span class="r-label">${R}%</span>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <div class="topic-stage">${dots}</div>
          <div class="topic-actions rating-actions">
            <button class="btn-rating btn-again" onclick="reviewTopic(${t.id}, 1)" title="Não lembrei">❌</button>
            <button class="btn-rating btn-hard" onclick="reviewTopic(${t.id}, 2)" title="Difícil">😓</button>
            <button class="btn-rating btn-good" onclick="reviewTopic(${t.id}, 3)" title="Lembrei">✅</button>
            <button class="btn-rating btn-easy" onclick="reviewTopic(${t.id}, 4)" title="Fácil">🚀</button>
            <button class="btn-delete" onclick="deleteSpacedTopic(${t.id})">✕</button>
          </div>
        </div>
      </div>`;
        }).join('');
    } catch (e) { console.error('Spaced error:', e); }
}

async function addSpacedTopic() {
    const name = document.getElementById('spacedName').value.trim();
    const category = document.getElementById('spacedCategory').value.trim() || 'Geral';
    if (!name) return;
    try {
        await fetch('/api/spaced', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, category })
        });
        document.getElementById('spacedName').value = '';
        document.getElementById('spacedCategory').value = '';
        loadSpacedTopics();
        loadUpcoming();
    } catch (e) { console.error(e); }
}

async function reviewTopic(id, rating = 3) {
    try {
        await fetch(`/api/spaced/${id}/review`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating })
        });
        loadSpacedTopics();
        loadUpcoming();
        loadStats();
    } catch (e) { console.error(e); }
}

async function deleteSpacedTopic(id) {
    if (!confirm('Remover este tópico da repetição espaçada?')) return;
    try {
        await fetch(`/api/spaced/${id}`, { method: 'DELETE' });
        loadSpacedTopics();
        loadUpcoming();
    } catch (e) { console.error(e); }
}

// ─── DIARY ───
function selectMood(mood) {
    currentMood = mood;
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.mood-btn[data-mood="${mood}"]`)?.classList.add('active');
}

async function saveDiaryEntry() {
    const entry_date = document.getElementById('diaryDate').value;
    const content = document.getElementById('diaryContent').value.trim();
    const hours_studied = parseFloat(document.getElementById('diaryHours').value) || 0;
    const topicsRaw = document.getElementById('diaryTopics').value;
    const topics_studied = topicsRaw ? topicsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
    if (!content) { alert('Escreva algo no diário.'); return; }
    try {
        await fetch('/api/diary', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entry_date, content, mood: currentMood, hours_studied, topics_studied })
        });
        document.getElementById('diaryContent').value = '';
        document.getElementById('diaryHours').value = '';
        document.getElementById('diaryTopics').value = '';
        loadDiaryEntries();
        loadLastDiary();
    } catch (e) { console.error(e); }
}

async function loadDiaryEntries() {
    try {
        const res = await fetch('/api/diary');
        if (!res.ok) return;
        const entries = await res.json();
        const el = document.getElementById('diaryList');
        if (!entries.length) { el.innerHTML = '<p class="empty-state">Nenhuma entrada. Comece a registrar seu progresso!</p>'; return; }
        el.innerHTML = entries.map(e => `
      <div class="diary-entry-card">
        <div class="diary-entry-header">
          <span class="diary-date">${formatDate(e.entry_date)} ${moodEmoji(e.mood)}</span>
          <button class="diary-delete" onclick="deleteDiaryEntry(${e.id})">Excluir</button>
        </div>
        <p class="diary-content">${e.content}</p>
        <p class="diary-meta">${e.hours_studied}h estudadas${e.topics_studied?.length ? ' • ' + e.topics_studied.join(', ') : ''}</p>
      </div>`).join('');
    } catch (e) { console.error(e); }
}

async function deleteDiaryEntry(id) {
    if (!confirm('Excluir esta entrada do diário?')) return;
    try {
        await fetch(`/api/diary/${id}`, { method: 'DELETE' });
        loadDiaryEntries();
        loadLastDiary();
    } catch (e) { console.error(e); }
}

// ─── HELPERS ───
function formatDate(d) {
    if (!d) return '';
    const raw = String(d);
    const date = raw.includes('T') ? new Date(raw) : new Date(raw + 'T00:00:00');
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    return `${day} ${months[date.getMonth()]}`;
}

function formatDateTime(d) {
    if (!d) return '';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ' ' +
        date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function moodEmoji(m) {
    return { great: '🤩', good: '😊', neutral: '😐', tired: '😴', bad: '😫' }[m] || '😐';
}

function truncate(s, n) {
    return s && s.length > n ? s.substring(0, n) + '...' : s;
}

function notify(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '🧠' });
    }
}

// ─── SUGESTÕES ───
async function loadUserSuggestions() {
    try {
        const res = await fetch('/api/suggestions');
        if (!res.ok) return;
        const suggestions = await res.json();
        const el = document.getElementById('userSuggestionsList');
        if (!el) return;
        if (!suggestions.length) {
            el.innerHTML = '<p class="empty-state">Nenhuma sugestão enviada ainda. Use o formulário acima!</p>';
            return;
        }
        const statusMap = { pending: '🕐 Pendente', approved: '✅ Aprovada', rejected: '❌ Rejeitada', implemented: '🚀 Implementada' };
        el.innerHTML = suggestions.map(s => `
          <div class="suggestion-item">
            <div class="suggestion-header">
              <strong>${s.title}</strong>
              <span class="suggestion-status">${statusMap[s.status] || s.status}</span>
            </div>
            <p class="suggestion-desc">${s.description}</p>
            <span class="suggestion-date">${formatDate(s.created_at)}</span>
          </div>`).join('');
    } catch (e) { console.error('Suggestions error:', e); }
}

async function submitSuggestion(e) {
    e.preventDefault();
    const btn = document.getElementById('suggSubmitBtn');
    const msgEl = document.getElementById('suggMessage');
    const title = document.getElementById('suggTitle').value.trim();
    const description = document.getElementById('suggDesc').value.trim();

    if (!title || !description) return;

    btn.disabled = true;
    btn.textContent = 'Enviando...';
    msgEl.textContent = '';
    msgEl.className = '';

    try {
        const res = await fetch('/api/suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            msgEl.textContent = 'Sugestão enviada com sucesso! Obrigado pela contribuição.';
            msgEl.style.color = 'var(--synapse-green)';
            document.getElementById('suggestionForm').reset();
            loadUserSuggestions();
        } else {
            msgEl.textContent = data.error || 'Erro ao enviar sugestão.';
            msgEl.style.color = 'var(--synapse-red)';
        }
    } catch (err) {
        msgEl.textContent = 'Erro de conexão. Tente novamente.';
        msgEl.style.color = 'var(--synapse-red)';
    }

    btn.disabled = false;
    btn.textContent = 'Enviar Sugestão';
}

// ─── NEURO-ARCHITECT GREETING ───
function showNeuroGreeting() {
    const lastGreeting = localStorage.getItem('neuro_greeting_date');
    const today = new Date().toISOString().split('T')[0];
    if (lastGreeting === today) return;

    const modal = document.getElementById('neuroGreetingModal');
    if (!modal) return;
    modal.classList.remove('hidden');

    // Update greeting title based on time of day
    const h = new Date().getHours();
    const name = currentUser?.name?.split(' ')[0] || 'estudante';
    const titleEl = modal.querySelector('.greeting-title');
    if (titleEl) {
        const period = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
        titleEl.textContent = `${period}, ${name}. Neuro-Arquiteto ativo.`;
    }

    // Update review count
    const reviewCount = document.getElementById('dashReviews')?.textContent || '0';
    const countEl = document.getElementById('greetingReviewCount');
    if (countEl) {
        const n = parseInt(reviewCount) || 0;
        countEl.textContent = n > 0 ? `${n} revisão${n > 1 ? 'es' : ''} pendente${n > 1 ? 's' : ''}` : 'Nenhuma revisão pendente';
    }
}

function selectGreetingOption(tab) {
    closeGreeting();
    switchTab(tab);
}

function closeGreeting() {
    const modal = document.getElementById('neuroGreetingModal');
    if (modal) modal.classList.add('hidden');
    localStorage.setItem('neuro_greeting_date', new Date().toISOString().split('T')[0]);
}

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}
