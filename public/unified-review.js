/**
 * NeuroForge — Forje sinapses. Domine o conhecimento.
 * Copyright (c) 2026 Jackson Erasmo Fuck. All rights reserved.
 * INPI Registration: 512026001683-5
 * Licensed under proprietary license. See LICENSE file.
 */

/* ═══════════════════════════════════════════════════════════════
   UNIFIED REVIEW + ZEN MODE
   Combines spaced topics + flashcards in a single distraction-free session
   ═══════════════════════════════════════════════════════════════ */

const UnifiedReview = (function () {

    let _items = [];
    let _index = 0;
    let _correct = 0;
    let _total = 0;
    let _xpEarned = 0;
    let _flipped = false;

    /* ── Load count for dashboard widget ── */
    async function loadDashboardCount() {
        const el = document.getElementById('unifiedReviewCount');
        if (!el) return;
        try {
            const res = await fetch('/api/unified-review/due');
            if (!res.ok) { el.textContent = 'Faça login para ver revisões'; return; }
            const data = await res.json();
            if (data.total === 0) {
                el.innerHTML = '🎉 <strong>Tudo em dia!</strong> Nenhuma revisão pendente.';
                const btn = el.parentElement?.nextElementSibling;
                if (btn) btn.style.display = 'none';
            } else {
                const parts = [];
                if (data.topics_count > 0) parts.push(`${data.topics_count} tópico${data.topics_count > 1 ? 's' : ''}`);
                if (data.flashcards_count > 0) parts.push(`${data.flashcards_count} flashcard${data.flashcards_count > 1 ? 's' : ''}`);
                el.innerHTML = `<strong>${data.total} revisões pendentes</strong> — ${parts.join(' + ')}`;
            }
        } catch { el.textContent = 'Erro ao carregar'; }
    }

    /* ── Start session ── */
    async function start() {
        try {
            const res = await fetch('/api/unified-review/due');
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();

            if (!data.items || data.items.length === 0) {
                if (typeof showToast === 'function') showToast('Nenhuma revisão pendente!', 'success');
                return;
            }

            _items = data.items;
            _index = 0;
            _correct = 0;
            _total = data.total;
            _xpEarned = 0;
            _flipped = false;

            enterZenMode();
            showItem();
        } catch (err) {
            console.error('Unified review start error:', err);
            if (typeof showToast === 'function') showToast('Erro ao iniciar revisão', 'danger');
        }
    }

    /* ── Zen Mode UI ── */
    function enterZenMode() {
        const overlay = document.getElementById('zenModeOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            // ESC to exit
            document.addEventListener('keydown', _zenKeyHandler);
        }
    }

    function exitZenMode() {
        const overlay = document.getElementById('zenModeOverlay');
        if (overlay) overlay.style.display = 'none';
        document.body.style.overflow = '';
        document.removeEventListener('keydown', _zenKeyHandler);
        // Refresh dashboard
        loadDashboardCount();
        if (typeof loadStats === 'function') loadStats();
    }

    function _zenKeyHandler(e) {
        if (e.key === 'Escape') { exitZenMode(); return; }
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (!_flipped) flip();
            return;
        }
        if (_flipped) {
            if (e.key === '1') rate(1);
            else if (e.key === '2') rate(2);
            else if (e.key === '3') rate(3);
            else if (e.key === '4') rate(4);
        }
    }

    function showItem() {
        if (_index >= _items.length) {
            showSummary();
            return;
        }

        const item = _items[_index];
        const frontEl = document.getElementById('zenFront');
        const backEl = document.getElementById('zenBack');
        const progressEl = document.getElementById('zenProgress');
        const categoryEl = document.getElementById('zenCategory');
        const inner = document.getElementById('zenCardInner');
        const showBtn = document.getElementById('zenShowBtn');
        const ratingEl = document.getElementById('zenRating');
        const summaryEl = document.getElementById('zenSummary');

        if (frontEl) frontEl.textContent = item.front;
        if (backEl) backEl.textContent = item.back;
        if (progressEl) progressEl.textContent = `${_index + 1}/${_total}`;
        if (categoryEl) {
            const typeLabel = item.type === 'topic' ? '📚 Tópico' : '🃏 Flashcard';
            const catName = item.category || '';
            categoryEl.innerHTML = `${typeLabel} <span style="opacity:0.6">· ${catName}</span>`;
            if (item.color) categoryEl.style.color = item.color;
            else categoryEl.style.color = '';
        }
        if (inner) inner.classList.remove('flipped');
        if (showBtn) showBtn.style.display = 'inline-flex';
        if (ratingEl) ratingEl.style.display = 'none';
        if (summaryEl) summaryEl.style.display = 'none';
        _flipped = false;
    }

    function flip() {
        const inner = document.getElementById('zenCardInner');
        const showBtn = document.getElementById('zenShowBtn');
        const ratingEl = document.getElementById('zenRating');

        if (inner) inner.classList.add('flipped');
        if (showBtn) showBtn.style.display = 'none';
        if (ratingEl) ratingEl.style.display = 'flex';
        _flipped = true;
    }

    async function rate(rating) {
        const item = _items[_index];
        if (!item) return;

        // Send to appropriate API
        try {
            if (item.type === 'flashcard') {
                const res = await fetch('/api/flashcards/cards/' + item.id + '/review', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rating })
                });
                if (res.ok) {
                    const data = await res.json();
                    _xpEarned += data.xp_earned || 0;
                }
            } else if (item.type === 'topic') {
                const res = await fetch('/api/spaced/' + item.id + '/review', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rating })
                });
                if (res.ok) {
                    const data = await res.json();
                    _xpEarned += data.xp || 0;
                }
            }
        } catch (err) {
            console.error('Rate error:', err);
        }

        if (rating >= 3) _correct++;
        _index++;
        showItem();
    }

    function showSummary() {
        const card = document.getElementById('zenCard');
        const showBtn = document.getElementById('zenShowBtn');
        const ratingEl = document.getElementById('zenRating');
        const summaryEl = document.getElementById('zenSummary');
        const progressEl = document.getElementById('zenProgress');
        const categoryEl = document.getElementById('zenCategory');

        if (card) card.style.display = 'none';
        if (showBtn) showBtn.style.display = 'none';
        if (ratingEl) ratingEl.style.display = 'none';
        if (progressEl) progressEl.textContent = 'Concluído';
        if (categoryEl) categoryEl.textContent = '';

        const accuracy = _total > 0 ? Math.round((_correct / _total) * 100) : 0;
        const accColor = accuracy >= 80 ? '#00e676' : accuracy >= 50 ? '#ffbe0b' : '#ff3366';

        if (summaryEl) {
            summaryEl.style.display = 'block';
            summaryEl.innerHTML =
                '<div class="zen-summary">'
                + '<span style="font-size:48px">🧠</span>'
                + '<h2>Sessão Concluída!</h2>'
                + '<div class="zen-summary-stats">'
                + '<div class="zen-stat"><span class="zen-stat-val">' + _total + '</span><span class="zen-stat-lbl">Revisados</span></div>'
                + '<div class="zen-stat"><span class="zen-stat-val" style="color:' + accColor + '">' + accuracy + '%</span><span class="zen-stat-lbl">Precisão</span></div>'
                + '<div class="zen-stat"><span class="zen-stat-val" style="color:#ffbe0b">+' + _xpEarned + '</span><span class="zen-stat-lbl">XP</span></div>'
                + '</div>'
                + '<button class="btn-action" onclick="exitZenMode()" style="margin-top:24px">Fechar</button>'
                + '</div>';
        }
    }

    return { loadDashboardCount, start, flip, rate, exitZenMode: exitZenMode };
})();

/* ── Global bindings ── */
function startUnifiedReview() { UnifiedReview.start(); }
function flipZenCard() { UnifiedReview.flip(); }
function rateZenCard(r) { UnifiedReview.rate(r); }
function exitZenMode() { UnifiedReview.exitZenMode(); }

/* ── Auto-load count on dashboard ── */
document.addEventListener('DOMContentLoaded', function () {
    UnifiedReview.loadDashboardCount();
});
