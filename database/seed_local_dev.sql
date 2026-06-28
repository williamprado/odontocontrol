-- =========================================================
-- SEED DATA FOR LOCAL DEV ENVIRONMENT
-- Safe, fictive mock data for local testing
-- =========================================================

-- Clean existing data in public schema (local testing only!)
TRUNCATE TABLE public.financeiro, public.historico_clinica, public.orcamento, 
               public.tratamento, public.consulta, public.procedimento, 
               public.paciente, public.profissional, public.membro_equipe, 
               public.clinica, public.app_config CASCADE;

-- Seed Global Configuration (app_config)
INSERT INTO public.app_config (id, super_admin_emails, app_name)
VALUES (
  '99999999-9999-9999-9999-999999999999',
  ARRAY['admin.teste@odontocontrol.com.br'],
  'OdontoControl Local Dev'
);

-- Seed Clinica Teste
INSERT INTO public.clinica (
  id, nome, cnpj, cro_responsavel, slug, telefone, email, 
  owner_nome, owner_email, owner_telefone, plano, status, 
  trial_ate, logo_url, cor_primaria, status_cobranca, valor_mensal, mrr
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Clinica Odontológica Local Dev',
  '12.345.678/0001-90',
  'CRO-SP 12345',
  'clinica-local-dev',
  '(11) 5555-1234',
  'clinica.dev@odontocontrol.com.br',
  'Dr. João Tester',
  'joao.tester@odontocontrol.com.br',
  '(11) 99999-8888',
  'pro',
  'trial',
  CURRENT_DATE + 30,
  NULL,
  '#06B6D4',
  'ativo',
  199.90,
  199.90
);

-- Seed Membros da Equipe
INSERT INTO public.membro_equipe (
  id, clinica_id, user_id, nome, email, role, ativo, must_change_password
)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333', -- Mock Supabase Auth uid()
  'Dr. João Tester',
  'joao.tester@odontocontrol.com.br',
  'owner',
  true,
  false
);

-- Seed Profissionais
INSERT INTO public.profissional (
  id, clinica_id, nome, especialidade, cro_numero, cro_uf, 
  telefone, email, ativo, percentual_repasse
)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'Dr. João Tester',
  'Clinico_geral',
  '12345',
  'SP',
  '(11) 99999-8888',
  'joao.tester@odontocontrol.com.br',
  true,
  50.00
);

-- Seed Paciente
INSERT INTO public.paciente (
  id, clinica_id, nome, cpf, data_nascimento, telefone, email, 
  profissao, convenio, ativo
)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111',
  'Maria Paciente Dev',
  '111.222.333-44',
  '1990-05-15',
  '(11) 98888-7777',
  'maria.dev@example.com',
  'Programadora',
  'Bradesco Saúde',
  true
);

-- Seed Procedimento
INSERT INTO public.procedimento (
  id, clinica_id, nome, codigo_tuss, descricao, valor, duracao_minutos, ativo
)
VALUES (
  '66666666-6666-6666-6666-666666666666',
  '11111111-1111-1111-1111-111111111111',
  'Consulta e Limpeza Geral',
  '81000010',
  'Avaliação clínica inicial e limpeza profilática completa.',
  180.00,
  45,
  true
);

-- Seed Consulta
INSERT INTO public.consulta (
  id, clinica_id, paciente_id, paciente_nome, profissional_id, profissional_nome,
  data, hora, duracao_minutos, tipo, status, valor_total, observacoes
)
VALUES (
  '77777777-7777-7777-7777-777777777777',
  '11111111-1111-1111-1111-111111111111',
  '55555555-5555-5555-5555-555555555555',
  'Maria Paciente Dev',
  '44444444-4444-4444-4444-444444444444',
  'Dr. João Tester',
  CURRENT_DATE + 2,
  '09:00:00',
  45,
  'consulta',
  'agendada',
  180.00,
  'Primeira consulta do dia, paciente solicitou aviso prévio via WhatsApp.'
);

-- Seed Financeiro (Receita pendente)
INSERT INTO public.financeiro (
  id, clinica_id, descricao, tipo, valor, data, vencimento, 
  categoria, forma_pagamento, paciente_id, status
)
VALUES (
  '88888888-8888-8888-8888-888888888888',
  '11111111-1111-1111-1111-111111111111',
  'Pagamento Maria Paciente Dev - Limpeza',
  'receita',
  180.00,
  CURRENT_DATE + 2,
  CURRENT_DATE + 2,
  'Tratamentos',
  'Pix',
  '55555555-5555-5555-5555-555555555555',
  'pendente'
);
