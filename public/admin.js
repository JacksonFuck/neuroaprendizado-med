/* Admin Interface Logic */

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
        const res = await fetch('/auth/me');
        if (!res.ok) {
            window.location.href = '/login.html';
            return;
        }

        const adminRes = await fetch('/api/admin/metrics');
        if (!adminRes.ok) {
            if (adminRes.status === 403) {
                alert('Acesso negado. Apenas administradores.');
                window.location.href = '/index.html';
            }
            return;
        }

        const data = await adminRes.json();

        document.getElementById('loadingAdmin').style.display = 'none';
        document.getElementById('tab-metrics').style.display = 'block';

        // Fill Stats
        document.getElementById('stat-total-users').textContent = data.totals.users;
        document.getElementById('stat-active-users').textContent = data.totals.active;
        document.getElementById('stat-pending-sugg').textContent = data.recent_suggestions.filter(s => s.status === 'pending').length;

        // Fill Suggestions Table
        const suggTable = document.getElementById('suggestions-table');
        suggTable.innerHTML = data.recent_suggestions.map(s => `
            <tr>
                <td>${new Date(s.created_at).toLocaleDateString()}</td>
                <td>${s.user_name || 'Anônimo'}</td>
                <td><strong>${s.title}</strong><br><span style="color:var(--text-dim)">${s.description}</span></td>
                <td><span class="status-badge status-${s.status}">${s.status}</span></td>
                <td>
                    <select class="input" style="padding: 4px; font-size: 11px; width: auto;" onchange="updateSuggestionStatus(${s.id}, this.value)">
                        <option value="pending" ${s.status === 'pending' ? 'selected' : ''}>Pendente</option>
                        <option value="approved" ${s.status === 'approved' ? 'selected' : ''}>Aprovar</option>
                        <option value="rejected" ${s.status === 'rejected' ? 'selected' : ''}>Rejeitar</option>
                        <option value="done" ${s.status === 'done' ? 'selected' : ''}>Concluído</option>
                    </select>
                </td>
            </tr>
        `).join('');

        // Fill Tokens Table
        const tokenTable = document.getElementById('tokens-table');
        tokenTable.innerHTML = data.invitation_tokens.map(t => `
            <tr>
                <td style="font-family:monospace; color:var(--synapse-cyan);">${t.token}</td>
                <td>${t.used_count}</td>
                <td>${t.max_uses}</td>
                <td>${new Date(t.created_at).toLocaleDateString()}</td>
            </tr>
        `).join('');

    } catch (err) {
        console.error(err);
        document.getElementById('loadingAdmin').textContent = 'Erro ao carregar dados admin.';
    }
}

async function updateSuggestionStatus(id, status) {
    try {
        const res = await fetch(`/api/admin/suggestions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (res.ok) {
            fetchMetrics();
        } else {
            alert('Erro ao atualizar status.');
        }
    } catch (err) {
        console.error(err);
    }
}

async function generateToken() {
    const maxUses = document.getElementById('tokenMaxUses').value;
    try {
        const res = await fetch('/api/admin/tokens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ max_uses: parseInt(maxUses) })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            document.getElementById('tokenResult').textContent = `Token gerado: ${data.token}`;
            fetchMetrics(); // reload table
        } else {
            alert('Erro ao gerar token: ' + (data.error || ''));
        }
    } catch (err) {
        console.error(err);
    }
}
