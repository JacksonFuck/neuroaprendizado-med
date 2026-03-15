# Roadmap -- NeuroForge

## Visão de Produto
Transformar o NeuroForge de uma ferramenta de estudo em um **coach virtual de engenharia neural** que acompanha, ensina e otimiza o aprendizado de cada aluno individualmente.

## Curto Prazo (1-2 meses)

### Avaliação Neurocognitiva Longitudinal (Baseline + Follow-up)

> **Princípio:** A avaliação não pode parecer uma prova. A carga cognitiva deve ser mínima.
> As melhores métricas são **passivas** — dados que o app já coleta naturalmente.

#### Filosofia da Avaliação
O sistema combina dois tipos de métricas:
1. **Métricas passivas** (coletadas automaticamente, sem "teste" explícito) — o aluno nem percebe
2. **Micro-avaliações ativas** (< 3 minutos, gamificadas) — parecem ferramentas, não provas

#### Baseline (Ponto Zero — Semana 0)
Realizado durante o onboarding ou na primeira semana de uso:
- [ ] **PVT Baseline** (60s): 5 tentativas de tempo de reação — mede alerta e fadiga basal
  - Métrica: RT médio, RT variabilidade (CV_RT), lapsos (RT > 500ms)
  - Carga cognitiva: mínima (apenas clicar quando aparecer)
- [ ] **N-Back Baseline** (2 min): 10 rodadas de 2-Back — mede memória de trabalho basal
  - Métrica: accuracy %, d-prime (sensibilidade), RT de respostas corretas
- [ ] **Stroop Baseline** (30s): 1 sessão de Stroop — mede controle inibitório basal
  - Métrica: accuracy %, RT médio, efeito de interferência
- [ ] **FSRS Primeiro Ciclo**: primeiras 10 revisões — mede retenção natural
  - Métrica: % de acerto na primeira revisão (sem treinamento FSRS prévio)
- [ ] **Questionário subjetivo** (5 perguntas, escala 1-5):
  1. "Quanto tempo consigo estudar sem perder o foco?" (proxy de atenção sustentada)
  2. "Quanto lembro do que estudei na semana passada?" (proxy de retenção percebida)
  3. "Quão cansado me sinto após 1h de estudo?" (proxy de fadiga cognitiva)
  4. "Quão motivado estou para estudar hoje?" (proxy de estado dopaminérgico)
  5. "Quão organizado é meu plano de estudos?" (proxy de controle executivo)
  - Carga: < 1 minuto

**Total do baseline: ~5 minutos.** O aluno pensa que está "aprendendo a usar as ferramentas", não que está sendo avaliado.

#### Avaliações Seriadas (Follow-up)
Mesmo protocolo do baseline, disparado automaticamente nos marcos:

| Marco | Quando | O que mede |
|-------|--------|-----------|
| **T0** | Semana 0 (onboarding) | Baseline — ponto zero |
| **T1** | Semana 4 | Adaptação inicial — BET começou a fazer efeito? |
| **T2** | Semana 8 | Consolidação — FSRS otimizou intervalos? N-Back subiu nível? |
| **T3** | Semana 12 | Maturação — mudanças estruturais mensuráveis |
| **T4** | 180 dias (6 meses) | Longo prazo — retenção real vs. retenção percebida |
| **T5** | 365 dias (1 ano) | Transformação — comparação completa com baseline |

#### Métricas Passivas (coletadas sem teste explícito)
O app já registra tudo que precisamos. Basta agregar ao longo do tempo:
- [ ] **RT médio no PVT** — tendência ao longo das semanas (espera-se ↓ com BET)
- [ ] **Nível máximo no N-Back** — progressão de 2-back → 3-back → 4-back
- [ ] **Retrievability média no FSRS** — a retenção real melhora com otimização?
- [ ] **Accuracy no Stroop** — controle inibitório melhora com treino BET?
- [ ] **Tempo médio de foco por sessão** — aumenta ao longo das semanas?
- [ ] **Streak de dias consecutivos** — hábito de estudo se consolida?
- [ ] **Compliance com NSDR** — % de sessões com pausa adequada
- [ ] **XP acumulado** — proxy geral de engajamento

#### Relatório de Progresso Automático
A cada marco (T1-T5), gerar automaticamente:
- [ ] Comparação visual: gráfico de barras Baseline vs. Atual para cada métrica
- [ ] Texto interpretativo: "Seu tempo de reação melhorou 18% desde o baseline"
- [ ] Score de evolução: nota composta 0-100 baseada em todas as métricas
- [ ] Recomendações: "Seu N-Back estagnou — tente aumentar para 15 min/dia"
- [ ] Exportável como PDF para o aluno e para o admin

#### Implementação Técnica
- [ ] Nova tabela `assessments` (user_id, type, timestamp, metrics JSONB)
- [ ] Endpoint `GET /api/assessment/due` — verifica se o aluno tem avaliação pendente
- [ ] Tela de avaliação: modal amigável "Vamos medir seu progresso! (~3 min)"
- [ ] Dashboard de evolução: gráficos comparando T0 → T_atual
- [ ] Admin: relatório de cohort com média/mediana/desvio de cada métrica por marco
- [ ] Notificação automática quando um marco é atingido (mensagem no app)

#### Por que isso vale ouro
Para investidores: "Em 12 semanas, nossos usuários mostraram redução de 22% no RT do PVT, aumento de 1.5 níveis no N-Back, e retenção FSRS 35% superior ao baseline."
Para públicação: dados longitudinais de N=50+ com métricas objetivas e subjetivas.
Para o aluno: motivação ao ver progresso real, não apenas pontos.

---

### Coach Virtual IA
- [ ] Chatbot integrado com LLM (Claude/GPT) para:
  - Onboarding personalizado ("Explique seu objetivo e eu monto seu plano")
  - Feedback sobre progresso ("Sua retenção caiu 15% -- sugiro NSDR antes da próxima sessão")
  - Explicação de tecnicas ("Me explique como funciona o N-Back")
  - Resposta a dúvidas sobre neurociência
- [ ] Schema de mensagens ja preparado (sender: 'ai')
- [ ] Integração via API (Anthropic SDK ou OpenAI)

### RPE Adaptativo (Erro de Predição de Recompensa)
- [ ] Calibração de dificuldade em tempo real para manter taxa de acerto entre 70-85% (Zona de Desenvolvimento Proximal)
- [ ] Feedback variavel: 4 tipos (minimal, informativo, surprise bonus, omitido) com distribuição 40/30/15/15
- [ ] Omissão estrategica de feedback em 15% dos acertos para gerar RPE negativo transitorio
- [ ] Métricas de "Surprise Index" por item: |R_estimado - R_real|

### Melhorias de UX
- [ ] Focus Tunnel: tela escura com ponto focal pulsante (5s) antes de cada sessão -- priming atencional LC-NE
- [ ] Progressive Declutter: remoção progressiva de elementos de UI conforme usuario entra em flow state
- [ ] Tutorial interativo na primeira visita a cada ferramenta
- [ ] Notificações push (PWA) para revisões pendentes
- [ ] Modo offline melhorado (cache de flashcards para estudo sem internet)

### Dados e Analytics
- [ ] Dashboard admin visual (não apenas API endpoints)
- [ ] Relatorio PDF exportavel por aluno
- [ ] Pesquisa de satisfação a cada 8 semanas (check-in)
- [ ] Métricas de cohort (retenção semanal, engajamento por feature)

## Medio Prazo (3-6 meses)

### FSRS Personalizado + STC-Aware
- [ ] Otimização dos 17-21 parâmetros FSRS por usuario (ML backend com PyTorch)
- [ ] Agendamento STC-aware: revisao calculada dentro da janela de tag sinaptica (1-3h para itens novos)
- [ ] Regra de associatividade tardia: boost de 15% na estabilidade de itens dificeis revisados proximo a itens faceis
- [ ] PRP_virtual global: sinal que modula prioridade de itens "taggeados" em momentos de alta energia plastica
- [ ] A/B testing de intervalos para validação
- [ ] Curva de esquecimento individual (não genérica)

### Micro-Pausas e Gap-Effects
- [ ] Micro-pausa de 10s a cada 2-3 minutos (tela escurece) para forcar replay neural hipocampal (10x velocidade)
- [ ] Micro-pausa de 60s a cada 25 minutos com respiracao guiada (4-7-8)
- [ ] Métricas de compliance com pausas e correlação com retenção

### Conteudo Inteligente
- [ ] Geração automatica de flashcards a partir de texto (IA)
- [ ] Importação de decks Anki (.apkg)
- [ ] Biblioteca compartilhada de decks por curso/matéria
- [ ] OCR de fotos de caderno para flashcards
- [ ] Interleaving automático de topicos (evitar blocos longos de mesmo assunto)

### Stroop Task Completa
- [ ] Stroop task integrada como warm-up cognitivo pre-estudo (3-5 min)
- [ ] Interleaved BET: a cada 25 min de estudo, 2 min de tarefa de inibição
- [ ] Tracking de fadiga: declínio de performance em BET dispara protocolo de pausa

### Social e Comunidade
- [ ] Grupos de estudo (turmas do professor)
- [ ] Desafios semanais entre grupos
- [ ] Compartilhamento de decks entre alunos
- [ ] Feed de atividade da turma (anonimo)

### Motor de Audio Neuro-Acustico
- [ ] Brown noise gerado proceduralmente (Web Audio API / Tone.js) com decaimento 1/f^2
- [ ] Binaural beats adaptativas: Alpha (10 Hz) para consolidacao, Theta (6 Hz) para encoding profundo
- [ ] Adaptacao automatica baseada na atividade (estudo ativo = Alpha, NSDR = Theta)
- [ ] Fade-out automático durante tarefas BET (evitar conflito sensorial)

## Longo Prazo (6-12 meses)

### NSDR (Non-Sleep Deep Rest) Integrado
- [ ] Audio NSDR guiado (10-20 min) com body scan e respiracao dirigida
- [ ] Session Bookending: NSDR de 5 min antes da primeira sessão, 10 min apos a ultima
- [ ] Hard Stop progressivo: tela escurece a partir de 80 min, bloqueio total em 90 min
- [ ] Desbloqueio condicional: minimo 10 min em frequencia relaxada para desbloquear próxima sessão
- [ ] Métricas de delta performance pre-NSDR vs pos-NSDR

### Validacao Clinica
- [ ] Estudo piloto N=50 (estudantes de medicina)
- [ ] Métricas: retenção 30 dias, cortisol salivar, EEG (se disponivel)
- [ ] Publicação em journal de educação/neurociência
- [ ] Parceria com universidades

### Plataforma para Professores
- [ ] Dashboard de turma com métricas por aluno
- [ ] Criação e atribuição de decks por professor
- [ ] Provas com flashcards + analytics de desempenho
- [ ] Integração com LMS (Moodle, Canvas)

### Expansão de Mercado
- [ ] App mobile nativo (React Native / Flutter)
- [ ] Versão em inglês e espanhol
- [ ] Plano institucional (universidades, cursinhos)
- [ ] API pública para integração com outros apps
- [ ] Marketplace de decks (criadores de conteúdo)

### Wearable Integration
- [ ] Apple Watch / Fitbit / Oura Ring para HRV monitoring
- [ ] Correlação HRV com performance cognitiva
- [ ] Alertas de fadiga baseados em dados fisiológicos reais
- [ ] Confirmação biométrica de NSDR: subida em VFC + redução de RHR acelera desbloqueio

### Dashboard de Neuro-Performance Avancado
- [ ] Retencao Real (%): cards corretos / cards apresentados (rolling 7 dias)
- [ ] RPE Score: media de |R_previsto - R_real| por sessão
- [ ] Fadiga Cognitiva Index: declínio % do RT baseline ao longo da sessão
- [ ] Eficiencia de Consolidacao: retenção em 24h / retenção imediata
- [ ] Flow State Duration: tempo continuo com RT < baseline * 1.1 e acurácia > 75%
- [ ] Recovery Compliance: % de sessoes com NSDR completado

## Princípio Guia
> "Cada feature deve mapear para uma via neuroquimica. Se não modula dopamina, noradrenalina, acetilcolina ou adenosina, não pertence ao NeuroForge."
