/* ═══════════════════════════════════════════════════════════════
   FLASHCARDS — FSRS-based Spaced Repetition Cards
   ═══════════════════════════════════════════════════════════════ */

let _flashcardDataLoaded = false;
let _reviewCards = [];
let _reviewIndex = 0;
let _reviewXP = 0;
let _reviewCorrect = 0;
let _reviewTotal = 0;
let _isFlipped = false;

// ─── MAIN LOADER ───

async function loadFlashcardData() {
    if (_flashcardDataLoaded) return;
    await loadDecks();
    _flashcardDataLoaded = true;
}

// ─── DECK MANAGEMENT ───

async function loadDecks() {
    try {
        const res = await fetch('/api/flashcards');
        if (!res.ok) throw new Error('Failed to load decks');
        const decks = await res.json();
        renderDecks(decks);
        populateDeckSelectors(decks);
    } catch (err) {
        console.error('loadDecks:', err);
        const el = document.getElementById('flashcardDecks');
        if (el) el.innerHTML = '<p class="empty-state">Erro ao carregar baralhos</p>';
    }
}

async function addDeck() {
    const name = document.getElementById('deckName').value.trim();
    const category = document.getElementById('deckCategory').value.trim() || 'Geral';
    const color = document.getElementById('deckColor').value || '#00f0ff';
    if (!name) return;

    try {
        const res = await fetch('/api/flashcards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, category, color })
        });
        if (!res.ok) throw new Error('Failed to create deck');
        document.getElementById('deckName').value = '';
        document.getElementById('deckCategory').value = '';
        _flashcardDataLoaded = false;
        await loadFlashcardData();
    } catch (err) {
        console.error('addDeck:', err);
    }
}

async function deleteDeck(id) {
    if (!confirm('Remover este baralho e todos os cards?')) return;
    try {
        await fetch('/api/flashcards/' + id, { method: 'DELETE' });
        _flashcardDataLoaded = false;
        await loadFlashcardData();
        const cardsEl = document.getElementById('flashcardCards');
        if (cardsEl) cardsEl.innerHTML = '';
    } catch (err) {
        console.error('deleteDeck:', err);
    }
}

// ─── CARD MANAGEMENT ───

async function loadCards(deckId) {
    try {
        const res = await fetch('/api/flashcards/' + deckId + '/cards');
        if (!res.ok) throw new Error('Failed to load cards');
        const cards = await res.json();
        renderCards(cards, deckId);
    } catch (err) {
        console.error('loadCards:', err);
        const el = document.getElementById('flashcardCards');
        if (el) el.innerHTML = '<p class="empty-state">Erro ao carregar cards</p>';
    }
}

async function addCard() {
    const front = document.getElementById('cardFront').value.trim();
    const back = document.getElementById('cardBack').value.trim();
    const deckId = document.getElementById('cardDeck').value;
    if (!front || !back || !deckId) {
        alert('Preencha frente, verso e selecione um baralho.');
        return;
    }

    try {
        const res = await fetch('/api/flashcards/' + deckId + '/cards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ front, back })
        });
        if (!res.ok) throw new Error('Failed to create card');
        document.getElementById('cardFront').value = '';
        document.getElementById('cardBack').value = '';
        await loadCards(deckId);
        _flashcardDataLoaded = false;
        await loadDecks();
    } catch (err) {
        console.error('addCard:', err);
    }
}

async function deleteCard(cardId, deckId) {
    if (!confirm('Remover este card?')) return;
    try {
        await fetch('/api/flashcards/cards/' + cardId, { method: 'DELETE' });
        await loadCards(deckId);
        _flashcardDataLoaded = false;
        await loadDecks();
    } catch (err) {
        console.error('deleteCard:', err);
    }
}

// ─── REVIEW SESSION ───

async function startReviewSession() {
    const container = document.getElementById('flashcardReview');
    if (!container) return;

    container.innerHTML = '<p style="text-align:center;color:var(--synapse-cyan)">Carregando cards para revisão...</p>';
    container.style.display = 'block';

    try {
        const res = await fetch('/api/flashcards/review/due');
        if (!res.ok) throw new Error('Failed to load due cards');
        const cards = await res.json();

        if (!cards || cards.length === 0) {
            container.innerHTML = '<div class="review-empty"><span style="font-size:48px">🎉</span><h3>Nenhum card pendente!</h3><p>Todos os cards estão em dia. Volte mais tarde.</p></div>';
            return;
        }

        _reviewCards = cards;
        _reviewIndex = 0;
        _reviewXP = 0;
        _reviewCorrect = 0;
        _reviewTotal = cards.length;
        _isFlipped = false;

        renderReviewUI(cards);
        showCurrentCard();
    } catch (err) {
        console.error('startReviewSession:', err);
        container.innerHTML = '<p class="empty-state">Erro ao iniciar revisão</p>';
    }
}

function showCurrentCard() {
    if (_reviewIndex >= _reviewCards.length) {
        showReviewSummary();
        return;
    }

    const card = _reviewCards[_reviewIndex];
    const frontEl = document.getElementById('reviewFront');
    const backEl = document.getElementById('reviewBack');
    const progressEl = document.getElementById('reviewProgress');
    const inner = document.getElementById('reviewFlipInner');
    const ratingBtns = document.getElementById('reviewRatingBtns');

    if (frontEl) frontEl.textContent = card.front;
    if (backEl) backEl.textContent = card.back;
    if (progressEl) progressEl.textContent = 'Card ' + (_reviewIndex + 1) + '/' + _reviewTotal;
    if (inner) inner.classList.remove('flipped');
    if (ratingBtns) ratingBtns.style.display = 'none';
    _isFlipped = false;

    const showBtn = document.getElementById('reviewShowBtn');
    if (showBtn) showBtn.style.display = 'inline-flex';
}

function flipCard() {
    const inner = document.getElementById('reviewFlipInner');
    const ratingBtns = document.getElementById('reviewRatingBtns');
    const showBtn = document.getElementById('reviewShowBtn');

    if (inner) inner.classList.add('flipped');
    if (ratingBtns) ratingBtns.style.display = 'flex';
    if (showBtn) showBtn.style.display = 'none';
    _isFlipped = true;
}

async function rateCard(rating) {
    const card = _reviewCards[_reviewIndex];
    if (!card) return;

    try {
        const res = await fetch('/api/flashcards/cards/' + card.id + '/review', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating: rating })
        });

        if (res.ok) {
            const data = await res.json();
            if (data.xp_earned) {
                _reviewXP += data.xp_earned;
                if (typeof showXPPopup === 'function') {
                    showXPPopup(data.xp_earned, 'Flashcard Review');
                }
            }
        }
    } catch (err) {
        console.error('rateCard:', err);
    }

    if (rating >= 3) _reviewCorrect++;

    _reviewIndex++;
    showCurrentCard();
}

function showReviewSummary() {
    const container = document.getElementById('flashcardReview');
    if (!container) return;

    const accuracy = _reviewTotal > 0 ? Math.round((_reviewCorrect / _reviewTotal) * 100) : 0;
    const accuracyColor = accuracy >= 80 ? 'var(--synapse-green)' : accuracy >= 50 ? 'var(--synapse-gold)' : 'var(--synapse-red)';

    container.innerHTML =
        '<div class="review-summary">'
        + '<span class="review-summary-icon">🧠</span>'
        + '<h3>Sessão Concluída!</h3>'
        + '<div class="review-summary-stats">'
        + '<div class="review-stat"><span class="review-stat-value">' + _reviewTotal + '</span><span class="review-stat-label">Cards Revisados</span></div>'
        + '<div class="review-stat"><span class="review-stat-value" style="color:' + accuracyColor + '">' + accuracy + '%</span><span class="review-stat-label">Precisão</span></div>'
        + '<div class="review-stat"><span class="review-stat-value" style="color:var(--synapse-gold)">+' + _reviewXP + '</span><span class="review-stat-label">XP Ganho</span></div>'
        + '</div>'
        + '<button class="btn-action" onclick="closeReviewSession()" style="margin-top:20px">Fechar</button>'
        + '</div>';
}

function closeReviewSession() {
    const container = document.getElementById('flashcardReview');
    if (container) {
        container.style.display = 'none';
        container.innerHTML = '';
    }
    _reviewCards = [];
    _reviewIndex = 0;
    _flashcardDataLoaded = false;
    loadFlashcardData();
}

// ─── IMPORT ───

async function importCards() {
    const deckId = document.getElementById('importDeck').value;
    const text = document.getElementById('importText').value.trim();
    if (!deckId || !text) {
        alert('Selecione um baralho e cole o conteúdo.\nFormatos aceitos:\n• pergunta;resposta (ponto e vírgula)\n• pergunta[TAB]resposta (tab — formato Anki)\n• pergunta|resposta (pipe)\n• pergunta,resposta (vírgula — se só houver uma)');
        return;
    }

    try {
        const res = await fetch('/api/flashcards/' + deckId + '/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ csv: text })
        });
        const data = await res.json();
        if (!res.ok) {
            alert('Erro: ' + (data.error || 'Falha na importação') + (data.details ? '\n' + data.details.join('\n') : ''));
            return;
        }
        const msg = 'Importados ' + (data.imported || 0) + ' cards com sucesso!' +
            (data.errors && data.errors.length ? '\n\nAvisos:\n' + data.errors.join('\n') : '');
        alert(msg);
        document.getElementById('importText').value = '';
        _flashcardDataLoaded = false;
        await loadFlashcardData();
    } catch (err) {
        console.error('importCards:', err);
        alert('Erro de conexão ao importar cards.');
    }
}

// ─── RENDERING ───

function renderDecks(decks) {
    const el = document.getElementById('flashcardDecks');
    if (!el) return;

    if (!decks || decks.length === 0) {
        el.innerHTML = '<p class="empty-state">Nenhum baralho criado. Crie o primeiro acima!</p>';
        return;
    }

    el.innerHTML = decks.map(function (d) {
        var cardCount = d.card_count || 0;
        var dueCount = d.due_count || 0;
        var borderColor = d.color || 'var(--synapse-cyan)';
        return '<details class="deck-accordion" style="--deck-color:' + borderColor + '">'
            + '<summary class="deck-accordion-header">'
            + '<div class="deck-accordion-info">'
            + '<span class="deck-accordion-dot" style="background:' + borderColor + '"></span>'
            + '<h4>' + escapeHtml(d.name) + '</h4>'
            + '<span class="deck-accordion-meta">' + cardCount + ' cards</span>'
            + (dueCount > 0 ? '<span class="deck-stat deck-stat-due">' + dueCount + ' pendentes</span>' : '<span class="deck-stat deck-stat-ok">Em dia</span>')
            + '<span class="deck-category">' + escapeHtml(d.category || 'Geral') + '</span>'
            + '</div>'
            + '<button class="btn-delete" onclick="event.stopPropagation();event.preventDefault();deleteDeck(' + d.id + ')" title="Remover baralho">&#10005;</button>'
            + '</summary>'
            + '<div class="deck-accordion-body" id="deckBody_' + d.id + '">'
            + '<p style="color:var(--text-dim);font-size:13px;text-align:center;padding:12px 0">Clique para carregar cards...</p>'
            + '</div>'
            + '</details>';
    }).join('');

    // Lazy-load cards when deck is opened
    el.querySelectorAll('.deck-accordion').forEach(function (det, i) {
        det.addEventListener('toggle', function () {
            if (det.open) {
                var deckId = decks[i].id;
                loadCardsInline(deckId);
            }
        });
    });
}

async function loadCardsInline(deckId) {
    var body = document.getElementById('deckBody_' + deckId);
    if (!body) return;
    body.innerHTML = '<p style="color:var(--synapse-cyan);font-size:13px;text-align:center;padding:8px 0">Carregando...</p>';

    try {
        var res = await fetch('/api/flashcards/' + deckId + '/cards');
        if (!res.ok) throw new Error('Failed');
        var cards = await res.json();
        renderCardsInline(cards, deckId, body);
    } catch (err) {
        body.innerHTML = '<p class="empty-state">Erro ao carregar cards</p>';
    }
}

function renderCardsInline(cards, deckId, container) {
    if (!cards || cards.length === 0) {
        container.innerHTML = '<p class="empty-state" style="padding:12px 0">Nenhum card neste baralho.</p>';
        return;
    }

    container.innerHTML = cards.map(function (c, i) {
        return '<div class="fc-card-row">'
            + '<span class="fc-card-num">' + (i + 1) + '</span>'
            + '<div class="fc-card-front-inline">' + escapeHtml(c.front) + '</div>'
            + '<div class="fc-card-back-inline">' + escapeHtml(c.back) + '</div>'
            + '<button class="btn-delete btn-delete-sm" onclick="deleteCard(' + c.id + ',' + deckId + ')" title="Remover">&#10005;</button>'
            + '</div>';
    }).join('');
}

function renderCards(cards, deckId) {
    // Legacy fallback — now handled by inline rendering
    var el = document.getElementById('flashcardCards');
    if (!el) return;
    el.innerHTML = '';
}

function renderReviewUI() {
    var container = document.getElementById('flashcardReview');
    if (!container) return;

    container.innerHTML =
        '<div class="review-container">'
        + '<div id="reviewProgress" class="review-progress">Card 1/' + _reviewTotal + '</div>'
        + '<div class="review-flip-card" id="reviewCard" onclick="if(!_isFlipped)flipCard()">'
        + '<div class="review-flip-inner" id="reviewFlipInner">'
        + '<div class="review-front" id="reviewFront"></div>'
        + '<div class="review-back" id="reviewBack"></div>'
        + '</div>'
        + '</div>'
        + '<button class="btn-action review-show-btn" id="reviewShowBtn" onclick="flipCard()">Mostrar Resposta</button>'
        + '<div class="review-rating-buttons" id="reviewRatingBtns" style="display:none">'
        + '<button class="btn-rating-lg btn-again-lg" onclick="rateCard(1)" title="Não lembrei"><span>&#10060;</span><span class="rating-label">Não lembrei</span></button>'
        + '<button class="btn-rating-lg btn-hard-lg" onclick="rateCard(2)" title="Difícil"><span>&#128547;</span><span class="rating-label">Difícil</span></button>'
        + '<button class="btn-rating-lg btn-good-lg" onclick="rateCard(3)" title="Lembrei"><span>&#9989;</span><span class="rating-label">Lembrei</span></button>'
        + '<button class="btn-rating-lg btn-easy-lg" onclick="rateCard(4)" title="Fácil"><span>&#128640;</span><span class="rating-label">Fácil</span></button>'
        + '</div>'
        + '</div>';
}

function populateDeckSelectors(decks) {
    var selectors = ['cardDeck', 'importDeck'];
    selectors.forEach(function (id) {
        var sel = document.getElementById(id);
        if (!sel) return;
        var current = sel.value;
        sel.innerHTML = '<option value="">Selecione o baralho</option>'
            + (decks || []).map(function (d) {
                return '<option value="' + d.id + '">' + escapeHtml(d.name) + '</option>';
            }).join('');
        if (current) sel.value = current;
    });

    // Populate review deck checkboxes
    var checkboxContainer = document.getElementById('reviewDeckCheckboxes');
    if (checkboxContainer && decks && decks.length > 0) {
        var allLabel = '<label style="color:var(--text-dim);font-size:13px;cursor:pointer"><input type="checkbox" checked class="review-deck-all" onchange="toggleAllReviewDecks(this)"> <strong>Todos</strong></label>';
        var deckLabels = decks.map(function (d) {
            var dueInfo = d.due_count > 0 ? ' (' + d.due_count + ')' : '';
            return '<label style="color:var(--text-dim);font-size:13px;cursor:pointer;display:flex;align-items:center;gap:4px">'
                + '<input type="checkbox" checked class="review-deck-cb" value="' + d.id + '" onchange="updateAllCheckbox()"> '
                + '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + (d.color || 'var(--synapse-cyan)') + '"></span> '
                + escapeHtml(d.name) + dueInfo
                + '</label>';
        }).join('');
        checkboxContainer.innerHTML = allLabel + deckLabels;
    }
}

function toggleAllReviewDecks(allCb) {
    var cbs = document.querySelectorAll('.review-deck-cb');
    cbs.forEach(function (cb) { cb.checked = allCb.checked; });
}

function updateAllCheckbox() {
    var cbs = document.querySelectorAll('.review-deck-cb');
    var allCb = document.querySelector('.review-deck-all');
    if (!allCb) return;
    var allChecked = true;
    cbs.forEach(function (cb) { if (!cb.checked) allChecked = false; });
    allCb.checked = allChecked;
}

async function startFilteredReview() {
    var cbs = document.querySelectorAll('.review-deck-cb:checked');
    var selectedIds = [];
    cbs.forEach(function (cb) { selectedIds.push(parseInt(cb.value)); });

    if (selectedIds.length === 0) {
        alert('Selecione pelo menos um baralho para revisão.');
        return;
    }

    var container = document.getElementById('flashcardReview');
    if (!container) return;

    container.innerHTML = '<p style="text-align:center;color:var(--synapse-cyan)">Carregando cards para revisão...</p>';
    container.style.display = 'block';

    try {
        var res = await fetch('/api/flashcards/review/due');
        if (!res.ok) throw new Error('Failed to load due cards');
        var allCards = await res.json();

        // Filter by selected decks
        var allSelected = document.querySelector('.review-deck-all');
        var cards = (allSelected && allSelected.checked) ? allCards : allCards.filter(function (c) {
            return selectedIds.indexOf(c.deck_id) !== -1;
        });

        if (!cards || cards.length === 0) {
            container.innerHTML = '<div class="review-empty"><span style="font-size:48px">🎉</span><h3>Nenhum card pendente!</h3><p>Todos os cards dos baralhos selecionados estão em dia.</p></div>';
            return;
        }

        _reviewCards = cards;
        _reviewIndex = 0;
        _reviewXP = 0;
        _reviewCorrect = 0;
        _reviewTotal = cards.length;
        _isFlipped = false;

        renderReviewUI();
        showCurrentCard();
    } catch (err) {
        console.error('startFilteredReview:', err);
        container.innerHTML = '<p class="empty-state">Erro ao iniciar revisão</p>';
    }
}

// ─── COPY PROMPT ───

function copyFCPrompt() {
    var text = document.getElementById('fcPromptText');
    if (!text) return;
    var content = text.textContent || text.innerText;
    navigator.clipboard.writeText(content).then(function () {
        var btn = document.getElementById('fcCopyBtn');
        if (btn) {
            btn.textContent = '✅ Copiado!';
            setTimeout(function () { btn.textContent = '📋 Copiar Prompt'; }, 2000);
        }
    }).catch(function () {
        // Fallback
        var range = document.createRange();
        range.selectNode(text);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        document.execCommand('copy');
        window.getSelection().removeAllRanges();
        var btn = document.getElementById('fcCopyBtn');
        if (btn) {
            btn.textContent = '✅ Copiado!';
            setTimeout(function () { btn.textContent = '📋 Copiar Prompt'; }, 2000);
        }
    });
}

function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}
