# Roadmap -- NeuroForge

## Visao de Produto
Transformar o NeuroForge de uma ferramenta de estudo em um **coach virtual de engenharia neural** que acompanha, ensina e otimiza o aprendizado de cada aluno individualmente.

## Curto Prazo (1-2 meses)

### Coach Virtual IA
- [ ] Chatbot integrado com LLM (Claude/GPT) para:
  - Onboarding personalizado ("Explique seu objetivo e eu monto seu plano")
  - Feedback sobre progresso ("Sua retencao caiu 15% -- sugiro NSDR antes da proxima sessao")
  - Explicacao de tecnicas ("Me explique como funciona o N-Back")
  - Resposta a duvidas sobre neurociencia
- [ ] Schema de mensagens ja preparado (sender: 'ai')
- [ ] Integracao via API (Anthropic SDK ou OpenAI)

### RPE Adaptativo (Erro de Predicao de Recompensa)
- [ ] Calibracao de dificuldade em tempo real para manter taxa de acerto entre 70-85% (Zona de Desenvolvimento Proximal)
- [ ] Feedback variavel: 4 tipos (minimal, informativo, surprise bonus, omitido) com distribuicao 40/30/15/15
- [ ] Omissao estrategica de feedback em 15% dos acertos para gerar RPE negativo transitorio
- [ ] Metricas de "Surprise Index" por item: |R_estimado - R_real|

### Melhorias de UX
- [ ] Focus Tunnel: tela escura com ponto focal pulsante (5s) antes de cada sessao -- priming atencional LC-NE
- [ ] Progressive Declutter: remocao progressiva de elementos de UI conforme usuario entra em flow state
- [ ] Tutorial interativo na primeira visita a cada ferramenta
- [ ] Notificacoes push (PWA) para revisoes pendentes
- [ ] Modo offline melhorado (cache de flashcards para estudo sem internet)

### Dados e Analytics
- [ ] Dashboard admin visual (nao apenas API endpoints)
- [ ] Relatorio PDF exportavel por aluno
- [ ] Pesquisa de satisfacao a cada 8 semanas (check-in)
- [ ] Metricas de cohort (retencao semanal, engajamento por feature)

## Medio Prazo (3-6 meses)

### FSRS Personalizado + STC-Aware
- [ ] Otimizacao dos 17-21 parametros FSRS por usuario (ML backend com PyTorch)
- [ ] Agendamento STC-aware: revisao calculada dentro da janela de tag sinaptica (1-3h para itens novos)
- [ ] Regra de associatividade tardia: boost de 15% na estabilidade de itens dificeis revisados proximo a itens faceis
- [ ] PRP_virtual global: sinal que modula prioridade de itens "taggeados" em momentos de alta energia plastica
- [ ] A/B testing de intervalos para validacao
- [ ] Curva de esquecimento individual (nao generica)

### Micro-Pausas e Gap-Effects
- [ ] Micro-pausa de 10s a cada 2-3 minutos (tela escurece) para forcar replay neural hipocampal (10x velocidade)
- [ ] Micro-pausa de 60s a cada 25 minutos com respiracao guiada (4-7-8)
- [ ] Metricas de compliance com pausas e correlacao com retencao

### Conteudo Inteligente
- [ ] Geracao automatica de flashcards a partir de texto (IA)
- [ ] Importacao de decks Anki (.apkg)
- [ ] Biblioteca compartilhada de decks por curso/materia
- [ ] OCR de fotos de caderno para flashcards
- [ ] Interleaving automatico de topicos (evitar blocos longos de mesmo assunto)

### Stroop Task Completa
- [ ] Stroop task integrada como warm-up cognitivo pre-estudo (3-5 min)
- [ ] Interleaved BET: a cada 25 min de estudo, 2 min de tarefa de inibicao
- [ ] Tracking de fadiga: declinio de performance em BET dispara protocolo de pausa

### Social e Comunidade
- [ ] Grupos de estudo (turmas do professor)
- [ ] Desafios semanais entre grupos
- [ ] Compartilhamento de decks entre alunos
- [ ] Feed de atividade da turma (anonimo)

### Motor de Audio Neuro-Acustico
- [ ] Brown noise gerado proceduralmente (Web Audio API / Tone.js) com decaimento 1/f^2
- [ ] Binaural beats adaptativas: Alpha (10 Hz) para consolidacao, Theta (6 Hz) para encoding profundo
- [ ] Adaptacao automatica baseada na atividade (estudo ativo = Alpha, NSDR = Theta)
- [ ] Fade-out automatico durante tarefas BET (evitar conflito sensorial)

## Longo Prazo (6-12 meses)

### NSDR (Non-Sleep Deep Rest) Integrado
- [ ] Audio NSDR guiado (10-20 min) com body scan e respiracao dirigida
- [ ] Session Bookending: NSDR de 5 min antes da primeira sessao, 10 min apos a ultima
- [ ] Hard Stop progressivo: tela escurece a partir de 80 min, bloqueio total em 90 min
- [ ] Desbloqueio condicional: minimo 10 min em frequencia relaxada para desbloquear proxima sessao
- [ ] Metricas de delta performance pre-NSDR vs pos-NSDR

### Validacao Clinica
- [ ] Estudo piloto N=50 (estudantes de medicina)
- [ ] Metricas: retencao 30 dias, cortisol salivar, EEG (se disponivel)
- [ ] Publicacao em journal de educacao/neurociencia
- [ ] Parceria com universidades

### Plataforma para Professores
- [ ] Dashboard de turma com metricas por aluno
- [ ] Criacao e atribuicao de decks por professor
- [ ] Provas com flashcards + analytics de desempenho
- [ ] Integracao com LMS (Moodle, Canvas)

### Expansao de Mercado
- [ ] App mobile nativo (React Native / Flutter)
- [ ] Versao em ingles e espanhol
- [ ] Plano institucional (universidades, cursinhos)
- [ ] API publica para integracao com outros apps
- [ ] Marketplace de decks (criadores de conteudo)

### Wearable Integration
- [ ] Apple Watch / Fitbit / Oura Ring para HRV monitoring
- [ ] Correlacao HRV com performance cognitiva
- [ ] Alertas de fadiga baseados em dados fisiologicos reais
- [ ] Confirmacao biometrica de NSDR: subida em VFC + reducao de RHR acelera desbloqueio

### Dashboard de Neuro-Performance Avancado
- [ ] Retencao Real (%): cards corretos / cards apresentados (rolling 7 dias)
- [ ] RPE Score: media de |R_previsto - R_real| por sessao
- [ ] Fadiga Cognitiva Index: declinio % do RT baseline ao longo da sessao
- [ ] Eficiencia de Consolidacao: retencao em 24h / retencao imediata
- [ ] Flow State Duration: tempo continuo com RT < baseline * 1.1 e acuracia > 75%
- [ ] Recovery Compliance: % de sessoes com NSDR completado

## Principio Guia
> "Cada feature deve mapear para uma via neuroquimica. Se nao modula dopamina, noradrenalina, acetilcolina ou adenosina, nao pertence ao NeuroForge."
