# OdontoControl

OdontoControl é um sistema completo de gestão clínica e CRM projetado para consultórios e clínicas odontológicas. O sistema otimiza o fluxo de atendimento, gerencia prontuários, orçamentos, tratamentos e oferece insights analíticos para crescimento da clínica ("AI Growth").

---

## 1. Stack Técnica

* **Frontend & Backend SSR:** [React 19](https://react.dev/) com [TanStack Start](https://tanstack.com/router/v1/docs/start/overview) (utilizando TanStack Router e motor de servidor Nitro/Vinxi).
* **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/) com suporte nativo via compilador Vite.
* **Banco de Dados & Auth (Transição):** [Supabase](https://supabase.com/) via SDK client-side `@supabase/supabase-js`.
* **Banco de Dados (Produção/Futuro):** [PostgreSQL](https://www.postgresql.org/) com a extensão [pgvector](https://github.com/pgvector/pgvector) hospedado localmente via Docker.
* **Containerização:** [Docker](https://www.docker.com/) com suporte a multi-stage builds.
* **Orquestração de Deploy:** [Docker Swarm](https://docs.docker.com/engine/swarm/) e gerenciamento visual via [Portainer](https://www.portainer.io/).

---

## 2. Estrutura de Pastas Principal

```text
├── .github/
│   └── workflows/
│       └── build-and-push-docker.yml # Workflow CI/CD GitHub Actions
├── deploy/
│   └── portainer-stack.yml   # Stack Docker Swarm para o Portainer (App + Postgres pgvector)
├── docker/
│   └── nginx.conf            # Configuração do Nginx (fallback SPA)
├── docs/
│   ├── DEPLOYMENT.md         # Guia passo a passo de deploy e CI/CD
│   └── MIGRATION_SUPABASE_TO_PGVECTOR.md # Roteiro de migração Supabase -> Postgres pgvector
├── src/
│   ├── components/           # Componentes React reutilizáveis (UI/Shadcn)
│   ├── hooks/                # Custom React Hooks
│   ├── integrations/         # Clientes e Middlewares do Supabase
│   ├── lib/                  # Utilitários, formatação e funções auxiliares do servidor
│   ├── routes/               # Rotas físicas da aplicação (TanStack Router)
│   ├── server.ts             # Entrada do servidor SSR/Nitro
│   └── start.ts              # Configuração de middlewares de inicialização
├── supabase/
│   ├── migrations/           # Arquivos de migração SQL com a estrutura do banco
│   └── config.toml           # Configuração de projeto do Supabase CLI
├── Dockerfile                # Build multi-stage para ambiente de produção
├── package.json              # Configurações, scripts e dependências do Node.js
└── vite.config.ts            # Configurações de compilação do Vite
```

---

## 3. Como Rodar Localmente

### Pré-requisitos
* Node.js (versão 20 ou superior)
* npm (versão 10 ou superior) ou Bun

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

### Passo 3: Iniciar servidor de desenvolvimento
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
Ou utilize o script de apoio adaptado (caso o Docker esteja instalado localmente):
```bash
bash scripts/build_and_push.sh
```

### Deploy no Swarm
A implantação pode ser realizada colando a stack configurada em [deploy/portainer-stack.yml](file:///i:/odontocontrol/deploy/portainer-stack.yml) no Portainer. A stack cria a aplicação integrada ao proxy reverso Traefik na rede overlay `wapainelnet` e provisiona um PostgreSQL com pgvector local.

Para detalhes completos sobre o deploy, consulte o [Guia de Deploy](file:///i:/odontocontrol/docs/DEPLOYMENT.md).

---

## 6. Transição Supabase para PostgreSQL com pgvector

Atualmente, o projeto executa queries direto no cliente (frontend) usando o Supabase JS SDK. Para migrar para a infraestrutura PostgreSQL com pgvector local, consulte as diretrizes detalhadas de arquitetura segura em [Migração Supabase para PostgreSQL pgvector](file:///i:/odontocontrol/docs/MIGRATION_SUPABASE_TO_PGVECTOR.md).

---

## 7. Segurança de Segredos e Chaves

> [!WARNING]
> **Atenção com Chaves e Senhas:**
> O arquivo `.env` nunca deve ser versionado no repositório Git. As credenciais expostas devem ser rotacionadas na nuvem antes do deploy em ambiente de produção oficial.
