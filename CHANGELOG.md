# Changelog -- NeuroForge

Todas as alteracoes notaveis do projeto serao documentadas neste arquivo.
O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

> **OBRIGATORIO:** Todo desenvolvimento futuro DEVE registrar as alteracoes neste arquivo antes do deploy.

## [3.0.0] -- 2026-03-17 -- Neurobica, Revisao Unificada, Modo Zen e Plano Pro

### Adicionado
- **Neurobica** -- 108 cards originais de ginastica cerebral em 6 categorias (Motor, Linguistica, Memoria, Sensorial, Atencao, Social)
  - Rotacao diaria por dia da semana
  - API completa: GET /daily, GET /cards, POST /complete, GET /stats
  - Widget no dashboard com card do dia
  - Secao educativa com referencias cientificas (Lawrence Katz, BDNF, neuroplasticidade)
  - Star rating e animacao de XP
- **Revisao Unificada** -- combina flashcards FSRS + topicos espacados em sessao unica
  - Interleaving (mistura) dos itens para melhor retencao
  - Roteamento automatico de ratings para API correta (/flashcards ou /spaced)
  - Tela de resumo com precisao %, XP ganho e itens revisados
- **Modo Zen** -- revisao fullscreen sem distracoes
  - Card flip 3D com CSS perspective + rotateY(180deg)
  - Atalhos de teclado: Space/Enter=virar, 1-4=avaliar, Esc=sair
- **Tutorial de flashcards** -- 2 metodos (NotebookLM 7 passos + prompt de IA com caixa copiavel)
- **Filtro de baralhos** -- checkboxes para selecionar quais baralhos incluir na revisao
- **Accordion de baralhos** -- lista colapsavel com `<details>` para cards inline
- **Limpeza de citacoes** -- auto-remove `[cite_start]`, `[cite_end]`, `[cite: N]` do import NotebookLM
- **Artigo SPRINT MIND 2025** (Reboussin et al.) adicionado a biblioteca cientifica
- **Categoria neuroprotection** na biblioteca de artigos
- **Plano Free vs Pro** -- sistema completo de restricoes por plano com middleware plan-gate
  - Free: 5 flashcards/dia, 1 baralho, 10 topicos, 2 pomodoros/dia, 3 entradas no diario
  - Free: ferramentas limitadas a Ancora e Ruido de Foco
  - Free: neurobica apenas card diario (sem baralho completo)
  - Free: sem graficos, ranking, exportacao, artigos ou avaliacao
- **Popup de upgrade Pro** -- modal com lista de beneficios, garantia de 7 dias e checkout Stripe
- **Badges PRO** -- indicadores visuais nas abas Ranking e Artigos para usuarios Free
- **Banner de upgrade** no dashboard para usuarios do plano gratuito
- **Interceptacao de tabs Pro** -- ranking e artigos bloqueados para Free com redirecionamento ao modal
- **Favicon animado** -- SVG redesenhado com 4 raios animados, pulse central e glow ring
- **Tecnicas Fundamentais expandidas** de 4 para 8 (+ Elaboracao, Dupla Codificacao, Feynman, Pratica Deliberada)
- **Protecao Legal** -- INPI 512026001683-5, LICENSE proprietaria, Termos de Uso, Politica de Privacidade
- **Consentimento telefone/coaching** -- migracao 009 com campos phone e coaching consent

### Corrigido
- **7 bugs do Pomodoro**: race condition (clearInterval antes de novo), tempo real (focusElapsed), validacao de input (clamp 5-90/1-30), snooze (extends mode atual), SVG circle (pct 0-1), API response check, toast feedback
- **NaN no grafico** "Precisao de Revisoes" -- fallback `|| 0` e ocultar quando total=0
- **Neurobica nao carregava** -- observer corrigido de secNeurobica para tab-neurobica
- **Campo c.category vs c.cat** -- 4 ocorrencias corrigidas na rota neurobica
- **ON CONFLICT com cast** -- PostgreSQL nao suporta ::date em ON CONFLICT, substituido por check-then-insert
- **DOIs quebrados**: Dresler (s41598-022-11636-4) e Birn (s41598-019-40273-7)
- **VPS index.js corrompido** -- res.redirect(/app) sem aspas (causava crash PM2)
- **Duplo %%** no contador da landing -- HTML tinha % estatico + JS adicionava suffix
- **Contador double-fire** -- flag data-animated para evitar IntersectionObserver duplicado
- **Labels SVG** "Sem/Com NeuroForge" reposicionados (x=270, y=42/y=72)
- **Sidebar favicon diferente** -- unificado favicon-32.svg para favicon.svg
- **Logo login** ampliado (80->110px container, 48->72px imagem)
- **Contraste botao** "Assine Pro" melhorado

### Alterado
- **Traducao completa PT-BR** -- todas as siglas tecnicas em ingles convertidas para portugues autoexplicativo
  - FSRS -> "repeticao inteligente", RPE -> "surpresa positiva", NSDR -> "descanso profundo"
  - PVT -> "teste de reatividade", BET -> "treino de resistencia cognitiva"
  - LC-NE -> "Centro de alerta", ACC -> "Controle atencional"
- Landing page: nomes de features traduzidos (Flashcards Inteligentes, Ruido de Foco, etc.)
- Ferramentas de foco: mensagens de feedback traduzidas
- Avaliacao cognitiva: siglas removidas dos titulos de teste
- Tecnicas com titulo PT-BR em destaque e EN em subtitulo menor
- Contadores da landing: 23+ -> 42+ Estudos Cientificos, 9->10 Ferramentas
- Card de pressao arterial atualizado com dados Reboussin 2025

---

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
