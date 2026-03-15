/* Scientific Articles Library — Pro feature */

let _articlesLoaded = false;

async function loadArticles() {
    if (_articlesLoaded) return;
    const el = document.getElementById('articlesList');
    if (!el) return;

    el.innerHTML = '<p style="text-align:center;color:var(--synapse-cyan)">Carregando biblioteca...</p>';

    try {
        const res = await fetch('/api/articles');
        if (res.status === 403) {
            el.innerHTML = '<div style="text-align:center;padding:24px"><p style="color:var(--synapse-gold);font-size:16px;margin-bottom:12px">\u{1F512} Biblioteca exclusiva do plano Pro</p><p style="color:var(--text-dim)">Assine o Pro para acessar 23+ artigos cient\u00EDficos na \u00EDntegra.</p><button class="btn-action" onclick="if(typeof startProCheckout===\'function\')startProCheckout()" style="margin-top:16px">Assinar Pro \u2014 R$ 29,90/m\u00EAs</button></div>';
            return;
        }
        if (!res.ok) throw new Error('Failed');
        const articles = await res.json();
        _articlesLoaded = true;
        renderArticles(articles);
    } catch (e) {
        el.innerHTML = '<p class="empty-state">Erro ao carregar artigos.</p>';
    }
}

function renderArticles(articles) {
    const el = document.getElementById('articlesList');
    if (!el) return;

    // Category labels
    const cats = {
        'learning': { label: 'Aprendizado', color: '#00f0ff' },
        'dopamine': { label: 'Dopamina & Recompensa', color: '#e040fb' },
        'attention': { label: 'Aten\u00E7\u00E3o & LC-NE', color: '#ffbe0b' },
        'spacing': { label: 'Espa\u00E7amento', color: '#00e676' },
        'nback': { label: 'N-Back & Working Memory', color: '#3a86ff' },
        'breathing': { label: 'Respira\u00E7\u00E3o & NSDR', color: '#ff8c00' }
    };

    // Filter buttons
    let html = '<div class="article-filters" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">';
    html += '<button class="article-filter active" onclick="filterArticles(this, \'all\')">Todos (' + articles.length + ')</button>';
    const catCounts = {};
    articles.forEach(a => { catCounts[a.category] = (catCounts[a.category] || 0) + 1; });
    Object.entries(cats).forEach(([key, val]) => {
        if (catCounts[key]) {
            html += '<button class="article-filter" onclick="filterArticles(this, \'' + key + '\')" style="border-color:' + val.color + '">' + val.label + ' (' + catCounts[key] + ')</button>';
        }
    });
    html += '</div>';

    // Article cards
    html += '<div class="articles-grid" id="articlesGrid">';
    articles.forEach(a => {
        const cat = cats[a.category] || { label: a.category, color: '#94a3c0' };
        html += `
        <div class="article-card" data-category="${a.category}">
            <div class="article-category" style="color:${cat.color}">${cat.label}</div>
            <h4 class="article-title">${a.title}</h4>
            <p class="article-authors">${a.authors}</p>
            <div class="article-meta">
                <span class="article-journal">${a.journal}</span>
                <span class="article-year">${a.year}</span>
            </div>
            <a href="${a.downloadUrl}" target="_blank" class="article-download">\u{1F4C4} Abrir PDF</a>
        </div>`;
    });
    html += '</div>';

    el.innerHTML = html;
}

function filterArticles(btn, category) {
    document.querySelectorAll('.article-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.article-card').forEach(card => {
        card.style.display = (category === 'all' || card.dataset.category === category) ? '' : 'none';
    });
}
