/* Admin Interface Logic — Enhanced v2 */

let currentData = null;

document.addEventListener('DOMContentLoaded', async () => {
    await fetchMetrics();
});

function switchAdminTab(tabName) {
    document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const panel = document.getElementById('tab-' + tabName);
    if (panel) panel.style.display = 'block';

    const nav = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
    if (nav) nav.classList.add('active');

    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('open');
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

async function fetchMetrics() {
    try {
        const authRes = await fetch('/auth/me');
        if (!authRes.ok) { window.location.href = '/login.html'; return; }

        const adminRes = await fetch('/api/admin/metrics');
        if (!adminRes.ok) {
            if (adminRes.status === 403) {
                alert('Acesso negado. Apenas administradores.');
                window.location.href = '/index.html';
            }
            return;
        }

        currentData = await adminRes.json();

        document.getElementById('loadingAdmin').style.display = 'none';
        document.getElementById('tab-metrics').style.display = 'block';

        renderKPIs(currentData);
        renderUsersTable(currentData.recent_users);
        renderSuggestionsTable(currentData.recent_suggestions);
        renderTokensTable(currentData.invitation_tokens);

    } catch (err) {
        console.error(err);
        document.getElementById('loadingAdmin').textContent = 'Erro ao carregar dados admin.';
    }
}

function renderKPIs(data) {
    const t = data.totals;
    document.getElementById('stat-total-users').textContent = t.users;
    document.getElementById('stat-active-users').textContent = t.active;
    document.getElementById('stat-pending-sugg').textContent = data.recent_suggestions.filter(s => s.status === 'pending').length;

    // Extended KPIs
    const extKpi = document.getElementById('extended-kpis');
    if (extKpi) {
        extKpi.innerHTML = `
            <div class="stat-card mini">
                <div class="stat-num">${t.inactive ?? 0}</div>
                <div class="stat-label">Não Ativados</div>
            </div>
            <div class="stat-card mini">
                <div class="stat-num">${t.admins ?? 0}</div>
                <div class="stat-label">Admins</div>
            </div>
            <div class="stat-card mini">
                <div class="stat-num">${t.pomodoro_sessions ?? 0}</div>
                <div class="stat-label">Sessões Pomodoro</div>
            </div>
            <div class="stat-card mini">
                <div class="stat-num">${Math.round((t.total_study_minutes ?? 0) / 60)}h</div>
                <div class="stat-label">Horas Estudadas</div>
            </div>
            <div class="stat-card mini">
                <div class="stat-num">${t.diary_entries ?? 0}</div>
                <div class="stat-label">Entradas no Diário</div>
            </div>
            <div class="stat-card mini">
                <div class="stat-num">${t.spaced_topics ?? 0}</div>
                <div class="stat-label">Tópicos Revisão</div>
            </div>
        `;
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('users-table');
    if (!tbody) return;

    tbody.innerHTML = users.map(u => {
        const lastLogin = u.last_login ? new Date(u.last_login).toLocaleDateString('pt-BR') : '—';
        const created = new Date(u.created_at).toLocaleDateString('pt-BR');
        const studyHours = Math.round((u.total_study_minutes || 0) / 60);
        const activeClass = u.is_active ? 'status-approved' : 'status-pending';
        const activeLabel = u.is_active ? 'Ativo' : 'Pendente';
        const lgpdDate = u.accepted_lgpd_at ? '✓' : '✗';

        return `
        <tr>
            <td>
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#00f0ff,#9b59f5);display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;">
                        ${(u.name || u.email || '?')[0].toUpperCase()}
                    </div>
                    <div>
                        <div style="font-weight:600;color:#e0f7ff;">${u.name || '—'}</div>
                        <div style="font-size:11px;color:#5e6a8a;">${u.email}</div>
                    </div>
                </div>
            </td>
            <td><span class="role-badge role-${u.role}">${u.role}</span></td>
            <td><span class="status-badge ${activeClass}">${activeLabel}</span></td>
            <td style="text-align:center;">
                <div style="font-size:12px;">📔 ${u.diary_entries || 0}</div>
                <div style="font-size:12px;">⏱ ${u.pomodoro_sessions || 0} sess.</div>
                <div style="font-size:12px;">🧠 ${u.spaced_topics || 0} top.</div>
                <div style="font-size:11px;color:#00f0ff;">${studyHours}h total</div>
            </td>
            <td style="font-size:11px;">${lgpdDate} LGPD<br>${created}</td>
            <td style="font-size:11px;color:#6c7a9c;">${lastLogin}</td>
            <td>
                <div style="display:flex;gap:6px;flex-direction:column;">
                    <button class="btn-action btn-warn" onclick="adminResetPassword(${u.id}, '${u.email}')">🔑 Reset Senha</button>
                    <button class="btn-action btn-ok" onclick="toggleUserActive(${u.id}, ${u.is_active})">${u.is_active ? '🔒 Desativar' : '✅ Ativar'}</button>
                    <button class="btn-action btn-ok" onclick="toggleUserRole(${u.id}, '${u.role}')">${u.role === 'admin' ? '👤 → User' : '👑 → Admin'}</button>
                    <button class="btn-action btn-danger" onclick="deleteUser(${u.id}, '${u.email}')">🗑 Excluir</button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function renderSuggestionsTable(suggestions) {
    const tbody = document.getElementById('suggestions-table');
    if (!tbody) return;

    tbody.innerHTML = suggestions.map(s => `
        <tr>
            <td>${new Date(s.created_at).toLocaleDateString('pt-BR')}</td>
            <td style="font-size:11px;">${s.user_name || 'Anônimo'}<br><span style="color:#5e6a8a">${s.user_email || ''}</span></td>
            <td><strong>${s.title}</strong><br><span style="color:var(--text-dim);font-size:12px;">${s.description}</span></td>
            <td><span class="status-badge status-${s.status}">${s.status}</span></td>
            <td>
                <select class="input" style="padding: 4px; font-size: 11px; width: auto;" onchange="updateSuggestionStatus(${s.id}, this.value)">
                    <option value="pending" ${s.status === 'pending' ? 'selected' : ''}>Pendente</option>
                    <option value="approved" ${s.status === 'approved' ? 'selected' : ''}>Aprovar</option>
                    <option value="rejected" ${s.status === 'rejected' ? 'selected' : ''}>Rejeitar</option>
                    <option value="done" ${s.status === 'done' ? 'selected' : ''}>Concluído</option>
                </select>
            </td>
        </tr>`).join('');
}

function renderTokensTable(tokens) {
    const tbody = document.getElementById('tokens-table');
    if (!tbody) return;

    tbody.innerHTML = tokens.map(t => `
        <tr>
            <td style="font-family:monospace;color:var(--synapse-cyan);">${t.token}</td>
            <td><span class="status-badge ${t.used ? 'status-done' : 'status-approved'}">${t.used ? 'Usado' : 'Disponível'}</span></td>
            <td style="font-size:11px;color:#5e6a8a;">${t.used_by_email || '—'}</td>
            <td style="font-size:11px;">${new Date(t.created_at).toLocaleDateString('pt-BR')}</td>
            <td>
                <button class="btn-action btn-danger" onclick="deleteToken(${t.id})" ${t.used ? 'disabled' : ''}>🗑 Excluir</button>
            </td>
        </tr>`).join('');
}

// =========================================
// User Actions
// =========================================
async function adminResetPassword(userId, email) {
    if (!confirm(`Gerar link de redefinição de senha para ${email}?`)) return;

    try {
        const res = await fetch(`/api/admin/users/${userId}/reset-password`, { method: 'POST' });
        const data = await res.json();

        if (data.success) {
            const msg = `Link de reset para ${data.email}:\n\n${data.reset_link}\n\n(válido por 24h)`;
            const modal = document.getElementById('reset-link-modal');
            const linkEl = document.getElementById('reset-link-content');
            if (modal && linkEl) {
                linkEl.textContent = data.reset_link;
                document.getElementById('reset-link-email').textContent = data.email;
                modal.style.display = 'flex';
            } else {
                prompt('Copie o link de reset:', data.reset_link);
            }
        } else {
            alert('Erro: ' + data.error);
        }
    } catch (err) {
        alert('Erro de conexão.');
    }
}

async function toggleUserActive(userId, currentState) {
    const newState = !currentState;
    const label = newState ? 'ativar' : 'desativar';
    if (!confirm(`Confirma ${label} este usuário?`)) return;

    try {
        const res = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: newState })
        });
        if (res.ok) fetchMetrics();
        else alert('Erro ao atualizar usuário.');
    } catch { alert('Erro de conexão.'); }
}

async function toggleUserRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Alterar role para "${newRole}"?`)) return;

    try {
        const res = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: newRole })
        });
        if (res.ok) fetchMetrics();
        else alert('Erro ao atualizar role.');
    } catch { alert('Erro de conexão.'); }
}

async function deleteUser(userId, email) {
    if (!confirm(`⚠️ ATENÇÃO: Excluir permanentemente o usuário "${email}"? Todos os dados serão perdidos.`)) return;

    try {
        const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
        if (res.ok) {
            fetchMetrics();
        } else {
            const d = await res.json();
            alert('Erro: ' + d.error);
        }
    } catch { alert('Erro de conexão.'); }
}

async function updateSuggestionStatus(id, status) {
    try {
        const res = await fetch(`/api/admin/suggestions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (res.ok) fetchMetrics();
        else alert('Erro ao atualizar status.');
    } catch (err) { console.error(err); }
}

async function generateToken() {
    try {
        const res = await fetch('/api/admin/tokens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();

        if (res.ok && data.success) {
            const resultEl = document.getElementById('tokenResult');
            resultEl.innerHTML = `Token gerado: <span style="font-family:monospace;color:#00f0ff;">${data.token.token}</span>`;
            fetchMetrics();
        } else {
            alert('Erro ao gerar token: ' + (data.error || ''));
        }
    } catch (err) { console.error(err); }
}

async function deleteToken(tokenId) {
    if (!confirm('Excluir este token?')) return;
    try {
        const res = await fetch(`/api/admin/tokens/${tokenId}`, { method: 'DELETE' });
        if (res.ok) fetchMetrics();
        else alert('Erro ao excluir token.');
    } catch { alert('Erro de conexão.'); }
}

// User search filter
function filterUsers(query) {
    const rows = document.querySelectorAll('#users-table tr');
    const q = query.toLowerCase();
    rows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
}
