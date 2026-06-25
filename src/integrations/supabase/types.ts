export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          app_name: string | null
          created_at: string
          id: string
          super_admin_emails: string[] | null
          system_settings: Json | null
          updated_at: string
        }
        Insert: {
          app_name?: string | null
          created_at?: string
          id?: string
          super_admin_emails?: string[] | null
          system_settings?: Json | null
          updated_at?: string
        }
        Update: {
          app_name?: string | null
          created_at?: string
          id?: string
          super_admin_emails?: string[] | null
          system_settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      clinica: {
        Row: {
          cnpj: string | null
          cor_primaria: string | null
          created_at: string
          cro_responsavel: string | null
          email: string | null
          endereco: Json | null
          id: string
          logo_url: string | null
          mrr: number
          nome: string
          owner_email: string | null
          owner_nome: string | null
          owner_telefone: string | null
          plano: Database["public"]["Enums"]["plano_enum"]
          slug: string | null
          status: Database["public"]["Enums"]["status_clinica_enum"]
          status_cobranca: Database["public"]["Enums"]["status_cobranca_enum"]
          telefone: string | null
          trial_ate: string | null
          ultimo_acesso: string | null
          updated_at: string
          valor_mensal: number
        }
        Insert: {
          cnpj?: string | null
          cor_primaria?: string | null
          created_at?: string
          cro_responsavel?: string | null
          email?: string | null
          endereco?: Json | null
          id?: string
          logo_url?: string | null
          mrr?: number
          nome: string
          owner_email?: string | null
          owner_nome?: string | null
          owner_telefone?: string | null
          plano?: Database["public"]["Enums"]["plano_enum"]
          slug?: string | null
          status?: Database["public"]["Enums"]["status_clinica_enum"]
          status_cobranca?: Database["public"]["Enums"]["status_cobranca_enum"]
          telefone?: string | null
          trial_ate?: string | null
          ultimo_acesso?: string | null
          updated_at?: string
          valor_mensal?: number
        }
        Update: {
          cnpj?: string | null
          cor_primaria?: string | null
          created_at?: string
          cro_responsavel?: string | null
          email?: string | null
          endereco?: Json | null
          id?: string
          logo_url?: string | null
          mrr?: number
          nome?: string
          owner_email?: string | null
          owner_nome?: string | null
          owner_telefone?: string | null
          plano?: Database["public"]["Enums"]["plano_enum"]
          slug?: string | null
          status?: Database["public"]["Enums"]["status_clinica_enum"]
          status_cobranca?: Database["public"]["Enums"]["status_cobranca_enum"]
          telefone?: string | null
          trial_ate?: string | null
          ultimo_acesso?: string | null
          updated_at?: string
          valor_mensal?: number
        }
        Relationships: []
      }
      consulta: {
        Row: {
          clinica_id: string
          created_at: string
          data: string
          duracao_minutos: number
          hora: string
          id: string
          observacoes: string | null
          paciente_id: string
          paciente_nome: string | null
          procedimentos: Json | null
          profissional_id: string
          profissional_nome: string | null
          prontuario: string | null
          status: Database["public"]["Enums"]["status_consulta_enum"]
          tipo: Database["public"]["Enums"]["tipo_consulta_enum"]
          updated_at: string
          valor_total: number | null
        }
        Insert: {
          clinica_id: string
          created_at?: string
          data: string
          duracao_minutos?: number
          hora: string
          id?: string
          observacoes?: string | null
          paciente_id: string
          paciente_nome?: string | null
          procedimentos?: Json | null
          profissional_id: string
          profissional_nome?: string | null
          prontuario?: string | null
          status?: Database["public"]["Enums"]["status_consulta_enum"]
          tipo?: Database["public"]["Enums"]["tipo_consulta_enum"]
          updated_at?: string
          valor_total?: number | null
        }
        Update: {
          clinica_id?: string
          created_at?: string
          data?: string
          duracao_minutos?: number
          hora?: string
          id?: string
          observacoes?: string | null
          paciente_id?: string
          paciente_nome?: string | null
          procedimentos?: Json | null
          profissional_id?: string
          profissional_nome?: string | null
          prontuario?: string | null
          status?: Database["public"]["Enums"]["status_consulta_enum"]
          tipo?: Database["public"]["Enums"]["tipo_consulta_enum"]
          updated_at?: string
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "consulta_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consulta_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "paciente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consulta_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissional"
            referencedColumns: ["id"]
          },
        ]
      }
      financeiro: {
        Row: {
          categoria: string | null
          clinica_id: string
          consulta_id: string | null
          created_at: string
          data: string
          descricao: string
          forma_pagamento: string | null
          id: string
          orcamento_id: string | null
          paciente_id: string | null
          parcela_atual: number
          status: Database["public"]["Enums"]["status_financeiro_enum"]
          tipo: Database["public"]["Enums"]["tipo_financeiro_enum"]
          total_parcelas: number
          updated_at: string
          valor: number
          vencimento: string | null
        }
        Insert: {
          categoria?: string | null
          clinica_id: string
          consulta_id?: string | null
          created_at?: string
          data: string
          descricao: string
          forma_pagamento?: string | null
          id?: string
          orcamento_id?: string | null
          paciente_id?: string | null
          parcela_atual?: number
          status?: Database["public"]["Enums"]["status_financeiro_enum"]
          tipo?: Database["public"]["Enums"]["tipo_financeiro_enum"]
          total_parcelas?: number
          updated_at?: string
          valor: number
          vencimento?: string | null
        }
        Update: {
          categoria?: string | null
          clinica_id?: string
          consulta_id?: string | null
          created_at?: string
          data?: string
          descricao?: string
          forma_pagamento?: string | null
          id?: string
          orcamento_id?: string | null
          paciente_id?: string | null
          parcela_atual?: number
          status?: Database["public"]["Enums"]["status_financeiro_enum"]
          tipo?: Database["public"]["Enums"]["tipo_financeiro_enum"]
          total_parcelas?: number
          updated_at?: string
          valor?: number
          vencimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_consulta_id_fkey"
            columns: ["consulta_id"]
            isOneToOne: false
            referencedRelation: "consulta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "paciente"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_clinica: {
        Row: {
          anexos: string[] | null
          clinica_id: string
          created_at: string
          data: string
          descricao: string
          id: string
          paciente_id: string
          profissional_id: string | null
          profissional_nome: string | null
          tipo: Database["public"]["Enums"]["tipo_historico_enum"]
          updated_at: string
        }
        Insert: {
          anexos?: string[] | null
          clinica_id: string
          created_at?: string
          data: string
          descricao: string
          id?: string
          paciente_id: string
          profissional_id?: string | null
          profissional_nome?: string | null
          tipo: Database["public"]["Enums"]["tipo_historico_enum"]
          updated_at?: string
        }
        Update: {
          anexos?: string[] | null
          clinica_id?: string
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          paciente_id?: string
          profissional_id?: string | null
          profissional_nome?: string | null
          tipo?: Database["public"]["Enums"]["tipo_historico_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_clinica_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_clinica_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "paciente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_clinica_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissional"
            referencedColumns: ["id"]
          },
        ]
      }
      membro_equipe: {
        Row: {
          ativo: boolean
          clinica_id: string
          created_at: string
          email: string
          id: string
          must_change_password: boolean
          nome: string
          role: Database["public"]["Enums"]["role_enum"]
          ultimo_login: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          clinica_id: string
          created_at?: string
          email: string
          id?: string
          must_change_password?: boolean
          nome: string
          role?: Database["public"]["Enums"]["role_enum"]
          ultimo_login?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          clinica_id?: string
          created_at?: string
          email?: string
          id?: string
          must_change_password?: boolean
          nome?: string
          role?: Database["public"]["Enums"]["role_enum"]
          ultimo_login?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membro_equipe_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamento: {
        Row: {
          clinica_id: string
          created_at: string
          data: string
          desconto_pct: number
          id: string
          itens: Json | null
          numero: string | null
          observacoes: string | null
          paciente_id: string
          paciente_nome: string | null
          parcelas: number
          profissional_id: string | null
          status: Database["public"]["Enums"]["status_orcamento_enum"]
          total: number | null
          total_com_desconto: number | null
          updated_at: string
          validade: string | null
        }
        Insert: {
          clinica_id: string
          created_at?: string
          data: string
          desconto_pct?: number
          id?: string
          itens?: Json | null
          numero?: string | null
          observacoes?: string | null
          paciente_id: string
          paciente_nome?: string | null
          parcelas?: number
          profissional_id?: string | null
          status?: Database["public"]["Enums"]["status_orcamento_enum"]
          total?: number | null
          total_com_desconto?: number | null
          updated_at?: string
          validade?: string | null
        }
        Update: {
          clinica_id?: string
          created_at?: string
          data?: string
          desconto_pct?: number
          id?: string
          itens?: Json | null
          numero?: string | null
          observacoes?: string | null
          paciente_id?: string
          paciente_nome?: string | null
          parcelas?: number
          profissional_id?: string | null
          status?: Database["public"]["Enums"]["status_orcamento_enum"]
          total?: number | null
          total_com_desconto?: number | null
          updated_at?: string
          validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamento_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "paciente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamento_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissional"
            referencedColumns: ["id"]
          },
        ]
      }
      paciente: {
        Row: {
          alergias: string[] | null
          ativo: boolean
          clinica_id: string
          convenio: string | null
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          doencas_preexistentes: string | null
          email: string | null
          endereco: Json | null
          foto_url: string | null
          id: string
          medicamentos_uso: string[] | null
          nome: string
          numero_convenio: string | null
          observacoes_anamnese: string | null
          profissao: string | null
          rg: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          alergias?: string[] | null
          ativo?: boolean
          clinica_id: string
          convenio?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          doencas_preexistentes?: string | null
          email?: string | null
          endereco?: Json | null
          foto_url?: string | null
          id?: string
          medicamentos_uso?: string[] | null
          nome: string
          numero_convenio?: string | null
          observacoes_anamnese?: string | null
          profissao?: string | null
          rg?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          alergias?: string[] | null
          ativo?: boolean
          clinica_id?: string
          convenio?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          doencas_preexistentes?: string | null
          email?: string | null
          endereco?: Json | null
          foto_url?: string | null
          id?: string
          medicamentos_uso?: string[] | null
          nome?: string
          numero_convenio?: string | null
          observacoes_anamnese?: string | null
          profissao?: string | null
          rg?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "paciente_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
        ]
      }
      procedimento: {
        Row: {
          ativo: boolean
          categoria: string | null
          clinica_id: string
          codigo_tuss: string | null
          created_at: string
          descricao: string | null
          duracao_minutos: number
          especialidade: string | null
          id: string
          nome: string
          updated_at: string
          valor: number
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          clinica_id: string
          codigo_tuss?: string | null
          created_at?: string
          descricao?: string | null
          duracao_minutos?: number
          especialidade?: string | null
          id?: string
          nome: string
          updated_at?: string
          valor: number
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          clinica_id?: string
          codigo_tuss?: string | null
          created_at?: string
          descricao?: string | null
          duracao_minutos?: number
          especialidade?: string | null
          id?: string
          nome?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "procedimento_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
        ]
      }
      profissional: {
        Row: {
          ativo: boolean
          clinica_id: string
          created_at: string
          cro_numero: string | null
          cro_uf: string | null
          email: string | null
          especialidade:
            | Database["public"]["Enums"]["especialidade_enum"]
            | null
          foto_url: string | null
          id: string
          nome: string
          percentual_repasse: number
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          clinica_id: string
          created_at?: string
          cro_numero?: string | null
          cro_uf?: string | null
          email?: string | null
          especialidade?:
            | Database["public"]["Enums"]["especialidade_enum"]
            | null
          foto_url?: string | null
          id?: string
          nome: string
          percentual_repasse?: number
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          clinica_id?: string
          created_at?: string
          cro_numero?: string | null
          cro_uf?: string | null
          email?: string | null
          especialidade?:
            | Database["public"]["Enums"]["especialidade_enum"]
            | null
          foto_url?: string | null
          id?: string
          nome?: string
          percentual_repasse?: number
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profissional_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
        ]
      }
      tratamento: {
        Row: {
          clinica_id: string
          created_at: string
          data_conclusao: string | null
          data_inicio: string | null
          dente: string | null
          descricao: string
          id: string
          observacoes: string | null
          paciente_id: string
          paciente_nome: string | null
          profissional_id: string | null
          profissional_nome: string | null
          status: Database["public"]["Enums"]["status_tratamento_enum"]
          updated_at: string
          valor_total: number | null
        }
        Insert: {
          clinica_id: string
          created_at?: string
          data_conclusao?: string | null
          data_inicio?: string | null
          dente?: string | null
          descricao: string
          id?: string
          observacoes?: string | null
          paciente_id: string
          paciente_nome?: string | null
          profissional_id?: string | null
          profissional_nome?: string | null
          status?: Database["public"]["Enums"]["status_tratamento_enum"]
          updated_at?: string
          valor_total?: number | null
        }
        Update: {
          clinica_id?: string
          created_at?: string
          data_conclusao?: string | null
          data_inicio?: string | null
          dente?: string | null
          descricao?: string
          id?: string
          observacoes?: string | null
          paciente_id?: string
          paciente_nome?: string | null
          profissional_id?: string | null
          profissional_nome?: string | null
          status?: Database["public"]["Enums"]["status_tratamento_enum"]
          updated_at?: string
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tratamento_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tratamento_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "paciente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tratamento_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissional"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      is_clinica_admin: { Args: { _clinica_id: string }; Returns: boolean }
      user_clinica_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      especialidade_enum:
        | "Clinico_geral"
        | "Ortodontia"
        | "Implantodontia"
        | "Endodontia"
        | "Periodontia"
        | "Estetica"
        | "Cirurgia"
        | "Outro"
      plano_enum: "starter" | "pro" | "premium"
      role_enum:
        | "owner"
        | "admin"
        | "dentista"
        | "recepcionista"
        | "auxiliar"
        | "financeiro"
        | "demo"
      status_clinica_enum: "ativo" | "trial" | "bloqueado"
      status_cobranca_enum: "ativo" | "inadimplente" | "suspenso"
      status_consulta_enum:
        | "agendada"
        | "confirmada"
        | "em_atendimento"
        | "concluida"
        | "cancelada"
        | "faltou"
      status_financeiro_enum: "pendente" | "pago" | "atrasado" | "cancelado"
      status_orcamento_enum:
        | "pendente"
        | "aprovado"
        | "recusado"
        | "em_negociacao"
      status_tratamento_enum:
        | "planejado"
        | "em_andamento"
        | "concluido"
        | "cancelado"
      tipo_consulta_enum:
        | "avaliacao"
        | "consulta"
        | "retorno"
        | "procedimento"
        | "urgencia"
      tipo_financeiro_enum: "receita" | "despesa"
      tipo_historico_enum:
        | "anamnese"
        | "exame"
        | "procedimento"
        | "observacao"
        | "receita"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      especialidade_enum: [
        "Clinico_geral",
        "Ortodontia",
        "Implantodontia",
        "Endodontia",
        "Periodontia",
        "Estetica",
        "Cirurgia",
        "Outro",
      ],
      plano_enum: ["starter", "pro", "premium"],
      role_enum: [
        "owner",
        "admin",
        "dentista",
        "recepcionista",
        "auxiliar",
        "financeiro",
        "demo",
      ],
      status_clinica_enum: ["ativo", "trial", "bloqueado"],
      status_cobranca_enum: ["ativo", "inadimplente", "suspenso"],
      status_consulta_enum: [
        "agendada",
        "confirmada",
        "em_atendimento",
        "concluida",
        "cancelada",
        "faltou",
      ],
      status_financeiro_enum: ["pendente", "pago", "atrasado", "cancelado"],
      status_orcamento_enum: [
        "pendente",
        "aprovado",
        "recusado",
        "em_negociacao",
      ],
      status_tratamento_enum: [
        "planejado",
        "em_andamento",
        "concluido",
        "cancelado",
      ],
      tipo_consulta_enum: [
        "avaliacao",
        "consulta",
        "retorno",
        "procedimento",
        "urgencia",
      ],
      tipo_financeiro_enum: ["receita", "despesa"],
      tipo_historico_enum: [
        "anamnese",
        "exame",
        "procedimento",
        "observacao",
        "receita",
      ],
    },
  },
} as const
