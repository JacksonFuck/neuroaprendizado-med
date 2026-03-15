# Contribuindo com o NeuroForge

## Regras Obrigatorias

### 1. CHANGELOG
Toda alteracao DEVE ser registrada no `CHANGELOG.md` ANTES do deploy.
Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)

### 2. Seguranca
- NUNCA commitar credenciais, senhas, tokens ou chaves API
- Usar `.env` para TODAS as configuracoes sensiveis
- Verificar `.gitignore` antes de commitar novos arquivos
- Testar com chaves de TESTE, nunca com chaves LIVE em codigo

### 3. Deploy
- Sempre via branch, PR, merge, deploy
- Bumpar SW cache version a cada deploy
- Testar localmente antes de push
- Verificar PM2 status apos deploy

### 4. Padroes de Codigo
- Acentuacao correta em todo texto visivel ao usuario
- Error handling: `console.error` no servidor, mensagem generica para o cliente
- `ensureAuth` em todas as rotas que requerem login
- Queries SQL parametrizadas (nunca concatenar)

### 5. Git
- Commits em portugues com prefixo: `feat:`, `fix:`, `docs:`, `chore:`, `security:`
- `Co-Authored-By: Claude <noreply@anthropic.com>` quando assistido por IA
