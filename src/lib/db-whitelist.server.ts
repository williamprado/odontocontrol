export interface TableConfig {
  table: string;
  allowedOperations: ("select" | "insert" | "update" | "delete")[];
  allowedColumns: string[];
  tenantColumn?: string;
  requireTenantScope: boolean;
  publicRules?: {
    select?: boolean;
    insert?: boolean;
    update?: boolean;
    delete?: boolean;
  };
}

export const DB_TABLES: Record<string, TableConfig> = {
  app_config: {
    table: "app_config",
    allowedOperations: ["select", "update"],
    allowedColumns: [
      "id",
      "super_admin_emails",
      "app_name",
      "system_settings",
      "created_at",
      "updated_at"
    ],
    requireTenantScope: false, // Global configuration
  },
  clinica: {
    table: "clinica",
    allowedOperations: ["select", "insert", "update"],
    allowedColumns: [
      "id",
      "nome",
      "cnpj",
      "cro_responsavel",
      "slug",
      "telefone",
      "email",
      "endereco",
      "owner_nome",
      "owner_email",
      "owner_telefone",
      "plano",
      "status",
      "trial_ate",
      "logo_url",
      "cor_primaria",
      "created_at",
      "updated_at",
      "status_cobranca",
      "valor_mensal",
      "mrr",
      "ultimo_acesso"
    ],
    tenantColumn: "id", // The clinic ID itself is the primary key
    requireTenantScope: true,
    publicRules: {
      select: true // Guests can read clinic config filtering by slug
    }
  },
  membro_equipe: {
    table: "membro_equipe",
    allowedOperations: ["select", "insert", "update"],
    allowedColumns: [
      "id",
      "clinica_id",
      "user_id",
      "nome",
      "email",
      "role",
      "ativo",
      "ultimo_login",
      "created_at",
      "updated_at",
      "must_change_password"
    ],
    tenantColumn: "clinica_id",
    requireTenantScope: true,
  },
  profissional: {
    table: "profissional",
    allowedOperations: ["select", "insert", "update", "delete"],
    allowedColumns: [
      "id",
      "clinica_id",
      "nome",
      "especialidade",
      "cro_numero",
      "cro_uf",
      "telefone",
      "email",
      "ativo",
      "percentual_repasse",
      "foto_url",
      "created_at",
      "updated_at"
    ],
    tenantColumn: "clinica_id",
    requireTenantScope: true,
    publicRules: {
      select: true // Guests can query clinic professionals for scheduling
    }
  },
  paciente: {
    table: "paciente",
    allowedOperations: ["select", "insert", "update", "delete"],
    allowedColumns: [
      "id",
      "clinica_id",
      "nome",
      "cpf",
      "rg",
      "data_nascimento",
      "telefone",
      "email",
      "endereco",
      "profissao",
      "convenio",
      "numero_convenio",
      "foto_url",
      "alergias",
      "medicamentos_uso",
      "doencas_preexistentes",
      "observacoes_anamnese",
      "ativo",
      "created_at",
      "updated_at"
    ],
    tenantColumn: "clinica_id",
    requireTenantScope: true,
    publicRules: {
      insert: true // Guests can create patient record during booking
    }
  },
  procedimento: {
    table: "procedimento",
    allowedOperations: ["select", "insert", "update", "delete"],
    allowedColumns: [
      "id",
      "clinica_id",
      "nome",
      "codigo_tuss",
      "descricao",
      "valor",
      "duracao_minutos",
      "especialidade",
      "categoria",
      "ativo",
      "created_at",
      "updated_at"
    ],
    tenantColumn: "clinica_id",
    requireTenantScope: true,
    publicRules: {
      select: true // Guests can query clinic procedures for scheduling
    }
  },
  consulta: {
    table: "consulta",
    allowedOperations: ["select", "insert", "update", "delete"],
    allowedColumns: [
      "id",
      "clinica_id",
      "paciente_id",
      "paciente_nome",
      "profissional_id",
      "profissional_nome",
      "data",
      "hora",
      "duracao_minutos",
      "tipo",
      "status",
      "procedimentos",
      "valor_total",
      "observacoes",
      "prontuario",
      "created_at",
      "updated_at"
    ],
    tenantColumn: "clinica_id",
    requireTenantScope: true,
    publicRules: {
      insert: true // Guests can book appointment (restricted to status = 'agendada' in server)
    }
  },
  tratamento: {
    table: "tratamento",
    allowedOperations: ["select", "insert", "update", "delete"],
    allowedColumns: [
      "id",
      "clinica_id",
      "paciente_id",
      "paciente_nome",
      "profissional_id",
      "profissional_nome",
      "descricao",
      "dente",
      "status",
      "data_inicio",
      "data_conclusao",
      "valor_total",
      "observacoes",
      "created_at",
      "updated_at"
    ],
    tenantColumn: "clinica_id",
    requireTenantScope: true,
  },
  orcamento: {
    table: "orcamento",
    allowedOperations: ["select", "insert", "update", "delete"],
    allowedColumns: [
      "id",
      "clinica_id",
      "paciente_id",
      "paciente_nome",
      "profissional_id",
      "numero",
      "data",
      "validade",
      "status",
      "total",
      "total_com_desconto",
      "desconto_pct",
      "itens",
      "parcelas",
      "observacoes",
      "created_at",
      "updated_at"
    ],
    tenantColumn: "clinica_id",
    requireTenantScope: true,
  },
  historico_clinica: {
    table: "historico_clinica",
    allowedOperations: ["select", "insert", "update", "delete"],
    allowedColumns: [
      "id",
      "clinica_id",
      "paciente_id",
      "data",
      "tipo",
      "descricao",
      "profissional_id",
      "profissional_nome",
      "anexos",
      "created_at",
      "updated_at"
    ],
    tenantColumn: "clinica_id",
    requireTenantScope: true,
  },
  financeiro: {
    table: "financeiro",
    allowedOperations: ["select", "insert", "update", "delete"],
    allowedColumns: [
      "id",
      "clinica_id",
      "descricao",
      "tipo",
      "valor",
      "data",
      "vencimento",
      "categoria",
      "forma_pagamento",
      "paciente_id",
      "consulta_id",
      "orcamento_id",
      "status",
      "parcela_atual",
      "total_parcelas",
      "created_at",
      "updated_at"
    ],
    tenantColumn: "clinica_id",
    requireTenantScope: true,
  }
};
