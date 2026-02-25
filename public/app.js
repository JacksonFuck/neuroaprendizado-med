/* ═══════════════════════════════════════════════════════════════
   NEUROAPRENDIZADO MED — Application Logic
   ═══════════════════════════════════════════════════════════════ */

let currentUser = null;
let currentMood = 'neutral';

// ─── INIT ───
const PREVIEW_MODE = !window.location.hostname || window.location.hostname === 'localhost' || window.location.protocol === 'file:';

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
            window.location.href = '/login.html';
            return;
        }
        currentUser = await res.json();
        renderUserInfo();
        setGreeting();
        await Promise.all([loadStats(), loadUpcoming(), loadLastDiary(), loadSpacedTopics(), loadDiaryEntries(), loadPomodoroLog()]);
    } catch {
        window.location.href = '/login.html';
        return;
    }
    document.getElementById('loadingScreen').classList.add('hidden');
    document.getElementById('diaryDate').valueAsDate = new Date();

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
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function toggleExpand(el) {
    el.classList.toggle('expanded');
}

async function logout() {
    await fetch('/auth/logout', { method: 'POST' });
    window.location.href = '/login.html';
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
        el.innerHTML = [...due, ...upcoming].slice(0, 6).map(t => `
      <div class="upcoming-item">
        <span class="upcoming-name">${t.name}</span>
        <span class="upcoming-date ${t.next_review <= today ? 'style="color:#ef4444"' : ''}">${t.next_review <= today ? '⚠️ Hoje' : formatDate(t.next_review)}</span>
      </div>`).join('');
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
let timerInterval = null;
let focusMinutes = 25;
let breakMinutes = 5;
let timeLeft = 25 * 60;
let isRunning = false;
let isFocusMode = true;

function startTimer() {
    if (isRunning) return;
    const newFocus = parseInt(document.getElementById('focusInput').value) || 25;
    const newBreak = parseInt(document.getElementById('breakInput').value) || 5;

    // If the input changed while stopped and hasn't ticked down, update it
    if (!timerInterval && timeLeft === focusMinutes * 60) {
        timeLeft = isFocusMode ? newFocus * 60 : newBreak * 60;
    }

    focusMinutes = newFocus;
    breakMinutes = newBreak;

    isRunning = true;
    document.getElementById('startBtn').textContent = '▶ Rodando...';
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timerInterval); timerInterval = null; isRunning = false;
            if (isFocusMode) {
                logPomodoroSession(focusMinutes);
                notify('Sessão concluída!', '🎉 Hora do intervalo.');
            } else {
                notify('Pausa encerrada!', '🧠 Hora de focar.');
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

function resetTimer() {
    clearInterval(timerInterval); timerInterval = null; isRunning = false;
    focusMinutes = parseInt(document.getElementById('focusInput').value) || 25;
    breakMinutes = parseInt(document.getElementById('breakInput').value) || 5;
    isFocusMode = true;
    timeLeft = focusMinutes * 60;
    document.getElementById('timerModeDisplay').textContent = 'FOCO';
    document.getElementById('startBtn').textContent = '▶ Iniciar';
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    document.getElementById('timerDisplay').textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    const totalSec = isFocusMode ? focusMinutes * 60 : breakMinutes * 60;
    const pct = timeLeft / totalSec;
    const circ = 565.5;
    const circle = document.getElementById('timerCircle');
    if (circle) circle.style.strokeDashoffset = circ * (1 - pct);
}

async function logPomodoroSession(mins) {
    try {
        await fetch('/api/pomodoro', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ focus_minutes: mins })
        });
        loadStats();
        loadPomodoroLog();
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
            return `
      <div class="spaced-topic-item">
        <div class="topic-info">
          <h4>${t.name}</h4>
          <p class="topic-meta">${t.category} • Próxima: ${formatDate(t.next_review)}</p>
        </div>
        <div style="display:flex;align-items:center;gap:16px">
          <div class="topic-stage">${dots}</div>
          <div class="topic-actions">
            <button class="btn-review" onclick="reviewTopic(${t.id})">Revisar ✓</button>
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

async function reviewTopic(id) {
    try {
        await fetch(`/api/spaced/${id}/review`, { method: 'PUT' });
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
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function formatDateTime(d) {
    if (!d) return '';
    const date = new Date(d);
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

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}
