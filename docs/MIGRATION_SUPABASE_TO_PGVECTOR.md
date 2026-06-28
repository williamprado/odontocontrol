# Migração de Supabase para PostgreSQL com pgvector

Este documento descreve a estratégia técnica e o roteiro para migrar a persistência e a lógica do sistema **OdontoControl** da infraestrutura gerenciada do Supabase para um banco de dados **PostgreSQL próprio equipado com a extensão pgvector**, hospedado via Docker Swarm.

---

## 1. Estado Atual e Acoplamento

Atualmente, o projeto utiliza a biblioteca `@supabase/supabase-js` diretamente no frontend para realizar operações de leitura e escrita (CRUD):
* Componentes de interface (como [CrudPage](file:///i:/odontocontrol/src/components/CrudPage.tsx), [PatientFicha](file:///i:/odontocontrol/src/components/PatientFicha.tsx) e [OrcamentoSheet](file:///i:/odontocontrol/src/components/OrcamentoSheet.tsx)) importam o cliente global `supabase` de `@/integrations/supabase/client` e consultam tabelas como `paciente`, `consulta`, `orcamento`, etc.
* O controle de acesso a nível de banco (RLS - Row Level Security) é imposto pelo Supabase com base no JWT do usuário autenticado no Supabase Auth.
* Funções administrativas seguras são executadas via Server Functions do TanStack Start, utilizando o cliente administrativo `supabaseAdmin` com a `service_role_key`.

---

## 2. Risco de Exposição Direta do Banco de Dados

> [!CAUTION]
> **Segurança de Acesso ao PostgreSQL:**
> Em bancos PostgreSQL tradicionais, **nunca** devemos expor a string de conexão (`DATABASE_URL`) ou permitir conexões diretas do navegador do usuário para o banco. Isso daria acesso total de leitura e escrita a qualquer agente mal-intencionado.
>
> Ao migrar do Supabase (que expõe uma API REST intermediária segura via PostgREST) para um banco PostgreSQL puro, **todo o acesso ao banco deve ser movido para o servidor (backend)**.

---

## 3. Estratégia de Migração: Camada de API / Server Functions

Para eliminar a dependência direta do Supabase sem expor o banco PostgreSQL, seguiremos os seguintes passos:

1. **Migrar queries para o Backend:** As consultas hoje presentes no frontend (`useQuery` no React chamando `supabase.from(...)`) deverão ser envelopadas em **Server Functions** do TanStack Start (`createServerFn`).
2. **Utilizar Drivers de Conexão no Servidor:** O código do servidor (SSR e Server Functions) usará drivers seguros como `pg` (node-postgres) ou ORMs como **Prisma** ou **Drizzle** para conversar com o banco local.
3. **Restrição de Acesso:** O banco PostgreSQL local não ficará exposto à internet, apenas para a rede overlay privada (`wapainelnet`) do Docker Swarm, acessível unicamente pelo container do app.

---

## 4. O Banco de Dados PostgreSQL & Extensão pgvector

O banco de dados provisionado no arquivo `portainer-stack.yml` utiliza a imagem oficial de pgvector:
```yaml
image: pgvector/pgvector:pg16
```

### Ativação da extensão
Antes de criar qualquer tabela que utilize busca vetorial, é necessário ativar a extensão no banco de dados executando:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Exemplo de Tabela Vetorial Futura (para RAG/IA)
Caso queira armazenar prontuários ou documentos clínicos em formato de embeddings vetoriais para buscas semânticas rápidas:
```sql
-- Criar extensão
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela de documentos com vetor de 1536 dimensões (padrão do OpenAI text-embedding-3-small / ada-002)
CREATE TABLE IF NOT EXISTS documento_clinico_vector (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid REFERENCES public.paciente(id) ON DELETE CASCADE,
  conteudo text NOT NULL,
  embedding vector(1536),
  created_at timestamptz DEFAULT now()
);

-- Criar índice HNSW (Hierarchical Navigable Small World) para buscas rápidas
CREATE INDEX ON documento_clinico_vector USING hnsw (embedding vector_cosine_ops);
```

---

## 5. Plano de Migração Faseado

Para mitigar riscos, a migração será dividida em 4 fases distintas:

### Fase 1: Infraestrutura (Executada nesta etapa)
* Subir o PostgreSQL com pgvector no Docker Swarm.
* Isolar o container do banco na rede overlay interna.
* Manter o código do app se comunicando temporariamente com o Supabase de produção enquanto a infra do Postgres valida.

### Fase 2: Adaptação das Server Functions & Backend
* Alterar as migrações SQL do Supabase (pasta `supabase/migrations/`) para serem compatíveis com o PostgreSQL padrão (ajustando chamadas específicas do schema `auth.` para um modelo de tabelas locais ouJWT customizado).
* Desenvolver uma camada de Server Functions para substituir as consultas diretas do cliente.
* Integrar driver `pg` ou Drizzle ORM nas Server Functions para ler/escrever no Postgres local.

### Fase 3: Migração de Dados (Carga Inicial)
* Configurar um script de migração para exportar os dados do Supabase.
* Aplicar os esquemas SQL no Postgres próprio.
* Importar os dados exportados respeitando as chaves estrangeiras.

### Fase 4: Autenticação & Desconexão
* **Autenticação:** O Supabase Auth pode ser mantido inicialmente (usando o JWT decodificado no middleware para identificar o usuário no Postgres local), ou substituído posteriormente por uma solução autohospedada (como NextAuth/Auth.js ou tabelas locais de usuários com JWT gerado no backend).
* Remover completamente o SDK `@supabase/supabase-js` do projeto.
