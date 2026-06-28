# OdontoControl

OdontoControl é um sistema completo de gestão clínica e CRM projetado para consultórios e clínicas odontológicas. O sistema otimiza o fluxo de atendimento, gerencia prontuários, orçamentos, tratamentos e oferece insights analíticos para crescimento da clínica ("AI Growth").

---

## 1. Stack Técnica

* **Frontend & Backend SSR:** [React 19](https://react.dev/) com [TanStack Start](https://tanstack.com/router/v1/docs/start/overview) (utilizando TanStack Router e motor de servidor Nitro/Vinxi).
* **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/) com suporte nativo via compilador Vite.
* **Autenticação:** [Better Auth](https://www.better-auth.com/) com armazenamento local no banco de dados.
* **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/) com a extensão [pgvector](https://github.com/pgvector/pgvector) hospedado localmente via Docker.
* **Containerização:** [Docker](https://www.docker.com/) com suporte a multi-stage builds.
* **Orquestração de Deploy:** [Docker Swarm](https://docs.docker.com/engine/swarm/) e gerenciamento visual via [Portainer](https://www.portainer.io/).

---

## 2. Estrutura de Pastas Principal

```text
├── .github/
│   └── workflows/
│       └── build-and-push-docker.yml # Workflow CI/CD GitHub Actions
├── database/
│   └── init_postgres.sql     # Estrutura do schema PostgreSQL (Tabelas e Extensões)
├── deploy/
│   └── portainer-stack.yml   # Stack Docker Swarm para o Portainer (App + Postgres pgvector)
├── docker/
│   └── nginx.conf            # Configuração do Nginx (fallback SPA)
├── docs/
│   └── DEPLOYMENT.md         # Guia passo a passo de deploy e CI/CD
├── scripts/
│   ├── init-db.mjs           # Script de inicialização automática do banco no startup
│   ├── bootstrap-super-admin.mjs # Script de bootstrap do usuário Super Admin
│   └── build_and_push.sh     # Script auxiliar de compilação Docker local
├── src/
│   ├── components/           # Componentes React reutilizáveis (UI/Shadcn)
│   ├── hooks/                # Custom React Hooks
│   ├── integrations/         # Clientes e adapters compatíveis do banco
│   ├── lib/                  # Utilitários, formatação, Better Auth server e funções do servidor
│   ├── routes/               # Rotas físicas da aplicação (TanStack Router)
│   ├── server.ts             # Entrada do servidor SSR/Nitro
│   └── start.ts              # Configuração de middlewares de inicialização
├── Dockerfile                # Build multi-stage para ambiente de produção
├── package.json              # Configurações, scripts e dependências do Node.js
└── vite.config.ts            # Configurações de compilação do Vite
```

---

## 3. Como Rodar Localmente

### Pré-requisitos
* Node.js (versão 20 ou superior)
* npm (versão 10 ou superior)
* PostgreSQL com extensão pgvector rodando localmente

### Passo 1: Instalar as dependências
```bash
npm install
```

### Passo 2: Configurar variáveis de ambiente
Copie o arquivo de exemplo e preencha as variáveis correspondentes:
```bash
cp .env.example .env
```
*(Nota: O arquivo `.env` está configurado no `.gitignore` para segurança).*

### Passo 3: Inicializar o banco de dados local
Certifique-se de preencher `DATABASE_URL` no `.env` apontando para o seu PostgreSQL local. Em seguida, execute o script de migração automática:
```bash
node scripts/init-db.mjs
```

### Passo 4: Semear o Super Admin local
Crie o usuário administrativo principal com e-mail/senha criptografados rodando:
```bash
node scripts/bootstrap-super-admin.mjs
```

### Passo 5: Iniciar servidor de desenvolvimento
```bash
npm run dev
```
O servidor de desenvolvimento estará disponível por padrão em `http://localhost:8080`.

---

## 4. Compilação (Build)

Para compilar a aplicação para produção (otimização de assets estáticos e compilação do servidor de SSR):
```bash
npm run build
```
O comando gerará os artefatos finais na pasta `.output/` (configurado pelo preset Nitro `node-server`).

Para testar o build localmente como em produção:
```bash
npm run preview
```

---

## 5. Docker & Deploy no Docker Swarm

O projeto está pronto para ser empacotado como um container Docker e publicado no Swarm de duas maneiras:

### Build Automatizado (CI/CD GitHub Actions)
Quando novos commits são enviados para a branch `main`, o GitHub Actions compila e publica a imagem Docker no Docker Hub:
* **Imagem:** `williamwilmer10/odontocontrol`
* **Tags:** `v0.1.<run_number>` e `latest`
* **Secrets necessários:** `DOCKER_USERNAME` e `DOCKER_PASSWORD` (Access Token) configurados nas configurações de segredos do repositório.

### Build Manual Local
Para compilar localmente:
```bash
docker build -t williamwilmer10/odontocontrol:latest .
```
Ou utilize o script de apoio adaptado:
```bash
bash scripts/build_and_push.sh
```

### Deploy no Swarm
A implantação é realizada colando a stack configurada em [deploy/portainer-stack.yml](file:///i:/odontocontrol/deploy/portainer-stack.yml) no Portainer. A stack cria a aplicação integrada ao proxy reverso Traefik na rede overlay `wapainelnet` e provisiona um PostgreSQL com pgvector local.

Para detalhes completos sobre o deploy, consulte o [Guia de Deploy](file:///i:/odontocontrol/docs/DEPLOYMENT.md).

---

## 6. Segurança de Segredos e Chaves

> [!WARNING]
> **Atenção com Chaves e Senhas:**
> O arquivo `.env` nunca deve ser versionado no repositório Git. As credenciais expostas devem ser rotacionadas e definidas de forma segura no deploy em ambiente de produção oficial.
> 
> * **DATABASE_URL:** Defina uma senha forte para o usuário `odontocontrol`.
> * **BETTER_AUTH_SECRET:** Crie uma chave secreta e aleatória de segurança. Ex: `openssl rand -base64 48`.

---

## 7. Primeiro Acesso / Bootstrap do Super Admin

Para realizar o bootstrap da aplicação em produção ou desenvolvimento, as credenciais padrão do Super Admin inicial são:
* **E-mail:** `admin@admin.com`
* **Senha:** `@Admin.com`

Estas variáveis podem ser configuradas/sobrescritas no deploy através de variáveis de ambiente (`BOOTSTRAP_ADMIN_EMAIL` e `BOOTSTRAP_ADMIN_PASSWORD`). Após o primeiro login, altere a senha para uma de sua preferência.
