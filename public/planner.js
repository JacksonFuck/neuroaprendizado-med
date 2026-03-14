/* ═══════════════════════════════════════════════════════════════
   PLANNER — Study Planner with Subject & Topic Management
   CRUD de materias/topicos, progresso, filtro temporal,
   link automatico com repeticao espacada
   ═══════════════════════════════════════════════════════════════ */

let plannerSubjects = [];
let plannerCurrentSubjectId = null;
let plannerTimeView = 'semana';

// ─── INIT ───

async function loadPlannerData() {
    try {
        await Promise.all([loadSubjects(), loadPlannerStats()]);
    } catch (e) {
        console.error('Erro ao carregar planner:', e);
    }
}

// ─── SUBJECTS CRUD ───

async function loadSubjects() {
    try {
        const res = await fetch('/api/planner/subjects');
        if (!res.ok) return;
        plannerSubjects = await res.json();
        renderSubjectCards(plannerSubjects);
        populateSubjectSelect(plannerSubjects);
    } catch (e) { console.error('Erro ao carregar materias:', e); }
}

async function addSubject() {
    const nameEl = document.getElementById('subjectName');
    const colorEl = document.getElementById('subjectColor');
    const hoursEl = document.getElementById('subjectHours');

    const name = nameEl.value.trim();
    const color = colorEl.value || '#0d9488';
    const target_hours = parseFloat(hoursEl.value) || 0;

    if (!name) return;

    try {
        await fetch('/api/planner/subjects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, color, target_hours })
        });
        nameEl.value = '';
        hoursEl.value = '';
        await Promise.all([loadSubjects(), loadPlannerStats()]);
    } catch (e) { console.error('Erro ao adicionar materia:', e); }
}

async function editSubject(id) {
    const subject = plannerSubjects.find(s => s.id === id);
    if (!subject) return;

    const newName = prompt('Nome da materia:', subject.name);
    if (!newName || newName.trim() === subject.name) return;

    try {
        await fetch(`/api/planner/subjects/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName.trim(), color: subject.color, target_hours: subject.target_hours })
        });
        await loadSubjects();
    } catch (e) { console.error('Erro ao editar materia:', e); }
}

async function deleteSubject(id) {
    if (!confirm('Remover esta materia e todos os seus topicos?')) return;
    try {
        await fetch(`/api/planner/subjects/${id}`, { method: 'DELETE' });
        if (plannerCurrentSubjectId === id) {
            plannerCurrentSubjectId = null;
            document.getElementById('plannerTopics').innerHTML = '';
        }
        await Promise.all([loadSubjects(), loadPlannerStats()]);
    } catch (e) { console.error('Erro ao remover materia:', e); }
}

// ─── TOPICS CRUD ───

async function loadTopics(subjectId) {
    plannerCurrentSubjectId = subjectId;

    // Highlight active subject card
    document.querySelectorAll('.planner-subject-card').forEach(c => c.classList.remove('active'));
    const activeCard = document.querySelector(`.planner-subject-card[data-id="${subjectId}"]`);
    if (activeCard) activeCard.classList.add('active');

    try {
        const res = await fetch(`/api/planner/topics?subject_id=${subjectId}`);
        if (!res.ok) return;
        const topics = await res.json();
        renderTopicList(topics, subjectId);
    } catch (e) { console.error('Erro ao carregar topicos:', e); }
}

async function addTopic() {
    const nameEl = document.getElementById('topicName');
    const subjectEl = document.getElementById('topicSubject');
    const hoursEl = document.getElementById('topicHours');
    const dateEl = document.getElementById('topicDate');
    const spacedEl = document.getElementById('topicAddSpaced');

    const name = nameEl.value.trim();
    const subject_id = parseInt(subjectEl.value, 10);
    const estimated_hours = parseFloat(hoursEl.value) || 0;
    const target_date = dateEl.value || null;
    const add_to_spaced = spacedEl ? spacedEl.checked : false;

    if (!name || !subject_id) return;

    try {
        await fetch('/api/planner/topics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, subject_id, estimated_hours, target_date, add_to_spaced })
        });
        nameEl.value = '';
        hoursEl.value = '';
        dateEl.value = '';
        if (spacedEl) spacedEl.checked = false;

        if (plannerCurrentSubjectId === subject_id) {
            await loadTopics(subject_id);
        }
        await Promise.all([loadSubjects(), loadPlannerStats()]);
    } catch (e) { console.error('Erro ao adicionar topico:', e); }
}

async function updateTopicStatus(topicId, newStatus) {
    try {
        await fetch(`/api/planner/topics/${topicId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (plannerCurrentSubjectId) await loadTopics(plannerCurrentSubjectId);
        await Promise.all([loadSubjects(), loadPlannerStats()]);
    } catch (e) { console.error('Erro ao atualizar status:', e); }
}

async function deleteTopic(id) {
    if (!confirm('Remover este topico?')) return;
    try {
        await fetch(`/api/planner/topics/${id}`, { method: 'DELETE' });
        if (plannerCurrentSubjectId) await loadTopics(plannerCurrentSubjectId);
        await Promise.all([loadSubjects(), loadPlannerStats()]);
    } catch (e) { console.error('Erro ao remover topico:', e); }
}

// ─── STATS ───

async function loadPlannerStats() {
    try {
        const res = await fetch('/api/planner/stats');
        if (!res.ok) return;
        const stats = await res.json();
        renderPlannerStats(stats);
    } catch (e) { console.error('Erro ao carregar stats:', e); }
}

// ─── RENDERING ───

function renderSubjectCards(subjects) {
    const el = document.getElementById('plannerSubjects');
    if (!subjects.length) {
        el.innerHTML = '<p class="empty-state">Nenhuma materia cadastrada. Adicione sua primeira materia acima.</p>';
        return;
    }

    el.innerHTML = subjects.map(s => {
        const totalTopics = s.topic_count || 0;
        const completedTopics = s.completed_count || 0;
        const pct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
        const actualHours = s.actual_hours || 0;
        const targetHours = s.target_hours || 0;
        const isActive = plannerCurrentSubjectId === s.id;

        return `
        <div class="planner-subject-card ${isActive ? 'active' : ''}" data-id="${s.id}" onclick="loadTopics(${s.id})" style="border-left: 4px solid ${s.color}">
            <div class="subject-card-header">
                <h4 class="subject-card-name" style="color: ${s.color}">${escapeHtml(s.name)}</h4>
                <div class="subject-card-actions">
                    <button class="btn-icon" onclick="event.stopPropagation(); editSubject(${s.id})" title="Editar" aria-label="Editar materia ${escapeHtml(s.name)}">&#9998;</button>
                    <button class="btn-icon btn-danger" onclick="event.stopPropagation(); deleteSubject(${s.id})" title="Remover" aria-label="Remover materia ${escapeHtml(s.name)}">&#10005;</button>
                </div>
            </div>
            <div class="subject-card-meta">
                <span>${totalTopics} topico${totalTopics !== 1 ? 's' : ''}</span>
                <span>${actualHours}h / ${targetHours}h</span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width: ${pct}%; background: ${s.color}"></div>
            </div>
            <span class="progress-label">${pct}% concluido</span>
        </div>`;
    }).join('');
}

function renderTopicList(topics, subjectId) {
    const el = document.getElementById('plannerTopics');
    const subject = plannerSubjects.find(s => s.id === subjectId);
    const subjectName = subject ? subject.name : '';

    if (!topics.length) {
        el.innerHTML = `
            <div class="topic-list-header">
                <h3>Topicos de ${escapeHtml(subjectName)}</h3>
            </div>
            <p class="empty-state">Nenhum topico nesta materia. Adicione um topico abaixo.</p>`;
        return;
    }

    const statusOrder = { pending: 0, in_progress: 1, completed: 2 };
    const sorted = [...topics].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

    const topicRows = sorted.map(t => {
        const isPending = t.status === 'pending';
        const isInProgress = t.status === 'in_progress';
        const isCompleted = t.status === 'completed';

        const nextStatus = isPending ? 'in_progress' : isInProgress ? 'completed' : 'pending';
        const checkboxIcon = isCompleted ? '&#9745;' : isInProgress ? '&#9898;' : '&#9744;';
        const statusClass = isCompleted ? 'completed' : isInProgress ? 'in-progress' : 'pending';
        const nameClass = isCompleted ? 'topic-name-done' : '';
        const dateDisplay = t.target_date ? formatTargetDate(t.target_date) : '';

        return `
        <div class="planner-topic-item ${statusClass}">
            <button class="topic-checkbox" onclick="updateTopicStatus(${t.id}, '${nextStatus}')" title="Alterar status" aria-label="Marcar ${escapeHtml(t.name)} como ${nextStatus}">${checkboxIcon}</button>
            <div class="topic-details">
                <span class="topic-name ${nameClass}">${escapeHtml(t.name)}</span>
                <span class="topic-meta">${t.estimated_hours || 0}h estimadas${dateDisplay ? ' &bull; ' + dateDisplay : ''}</span>
            </div>
            <button class="btn-icon btn-danger" onclick="deleteTopic(${t.id})" title="Remover topico" aria-label="Remover topico ${escapeHtml(t.name)}">&#10005;</button>
        </div>`;
    }).join('');

    el.innerHTML = `
        <div class="topic-list-header">
            <h3>Topicos de ${escapeHtml(subjectName)}</h3>
            <span class="topic-count">${topics.length} topico${topics.length !== 1 ? 's' : ''}</span>
        </div>
        ${topicRows}`;
}

function renderPlannerStats(stats) {
    const el = document.getElementById('plannerStats');
    if (!stats) { el.innerHTML = ''; return; }

    const totalSubjects = stats.total_subjects || 0;
    const totalTopics = stats.total_topics || 0;
    const completedTopics = stats.completed_topics || 0;
    const totalHours = stats.total_estimated_hours || 0;
    const actualHours = stats.total_actual_hours || 0;
    const overallPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    el.innerHTML = `
        <div class="planner-stats-grid">
            <div class="planner-stat-card">
                <span class="stat-value">${totalSubjects}</span>
                <span class="stat-label">Materias</span>
            </div>
            <div class="planner-stat-card">
                <span class="stat-value">${totalTopics}</span>
                <span class="stat-label">Topicos</span>
            </div>
            <div class="planner-stat-card">
                <span class="stat-value">${overallPct}%</span>
                <span class="stat-label">Progresso</span>
            </div>
            <div class="planner-stat-card">
                <span class="stat-value">${actualHours}/${totalHours}h</span>
                <span class="stat-label">Horas</span>
            </div>
        </div>
        <div class="planner-stats-bar">
            <div class="progress-bar-container large">
                <div class="progress-bar-fill" style="width: ${overallPct}%"></div>
            </div>
            <span class="progress-label">${completedTopics} de ${totalTopics} topicos concluidos</span>
        </div>`;
}

// ─── TIME VIEW FILTER ───

function filterByTimeView(view) {
    plannerTimeView = view;

    // Update active button/select
    const selectEl = document.getElementById('plannerTimeView');
    if (selectEl) selectEl.value = view;

    const now = new Date();
    let cutoff;

    switch (view) {
        case 'semana': {
            cutoff = new Date(now);
            cutoff.setDate(cutoff.getDate() + 7);
            break;
        }
        case 'mes': {
            cutoff = new Date(now);
            cutoff.setMonth(cutoff.getMonth() + 1);
            break;
        }
        case 'semestre': {
            cutoff = new Date(now);
            cutoff.setMonth(cutoff.getMonth() + 6);
            break;
        }
        case 'ano': {
            cutoff = new Date(now);
            cutoff.setFullYear(cutoff.getFullYear() + 1);
            break;
        }
        default: {
            cutoff = new Date(now);
            cutoff.setDate(cutoff.getDate() + 7);
        }
    }

    const cutoffStr = cutoff.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];

    // Filter visible topic items by target_date
    document.querySelectorAll('.planner-topic-item').forEach(item => {
        const metaEl = item.querySelector('.topic-meta');
        if (!metaEl) return;

        // Topics without a date are always visible
        const dateMatch = metaEl.innerHTML.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (!dateMatch) {
            item.style.display = '';
            return;
        }

        const [, dd, mm, yyyy] = dateMatch;
        const topicDate = `${yyyy}-${mm}-${dd}`;

        item.style.display = (topicDate <= cutoffStr) ? '' : 'none';
    });
}

// ─── HELPERS ───

function formatTargetDate(dateStr) {
    if (!dateStr) return '';

    // Use global formatDate if available
    if (typeof formatDate === 'function') return formatDate(dateStr);

    const raw = String(dateStr);
    const date = raw.includes('T') ? new Date(raw) : new Date(raw + 'T00:00:00');
    if (isNaN(date.getTime())) return '';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function populateSubjectSelect(subjects) {
    const select = document.getElementById('topicSubject');
    if (!select) return;

    const currentVal = select.value;
    select.innerHTML = '<option value="">Selecione a materia</option>' +
        subjects.map(s => `<option value="${s.id}" ${s.id == currentVal ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('');
}

function escapeHtml(str) {
    if (!str) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(str).replace(/[&<>"']/g, c => map[c]);
}
