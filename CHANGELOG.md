# Changelog -- NeuroForge

Todas as alteracoes notaveis do projeto serao documentadas neste arquivo.
O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

> **OBRIGATORIO:** Todo desenvolvimento futuro DEVE registrar as alteracoes neste arquivo antes do deploy.

## [2.0.0] -- 2026-03-14 -- Evolucao para Nivel Profissional

### Adicionado
- **Flashcards com FSRS por card** -- Baralhos, cards com frente/verso, revisao com flip 3D, importacao CSV multi-formato (;, tab, |, ,), 4 ratings FSRS por card individual
- **Planejador de Estudos** -- Materias com cores, topicos com progresso %, filtro temporal (semana/mes/semestre/ano), link automatico com repeticao espacada
- **Dashboard com Graficos** -- 5 visualizacoes Chart.js (foco semanal, retencao, N-Back, precisao revisoes, heatmap 365 dias), exportacao CSV
- **Gamificacao Neural** -- XP engine, 20 achievements, 5 niveis (Iniciante a Neurocientista), rankings anonimos, popups animados de XP
- **N-Back Profissional** -- Audio (Speech Synthesis), feedback visual verde/vermelho, atalhos de teclado (A=posicao, L=letra), auto-progressao de nivel, historico persistente, seletor de rodadas
- **Go/No-Go Task** -- 30 estimulos (70/30 split), tempo de reacao, taxa de inibicao, feedback visual
- **PVT (Psychomotor Vigilance Task)** -- Padrao NASA/militar, 10 tentativas, deteccao de fadiga por RT
- **Pesquisa de Onboarding** -- Survey de 5 passos (nivel, objetivos, habitos, opt-in, resumo), goals tracking
- **Caixa de Mensagens** -- Mensagens automaticas (welcome, milestones, dicas diarias), badge de nao lidas, schema preparado para IA
- **Sistema Freemium** -- Plano Free (limitado) vs Pro (ilimitado), cadastro gratis sem token, gates por plano
- **Stripe Checkout** -- Pagamento de assinatura Pro R$ 29,90/mes, webhook para upgrade automatico, portal do cliente, 7 dias de trial
- **Landing Page** -- Pagina de marketing standalone com animacao neural Canvas, mini Stroop jogavel, flashcard flip demo, tabela comparativa, pricing, formulario de cadastro
- **Aba "Comece Aqui"** -- Onboarding completo com guia de cada ferramenta (como, quando, por que, ganhos %, referencias PubMed)
- **Branding NeuroForge** -- Favicon SVG animado, logo PNG generator, slogan "Forje sinapses. Domine o conhecimento.", animacao neural em todas as paginas
- **Admin Analytics** -- 7 endpoints para metricas de plataforma (overview, engagement, retention, performance, N-Back cohort, FSRS effectiveness, CSV export)
- **Referencias ABNT clicaveis** -- DOIs verificados em todas as abas (Tecnicas, Protocolos, Habitos, Suplementacao, Ciencia, Onboarding)

### Corrigido
- **Invalid Date** -- formatDate() agora detecta ISO timestamps do PostgreSQL
- **Aba Sugestoes invisivel** -- ID mismatch (tab-sugestoes para tab-suggestions)
- **Sugestoes sem GET** -- Adicionada rota GET + lista no frontend
- **Auth inconsistente** -- Sugestoes agora usam ensureAuth middleware
- **Streak null** -- CTE com COALESCE para sessoes vazias
- **Service Worker bloqueando atualizacoes** -- Cache-first para Network-first, cache version bump
- **Gamificacao invisivel** -- CSS variables --text-primary/--text-secondary definidas
- **Ranking nao renderizava** -- #rankingTable de div para table
- **Hiperventilacao timing** -- 1.5s/1.0s para 5s/5s (respiracao coerente)
- **Goals mostrando UNDEFINED** -- Campo goal_type correto + labels em portugues
- **Survey aparecendo toda vez** -- localStorage fallback + check estrito de onboarding_completed
- **Go/No-Go circulo invisivel** -- Removido inline opacity que sobrepunha CSS classes
- **Acentuacao** -- ~300+ correcoes de acento/cedilha em todos os arquivos frontend
- **Contraste mobile** -- Cores de texto mais claras para legibilidade em telas pequenas
- **SOMA-NPT preco** -- Corrigido para CHF 548/mes (verificado em soma-npt.ch)

### Seguranca
- Rate limiting em endpoints de autenticacao e registro
- Remocao de credenciais hardcoded do tracking Git
- Error messages genericas (sem err.message para cliente)
- Session secret sem fallback inseguro
- Reducao de max-age do cookie de 30 para 7 dias
- Password minimo 8 caracteres

## [1.0.0] -- 2026-03-07 -- Lancamento Inicial

### Adicionado
- Dashboard com stats (minutos, sessoes, streak, revisoes)
- Pomodoro Timer com hard block de 90 minutos + alarme + snooze
- Repeticao Espacada com intervalos fixos [1,3,7,14,30]
- Diario de Estudos com mood tracking
- Conteudo educacional (Tecnicas, Protocolos, Habitos, Suplementacao, Fato vs Mito, Ciencia)
- Sistema de Sugestoes
- Autenticacao (Google OAuth + email/senha com token de convite)
- Admin Panel com gestao de usuarios
- PWA com Service Worker
- LGPD compliance (aceite + direito de exclusao)
- Deploy Hostinger VPS com PM2 + Nginx + SSL
