document.addEventListener('DOMContentLoaded', () => {
    const consentName = 'neuro_cookie_consent_lgpd';

    // Check if user already accepted
    if (localStorage.getItem(consentName)) {
        return; // Already accepted
    }

    // Create the overlay banner
    const banner = document.createElement('div');
    banner.className = 'cookie-consent-banner';
    banner.innerHTML = `
        <div class="cookie-content">
            <span class="cookie-icon">🍪</span>
            <div class="cookie-text">
                <strong>Aviso de Privacidade e Cookies (LGPD)</strong>
                <p>O Neuroaprendizado Med utiliza cookies essenciais para garantir o funcionamento do nosso painel de estudos (como autenticação de sessão) e para aprimorar sua performance. Não utilizamos cookies de rastreamento para anúncios terceiros. Ao clicar em "Entendi e Aceito", você concorda com o uso de nosso armazenamento local de acordo com os princípios da LGPD.</p>
            </div>
        </div>
        <div class="cookie-actions">
            <button class="btn-action" id="btnAcceptCookies">Entendi e Aceito</button>
        </div>
    `;

    document.body.appendChild(banner);

    // Fade in
    setTimeout(() => {
        banner.classList.add('visible');
    }, 500);

    // Listeners
    document.getElementById('btnAcceptCookies').addEventListener('click', () => {
        localStorage.setItem(consentName, 'true');
        banner.classList.remove('visible');
        setTimeout(() => {
            banner.remove();
        }, 400); // Wait for transition
    });
});
