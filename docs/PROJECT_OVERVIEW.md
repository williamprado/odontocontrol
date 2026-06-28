# OdontoControl - Visão Geral do Projeto

Este documento consolida a visão geral, objetivos de produto, stack tecnológica, módulos principais e o estado atual da migração do sistema **OdontoControl**.

---

## 1. Visão Geral e Objetivo do Produto
O **OdontoControl** é um sistema de gestão integrada (ERP) e CRM projetado especificamente para clínicas odontológicas e consultórios. O objetivo principal do produto é automatizar a gestão operacional e administrativa de clínicas, oferecendo recursos como:
- Agendamento inteligente e controle de consultas.
- Ficha clínica completa do paciente (anamnese, histórico clínico, planos de tratamento e orçamentos).
- Módulo financeiro integrado (receitas, despesas, parcelamentos e fluxo de caixa).
- Relatórios analíticos e de projeção de crescimento com auxílio de inteligência artificial.
- Suporte a múltiplos tenants (clínicas isoladas) e controle de acessos baseado em perfis (owner, admin, dentista, recepcionista, etc.).

---

## 2. Stack Técnica
A aplicação foi construída sobre uma arquitetura moderna e full-stack de alto desempenho:
- **Core / Framework:** React 19, TypeScript e TanStack Start (construído sobre Vinxi/Nitro).
- **Styling:** Tailwind CSS v4 para estilização nativa e moderna.
- **Roteamento:** TanStack Router (roteamento baseado em arquivos).
- **Autenticação:** Better Auth (autenticação local persistida em tabelas dedicadas do Postgres).
- **Banco de Dados:** PostgreSQL com a extensão `pgvector` provisionado via contêineres Docker locais e orquestrado no Docker Swarm. Supabase foi 100% removido.

---

## 3. Estrutura de Rotas e Módulos Principais
As rotas estão mapeadas sob `src/routes/` seguindo a convenção de arquivo do TanStack Router:
- **Landing Page & Público (`index.tsx`, `entrar.tsx`, etc.):** Página principal com planos de assinatura, tela de login, cadastro, recuperação de senha e onboarding multi-etapa para novas clínicas.
- **Agendamento Público (`agendar.$slug.tsx`):** Canal de auto-agendamento de consultas pelo paciente baseado no link personalizado da clínica.
- **Painel Administrativo da Clínica (`_app.tsx`):** Acesso autenticado e protegido por tenant contendo:
  - **Dashboard:** Visão geral e métricas de desempenho.
  - **Agenda:** Gerenciamento visual de marcações de consultas.
  - **Pacientes:** Cadastro detalhado e ficha clínica interativa (anamnese/histórico).
  - **Profissionais / Equipe:** Gestão de dentistas, especialidades e repasses de comissão.
  - **Tratamentos & Orçamentos:** Planejamento odontológico com exportação A4 simplificada.
  - **Financeiro:** Controle de fluxo de caixa, pagamentos e recebimentos.
  - **Relatórios & AIGrowth:** Painéis analíticos e insights para expansão do negócio.
- **Painel Master Global (`_master.tsx`):** Acesso restrito a Super Administradores da plataforma (emails configurados na tabela `app_config.super_admin_emails`) para cadastro, controle e suspensão de clínicas por inadimplência.
- **Ambiente de Demonstração (`_demo.tsx`):** Rotas de testes read-only alimentadas por mock de dados em memória.

---

## 4. Status da Migração (Supabase → PostgreSQL/pgvector)
- **Fase 1:** Estrutura de conteinerização do banco local (`pgvector/pgvector:pg16`) e Dockerfile multi-stage configurado para o servidor Nitro Node.
- **Fase 2:** Implementação de um **Proxy Adapter progressivo** em `src/integrations/supabase/client.ts` que intercepta consultas `.from(table)` e as redireciona para a Server Function segura `executeDbQuery`.
- **Fase 2.1:** Configurações de Docker Compose local e seed de dados fictícios em banco de desenvolvimento para validações locais de build.
- **Fase 2.4 (Concluída):** Remoção completa da dependência do Supabase Auth no backend e frontend. A autenticação foi migrada integralmente para o **Better Auth** rodando localmente no PostgreSQL local. Implementados scripts de inicialização automática do banco (`init-db.mjs`) e bootstrap do Super Admin (`bootstrap-super-admin.mjs`) 100% locais que executam no startup do container.

---

## 5. Próximos Passos
1. Realizar deploy no Portainer (Docker Swarm) do cluster completo de produção (App + Banco Local PostgreSQL).
2. Monitorar os logs do banco de dados e do Better Auth em produção durante o fluxo de migração dos clientes reais.
