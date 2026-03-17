/**
 * NeuroForge — Forje sinapses. Domine o conhecimento.
 * Copyright (c) 2026 Jackson Erasmo Fuck. All rights reserved.
 * INPI Registration: 512026001683-5
 * Licensed under proprietary license. See LICENSE file.
 */
document.addEventListener('DOMContentLoaded', () => {
    const consentName = 'neuro_cookie_consent_lgpd';

    if (localStorage.getItem(consentName)) return;

    // Inject styles (self-contained — works on any page without app.css)
    const style = document.createElement('style');
    style.textContent = `
        .cookie-consent-banner {
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%) translateY(150%);
            width: calc(100% - 48px);
            max-width: 720px;
            background: rgba(10, 12, 28, 0.95);
            border: 1px solid rgba(0, 240, 255, 0.15);
            border-radius: 16px;
            padding: 20px 24px;
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            box-shadow: 0 0 30px rgba(0, 240, 255, 0.08), 0 8px 32px rgba(0, 0, 0, 0.4);
            z-index: 10000;
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            font-family: 'Inter', 'Plus Jakarta Sans', system-ui, sans-serif;
        }
        .cookie-consent-banner.visible {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        .cookie-consent-banner .cookie-content {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            flex: 1;
        }
        .cookie-consent-banner .cookie-icon {
            font-size: 28px;
            line-height: 1;
            flex-shrink: 0;
        }
        .cookie-consent-banner .cookie-text strong {
            display: block;
            font-size: 14px;
            color: #f0f4ff;
            margin-bottom: 4px;
        }
        .cookie-consent-banner .cookie-text p {
            font-size: 12px;
            color: #94a3c0;
            line-height: 1.5;
            margin: 0;
        }
        .cookie-consent-banner .cookie-text a {
            color: #00f0ff;
            text-decoration: underline;
        }
        .cookie-consent-banner .cookie-text a:hover {
            color: #fff;
        }
        .cookie-consent-banner .cookie-actions {
            flex-shrink: 0;
        }
        .cookie-consent-banner .btn-accept {
            background: linear-gradient(135deg, #00f0ff, #00b8d4);
            color: #0a0a14;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s;
            font-family: inherit;
        }
        .cookie-consent-banner .btn-accept:hover {
            background: linear-gradient(135deg, #33f5ff, #00e5ff);
            box-shadow: 0 0 16px rgba(0, 240, 255, 0.3);
        }
        @media (max-width: 600px) {
            .cookie-consent-banner {
                flex-direction: column;
                align-items: stretch;
                bottom: 0;
                left: 0;
                width: 100%;
                max-width: 100%;
                border-radius: 16px 16px 0 0;
                transform: translateX(0) translateY(150%);
                padding: 16px;
            }
            .cookie-consent-banner.visible {
                transform: translateX(0) translateY(0);
            }
            .cookie-consent-banner .btn-accept {
                width: 100%;
                padding: 12px;
            }
        }
    `;
    document.head.appendChild(style);

    const banner = document.createElement('div');
    banner.className = 'cookie-consent-banner';
    banner.innerHTML = `
        <div class="cookie-content">
            <span class="cookie-icon">🍪</span>
            <div class="cookie-text">
                <strong>Aviso de Privacidade e Cookies (LGPD)</strong>
                <p>O NeuroForge utiliza cookies essenciais para autenticação de sessão e funcionamento da plataforma. Não utilizamos cookies de rastreamento para anúncios. Ao continuar, você concorda com nossa
                <a href="/privacy-policy.html">Política de Privacidade</a> e
                <a href="/terms-of-use.html">Termos de Uso</a>,
                em conformidade com a LGPD (Lei 13.709/2018).</p>
            </div>
        </div>
        <div class="cookie-actions">
            <button class="btn-accept" id="btnAcceptCookies">Entendi e Aceito</button>
        </div>
    `;

    document.body.appendChild(banner);

    setTimeout(() => banner.classList.add('visible'), 500);

    document.getElementById('btnAcceptCookies').addEventListener('click', () => {
        localStorage.setItem(consentName, 'true');
        banner.classList.remove('visible');
        setTimeout(() => banner.remove(), 400);
    });
});
