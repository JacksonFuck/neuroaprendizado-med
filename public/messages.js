/* ═══════════════════════════════════════════════════════════════
   NEUROAPRENDIZADO MED — Messages Inbox
   ═══════════════════════════════════════════════════════════════ */

const MESSAGE_TYPE_ICONS = {
    welcome: '🧠',
    tip: '💡',
    achievement: '🏆',
    milestone: '🎯',
    reminder: '⏰',
    feedback: '💬'
};

// ─── UNREAD COUNT (for badge) ───
async function loadUnreadCount() {
    try {
        const res = await fetch('/api/messages/unread-count');
        if (!res.ok) return;
        const { count } = await res.json();
        const badge = document.getElementById('messageBadge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    } catch (e) { /* silent */ }
}

// ─── LOAD MESSAGES ───
async function loadMessages() {
    const el = document.getElementById('messagesList');
    if (!el) return;

    try {
        const res = await fetch('/api/messages');
        if (!res.ok) {
            el.innerHTML = '<p class="empty-state">Nenhuma mensagem ainda.</p>';
            return;
        }
        const messages = await res.json();
        renderMessages(messages);
    } catch (e) {
        el.innerHTML = '<p class="empty-state">Erro ao carregar mensagens.</p>';
    }
}

// ─── RENDER MESSAGES ───
function renderMessages(messages) {
    const el = document.getElementById('messagesList');
    if (!el) return;

    if (!messages || !messages.length) {
        el.innerHTML = '<p class="empty-state">Nenhuma mensagem na caixa de entrada.</p>';
        return;
    }

    el.innerHTML = messages.map(m => {
        const icon = MESSAGE_TYPE_ICONS[m.type] || '📩';
        const isUnread = !m.read_at;
        const timeAgo = getTimeAgo(m.created_at);

        return `
        <div class="message-item ${isUnread ? 'unread' : ''}" onclick="markAsRead(${m.id}, this)">
            <div class="message-header">
                <div style="display:flex;align-items:center">
                    <span class="message-type-icon">${icon}</span>
                    <span class="message-title">${escapeHtml(m.title)}</span>
                </div>
                <span class="message-time">${timeAgo}</span>
            </div>
            <div class="message-body">${escapeHtml(m.body)}</div>
        </div>`;
    }).join('');
}

// ─── MARK AS READ ───
async function markAsRead(id, element) {
    if (element && !element.classList.contains('unread')) return;

    try {
        await fetch(`/api/messages/${id}/read`, { method: 'PUT' });
        if (element) element.classList.remove('unread');
        loadUnreadCount();
    } catch (e) { console.error('Mark read error:', e); }
}

async function markAllAsRead() {
    try {
        await fetch('/api/messages/read-all', { method: 'PUT' });
        document.querySelectorAll('.message-item.unread').forEach(el => el.classList.remove('unread'));
        loadUnreadCount();
    } catch (e) { console.error('Mark all read error:', e); }
}

// ─── HELPERS ───
function getTimeAgo(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'agora';
    if (diffMin < 60) return `${diffMin}min`;
    if (diffHr < 24) return `${diffHr}h`;
    if (diffDay < 7) return `${diffDay}d`;
    if (diffDay < 30) return `${Math.floor(diffDay / 7)}sem`;
    return `${Math.floor(diffDay / 30)}m`;
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
