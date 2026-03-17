# 🚀 Guia de Deploy - Hostinger VPS

A plataforma foi arquitetada de forma enxuta (Node.js/Express + PostgreSQL) para rodar perfeitamente em uma VPS padrão da Hostinger.

Estas são as instruções exatas de como subir o projeto de forma profissional e mantê-lo online 24/7 usando o `PM2`.

## Passo 1: Preparar o Servidor Hostinger

Acesse sua VPS da Hostinger via SSH.
```bash
ssh root@SEU_IP_DA_VPS
```

Uma vez dentro da VPS, instale as dependências essenciais do servidor (caso seja uma VPS Ubuntu crua):
```bash
# Atualize os pacotes
apt update && apt upgrade -y

# Instale o Node.js v20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Instale o gerenciador de processos PM2 (para manter a aplicação viva 24/7)
npm install -g pm2

# Instale o PostgreSQL (se o banco for ficar na mesma VPS)
apt postgis postgresql postgresql-contrib -y
```

## Passo 2: Clonar/Enviar a Aplicação

Se o seu código já está no GitHub, basta clonar. Senão, envie o ZIP do projeto atual para a VPS.
Recomendamos criar uma pasta `/var/www/neuroaprendizado`:

```bash
mkdir -p /var/www/neuroaprendizado
cd /var/www/neuroaprendizado
git clone URL_DO_SEU_REPOSITORIO .
```

## Passo 3: Configurar o Ambiente de Produção

Instale as dependências da raiz do projeto:
```bash
npm install --omit=dev
```

Crie o arquivo `.env` da produção dentro deste diretório (não utilize o `.env` local).
```bash
nano .env
```
Cole os dados reais do seu PostgreSQL de Produção e a nova porta:
```env
PORT=3000
NODE_ENV=production
BASE_URL=https://neuroaprendizado.unipar.jacksonuti.cloud
SESSION_SECRET=coloque_uma_senha_muito_forte_aqui
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=sua_senha_segura_do_banco
DB_NAME=neuro_db

# ── SMTP (email de ativação de conta) ──────────────────────────────────────
# Hostinger E-mail (smtp.hostinger.com, port=465, secure=true)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=jackson@jacksonuti.cloud
SMTP_PASS=Ritmosinusal120/80
SMTP_FROM_NAME=Neuroaprendizado Med
```

> **Importante:** Se SMTP não for configurado, o link de ativação aparecerá nos logs do PM2 (`pm2 logs neuroaprendizado-api`). Você pode copiar e enviar o link manualmente ao usuário.

## Passo 4: Inicializar o Banco de Dados

Crie as tabelas utilizando o script embutido no nosso projeto:
```bash
npm run db:init
```

E se quiser garantir o usuário administrador, apenas invoque:
```bash
node init_admin.js
```

## Passo 5: Rodar com PM2 (24/7)

Agora inicie a aplicação usando PM2 para que ela reinicie automaticamente caso a VPS sofra reboot ou a aplicação congele:
```bash
pm2 start server/index.js --name "neuroaprendizado-api"
pm2 save
pm2 startup
```

Pronto! A aplicação agora estará rodando na porta 3000 interna da sua VPS.

---

## Passo Extra (Opcional, porém Recomendado): Configurar Nginx / Domínio

Para acessar sua aplicação pelo domínio (`neuroaprendizado.com.br`) e utilizar SSL (HTTPS), instale o Nginx:

```bash
apt install nginx certbot python3-certbot-nginx -y
```

E adicione este bloco no seu Nginx (`/etc/nginx/sites-available/neuroaprendizado`):

```nginx
server {
    listen 80;
    server_name www.seudominio.com.br seudominio.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # O Express já está marcado com `trust proxy 1`, então headers importam
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

E gere seu cadeado seguro do Google:
```bash
certbot --nginx -d seudominio.com.br -d www.seudominio.com.br
```

---
**Recuperação/Status:**
Para ver os logs do sistema a qualquer momento: `pm2 logs neuroaprendizado-api`
Para reiniciar após mexer no código: `pm2 restart neuroaprendizado-api`
