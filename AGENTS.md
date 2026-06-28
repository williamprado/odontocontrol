# Orientações para Agentes de IA - Projeto OdontoControl

Este arquivo é destinado a agentes de IA que venham a interagir com este repositório. Ele estabelece diretrizes operacionais, comandos recomendados e regras de segurança para garantir a integridade do código e da infraestrutura.

---

## 1. Visão Geral do Projeto
* **Nome:** OdontoControl
* **Objetivo:** Sistema de gestão e CRM para clínicas odontológicas.
* **Stack Principal:** React 19, TanStack Start (Vinxi/Nitro), Tailwind CSS v4, TypeScript.
* **Banco de Dados:** Atualmente integrado ao Supabase (Auth e CRUD de dados). O PostgreSQL com pgvector local está provisionado na stack Docker para migração futura.

---

## 2. Estrutura de Pastas de Interesse
* [deploy/portainer-stack.yml](file:///i:/odontocontrol/deploy/portainer-stack.yml): Configuração da stack de deploy do Docker Swarm.
* [docs/DEPLOYMENT.md](file:///i:/odontocontrol/docs/DEPLOYMENT.md): Instruções detalhadas de deploy.
* [docs/MIGRATION_SUPABASE_TO_PGVECTOR.md](file:///i:/odontocontrol/docs/MIGRATION_SUPABASE_TO_PGVECTOR.md): Roteiro para migração da persistência do Supabase para o Postgres local.
* `src/routes/`: Rotas do TanStack Router.
* `src/integrations/supabase/`: Clientes do Supabase (client, client.server e middlewares).
* `supabase/migrations/`: Migrações SQL contendo o esquema do banco de dados.

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
* A migração para PostgreSQL local com pgvector deve seguir o plano detalhado no [MIGRATION_SUPABASE_TO_PGVECTOR.md](file:///i:/odontocontrol/docs/MIGRATION_SUPABASE_TO_PGVECTOR.md), garantindo que as chamadas client-side do Supabase sejam reestruturadas em Server Functions antes de remover o SDK do Supabase.
