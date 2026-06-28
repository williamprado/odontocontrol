# Orientações para Agentes de IA - Projeto OdontoControl

Este arquivo é destinado a agentes de IA que venham a interagir com este repositório. Ele estabelece diretrizes operacionais, comandos recomendados e regras de segurança para garantir a integridade do código e da infraestrutura.

---

## 1. Visão Geral do Projeto
* **Nome:** OdontoControl
* **Objetivo:** Sistema de gestão e CRM para clínicas odontológicas.
* **Stack Principal:** React 19, TanStack Start (Vinxi/Nitro), Tailwind CSS v4, Better Auth, TypeScript.
* **Banco de Dados:** Banco oficial e único: PostgreSQL com pgvector local provisionado via Docker Swarm. Supabase Auth foi 100% removido.

---

## 2. Estrutura de Pastas de Interesse
* [deploy/portainer-stack.yml](file:///i:/odontocontrol/deploy/portainer-stack.yml): Configuração da stack de deploy do Docker Swarm.
* [docs/DEPLOYMENT.md](file:///i:/odontocontrol/docs/DEPLOYMENT.md): Instruções detalhadas de deploy.
* `src/routes/`: Rotas do TanStack Router.
* `src/lib/auth.server.ts`: Inicialização do servidor Better Auth.
* `src/lib/auth-client.ts`: Inicialização do cliente de autenticação Better Auth.
* `src/routes/api/auth/$.ts`: Rota de API catch-all para Better Auth.
* `database/init_postgres.sql`: Estrutura do schema de inicialização do PostgreSQL.

---

## 3. Comandos Permitidos e Validações

### Instalação de Dependências
```bash
npm install
```

### Compilação (Build)
```bash
npm run build
```

### Execução local (Desenvolvimento)
```bash
npm run dev
```

### Execução local (Produção/Preview)
```bash
npm run preview
```

### Validação de Sintaxe do Docker Compose
```bash
docker compose -f deploy/portainer-stack.yml config
```

---

## 4. Regras Críticas de Segurança

> [!IMPORTANT]
> **Gestão de Secrets:**
> * **NUNCA** adicione chaves, senhas ou tokens ao controle de versão (Git).
> * O arquivo `.env` está explicitamente no `.gitignore` e **NUNCA** deve ser forçado no Git.
> * Sempre utilize o `.env.example` para declarar novas variáveis de ambiente requeridas pela aplicação.
> * Caso identifique chaves vazadas em commits antigos ou arquivos não ignorados, reporte imediatamente ao usuário para rotação das chaves.

---

## 5. Regras de Deploy e Infraestrutura
* **Não faça push** de tags ou commits diretamente para branches de produção sem autorização expressa do usuário.
* A imagem Docker pública autorizada do projeto é `williamwilmer10/odontocontrol`.
* O workflow de CI/CD em `.github/workflows/build-and-push-docker.yml` compila e publica a imagem no Docker Hub automaticamente no push para `main`.
* O script `scripts/build_and_push.sh` pode ser usado para compilar e publicar novas tags de forma incremental localmente.
* **Não altere** ou acione builds manuais em ambientes de staging ou produção direta sem autorização.

---

## 6. Bootstrap do Super Admin e Inicialização
* O script [scripts/init-db.mjs](file:///i:/odontocontrol/scripts/init-db.mjs) executa no startup para aplicar o schema PostgreSQL e criar as tabelas do Better Auth de forma idempotente.
* O script [scripts/bootstrap-super-admin.mjs](file:///i:/odontocontrol/scripts/bootstrap-super-admin.mjs) executa no startup para criar o Super Admin (`admin@admin.com` / `@Admin.com`) de forma idempotente diretamente nas tabelas locais do Better Auth/PostgreSQL.
* **Nunca** tente atualizar a coluna `user_id` de `membro_equipe` diretamente no client-side do React. Use a Server Function `syncAuthUser` de forma a validar as credenciais através do contexto do Better Auth no servidor.
* Mantenha a inicialização idempotente e segura (não logar senhas ou URLs do banco).
