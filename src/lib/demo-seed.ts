// Seed mock rico para o modo demo.
import { addDays, format, subDays, subMonths } from "date-fns";

const today = new Date();
const d = (offset: number) => format(addDays(today, offset), "yyyy-MM-dd");

export const demoClinica = {
  id: "demo-clinica",
  nome: "OdontoControl Excellence",
  slug: "excellence",
  cnpj: "12.345.678/0001-90",
  cro_responsavel: "CRO-SP 12345",
  telefone: "(11) 3456-7890",
  whatsapp: "(11) 99999-0000",
  email: "contato@excellence.odonto.br",
  endereco: "Av. Paulista, 1500 - Bela Vista, São Paulo/SP",
  primary_color: "#0EA5E9",
  plano: "profissional",
};

export const demoProfissionais = [
  { id: "p1", nome: "Dra. Patrícia Lima",  especialidade: "Ortodontia",      cro_numero: "23456", cro_uf: "SP", telefone: "(11) 99100-2001", valor_consulta: 280, percentual_repasse: 50, ativo: true, cor: "#0EA5E9" },
  { id: "p2", nome: "Dr. Ricardo Souza",   especialidade: "Implantodontia",  cro_numero: "34567", cro_uf: "SP", telefone: "(11) 99100-2002", valor_consulta: 320, percentual_repasse: 55, ativo: true, cor: "#8B5CF6" },
  { id: "p3", nome: "Dra. Carla Mendes",   especialidade: "Endodontia",      cro_numero: "45678", cro_uf: "SP", telefone: "(11) 99100-2003", valor_consulta: 280, percentual_repasse: 50, ativo: true, cor: "#10B981" },
  { id: "p4", nome: "Dr. Marcos Silva",    especialidade: "Clínico Geral",   cro_numero: "56789", cro_uf: "SP", telefone: "(11) 99100-2004", valor_consulta: 200, percentual_repasse: 45, ativo: true, cor: "#F59E0B" },
];

export const demoProcedimentos = [
  { id: "pr1",  nome: "Avaliação inicial",         codigo_tuss: "99999014", valor: 150,   duracao_minutos: 30, categoria: "Consulta" },
  { id: "pr2",  nome: "Limpeza profissional",      codigo_tuss: "99999001", valor: 220,   duracao_minutos: 45, categoria: "Prevenção" },
  { id: "pr3",  nome: "Restauração de resina",     codigo_tuss: "99999002", valor: 380,   duracao_minutos: 60, categoria: "Dentística" },
  { id: "pr4",  nome: "Tratamento de canal",       codigo_tuss: "99999003", valor: 1800,  duracao_minutos: 90, categoria: "Endodontia" },
  { id: "pr5",  nome: "Clareamento dental",        codigo_tuss: "99999005", valor: 1200,  duracao_minutos: 60, categoria: "Estética" },
  { id: "pr6",  nome: "Implante unitário",         codigo_tuss: "99999004", valor: 3800,  duracao_minutos: 120, categoria: "Implantodontia" },
  { id: "pr7",  nome: "Coroa de porcelana",        codigo_tuss: "99999010", valor: 2500,  duracao_minutos: 90, categoria: "Prótese" },
  { id: "pr8",  nome: "Aparelho fixo - manutenção",codigo_tuss: "99999007", valor: 250,   duracao_minutos: 30, categoria: "Ortodontia" },
  { id: "pr9",  nome: "Faceta de porcelana",       codigo_tuss: "99999012", valor: 1900,  duracao_minutos: 90, categoria: "Estética" },
  { id: "pr10", nome: "Extração simples",          codigo_tuss: "99999008", valor: 350,   duracao_minutos: 45, categoria: "Cirurgia" },
  { id: "pr11", nome: "Raspagem periodontal",      codigo_tuss: "99999013", valor: 420,   duracao_minutos: 60, categoria: "Periodontia" },
  { id: "pr12", nome: "Radiografia panorâmica",    codigo_tuss: "99999015", valor: 120,   duracao_minutos: 15, categoria: "Diagnóstico" },
];

// ===================== PACIENTES (30) =====================
type Pac = {
  id: string; nome: string; cpf: string; telefone: string; email: string;
  convenio: string; data_nascimento: string;
  status: "ativo" | "inativo" | "novo" | "retorno_pendente";
  tags: string[];
  ultima_consulta: string; dias_sem_consulta: number;
  total_consultas: number; valor_historico: number;
  alergias: string[]; medicamentos_uso: string[]; doencas_preexistentes: string | null;
};

const NOMES_BR = [
  "Ana Beatriz Silva","Carla Mendonça Ribeiro","Mariana Costa","Patrícia Ribeiro","Juliana Martins",
  "Beatriz Oliveira","Camila Rodrigues","Larissa Souza","Renata Barbosa","Aline Castro",
  "Fernanda Dias","Cíntia Pinheiro","Tatiana Moreira","Priscila Gomes","Vanessa Cavalcanti",
  "Bianca Freitas","Carlos Eduardo Pereira","Fernando Almeida","Roberto Carvalho","Lucas Ferreira",
  "Rodrigo Santos","Diego Nascimento","Gabriel Lima","Tiago Mendes","Bruno Araújo",
  "Marcelo Rocha","Vinícius Cardoso","Eduardo Vieira","Henrique Cunha","Felipe Monteiro",
];
const CONV = ["Unimed","Amil Dental","Odontoprev","SulAmérica","Bradesco Saúde","Particular"];

function build(i: number, status: Pac["status"], tags: string[], diasSem: number, totC: number, valH: number): Pac {
  const nome = NOMES_BR[i];
  return {
    id: `pa${i + 1}`,
    nome,
    cpf: `${100 + i}.${200 + i}.${300 + i}-${(10 + i) % 100}`,
    telefone: `(11) 9${String(80000000 + i * 1373).padStart(8, "0").slice(0, 8)}`,
    email: `${nome.split(" ")[0].toLowerCase()}@email.com`,
    convenio: CONV[i % CONV.length],
    data_nascimento: format(subMonths(today, 240 + i * 7), "yyyy-MM-dd"),
    status, tags,
    ultima_consulta: format(subDays(today, diasSem), "yyyy-MM-dd"),
    dias_sem_consulta: diasSem,
    total_consultas: totC,
    valor_historico: valH,
    alergias: i % 5 === 0 ? ["Penicilina"] : i % 7 === 0 ? ["Látex"] : [],
    medicamentos_uso: i % 6 === 0 ? ["Losartana"] : i % 8 === 0 ? ["Sinvastatina"] : [],
    doencas_preexistentes: i % 9 === 0 ? "Hipertensão" : i % 11 === 0 ? "Diabetes tipo 2" : null,
  };
}

export const demoPacientes: Pac[] = [
  // 18 ativos
  build(0,  "ativo", ["vip","recorrente"], 8,  24, 18400),
  build(1,  "ativo", ["vip"], 12, 18, 22500),
  build(2,  "ativo", ["recorrente"], 5, 32, 11800),
  build(3,  "ativo", ["recorrente","revisao_pendente"], 22, 14, 6800),
  build(4,  "ativo", [], 18, 8, 4200),
  build(5,  "ativo", ["vip","recorrente"], 9, 28, 16200),
  build(6,  "ativo", ["recorrente"], 14, 22, 9400),
  build(7,  "ativo", [], 26, 6, 2800),
  build(8,  "ativo", ["recorrente"], 3, 19, 7800),
  build(9,  "ativo", ["vip"], 11, 21, 19600),
  build(10, "ativo", ["recorrente"], 17, 11, 5400),
  build(11, "ativo", [], 28, 7, 3200),
  build(12, "ativo", ["recorrente","revisao_pendente"], 20, 13, 6100),
  build(13, "ativo", ["vip","recorrente"], 7, 26, 14200),
  build(14, "ativo", [], 24, 9, 4800),
  build(15, "ativo", ["recorrente"], 16, 15, 6700),
  build(16, "ativo", ["vip"], 13, 17, 11900),
  build(17, "ativo", ["recorrente","revisao_pendente"], 21, 12, 5600),
  // 8 inativos (>60 dias)
  build(18, "inativo", ["inativo","vip"], 68, 18, 12800),
  build(19, "inativo", ["inativo"], 82, 9, 3400),
  build(20, "inativo", ["inativo","tratamento_pausado"], 95, 14, 9200),
  build(21, "inativo", ["inativo","vip"], 75, 21, 15600),
  build(22, "inativo", ["inativo"], 110, 6, 1800),
  build(23, "inativo", ["inativo","tratamento_pausado"], 88, 11, 7400),
  build(24, "inativo", ["inativo"], 72, 8, 2900),
  build(25, "inativo", ["inativo","vip"], 102, 16, 10200),
  // 4 novos
  build(26, "novo", ["novo"], 2, 1, 150),
  build(27, "novo", ["novo"], 5, 1, 150),
  build(28, "novo", ["novo"], 1, 1, 150),
  build(29, "novo", ["novo"], 7, 2, 480),
];

// ===================== CONSULTAS DE HOJE (12) =====================
const tdy = format(today, "yyyy-MM-dd");
const PROCS_NM = ["Limpeza","Avaliação","Restauração","Canal","Manutenção Ortodontia","Clareamento","Implante - 2ª etapa","Coroa","Faceta","Extração"];
const STATUS_HJ = ["concluida","concluida","concluida","em_atendimento","agendada","confirmada","confirmada","agendada","agendada","faltou","agendada","confirmada"];
const HORAS_HJ  = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","13:30","14:00","14:30","16:00","17:30"];

export const consultasHoje = HORAS_HJ.map((hora, i) => {
  const pac = demoPacientes[i];
  const prof = demoProfissionais[i % 4];
  const proc = PROCS_NM[i % PROCS_NM.length];
  return {
    id: `ch${i}`, paciente_id: pac.id, paciente_nome: pac.nome,
    profissional_id: prof.id, profissional_nome: prof.nome,
    procedimento: proc, data: tdy, hora,
    status: STATUS_HJ[i], tipo: "consulta",
    valor_total: prof.valor_consulta + (i % 3) * 80,
  };
});

// Outras consultas (semana inteira + histórico)
const STATUS_W = ["agendada","confirmada","concluida","concluida","concluida","cancelada","faltou"];
export const demoConsultas = [
  ...consultasHoje,
  ...Array.from({ length: 78 }).map((_, i) => {
    const pac = demoPacientes[i % demoPacientes.length];
    const prof = demoProfissionais[i % 4];
    const offset = ((i % 21) - 14);
    const st = offset > 0 ? (i % 3 === 0 ? "confirmada" : "agendada") : STATUS_W[i % STATUS_W.length];
    return {
      id: `c${i + 1}`, paciente_id: pac.id, paciente_nome: pac.nome,
      profissional_id: prof.id, profissional_nome: prof.nome,
      procedimento: PROCS_NM[i % PROCS_NM.length],
      data: d(offset),
      hora: `${String(8 + (i % 9)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`,
      status: st, tipo: "consulta",
      valor_total: prof.valor_consulta + (i % 3) * 80,
      prontuario: st === "concluida" ? "Atendimento realizado. Orientações de pós fornecidas." : null,
    };
  }),
];

// ===================== TRATAMENTOS (24) =====================
const TIPOS_T = [
  "Ortodontia Fixa","Implante Dentário","Tratamento de Canal","Clareamento + Facetas",
  "Coroa de Porcelana","Reabilitação Total","Alinhador Invisível","Prótese Parcial",
];
const ST_T = ["em_andamento","em_andamento","em_andamento","em_andamento","pausado","iniciado","concluido"];

export const demoTratamentos = Array.from({ length: 24 }).map((_, i) => {
  const pac = demoPacientes[i % demoPacientes.length];
  const prof = demoProfissionais[i % 4];
  const tipo = TIPOS_T[i % TIPOS_T.length];
  const status = ST_T[i % ST_T.length];
  const etapas = 4 + (i % 8);
  const concl = status === "concluido" ? etapas : status === "iniciado" ? 0 : Math.floor(etapas * (0.3 + (i % 5) * 0.12));
  return {
    id: `t${i + 1}`,
    paciente_id: pac.id, paciente_nome: pac.nome,
    profissional_id: prof.id, profissional_nome: prof.nome,
    descricao: tipo, tipo,
    dente: ["—","36","11,12,21,22","Arcada superior","47","Todos","14, 15"][i % 7],
    status, data_inicio: d(-(30 + i * 8)),
    proxima_etapa: status === "em_andamento" ? `Etapa ${concl + 1} de ${etapas}` : null,
    valor_total: [4800,6000,1800,8000,2500,14000,12000,3000][i % 8],
    etapas_total: etapas, etapas_concluidas: concl,
    progresso: Math.round((concl / etapas) * 100),
  };
});

// ===================== ORÇAMENTOS (14) =====================
const ST_ORC = ["aprovado","pendente","pendente","enviado","aprovado","recusado","pendente","aprovado","enviado","pendente","pendente","aprovado","recusado","pendente"];

export const demoOrcamentos = Array.from({ length: 14 }).map((_, i) => {
  const pac = demoPacientes[i % demoPacientes.length];
  const prof = demoProfissionais[i % 4];
  const procs = [demoProcedimentos[(i + 2) % demoProcedimentos.length], demoProcedimentos[(i + 5) % demoProcedimentos.length], demoProcedimentos[(i + 7) % demoProcedimentos.length]].slice(0, 1 + (i % 3));
  const itens = procs.map((p) => ({ nome: p.nome, valor: p.valor, qtd: 1 + (i % 2), descricao: p.categoria }));
  const total = itens.reduce((a, it) => a + it.valor * it.qtd, 0);
  const desconto = i % 4 === 0 ? 10 : 0;
  const diasEnv = i * 3 + 1;
  return {
    id: `o${i + 1}`,
    numero: `ORC-${String(i + 1).padStart(3, "0")}`,
    paciente_id: pac.id, paciente_nome: pac.nome,
    profissional_id: prof.id, profissional_nome: prof.nome,
    data: d(-diasEnv),
    validade: d(30 - diasEnv),
    dias_desde_envio: diasEnv,
    status: ST_ORC[i],
    itens, total,
    desconto_pct: desconto,
    total_com_desconto: total - (total * desconto) / 100,
    parcelas: [1, 3, 6, 12][i % 4],
    observacoes: "Pagamento facilitado em até 12x sem juros no cartão.",
  };
});

// ===================== FINANCEIRO (80+) =====================
const CAT_REC = [
  ["Consulta", 180, 320], ["Tratamento", 800, 2500], ["Orçamento", 1500, 4500],
  ["Reembolso", 200, 600], ["Convênio", 150, 280],
] as const;
const CAT_DESP = [
  ["Aluguel", 5500], ["Materiais", 1400], ["Laboratório", 2200],
  ["Marketing", 850], ["Folha pagamento", 13800], ["Equipamentos", 2400],
  ["Energia", 920], ["Internet", 380], ["Limpeza", 480], ["Outros", 320],
] as const;

export const demoFinanceiro = (() => {
  const lst: any[] = [];
  // 60 receitas distribuídas no mês
  for (let i = 0; i < 60; i++) {
    const [cat, min, max] = CAT_REC[i % CAT_REC.length];
    lst.push({
      id: `r${i}`,
      tipo: "receita",
      descricao: `${cat} — ${demoPacientes[i % demoPacientes.length].nome}`,
      categoria: cat,
      valor: Math.round(min + Math.random() * (max - min)),
      data: format(subDays(today, i % 28), "yyyy-MM-dd"),
      forma_pagamento: ["Pix","Cartão crédito","Cartão débito","Dinheiro","Boleto"][i % 5],
      status: i % 9 === 0 ? "pendente" : i % 13 === 0 ? "atrasado" : "pago",
    });
  }
  // 25 despesas
  for (let i = 0; i < 25; i++) {
    const [c, v] = CAT_DESP[i % CAT_DESP.length];
    lst.push({
      id: `dp${i}`,
      tipo: "despesa",
      descricao: c,
      categoria: c,
      valor: v + (i % 5) * 80,
      data: format(subDays(today, (i * 2) % 28), "yyyy-MM-dd"),
      forma_pagamento: "Transferência",
      status: i % 11 === 0 ? "pendente" : "pago",
    });
  }
  return lst;
})();

// ===================== KPIs DEMO =====================
export const DEMO_KPI = {
  consultasHoje: 12,
  consultasSemana: 78,
  consultasMes: 287,
  pacientesAtivos: 412,
  pacientesInativos: 38,
  revisoesPendentes: 18,
  tratamentosAndamento: 24,
  orcamentosPendentes: 14,
  faturamentoMes: 47800,
  aReceber: 18400,
  recebidoMes: 29400,
  despesasMes: 22400,
  ticketMedio: 286,
  taxaOcupacao: 0.82,
  taxaCancelamento: 0.06,
  taxaFaltasHoje: 0.16,
};

// ===================== ALERTAS DASHBOARD =====================
export const DEMO_ALERTAS = [
  { tone: "red",   titulo: "Taxa de faltas alta hoje: 16%",        desc: "2 pacientes faltaram. Considere overbooking nos próximos slots.", cta: "Ver agenda" },
  { tone: "amber", titulo: "8 orçamentos parados há +14 dias",     desc: "Potencial de R$ 23.400 perdido sem follow-up.",                    cta: "Disparar follow-up" },
  { tone: "sky",   titulo: "5 pacientes VIP sem retorno há +60 dias", desc: "Reativar pode gerar R$ 8.500 em consultas.",                  cta: "Reativar" },
  { tone: "green", titulo: "Carla Mendonça confirmou Implante — Etapa 2", desc: "Maior ticket da semana: R$ 3.800.",                       cta: "Ver consulta" },
];

// ===================== AI GROWTH OPORTUNIDADES =====================
export const demoAIOportunidades = [
  {
    id: "ai1",
    icon: "Users",
    tone: "red",
    titulo: "12 pacientes não retornam há +30 dias",
    desc: "Recupere receita reativando agora.",
    impacto: 8500,
    pacientes: demoPacientes.filter((p) => p.dias_sem_consulta > 60).slice(0, 6).map((p) => ({
      nome: p.nome, telefone: p.telefone, dias: p.dias_sem_consulta, valor: p.valor_historico,
    })),
    mensagem: "Olá, [Nome]! 😊 Aqui é da OdontoControl! Notamos que faz um tempinho que não te vemos. Que tal agendar uma revisão? Estamos aqui para cuidar do seu sorriso! 🦷✨",
  },
  {
    id: "ai2",
    icon: "RotateCcw",
    tone: "amber",
    titulo: "8 revisões pendentes",
    desc: "Pacientes que ainda não agendaram revisão semestral.",
    impacto: 1600,
    pacientes: demoPacientes.filter((p) => p.tags.includes("revisao_pendente")).slice(0, 5).map((p) => ({
      nome: p.nome, telefone: p.telefone, dias: p.dias_sem_consulta, valor: p.valor_historico,
    })),
    mensagem: "Olá [Nome]! Está na hora da sua revisão semestral. Posso agendar você essa semana? Temos horários no fim de tarde 😊",
  },
  {
    id: "ai3",
    icon: "Activity",
    tone: "orange",
    titulo: "5 tratamentos pausados há +30 dias",
    desc: "Continue os tratamentos e fecha receita parada.",
    impacto: 24000,
    pacientes: demoTratamentos.filter((t) => t.status === "pausado").slice(0, 4).map((t) => ({
      nome: t.paciente_nome, telefone: "(11) 99000-0000", dias: 35, valor: t.valor_total,
    })),
    mensagem: "Olá [Nome]! Gostaríamos de dar continuidade ao seu tratamento. Temos horários disponíveis essa semana, posso encaixar você?",
  },
  {
    id: "ai4",
    icon: "FileText",
    tone: "teal",
    titulo: "6 orçamentos sem resposta +14 dias",
    desc: "Follow-up gera 32% de aprovação extra.",
    impacto: 13100,
    pacientes: demoOrcamentos.filter((o) => o.status === "pendente" && o.dias_desde_envio > 14).slice(0, 5).map((o) => ({
      nome: o.paciente_nome, telefone: "(11) 99000-0000", dias: o.dias_desde_envio, valor: o.total_com_desconto,
    })),
    mensagem: "Olá [Nome]! Passamos para ver se ficou alguma dúvida sobre o orçamento que apresentamos. Estamos à disposição para conversar e oferecer condições especiais!",
  },
  {
    id: "ai5",
    icon: "Clock",
    tone: "blue",
    titulo: "Horário fraco: Terças e quintas 13h–15h",
    desc: "Apenas 30% dos slots ocupados nesse intervalo.",
    impacto: 4200,
    pacientes: [],
    mensagem: "🎁 Promoção relâmpago! Limpeza profissional + avaliação às terças e quintas, 13h–15h, com 20% OFF. Vagas limitadas, agende já!",
  },
];

// ===================== HISTÓRICO =====================
export const demoHistorico = Array.from({ length: 30 }).map((_, i) => {
  const pac = demoPacientes[i % demoPacientes.length];
  const tipos = ["anamnese","exame","procedimento","observacao","receita"];
  return {
    id: `h${i}`,
    paciente_id: pac.id,
    paciente_nome: pac.nome,
    tipo: tipos[i % tipos.length],
    descricao: [
      "Anamnese inicial realizada.","Radiografia panorâmica solicitada.",
      "Restauração classe II em resina, dente 16.","Paciente relatou melhora da sensibilidade.",
      "Receita de amoxicilina 500mg, 7 dias.",
    ][i % 5],
    data: format(subDays(today, i * 4), "yyyy-MM-dd"),
    profissional_nome: demoProfissionais[i % demoProfissionais.length].nome,
  };
});

// Compat
export const demoData = {
  clinica: demoClinica,
  profissionais: demoProfissionais,
  procedimentos: demoProcedimentos,
  pacientes: demoPacientes,
  consultas: demoConsultas,
  consultasHoje,
  tratamentos: demoTratamentos,
  orcamentos: demoOrcamentos,
  financeiro: demoFinanceiro,
  historico: demoHistorico,
  kpi: DEMO_KPI,
  alertas: DEMO_ALERTAS,
  ai: demoAIOportunidades,
};
