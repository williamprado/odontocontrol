
# OdontoControl AI — Rebuild Plan

Massive scope. Vou recomeçar a camada de UI/rotas mantendo o banco já provisionado (clinica, paciente, consulta, profissional, procedimento, tratamento, orcamento, financeiro, historico_clinica, membro_equipe, app_config). Vou estender o schema para suportar os requisitos novos e reescrever todas as rotas no padrão file-based do TanStack Start.

## 1. Database (migration única adicional)

Estender, não recriar:
- `clinica`: adicionar `status_cobranca` enum (ativo/inadimplente/suspenso), `mrr` numeric, `valor_mensal` numeric, `ultimo_acesso` timestamptz
- `membro_equipe.role` enum: adicionar `dentista/auxiliar/financeiro/demo`
- `procedimento`: já tem codigo_tuss ✓
- `orcamento`: já tem numero, validade, desconto, parcelas ✓
- Nova `user_roles` (user_id, role super_admin enum, clinica_id nullable) — só pra super_admin global
- Função `is_super_admin()`, `current_clinica_id()`
- RLS pública para `/agendar/:slug`: policies `anon` em profissional/procedimento/clinica (select by slug) e consulta (insert)
- `clinica.slug` unique + trigger pra gerar

## 2. Estrutura de rotas (file-based)

```
src/routes/
  __root.tsx                    (já existe — providers)
  index.tsx                     LandingPage (hero odonto, features, pricing 79/159/299)
  entrar.tsx                    Tabs Entrar | Criar conta
  esqueci-senha.tsx
  reset-senha.tsx
  trocar-senha.tsx
  clinica-suspensa.tsx
  agendar.$slug.tsx             Público (anon)
  _master.tsx                   SuperAdminGuard + SidebarMaster (vermelha)
    _master/listaClinicas.tsx
    _master/novaClinica.tsx
    _master/painel.tsx
    _master/clinicasSuspensas.tsx
  _app.tsx                      TenantGuard + TenantLayout + TrialBanner
    _app/Onboarding.tsx         multi-step (5 etapas)
    _app/Dashboard.tsx
    _app/Agenda.tsx
    _app/Pacientes.tsx          + ficha drawer com tabs (dados/anamnese/historico/tratamentos)
    _app/Profissionais.tsx
    _app/Procedimentos.tsx
    _app/Tratamentos.tsx
    _app/Orcamentos.tsx         com PDF + aprovar
    _app/Financeiro.tsx
    _app/Relatorios.tsx
    _app/AIGrowth.tsx           chatbot shell mockado
    _app/Equipe.tsx
    _app/Configuracoes.tsx      Tabs: Clinica | Equipe | Aparencia | Cobranca
  _demo.tsx                     DemoLayout + banner + seed in-memory
    _demo/Dashboard.tsx ... (mesmas páginas read-only com dados mock)
```

## 3. Componentes compartilhados

```
src/components/
  PageHeader.tsx
  DataTable.tsx                 wrapper genérico (search + paginação)
  FormDialog.tsx
  KpiCard.tsx
  PatientFicha.tsx              Sheet com tabs
  TreatmentPlan.tsx
  OrcamentoPdf.tsx              window.print() com layout A4
  SidebarMaster.tsx
  SidebarTenant.tsx
  SidebarDemo.tsx
  SuperAdminGuard.tsx
  TenantGuard.tsx
  TrialBanner.tsx
  guards/                       wrappers de rota
  demo/seed.ts                  dados mockados
```

## 4. Design tokens

`src/styles.css`:
- `--brand: #06B6D4`
- `--brand-master: hsl(0 70% 35%)`
- `--surface: #F8F7F3`
- `--sidebar-bg: #111318`
- tema dark sidebar tenant; sidebar master usa --brand-master

## 5. Auth & roles

- Lovable Cloud Auth (email/senha + Google)
- `useAuth` retorna: session, membro, role (do membro_equipe), isSuperAdmin (app_config.super_admin_emails)
- TenantGuard: redirect /entrar se não logado; /Onboarding se sem clinica; /clinica-suspensa se status_cobranca=suspenso (exceto /Configuracoes?tab=cobranca)
- SuperAdminGuard: 403 se não estiver em super_admin_emails

## 6. Ordem de implementação (em commits lógicos)

1. Migration (schema extensions + RLS + slug + status_cobranca)
2. Design tokens + Sidebars + Guards + Layouts (_app/_master/_demo)
3. LandingPage + /entrar + recuperação senha
4. Demo (seed mock + páginas read-only)
5. Onboarding multi-step
6. /app/Dashboard + KPIs
7. /app/Pacientes com PatientFicha completa (anamnese/historico/tratamentos)
8. /app/Agenda + Profissionais + Procedimentos
9. /app/Tratamentos + Orcamentos (com PDF e aprovar→tratamento)
10. /app/Financeiro + Relatorios + AIGrowth shell + Equipe + Configuracoes
11. /master/* (lista, novo, painel MRR, suspensas)
12. /agendar/:slug público

## 7. Trade-offs / decisões

- **AIGrowth**: shell visual + mensagens canned (sem IA real ainda)
- **OrcamentoPdf**: `window.print()` com CSS print-friendly (sem libs)
- **Demo**: dados em memória (zustand-like via context), zero writes ao banco
- **PatientFicha**: Sheet lateral grande com Tabs (não rota separada) pra evitar explosão de rotas
- **Super admin role**: via `app_config.super_admin_emails` (já existe) — `user_roles` table fica como extensão futura, pulo agora
- **Status cobrança**: lógica de transição manual via /master (sem cron real)

## 8. Pendências assumidas (não vou implementar agora)

- Google OAuth real (mantenho email/senha; usuário pode pedir depois)
- Geração de PDF server-side (uso print do browser)
- Cron de trial/suspensão automática
- IA real no AIGrowth
- Storage de fotos (foto_url fica como text input com URL)
- Envio de email transacional (recuperação de senha usa fluxo padrão Supabase)
- Pagamentos reais na pricing page (botões só linkam pra /entrar)

## Estimativa

~30-40 arquivos novos/reescritos. Vou priorizar funcional sobre polido visual em cada tela, mantendo design system consistente. Sidebar+Layouts primeiro pra dar a "casca", depois preencho página por página na ordem listada.

Posso começar?
