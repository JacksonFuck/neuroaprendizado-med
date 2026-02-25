# Guia Definitivo de Prompts para o NotebookLM (Studio de Criação)

## Visão geral do NotebookLM e do Studio

NotebookLM é uma ferramenta de pesquisa e anotações da Google focada em "IA ancorada em fontes" (grounded AI), ou seja, as respostas são sempre baseadas nos documentos e links que você carregou na aba de fontes. A interface se organiza em três painéis: fontes, chat e Studio, onde o Studio gera artefatos como áudio, vídeos/roteiros, relatórios, mapas mentais e outros, todos derivados das mesmas fontes ancoradas.[^1][^2][^3]

O Studio permite criar múltiplos artefatos por caderno (notebook), como Audio Overviews, vídeos, apresentações, relatórios e mindmaps, que podem ser regenerados ou ajustados a partir de prompts personalizados. A Google destaca que é possível visualizar o "prompt personalizado" usado em cada artefato, o que transforma NotebookLM em um laboratório prático de engenharia de prompt sobre documentos reais.[^4][^1]

## Por que prompt engineering em NotebookLM é diferente

Ao contrário de um LLM genérico, NotebookLM é restrito por design a usar apenas as fontes presentes no caderno, exibindo citações clicáveis que levam aos trechos exatos do material. Isso significa que técnicas de grounding, controle de estilo e verificação de citações funcionam de forma mais previsível, pois o modelo não “alucina” para fora do conjunto de documentos.[^5][^6]

A aba Studio introduz tipos de artefatos (podcasts de áudio, roteiros, relatórios, mapas mentais) com prompts internos pré-configurados, que podem ser sobrescritos por prompts customizados antes de gerar o conteúdo. Na prática, isso cria um fluxo de trabalho em dois níveis: primeiro, selecionar/curar fontes e, depois, usar prompts especializados para cada tipo de saída (áudio, vídeo, slides, relatórios, infográficos, PKM avançado).[^1][^4]

## Taxonomia geral de prompts por tipo de saída

A tabela abaixo resume os principais tipos de saída no Studio e o foco de otimização de prompts para cada um.

| Tipo de saída | Finalidade principal | Foco de otimização de prompt |
|---------------|----------------------|------------------------------|
| Audio Overview / Podcasts | Conversas em áudio entre anfitriões de IA sobre suas fontes | Tom, persona, profundidade técnica, idioma, formato (breve, deep dive, debate, crítica), seleção de fontes |
| Vídeo e roteiros | Vídeo explicativo ou aula em vídeo com base nas fontes | Estrutura de tópicos, resumo executivo inicial, seções, gancho, chamadas para ação, nível técnico |
| Apresentações (slides) | Roteiro de slides e narrativa de apresentação | Estrutura visual (seções, número de slides), bullets, exemplos, notas do apresentador |
| Infográficos | Extração de dados e hierarquias para visualização | Listas de estatísticas, comparações, hierarquias de conceitos, sugestões de layout |
| Relatórios (acadêmicos/técnicos/corporativos) | Sínteses longas e estruturadas com alta fidelidade às fontes | Estrutura formal (IMRAD, relatórios executivos, white papers), citações, discussão crítica, limitações |
| PKM / workflows de estudo | Gestão de conhecimento pessoal, estudo, revisão | Organização em módulos, mapas mentais, flashcards, perguntas-guia, revisão espaçada |

NotebookLM oferece tipos de áudio específicos — breve, deep dive, debate e crítica — permitindo que o prompt escolha o estilo de conversa e o nível de análise para estudo, ensino ou produtividade. Para PKM, comunidades de produtividade destacam o uso de NotebookLM como “camada de conhecimento” por cima de notas e PDFs, ideal para tese, revisões de literatura e análise profunda de documentos.[^7][^5][^4]

## Princípios avançados de grounding e controle de estilo

Grounding em NotebookLM significa sempre referenciar explicitamente quais fontes o modelo deve usar, pois ele permite selecionar fontes específicas na barra lateral ou via instruções no prompt. Promptar o modelo para citar a fonte e, preferencialmente, o trecho ou seção, reforça o comportamento de ancoragem e facilita auditoria acadêmica.[^8][^1]

Para controle de estilo, a documentação e guias avançados recomendam indicar: público-alvo, nível de conhecimento, tom (formal, didático, coloquial), idioma e formato de saída (podcast de 15 minutos, relatório de 5 páginas, vídeo de 10 minutos, etc.). Esses parâmetros são particularmente importantes em Audio Overviews e roteiros, pois influenciam densidade de informação, profundidade técnica e ritmo narrativo.[^9][^10][^3]

## Técnicas de Chain-of-Thought e Few-Shot adaptadas ao NotebookLM

Em vez de depender somente de "pensar passo a passo" em uma única resposta longa, usuários avançados exploram NotebookLM como um ambiente de múltiplos artefatos encadeados, por exemplo, pedindo primeiro um mindmap, depois um relatório, e finalmente um áudio que discute os trade-offs identificados. Isso funciona como uma Chain-of-Thought distribuída: cada artefato representa uma etapa do raciocínio apoiada em citações e trechos específicos das fontes.[^3][^4]

Few-shot prompting em NotebookLM é mais eficaz quando o usuário cola exemplos de trechos bem formatados (por exemplo, um parágrafo de relatório perfeito ou um slide modelar) no prompt customizado do Studio, pedindo que o modelo imite aquele estilo aplicado ao restante do material. Como o sistema exibe o prompt usado em cada artefato, é possível iterar: gerar, inspecionar, ajustar o prompt de estilo com mais exemplos e regerar, refinando a performance.[^2][^3]

## Detecção de conflitos e síntese de visões opostas

NotebookLM aceita múltiplas fontes num mesmo caderno, o que permite carregar artigos ou relatórios com conclusões divergentes sobre o mesmo tema. Fóruns e tutoriais recomendam pedir explicitamente que o modelo identifique contradições, lacunas e pressupostos diferentes entre as fontes, e, em seguida, gerar um áudio em formato de debate ou um relatório comparativo.[^6][^5]

A funcionalidade de Audio Overview com estilo “debate” ou “crítica” é especialmente adequada para encenar discussões entre duas ou mais perspectivas, ajudando em debates acadêmicos ou revisão de literatura. Ao integrar prompts que exigem explicitação de evidências de cada lado, o usuário transforma o podcast em um seminário orientado, com intervenção ativa para checar se o argumento está de fato ancorado em passagens dos textos.[^4]

## Qualidade das fontes e curadoria para PKM e estudo

Guias de PKM e artigos de produtividade enfatizam que NotebookLM funciona melhor como camada de raciocínio sobre uma base de notas bem curada (por exemplo, notas atômicas em Google Keep ou PDFs selecionados) em vez de repositório caótico de tudo. Fluxos recomendados incluem usar outra ferramenta (Keep, Obsidian, Notion) para captura bruta e organização, exportar para Google Docs/PDF e conectar esse material a notebooks focados dentro do NotebookLM.[^11][^5][^6]

Um guia avançado de NotebookLM recomenda organizar notebooks por projeto ou curso, nomeando cadernos e fontes de forma consistente, usando tags de módulo ou tema, e reservando um notebook “hub” de metaconhecimento com mapas mentais gerais e resumos executivos. Essa curadoria aumenta a qualidade das saídas do Studio, porque o modelo trabalha sobre um corpus tematicamente coerente, o que reduz dispersão e aumenta a profundidade das respostas.[^6][^3]

***

## 1. Prompts otimizados para Audio Overviews / Podcasts

### 1.1. Fundamentos específicos de áudio no NotebookLM

Audio Overviews são diálogos em formato de podcast entre dois anfitriões de IA que explicam e discutem as fontes do caderno, com opções de customização de foco, tópicos, público-alvo e, em planos pagos, duração. Atualizações recentes adicionaram quatro estilos principais de áudio: breve, deep dive, debate e crítica, cada um com objetivos pedagógicos distintos.[^10][^8][^4]

Tutoriais especializados mostram que, antes de gerar o áudio, é possível clicar em "Customize" ou usar o campo de instruções para especificar tom, idioma, tópicos prioritários, nível de detalhe e o tipo de estilo desejado. Isso permite transformar o áudio padrão em algo muito mais direcionado, por exemplo, um episódio para leigos em português ou uma discussão técnica para pós-graduação.[^12][^9][^10]

### 1.2. Técnicas de grounding e controle de estilo para áudio

Boas práticas para grounding em áudio incluem: restringir a conjuntos específicos de fontes (selecionando-as na barra lateral ou citando-as nominalmente) e pedir citações verbais ou referências claras ao título do documento quando novas ideias forem apresentadas. Isso é especialmente útil em revisões de literatura, onde o ouvinte precisa saber de qual artigo vem cada afirmação.[^8][^5]

Para controle de estilo, especialistas recomendam explicitar: personas dos anfitriões, relação com o ouvinte (ex.: professor–aluno, par acadêmico, mentor), idioma, variação regional, e densidade de jargão técnico. Além disso, é possível indicar o uso de exemplos práticos, metáforas, analogias e resumos parciais ao fim de cada bloco de discussão, o que melhora retenção em estudo de alto nível.[^9][^10][^4]

### 1.3. Exemplos de prompts prontos – Áudio

**1.3.1. Estudo acadêmico de alto nível (pós-graduação)**

> Você é um comitê de qualificação de mestrado discutindo apenas as fontes selecionadas neste caderno. Gere um Audio Overview no estilo **Deep Dive** em português do Brasil, com duração aproximada de 40 minutos, dividido em 4 blocos de 10 minutos. Em cada bloco:
> 
> - Um anfitrião atua como pesquisador sênior, o outro como doutorando crítico.
> - Foque apenas nos artigos [NOME OU TAG DOS ARTIGOS-CHAVE], ignorando fontes de baixa relevância.
> - Comece com um resumo executivo da contribuição principal de cada artigo.
> - Em seguida, discuta métodos, resultados e limitações, citando explicitamente o título do artigo e, quando possível, a seção ou página correspondente.
> - Termine cada bloco com 3–5 perguntas de pesquisa em aberto que emergem dos resultados.
> - Mantenha tom formal, vocabulário técnico e explicite sempre quando houver divergências entre as fontes.

**Por que funciona:** o prompt ancorado em fontes específicas, com papéis claros e estrutura em blocos, obriga o modelo a organizar o áudio como uma banca acadêmica, enfatizando métodos, limitações e perguntas futuras.

**1.3.2. Análise de documentos técnicos para profissionais de produto ou engenharia**

> Gere um Audio Overview em formato de **debate** em português do Brasil, com 20–25 minutos de duração, sobre as especificações técnicas presentes nas fontes selecionadas. Configure dois anfitriões:
> 
> - "Engenheiro Cético": questiona riscos, trade-offs, escalabilidade, segurança e custos.
> - "Arquiteto Defensor": argumenta a favor das soluções propostas nas fontes.
> 
> Estruture a conversa em:
> 1. Contexto geral do sistema (5 min).
> 2. Arquitetura e principais componentes (10 min).
> 3. Riscos, limitações e possíveis melhorias (10 min).
> 
> Em cada crítica ou defesa, cite explicitamente qual documento embasa o argumento, mencionando o título ou o autor. Evite explicações superficiais: peça para que os anfitriões expliquem como cada decisão técnica afeta desempenho, custo e manutenção a longo prazo.

**Por que funciona:** o uso de personas opostas força o modelo a explorar tensões e contradições nos documentos, útil para revisão técnica e tomada de decisão.

**1.3.3. PKM: podcast de revisão de notas pessoais**

> Use apenas as fontes deste caderno marcadas como notas de revisão pessoal. Gere um Audio Overview **breve** em português do Brasil, de até 15 minutos, explicando os principais conceitos que preciso revisar hoje. Configure os dois anfitriões como:
> 
> - "Professor": explica de forma didática, com exemplos do dia a dia.
> - "Aluno": faz perguntas ingênuas, pedindo esclarecimentos.
> 
> Requisitos:
> - Comece com um resumo de 2 minutos listando os 3–5 tópicos prioritários de revisão.
> - Para cada tópico, explique definição, exemplo concreto e erro comum.
> - Termine propondo 5 questões de autoavaliação que posso responder depois de ouvir o episódio.
> - Use linguagem simples, sem jargões desnecessários, mantendo sempre o áudio ancorado nas minhas notas e PDFs.

**Por que funciona:** esse formato converte o caderno em um recurso de revisão auditiva leve e recorrente, reforçando memória através de explicações simples e perguntas.

***

## 2. Prompts para Vídeo e Roteiros (Studio de Criação)

### 2.1. Estrutura mínima de roteiros no Studio

O Studio de NotebookLM permite gerar vídeos e roteiros baseados nos mesmos materiais usados pelos áudios, com foco em estruturação de tópicos, transições e, em alguns casos, sugestões visuais. Usuários avançados combinam um áudio profundo com um vídeo sintético, reaproveitando o mesmo conjunto de fontes mas com prompts diferentes para resumir ou reorganizar o conteúdo.[^3][^1][^4]

Guias e tutoriais recomendam sempre pedir: resumo executivo inicial, seções claramente marcadas, tempo estimado por seção e indicação de recursos visuais (gráficos, esquemas, capturas de tela) para facilitar a produção do vídeo em um editor externo.[^13][^3]

### 2.2. Técnicas de engenharia de prompt para roteiros

Para vídeos educacionais, pesquisas em ensino indicam que uma boa prática é combinar um resumo executivo curto com aprofundamentos progressivos por seções, o que se alinha com o uso de introduções de alto nível seguidas de explicações mais detalhadas. Em NotebookLM, isso pode ser imposto via prompt pedindo explicitamente um bloco de "Overview" antes de qualquer detalhe, além de seções de exemplos, analogias e recapitulações.[^14][^3]

Few-shot prompting é particularmente útil aqui: colar um trecho de roteiro bem formatado (com marcações de cena, narração, indicações visuais) e instruir NotebookLM a "imitar o estilo" aplicado ao novo conteúdo do caderno. Como o roteiro é textual, é simples refinar o estilo, nivelando o grau de formalidade e o ritmo das falas.[^2]

### 2.3. Exemplos de prompts prontos – Vídeo e roteiros

**2.3.1. Aula em vídeo para disciplina universitária (análise de documentos técnicos)**

> Gere um roteiro completo de vídeo-aula em português do Brasil, baseado apenas nas fontes selecionadas. Estruture o roteiro com as seguintes seções, indicando tempo estimado em minutos para cada uma:
> 
> 1. **Resumo executivo (2–3 min)** – apresente o problema central, as principais soluções discutidas nas fontes e o porquê o tema é relevante.
> 2. **Fundamentos teóricos (5–7 min)** – explique conceitos-chave, com foco em definição, contexto histórico e terminologia; cite explicitamente quais documentos suportam cada conceito.
> 3. **Análise detalhada dos documentos técnicos (10–15 min)** – descreva a arquitetura, algoritmos, metodologias ou protocolos apresentados nas fontes, destacando diferenças entre eles.
> 4. **Comparação crítica e limitações (5–7 min)** – aponte convergências, divergências, lacunas e riscos.
> 5. **Aplicações práticas e casos de uso (5 min)** – ilustre com exemplos de aplicação presentes nos documentos ou inferidos a partir deles.
> 6. **Recapitulação e próximos passos (3–5 min)** – resuma as ideias centrais e proponha leituras ou exercícios adicionais.
> 
> Para cada seção, forneça:
> - Texto de narração em 1ª ou 3ª pessoa.
> - Sugestão de elementos visuais (títulos em tela, bullets, gráficos, esquemas).
> - Indicação de pausas estratégicas para o professor inserir perguntas ao público.

**Por que funciona:** integra resumo executivo, análise crítica e estruturação didática, aproveitando o grounding para citar fontes diretamente no roteiro.

**2.3.2. Vídeo curto de divulgação científica**

> Com base nestas fontes, escreva um roteiro para um vídeo curto (até 3 minutos) em português do Brasil, voltado para o público leigo. Estrutura obrigatória:
> 
> - **Hook inicial (15–20 segundos)**: comece com uma pergunta intrigante ou dado surpreendente extraído das fontes.
> - **Resumo executivo (30–40 segundos)**: explique, em linguagem simples, o que o artigo ou relatório descobriu.
> - **Corpo (1–2 minutos)**: destaque 2–3 ideias principais, com exemplos concretos.
> - **Fecho (15–20 segundos)**: recapitule o principal insight e convide o público a refletir ou agir.
> 
> Use frases curtas, evite jargão e, quando necessário, explique termos técnicos com analogias. Indique, entre colchetes, sugestões rápidas de visual (por exemplo: [mostrar gráfico de barras comparando X e Y]).

**Por que funciona:** adapta a mesma base de fontes acadêmicas para divulgação, mantendo fidelidade mas com linguagem acessível e estrutura de vídeo curto.

***

## 3. Prompts para Apresentações (roteiros de slides)

### 3.1. Estruturas visuais e fluxo narrativo

Embora NotebookLM não produza arquivos de slides prontos, ele é eficaz em gerar roteiros de slides e sugestões de estrutura visual a partir das fontes carregadas. Usuários frequentemente geram um roteiro detalhado no Studio e depois o transplantam para PowerPoint, Google Slides ou ferramentas de design.[^2][^3]

Boas práticas incluem pedir: número aproximado de slides, divisão em seções (introdução, métodos, resultados, discussão, conclusão), bullets por slide, notas do apresentador e sugestões de gráficos ou diagramas que representem dados dos documentos.[^14][^3]

### 3.2. Exemplos de prompts prontos – Apresentações

**3.2.1. Apresentação acadêmica de artigo ou capítulo de tese**

> Com base apenas nas fontes selecionadas, gere um roteiro detalhado para uma apresentação de 20 minutos em português do Brasil, no formato de defesa acadêmica. Estruture em aproximadamente 15–20 slides, com as seguintes seções:
> 
> 1. Título, autor, contexto (1 slide).
> 2. Motivação e problema de pesquisa (2–3 slides).
> 3. Revisão de literatura essencial (3–4 slides), citando explicitamente quais autores e trabalhos são mencionados em cada bullet.
> 4. Metodologia (3–4 slides).
> 5. Resultados principais (3–4 slides) com indicação de quais tabelas, figuras ou dados devem ser convertidos em gráficos.
> 6. Discussão, limitações e trabalhos futuros (2–3 slides).
> 7. Conclusão e implicações práticas (1–2 slides).
> 
> Para cada slide, forneça:
> - Título do slide.
> - 3–5 bullets enxutos.
> - Notas do apresentador com explicações mais detalhadas.
> - Indicação de qual fonte embasa o conteúdo.

**Por que funciona:** transforma diretamente a estrutura IMRAD em roteiro de slides, com grounding explícito por slide.

**3.2.2. Apresentação executiva para diretoria (documentos corporativos)**

> Gere um roteiro de apresentação em português do Brasil, em até 12 slides, destilando as principais conclusões e recomendações dos relatórios corporativos presentes nas fontes selecionadas. Requisitos:
> 
> - Slide 1: título e objetivo da apresentação.
> - Slides 2–3: resumo executivo – 3–5 bullets com insights principais, sempre ancorados em números ou evidências das fontes.
> - Slides 4–7: análise detalhada (situação atual, oportunidades, riscos), com indicadores-chave.
> - Slides 8–10: recomendações estratégicas e plano de ação resumido.
> - Slides 11–12: riscos, limitações e próximos passos.
> 
> Especifique, em cada slide, quais métricas, gráficos ou tabelas devem ser exibidos, mencionando o documento de origem. Mantenha linguagem concisa, orientada a decisão, evitando jargões técnicos desnecessários.

**Por que funciona:** reflete expectativas de relatórios executivos, com forte foco em decisão e visualização, ao mesmo tempo em que continua ancorado em fontes.

***

## 4. Prompts para Infográficos

### 4.1. Extração de dados, hierarquias e conceitos visuais

NotebookLM não gera imagens diretamente, mas pode produzir esboços textuais detalhados para infográficos, incluindo listas de métricas, comparações e hierarquias conceituais. Esse tipo de saída é especialmente útil para transformar revisões de literatura ou relatórios longos em painéis visuais de estudo ou comunicação.[^3][^2]

Ao projetar prompts para infográficos, o objetivo é extrair:
- Métricas e estatísticas relevantes (valores, intervalos, tendências).
- Comparações entre categorias, grupos ou períodos.
- Hierarquias (conceito geral → subconceitos → exemplos).
- Sugestões de layouts (linha do tempo, pirâmide, matriz 2x2, fluxograma etc.).

### 4.2. Exemplos de prompts prontos – Infográficos

**4.2.1. Infográfico para revisão de literatura técnica**

> A partir das fontes selecionadas, extraia um esboço completo para um infográfico de revisão de literatura em português do Brasil. O infográfico deve conter:
> 
> - Um título principal e subtítulo.
> - Uma linha do tempo dos principais trabalhos citados (ano, autor, contribuição resumida).
> - Uma seção de "principais abordagens/metodologias" com 3–5 categorias, listando para cada uma: autores representativos, vantagens, limitações.
> - Uma seção de "métricas e resultados" com os números-chave relevantes (por exemplo, acurácia, tempos de resposta, custos), sempre mencionando a fonte.
> - Uma seção "lacunas e oportunidades de pesquisa" com 3–5 bullets.
> 
> Entregue o resultado em formato estruturado (tabela + bullets) para que eu possa repassar para uma ferramenta de design (Figma, Canva etc.). Não invente dados: use apenas valores numéricos presentes nas fontes.

**Por que funciona:** força o modelo a organizar o conteúdo em componentes visuais bem definidos, facilitando a transposição para um layout gráfico.

**4.2.2. Infográfico de processo para documentos corporativos ou técnicos**

> Com base nestes documentos, gere um esboço textual de infográfico de processo, em português do Brasil, que explique o fluxo principal descrito nas fontes (por exemplo, pipeline de dados, ciclo de desenvolvimento ou jornada do cliente). Inclua:
> 
> - Título e descrição geral do processo.
> - 5–9 etapas numeradas, cada uma com: nome da etapa, descrição curta, entrada, saída, atores envolvidos.
> - Destaque, com ícones sugeridos (por exemplo, [ícone de alerta]), pontos de risco ou gargalos.
> - Uma seção final com 3–5 indicadores de desempenho que poderiam ser monitorados, ancorados nas métricas mencionadas nos documentos.
> 
> Estruture em formato de listas e tabelas para facilitar implementação gráfica posterior.

**Por que funciona:** traduz processos complexos em etapas visualmente representáveis, mantendo alinhamento com as descrições técnicas originais.

***

## 5. Prompts para Relatórios Técnicos, Acadêmicos e Corporativos

### 5.1. Estruturas formais e fidelidade às fontes

NotebookLM é particularmente forte na criação de relatórios longos com base em muitos PDFs, artigos e notas, pois foi desenhado como assistente de pesquisa com citações automáticas. Estudos de caso com uso em cursos universitários mostram workflows em que os alunos carregam módulos inteiros de aula, geram guias de estudo, FAQs e briefings, e depois usam essas saídas como base para redação em outros editores.[^5][^14][^6][^3]

Em contextos acadêmicos, recomenda-se estruturar relatórios no padrão IMRAD (Introdução, Métodos, Resultados e Discussão) ou com seções de revisão de literatura, metodologia, análise e conclusão, sempre pedindo citações explícitas com referência às fontes carregadas. Em contextos corporativos, a estrutura costuma enfatizar resumo executivo, cenário atual, análise, recomendações e riscos.[^5][^3]

### 5.2. Técnicas de grounding forte e auditoria

Para garantir alta fidelidade às fontes, prompts eficazes incluem instruções como: "não invente fatos que não estejam nas fontes", "cite o documento e, se possível, o trecho exato", e "marque claramente quando alguma afirmação é inferência ou especulação". Também é útil pedir seções específicas de limitações das fontes e lacunas de evidência.[^5][^3]

Relatórios podem ser usados como base para escrita posterior em um processador de texto externo, mas a principal vantagem de NotebookLM é a rastreabilidade: cada afirmação pode ser clicada para voltar ao parágrafo original do PDF ou da nota.[^6][^5]

### 5.3. Exemplos de prompts prontos – Relatórios

**5.3.1. Relatório acadêmico de revisão sistemática de literatura**

> Gere um relatório acadêmico em português do Brasil, no formato de revisão de literatura, com base exclusivamente nas fontes selecionadas. Estruture o texto com as seções:
> 
> 1. Introdução (contexto, problema de pesquisa, objetivos).
> 2. Metodologia de seleção das fontes (mesmo que simplificada, descrevendo o corpus carregado).
> 3. Revisão de literatura organizada por temas ou abordagens.
> 4. Síntese crítica, destacando convergências, divergências e lacunas.
> 5. Implicações teóricas e práticas.
> 6. Limitações e agenda de pesquisa futura.
> 
> Requisitos:
> - Use linguagem acadêmica formal.
> - Sempre que possível, faça referência explícita aos autores e anos dos trabalhos.
> - Indique quando estiver inferindo além das afirmações explícitas dos textos.
> - Inclua uma breve seção final de "principais insights" em formato de bullets para orientar a escrita de um artigo.

**Por que funciona:** espelha o formato de revisão acadêmica e explora a capacidade de NotebookLM de organizar grandes corpora em temas com citações.

**5.3.2. Relatório técnico para equipe de engenharia**

> Com base nesses documentos técnicos, gere um relatório estruturado em português do Brasil para uma equipe de engenharia de software. Estruture em:
> 
> - Resumo executivo (1–2 páginas) com os principais achados e decisões recomendadas.
> - Visão geral da arquitetura atual/proposta.
> - Análise detalhada de componentes (por exemplo, serviços, bancos de dados, pipelines de dados).
> - Avaliação de desempenho, segurança e escalabilidade, usando os dados numéricos presentes nas fontes.
> - Riscos, trade-offs e alternativas consideradas.
> - Plano de próximos passos (curto, médio e longo prazo).
> 
> Exija que o modelo indique, entre parênteses, a qual documento pertence cada trecho técnico mais importante, para facilitar auditoria posterior.

**Por que funciona:** aproxima o relatório do formato de RFC ou documentação arquitetural, com foco em decisões e trade-offs ancorados em fontes técnicas.

**5.3.3. Relatório corporativo de análise de mercado**

> Gere um relatório corporativo em português do Brasil, com base nos relatórios de mercado presentes nas fontes. Estrutura sugerida:
> 
> - Resumo executivo com 5–7 bullets.
> - Visão geral do mercado (tamanho, crescimento, segmentos principais).
> - Análise competitiva (principais players, diferenciais, barreiras de entrada).
> - Tendências e cenários futuros.
> - Oportunidades e riscos para nossa organização.
> - Recomendações estratégicas.
> 
> Use apenas números e projeções presentes nas fontes, citando claramente de qual relatório vêm. Não extrapole além do que os dados permitem.

**Por que funciona:** estabelece fronteiras claras para evitar extrapolações não ancoradas, crucial em contextos corporativos.

***

## 6. Prompts para PKM, estudo acadêmico e fluxos de trabalho

### 6.1. NotebookLM como camada de conhecimento em PKM

Usuários em comunidades de PKM descrevem NotebookLM como uma "camada de conhecimento" por cima de notas existentes, em vez de um sistema completo de PKM com backlinks e estrutura rígida. Ele é visto como ideal para análise profunda de documentos, teses, revisões de literatura e explorações de temas específicos.[^11][^7]

Workflows comuns incluem capturar notas em ferramentas leves (Google Keep, Obsidian, Notion), agrupar por tema ou projeto, exportar para Docs/PDF e conectar cada conjunto a um notebook dedicado no NotebookLM. Dentro desse notebook, os usuários geram guias de estudo, quizzes, podcasts, mindmaps e relatórios como artefatos auxiliares de aprendizagem.[^11][^5]

### 6.2. Técnicas de Chain-of-Thought em múltiplos artefatos

Um padrão avançado é usar o Studio para criar uma cadeia de artefatos que representam diferentes estágios do raciocínio: por exemplo, começar com um Audio Overview breve para ter visão geral, depois um mapa mental para ver a estrutura, em seguida um relatório crítico e, por fim, um áudio em formato de debate focalizado nos pontos de maior controvérsia.[^4][^3]

Essa abordagem se assemelha à Chain-of-Thought porque cada artefato explicita uma camada de processamento: do entendimento superficial à análise crítica e síntese. Além disso, os prompts podem instruir o modelo a reutilizar o que foi produzido em outro artefato (colando o texto ou referenciando os tópicos) para criar uma "trilha" de raciocínio auditável.[^3]

### 6.3. Exemplos de prompts prontos – PKM e estudo

**6.3.1. Guia de estudo modular para disciplina universitária**

> Considere que este caderno contém todos os materiais de uma disciplina (aulas em PDF, artigos, slides, notas). Gere um guia de estudo em português do Brasil organizado por módulos (M1, M2, M3...), com as seguintes seções para cada módulo:
> 
> - Resumo executivo do módulo em 2–3 parágrafos.
> - Lista de conceitos-chave com definições curtas.
> - 5–10 perguntas para autoavaliação.
> - 3–5 exercícios práticos ou estudos de caso propostos.
> - Referências internas (indicar quais fontes são mais importantes para cada conceito).
> 
> No fim do guia, inclua uma seção geral de "estratégia de revisão" com sugestões de como combinar os recursos do NotebookLM (audio overviews, mindmaps, quizzes) para revisar o conteúdo ao longo do semestre.

**6.3.2. Workflow PKM de segunda mente para tema de pesquisa**

> A partir das minhas notas e PDFs sobre [TEMA], desenhe um workflow de PKM em português do Brasil usando NotebookLM como camada de conhecimento. Descreva:
> 
> - Como organizar os cadernos por subtemas ou projetos.
> - Que tipos de artefatos do Studio devo gerar em cada fase (por exemplo: visão geral, aprofundamento, síntese crítica, preparação de escrita).
> - Como usar Audio Overviews, relatórios e mapas mentais de forma complementar.
> - Estratégias para revisão recorrente (por exemplo, gerar podcasts semanais de revisão, atualizar mapas mentais a cada novo artigo).
> 
> Apresente o workflow em formato de passos numerados (1–10) com explicações curtas e sugestões de prompts concretos que posso reutilizar.

**6.3.3. Preparação para prova ou qualificação**

> Considerando todas as fontes deste caderno, gere um plano de preparação para prova de qualificação em português do Brasil. Inclua:
> 
> - Lista de temas que provavelmente serão cobrados, com base na recorrência nas fontes.
> - Prioridade de estudo (alta, média, baixa) para cada tema.
> - Sugestões de artefatos a gerar no Studio (por exemplo: debate em áudio sobre teorias conflitantes, relatórios críticos de artigos-chave, mapas mentais).
> - Exemplos de perguntas que uma banca poderia fazer e respostas modelo ancoradas nas fontes.
> 
> Mantenha o plano extremamente prático, organizado em uma tabela ou lista, e priorize o uso de áudio e relatórios como ferramentas principais de revisão.

***

## 7. Prompts para conflitos de informação, lacunas e debates acadêmicos

### 7.1. Destacar contradições entre documentos

Redes de usuários observam que NotebookLM é bastante eficaz para comparar documentos e identificar inconsistências, desde que os prompts peçam explicitamente por contradições, supostos conflitos e lacunas de evidência. Isso é particularmente útil em revisões de literatura onde diferentes artigos apresentam resultados divergentes.[^7][^5]

Uma estratégia é instruir o modelo a produzir tabelas comparativas entre fontes, explicitando hipótese, método, amostra, resultados e conclusões, e depois gerar um áudio de debate com base nessa tabela. Esse fluxo aumenta a transparência, pois tanto o texto quanto o áudio precisam se referir a evidências específicas.[^4][^3]

### 7.2. Exemplos de prompts prontos – Conflitos e debates

**7.2.1. Tabela de conflitos entre artigos**

> Com base nos artigos e relatórios deste caderno que tratam de [TEMA], identifique todos os pontos em que há conclusões divergentes ou conflitantes. Gere uma tabela com as colunas:
> 
> - Referência (autor, ano, título resumido).
> - Hipótese ou pergunta de pesquisa.
> - Metodologia principal.
> - Principais resultados.
> - Conclusão.
> - Tipo de conflito (diferença de método, amostra, interpretação, dados inconclusivos).
> 
> Depois da tabela, escreva uma síntese em 3–5 parágrafos explicando as possíveis razões para essas divergências e quais experimentos ou estudos adicionais seriam necessários para resolver os conflitos.

**7.2.2. Debate acadêmico em formato de áudio**

> Usando os mesmos artigos onde foram identificadas divergências sobre [TEMA], gere um Audio Overview em inglês ou português (especifique aqui) no estilo **debate acadêmico**. Configure dois anfitriões:
> 
> - Defensor da "Visão A" (explique qual visão é com base nas fontes).
> - Defensor da "Visão B" (idem).
> 
> Requisitos:
> - Estruturar em: (1) contextualização do debate, (2) argumentos principais de cada lado, (3) discussão de evidências frágeis ou inconclusivas, (4) propostas de estudos futuros.
> - Em cada argumento, mencionar explicitamente qual artigo ou relatório está sendo citado.
> - Terminar com uma síntese neutra apontando o que já é relativamente consensual e o que ainda é aberto.

**7.2.3. Identificação de lacunas de informação**

> Com base em todas as fontes deste caderno, identifique lacunas de informação relevantes para futuras pesquisas sobre [TEMA]. Em português do Brasil, gere um relatório curto com:
> 
> - Lista de questões importantes que NÃO podem ser respondidas de forma satisfatória usando apenas as fontes atuais.
> - Para cada questão, indique rapidamente quais documentos chegam perto de responder, mas falham (por exemplo, por falta de dados, amostra pequena, metodologia limitada).
> - Sugestões de que tipo de dados, métodos ou estudos adicionais seriam necessários.
> 
> Deixe claro quando estiver extrapolando além do que os textos dizem explicitamente.

***

## 8. Técnicas de Few-Shot, personas e controle fino de estilo

### 8.1. Uso de exemplos (Few-Shot) no Studio

Boas práticas de prompt engineering em LLMs indicam que fornecer exemplos de entrada–saída desejados (Few-Shot) melhora consistência e estilo, e usuários de NotebookLM aplicam isso colando trechos-modelo diretamente no campo de prompt do Studio. Isso é especialmente útil para roteiros de vídeo, relatórios e guias de estudo.[^15][^16][^2]

Como NotebookLM exibe o "View custom prompt" de cada artefato, é possível criar uma biblioteca de prompts modelo reutilizáveis, copiando e adaptando entre notebooks e projetos. Isso se aproxima de um sistema de templates de workflow acadêmico ou profissional.[^1][^2]

### 8.2. Personas para áudio, vídeo e relatórios

Definir personas claras (pesquisador sênior, aluno iniciante, gerente de produto, engenheiro cético, paciente, etc.) ajuda o modelo a ajustar vocabulário, tom e foco da explicação. Em podcasts, é comum definir pares de personas complementares (professor–aluno, defensor–crítico) para criar dinâmica de diálogo; em relatórios, a persona define o nível de formalidade e profundidade.[^14][^4][^3]

### 8.3. Exemplos de prompts prontos – Few-Shot e estilo

**8.3.1. Copiar estilo de um trecho de relatório**

> Aqui está um exemplo do estilo de relatório que desejo (extraído de outro documento):
> 
> "[COLE AQUI 2–3 PARÁGRAFOS DE EXEMPLO DE ESTILO, SEM DADOS SENSÍVEIS]"
> 
> Com base nesse exemplo de estilo (tom, estrutura de parágrafos, forma de citar autores) e nas fontes deste caderno, gere um novo relatório em português do Brasil sobre [TEMA], mantendo o estilo o mais próximo possível, mas usando apenas informações ancoradas nas minhas fontes.

**8.3.2. Ajustar tom entre técnico e leigo**

> Usando estas mesmas fontes, gere duas versões de resumo em português do Brasil:
> 
> - Versão A: para público leigo, sem jargão, com analogias e exemplos cotidianos.
> - Versão B: para especialistas, com vocabulário técnico, menção a autores, métodos e métricas específicas.
> 
> Mantenha a fidelidade às fontes em ambas as versões, mas adapte o nível de detalhe e o estilo de escrita.

**8.3.3. Personas múltiplas em relatório ou guia**

> Com base nestas fontes, produza um guia em português do Brasil dividido em duas partes:
> 
> - Parte 1: explicação voltada para um estudante de graduação, com foco em compreensão básica.
> - Parte 2: explicação voltada para um pesquisador de pós-graduação, enfatizando debates teóricos, lacunas e questões avançadas.
> 
> Use títulos claros para separar as partes e adapte o tom e o nível de detalhe em cada uma, sem inventar conteúdo fora das fontes.

***

## 9. Checklist prático para criação de prompts em NotebookLM

1. **Curar o caderno:** agrupe fontes por projeto/tema e remova documentos irrelevantes.[^6][^5]
2. **Selecionar fontes no Studio:** antes de gerar um artefato, selecione apenas as fontes relevantes na barra lateral ou mencione-as no prompt.[^8][^1]
3. **Definir objetivo e público-alvo:** especifique se o artefato é para estudo próprio, aula, diretoria, equipe técnica ou público leigo.[^14][^3]
4. **Escolher tipo de saída:** áudio (breve, deep dive, debate, crítica), vídeo/roteiro, apresentação, relatório, infográfico, mapa mental.[^8][^2][^4]
5. **Controlar estilo e idioma:** indique idioma, tom (formal, coloquial, inspirador), densidade de jargão, uso de exemplos e metáforas.[^10][^9][^3]
6. **Exigir grounding forte:** peça citações explícitas das fontes, referência a autores, títulos ou seções, e proíba invenções fora do corpus.[^5][^3]
7. **Explorar conflitos e lacunas:** para uso acadêmico, inclua sempre seções de limitações, contradições entre documentos e perguntas em aberto.[^7][^5]
8. **Aplicar Few-Shot quando possível:** cole exemplos de estilo ou estrutura que deseja reproduzir, especialmente para roteiros e relatórios.[^15][^2]
9. **Iterar com o "View custom prompt":** revise o prompt usado, ajuste instruções (por exemplo, aumentar/de reduzir profundidade) e regenere o artefato.[^1][^2]
10. **Integrar na rotina de PKM:** use NotebookLM como camada analítica sobre seu sistema de notas, gerando podcasts, relatórios e mapas mentais recorrentes para revisar e consolidar conhecimento.[^11][^3][^5]

Este guia reúne as melhores práticas descritas em documentação oficial, estudos acadêmicos sobre uso de podcasts gerados por NotebookLM na educação e workflows compartilhados por usuários avançados em comunidades de produtividade e PKM. Ao combinar grounding rigoroso, controle de estilo, personas adequadas e técnicas de Few-Shot, é possível transformar o Studio de Criação do NotebookLM em um ambiente altamente especializado para estudo acadêmico de alto nível, análise de documentos técnicos e gestão de conhecimento pessoal.[^14][^1][^8][^6][^3][^5]

---

## References

1. [Create a notebook in NotebookLM](https://support.google.com/notebooklm/answer/16206563?hl=en) - Important: At this time, the NotebookLM mobile app may have limitations to this feature. Learn more ...

2. [9 Immediately Useful NotebookLM Prompts to Accelerate Your ...](https://excellentprompts.substack.com/p/notebooklm) - Turn any topic or transcript into hands-on mastery using Google's most underused learning superpower...

3. [Mastering NotebookLM: Go From Raw Information To Solid ...](https://www.aifire.co/p/mastering-notebooklm-go-from-raw-information-to-solid-knowledge) - We won't just cover the basic features; we'll explore advanced techniques, effective workflows, and ...

4. [NEW NotebookLM Audio Overview 🎙️ Practical & Productive AI Workflow](https://www.youtube.com/watch?v=W_xR0rHpyhc) - Hi Friends, my name is Callum aka wanderloots. In today's video, I walk through NotebookLM's latest ...

5. [Best 9 PKM Tools Reddit Geeks Use To Build A Second ...](https://sastranusa.com/best-9-pkm-tools-reddit-geeks-use-to-build-a-second-brain-with-pdfs-podcasts-and-notes-recall-notebooklm-and-more/) - On Reddit, communities like r/ObsidianMD, r/PKMS, and r/NoteTaking are filled with in-depth workflow...

6. [My NotebookLM workflow and why I think it's enormously helpful](https://www.reddit.com/r/UMPI/comments/1n6ddhx/my_notebooklm_workflow_and_why_i_think_its/) - My NotebookLM workflow and why I think it's enormously helpful

7. [Anyone using Google's NotebookLM as a PKM?](https://www.reddit.com/r/PKMS/comments/1kxe185/anyone_using_googles_notebooklm_as_a_pkm/) - Anyone using Google's NotebookLM as a PKM?

8. [Generate Audio Overview in NotebookLM](https://support.google.com/notebooklm/answer/16212820?hl=en) - Important: At this time, the NotebookLM mobile app may have limitations to this feature. Learn more ...

9. [Customizing & Guiding NotebookLM Audio Overviews](https://www.youtube.com/watch?v=zw6-tUfHjYo) - Customizing NotebookLM's Audio Overview for Optimal Learning

NotebookLM offers a versatile AI tool ...

10. [How to customise your NotebookLM Audio overviews](https://www.youtube.com/watch?v=fDzsth9WL8Y) - NotebookLM's audio overviews are a powerful way to turn your sources into podcast-style summaries, b...

11. [I wanted to share my PKM workflow](https://www.reddit.com/r/PKMS/comments/1kkqpq3/i_wanted_to_share_my_pkm_workflow/) - I wanted to share my PKM workflow

12. [How to customise your audio overviews with NotebookLM](https://www.linkedin.com/posts/rstevensonuk_are-you-letting-notebooklm-decide-what-goes-activity-7338460032772067329-6d1G) - Are you letting NotebookLM decide what goes into your audio overviews? STOP! I get sent a lot of aud...

13. [Free Google AI & Notebook LM Tutorial, Prompt Engineering ...](https://www.youtube.com/watch?v=2WMPF5ejmho) - ... Google's Prompt Engineering Report 01:38 - Using NotebookLM 03:26 - NotebookLM Audio Overview 07...

14. [An Explorative Diary Study of AI-Generated Podcasts in University Education: Benefits, Challenges, and Future Directions](https://dl.acm.org/doi/10.1145/3706599.3719957) - In this study, we explore the potential of AI-generated podcasts as an educational tool in the evolv...

15. [Wordflow: Social Prompt Engineering for Large Language Models](http://arxiv.org/pdf/2401.14447v1.pdf) - Large language models (LLMs) require well-crafted prompts for effective use.
Prompt engineering, the...

16. [PromptSource: An Integrated Development Environment and Repository for
  Natural Language Prompts](https://arxiv.org/pdf/2202.01279.pdf) - PromptSource is a system for creating, sharing, and using natural language
prompts. Prompts are func...

