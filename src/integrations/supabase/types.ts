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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ativo_status_logs: {
        Row: {
          acao: string
          ativo_id: string
          created_at: string | null
          id: string
          observacao: string | null
          usuario_id: string
        }
        Insert: {
          acao: string
          ativo_id: string
          created_at?: string | null
          id?: string
          observacao?: string | null
          usuario_id: string
        }
        Update: {
          acao?: string
          ativo_id?: string
          created_at?: string | null
          id?: string
          observacao?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ativo_status_logs_ativo_id_fkey"
            columns: ["ativo_id"]
            isOneToOne: false
            referencedRelation: "ativo_historico_manutencao"
            referencedColumns: ["ativo_id"]
          },
          {
            foreignKeyName: "ativo_status_logs_ativo_id_fkey"
            columns: ["ativo_id"]
            isOneToOne: false
            referencedRelation: "ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ativo_status_logs_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      ativo_tipos: {
        Row: {
          checklist_default: Json | null
          conf_tipo: string | null
          created_at: string | null
          criticidade: string | null
          id: string
          impacta_conformidade: boolean
          is_conformidade: boolean
          nome: string
          periodicidade_default: string | null
          sistema_manutencao: string | null
          slug: string | null
        }
        Insert: {
          checklist_default?: Json | null
          conf_tipo?: string | null
          created_at?: string | null
          criticidade?: string | null
          id?: string
          impacta_conformidade?: boolean
          is_conformidade?: boolean
          nome: string
          periodicidade_default?: string | null
          sistema_manutencao?: string | null
          slug?: string | null
        }
        Update: {
          checklist_default?: Json | null
          conf_tipo?: string | null
          created_at?: string | null
          criticidade?: string | null
          id?: string
          impacta_conformidade?: boolean
          is_conformidade?: boolean
          nome?: string
          periodicidade_default?: string | null
          sistema_manutencao?: string | null
          slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ativo_tipos_conf_tipo_fkey"
            columns: ["conf_tipo"]
            isOneToOne: false
            referencedRelation: "conf_categorias"
            referencedColumns: ["slug"]
          },
        ]
      }
      ativos: {
        Row: {
          andar: string | null
          condominio_id: string | null
          created_at: string | null
          data_instalacao: string | null
          descricao: string | null
          extintor_capacidade: string | null
          extintor_tipo: string | null
          fabricante: string | null
          id: string
          identificador: string | null
          is_ativo: boolean | null
          local: string | null
          modelo: string | null
          nome: string
          numero_serie: string | null
          observacoes: string | null
          requer_conformidade: boolean | null
          tipo_id: string | null
          tipo_uso: string | null
          torre: string | null
          validade_carga: string | null
          validade_teste_hidrostatico: string | null
          zona_localizacao: string | null
        }
        Insert: {
          andar?: string | null
          condominio_id?: string | null
          created_at?: string | null
          data_instalacao?: string | null
          descricao?: string | null
          extintor_capacidade?: string | null
          extintor_tipo?: string | null
          fabricante?: string | null
          id?: string
          identificador?: string | null
          is_ativo?: boolean | null
          local?: string | null
          modelo?: string | null
          nome: string
          numero_serie?: string | null
          observacoes?: string | null
          requer_conformidade?: boolean | null
          tipo_id?: string | null
          tipo_uso?: string | null
          torre?: string | null
          validade_carga?: string | null
          validade_teste_hidrostatico?: string | null
          zona_localizacao?: string | null
        }
        Update: {
          andar?: string | null
          condominio_id?: string | null
          created_at?: string | null
          data_instalacao?: string | null
          descricao?: string | null
          extintor_capacidade?: string | null
          extintor_tipo?: string | null
          fabricante?: string | null
          id?: string
          identificador?: string | null
          is_ativo?: boolean | null
          local?: string | null
          modelo?: string | null
          nome?: string
          numero_serie?: string | null
          observacoes?: string | null
          requer_conformidade?: boolean | null
          tipo_id?: string | null
          tipo_uso?: string | null
          torre?: string | null
          validade_carga?: string | null
          validade_teste_hidrostatico?: string | null
          zona_localizacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ativos_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ativos_tipo_id_fkey"
            columns: ["tipo_id"]
            isOneToOne: false
            referencedRelation: "ativo_tipos"
            referencedColumns: ["id"]
          },
        ]
      }
      chamados: {
        Row: {
          ativo_id: string | null
          categoria: string | null
          condominio_id: string | null
          created_at: string
          criado_por: string | null
          descricao: string | null
          id: string
          local: string | null
          prioridade: string | null
          status: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          ativo_id?: string | null
          categoria?: string | null
          condominio_id?: string | null
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          id?: string
          local?: string | null
          prioridade?: string | null
          status?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          ativo_id?: string | null
          categoria?: string | null
          condominio_id?: string | null
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          id?: string
          local?: string | null
          prioridade?: string | null
          status?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chamados_ativo_id_fkey"
            columns: ["ativo_id"]
            isOneToOne: false
            referencedRelation: "ativo_historico_manutencao"
            referencedColumns: ["ativo_id"]
          },
          {
            foreignKeyName: "chamados_ativo_id_fkey"
            columns: ["ativo_id"]
            isOneToOne: false
            referencedRelation: "ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamados_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamados_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      condominio_config: {
        Row: {
          condominio_id: string
          created_at: string
          endereco: string | null
          id: string
          nome: string
          unidades: number | null
          updated_at: string
        }
        Insert: {
          condominio_id: string
          created_at?: string
          endereco?: string | null
          id?: string
          nome: string
          unidades?: number | null
          updated_at?: string
        }
        Update: {
          condominio_id?: string
          created_at?: string
          endereco?: string | null
          id?: string
          nome?: string
          unidades?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "condominio_config_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: true
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      condominio_template_overrides: {
        Row: {
          checklist_adicional: Json | null
          condominio_id: string | null
          created_at: string | null
          documentos_adicionais: string[] | null
          id: string
          observacoes: string | null
          periodicidade_customizada: unknown
          template_id: string | null
        }
        Insert: {
          checklist_adicional?: Json | null
          condominio_id?: string | null
          created_at?: string | null
          documentos_adicionais?: string[] | null
          id?: string
          observacoes?: string | null
          periodicidade_customizada?: unknown
          template_id?: string | null
        }
        Update: {
          checklist_adicional?: Json | null
          condominio_id?: string | null
          created_at?: string | null
          documentos_adicionais?: string[] | null
          id?: string
          observacoes?: string | null
          periodicidade_customizada?: unknown
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "condominio_template_overrides_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condominio_template_overrides_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "manut_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      condominios: {
        Row: {
          created_at: string | null
          endereco: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          endereco?: string | null
          id?: string
          nome: string
        }
        Update: {
          created_at?: string | null
          endereco?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      conf_categorias: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          slug: string
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          slug?: string
        }
        Relationships: []
      }
      conformidade_anexos: {
        Row: {
          created_at: string | null
          documento_tipo_id: string | null
          file_path: string
          id: string
          item_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          documento_tipo_id?: string | null
          file_path: string
          id?: string
          item_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          documento_tipo_id?: string | null
          file_path?: string
          id?: string
          item_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conformidade_anexos_documento_tipo_id_fkey"
            columns: ["documento_tipo_id"]
            isOneToOne: false
            referencedRelation: "documento_tipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conformidade_anexos_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "conformidade_historico_auditoria"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "conformidade_anexos_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "conformidade_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conformidade_anexos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      conformidade_itens: {
        Row: {
          ativo_id: string | null
          condominio_id: string | null
          conf_categoria_id: string | null
          created_at: string | null
          executado_por: string | null
          id: string
          observacoes: string | null
          periodicidade: unknown
          plano_id: string | null
          proximo: string
          status: Database["public"]["Enums"]["semaforo"]
          tipo: Database["public"]["Enums"]["manut_tipo"]
          ultimo: string | null
          updated_at: string | null
        }
        Insert: {
          ativo_id?: string | null
          condominio_id?: string | null
          conf_categoria_id?: string | null
          created_at?: string | null
          executado_por?: string | null
          id?: string
          observacoes?: string | null
          periodicidade: unknown
          plano_id?: string | null
          proximo: string
          status?: Database["public"]["Enums"]["semaforo"]
          tipo: Database["public"]["Enums"]["manut_tipo"]
          ultimo?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo_id?: string | null
          condominio_id?: string | null
          conf_categoria_id?: string | null
          created_at?: string | null
          executado_por?: string | null
          id?: string
          observacoes?: string | null
          periodicidade?: unknown
          plano_id?: string | null
          proximo?: string
          status?: Database["public"]["Enums"]["semaforo"]
          tipo?: Database["public"]["Enums"]["manut_tipo"]
          ultimo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conformidade_itens_ativo_id_fkey"
            columns: ["ativo_id"]
            isOneToOne: false
            referencedRelation: "ativo_historico_manutencao"
            referencedColumns: ["ativo_id"]
          },
          {
            foreignKeyName: "conformidade_itens_ativo_id_fkey"
            columns: ["ativo_id"]
            isOneToOne: false
            referencedRelation: "ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conformidade_itens_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conformidade_itens_conf_categoria_id_fkey"
            columns: ["conf_categoria_id"]
            isOneToOne: false
            referencedRelation: "conf_categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conformidade_itens_executado_por_fkey"
            columns: ["executado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conformidade_itens_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "calendario_manutencoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conformidade_itens_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos_manutencao"
            referencedColumns: ["id"]
          },
        ]
      }
      conformidade_logs: {
        Row: {
          acao: Database["public"]["Enums"]["conf_acao"]
          created_at: string
          detalhes: Json | null
          id: string
          item_id: string
          usuario_id: string
        }
        Insert: {
          acao: Database["public"]["Enums"]["conf_acao"]
          created_at?: string
          detalhes?: Json | null
          id?: string
          item_id: string
          usuario_id: string
        }
        Update: {
          acao?: Database["public"]["Enums"]["conf_acao"]
          created_at?: string
          detalhes?: Json | null
          id?: string
          item_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conformidade_logs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "conformidade_historico_auditoria"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "conformidade_logs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "conformidade_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conformidade_logs_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      documento_tipos: {
        Row: {
          codigo: string
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          codigo: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          codigo?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      locais: {
        Row: {
          created_at: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      manut_template_documentos: {
        Row: {
          created_at: string | null
          documento_tipo_id: string | null
          id: string
          obrigatorio: boolean | null
          template_id: string | null
        }
        Insert: {
          created_at?: string | null
          documento_tipo_id?: string | null
          id?: string
          obrigatorio?: boolean | null
          template_id?: string | null
        }
        Update: {
          created_at?: string | null
          documento_tipo_id?: string | null
          id?: string
          obrigatorio?: boolean | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manut_template_documentos_documento_tipo_id_fkey"
            columns: ["documento_tipo_id"]
            isOneToOne: false
            referencedRelation: "documento_tipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manut_template_documentos_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "manut_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      manut_templates: {
        Row: {
          checklist: Json | null
          created_at: string | null
          descricao: string | null
          evidencia: string | null
          id: string
          is_conformidade: boolean | null
          periodicidade: unknown
          responsavel: string | null
          sistema: string
          titulo_plano: string
        }
        Insert: {
          checklist?: Json | null
          created_at?: string | null
          descricao?: string | null
          evidencia?: string | null
          id?: string
          is_conformidade?: boolean | null
          periodicidade: unknown
          responsavel?: string | null
          sistema: string
          titulo_plano: string
        }
        Update: {
          checklist?: Json | null
          created_at?: string | null
          descricao?: string | null
          evidencia?: string | null
          id?: string
          is_conformidade?: boolean | null
          periodicidade?: unknown
          responsavel?: string | null
          sistema?: string
          titulo_plano?: string
        }
        Relationships: []
      }
      manutencoes: {
        Row: {
          anexo_path: string | null
          ativo_id: string | null
          created_at: string | null
          descricao: string | null
          executada_em: string | null
          fornecedor_id: string | null
          id: string
          plano_id: string | null
          status: Database["public"]["Enums"]["status_exec"]
          tipo: Database["public"]["Enums"]["manut_tipo"]
          titulo: string
          vencimento: string | null
        }
        Insert: {
          anexo_path?: string | null
          ativo_id?: string | null
          created_at?: string | null
          descricao?: string | null
          executada_em?: string | null
          fornecedor_id?: string | null
          id?: string
          plano_id?: string | null
          status?: Database["public"]["Enums"]["status_exec"]
          tipo?: Database["public"]["Enums"]["manut_tipo"]
          titulo: string
          vencimento?: string | null
        }
        Update: {
          anexo_path?: string | null
          ativo_id?: string | null
          created_at?: string | null
          descricao?: string | null
          executada_em?: string | null
          fornecedor_id?: string | null
          id?: string
          plano_id?: string | null
          status?: Database["public"]["Enums"]["status_exec"]
          tipo?: Database["public"]["Enums"]["manut_tipo"]
          titulo?: string
          vencimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manutencoes_ativo_id_fkey"
            columns: ["ativo_id"]
            isOneToOne: false
            referencedRelation: "ativo_historico_manutencao"
            referencedColumns: ["ativo_id"]
          },
          {
            foreignKeyName: "manutencoes_ativo_id_fkey"
            columns: ["ativo_id"]
            isOneToOne: false
            referencedRelation: "ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manutencoes_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "calendario_manutencoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manutencoes_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos_manutencao"
            referencedColumns: ["id"]
          },
        ]
      }
      nao_conformidades: {
        Row: {
          created_at: string | null
          descricao: string | null
          gerou_os_corretiva_id: string | null
          gravidade: string | null
          id: string
          os_id: string
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          gerou_os_corretiva_id?: string | null
          gravidade?: string | null
          id?: string
          os_id: string
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          gerou_os_corretiva_id?: string | null
          gravidade?: string | null
          id?: string
          os_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nao_conformidades_gerou_os_corretiva_id_fkey"
            columns: ["gerou_os_corretiva_id"]
            isOneToOne: false
            referencedRelation: "os"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nao_conformidades_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "os"
            referencedColumns: ["id"]
          },
        ]
      }
      os: {
        Row: {
          aceite_em: string | null
          ativo_id: string | null
          centro_custo: string | null
          checklist_status: Json | null
          condominio_id: string | null
          created_at: string | null
          custo_aprovado: number | null
          custo_final: number | null
          custo_previsto: number | null
          data_abertura: string
          data_conclusao: string | null
          data_fechamento: string | null
          data_prevista: string | null
          descricao: string | null
          executante_id: string | null
          executor_cnpj: string | null
          executor_contato: string | null
          executor_empresa: string | null
          executor_nome: string | null
          executor_observacoes: string | null
          id: string
          iniciada_por: string | null
          local: string | null
          manutencao_id: string | null
          motivo_reprovacao: string | null
          numero: string | null
          origem: string | null
          pdf_path: string | null
          plano_id: string | null
          prioridade: string
          responsavel: string | null
          sla_vencimento: string | null
          solicitante_id: string | null
          status: string
          tipo_executor: string | null
          titulo: string
          updated_at: string | null
          validado_em: string | null
          validado_por: string | null
        }
        Insert: {
          aceite_em?: string | null
          ativo_id?: string | null
          centro_custo?: string | null
          checklist_status?: Json | null
          condominio_id?: string | null
          created_at?: string | null
          custo_aprovado?: number | null
          custo_final?: number | null
          custo_previsto?: number | null
          data_abertura?: string
          data_conclusao?: string | null
          data_fechamento?: string | null
          data_prevista?: string | null
          descricao?: string | null
          executante_id?: string | null
          executor_cnpj?: string | null
          executor_contato?: string | null
          executor_empresa?: string | null
          executor_nome?: string | null
          executor_observacoes?: string | null
          id?: string
          iniciada_por?: string | null
          local?: string | null
          manutencao_id?: string | null
          motivo_reprovacao?: string | null
          numero?: string | null
          origem?: string | null
          pdf_path?: string | null
          plano_id?: string | null
          prioridade?: string
          responsavel?: string | null
          sla_vencimento?: string | null
          solicitante_id?: string | null
          status?: string
          tipo_executor?: string | null
          titulo: string
          updated_at?: string | null
          validado_em?: string | null
          validado_por?: string | null
        }
        Update: {
          aceite_em?: string | null
          ativo_id?: string | null
          centro_custo?: string | null
          checklist_status?: Json | null
          condominio_id?: string | null
          created_at?: string | null
          custo_aprovado?: number | null
          custo_final?: number | null
          custo_previsto?: number | null
          data_abertura?: string
          data_conclusao?: string | null
          data_fechamento?: string | null
          data_prevista?: string | null
          descricao?: string | null
          executante_id?: string | null
          executor_cnpj?: string | null
          executor_contato?: string | null
          executor_empresa?: string | null
          executor_nome?: string | null
          executor_observacoes?: string | null
          id?: string
          iniciada_por?: string | null
          local?: string | null
          manutencao_id?: string | null
          motivo_reprovacao?: string | null
          numero?: string | null
          origem?: string | null
          pdf_path?: string | null
          plano_id?: string | null
          prioridade?: string
          responsavel?: string | null
          sla_vencimento?: string | null
          solicitante_id?: string | null
          status?: string
          tipo_executor?: string | null
          titulo?: string
          updated_at?: string | null
          validado_em?: string | null
          validado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "os_ativo_id_fkey"
            columns: ["ativo_id"]
            isOneToOne: false
            referencedRelation: "ativo_historico_manutencao"
            referencedColumns: ["ativo_id"]
          },
          {
            foreignKeyName: "os_ativo_id_fkey"
            columns: ["ativo_id"]
            isOneToOne: false
            referencedRelation: "ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_executante_id_fkey"
            columns: ["executante_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_iniciada_por_fkey"
            columns: ["iniciada_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_manutencao_id_fkey"
            columns: ["manutencao_id"]
            isOneToOne: false
            referencedRelation: "ativo_historico_manutencao"
            referencedColumns: ["manutencao_id"]
          },
          {
            foreignKeyName: "os_manutencao_id_fkey"
            columns: ["manutencao_id"]
            isOneToOne: false
            referencedRelation: "manutencoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "calendario_manutencoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos_manutencao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_validado_por_fkey"
            columns: ["validado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      os_anexos: {
        Row: {
          created_at: string | null
          file_path: string
          id: string
          os_id: string
          tipo_anexo: string | null
        }
        Insert: {
          created_at?: string | null
          file_path: string
          id?: string
          os_id: string
          tipo_anexo?: string | null
        }
        Update: {
          created_at?: string | null
          file_path?: string
          id?: string
          os_id?: string
          tipo_anexo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "os_anexos_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "os"
            referencedColumns: ["id"]
          },
        ]
      }
      os_logs: {
        Row: {
          acao: string
          created_at: string | null
          detalhes: Json | null
          id: string
          os_id: string
          usuario_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string | null
          detalhes?: Json | null
          id?: string
          os_id: string
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string | null
          detalhes?: Json | null
          id?: string
          os_id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "os_logs_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "os"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_logs_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_manutencao: {
        Row: {
          antecedencia_dias: number | null
          ativo_id: string | null
          checklist: Json | null
          condominio_id: string | null
          conf_categoria_id: string | null
          created_at: string | null
          id: string
          is_legal: boolean | null
          periodicidade: unknown
          proxima_execucao: string
          responsavel: string | null
          sla_dias: number | null
          tipo: Database["public"]["Enums"]["manut_tipo"]
          titulo: string
        }
        Insert: {
          antecedencia_dias?: number | null
          ativo_id?: string | null
          checklist?: Json | null
          condominio_id?: string | null
          conf_categoria_id?: string | null
          created_at?: string | null
          id?: string
          is_legal?: boolean | null
          periodicidade: unknown
          proxima_execucao: string
          responsavel?: string | null
          sla_dias?: number | null
          tipo?: Database["public"]["Enums"]["manut_tipo"]
          titulo: string
        }
        Update: {
          antecedencia_dias?: number | null
          ativo_id?: string | null
          checklist?: Json | null
          condominio_id?: string | null
          conf_categoria_id?: string | null
          created_at?: string | null
          id?: string
          is_legal?: boolean | null
          periodicidade?: unknown
          proxima_execucao?: string
          responsavel?: string | null
          sla_dias?: number | null
          tipo?: Database["public"]["Enums"]["manut_tipo"]
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "planos_manutencao_ativo_id_fkey"
            columns: ["ativo_id"]
            isOneToOne: false
            referencedRelation: "ativo_historico_manutencao"
            referencedColumns: ["ativo_id"]
          },
          {
            foreignKeyName: "planos_manutencao_ativo_id_fkey"
            columns: ["ativo_id"]
            isOneToOne: false
            referencedRelation: "ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planos_manutencao_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planos_manutencao_conf_categoria_id_fkey"
            columns: ["conf_categoria_id"]
            isOneToOne: false
            referencedRelation: "conf_categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          auth_user_id: string
          cpf: string | null
          created_at: string | null
          email: string | null
          id: string
          nome: string | null
        }
        Insert: {
          auth_user_id: string
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string | null
        }
        Update: {
          auth_user_id?: string
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string | null
        }
        Relationships: []
      }
      usuarios_condominios: {
        Row: {
          cargo: string | null
          condominio_id: string
          created_at: string | null
          is_principal: boolean | null
          papel: Database["public"]["Enums"]["app_role"]
          usuario_id: string
        }
        Insert: {
          cargo?: string | null
          condominio_id: string
          created_at?: string | null
          is_principal?: boolean | null
          papel: Database["public"]["Enums"]["app_role"]
          usuario_id: string
        }
        Update: {
          cargo?: string | null
          condominio_id?: string
          created_at?: string | null
          is_principal?: boolean | null
          papel?: Database["public"]["Enums"]["app_role"]
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_condominios_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_condominios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      ativo_historico_manutencao: {
        Row: {
          ativo_id: string | null
          ativo_nome: string | null
          condominio_id: string | null
          data_criacao: string | null
          executada_em: string | null
          identificador: string | null
          manutencao_id: string | null
          manutencao_tipo: Database["public"]["Enums"]["manut_tipo"] | null
          manutencao_titulo: string | null
          periodicidade: unknown
          plano_titulo: string | null
          status: Database["public"]["Enums"]["status_exec"] | null
          tipo_uso: string | null
          torre: string | null
          vencimento: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ativos_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      calendario_manutencoes: {
        Row: {
          ativo_nome: string | null
          ativo_tipo: string | null
          condominio_id: string | null
          data_evento: string | null
          id: string | null
          periodicidade: unknown
          requer_conformidade: boolean | null
          status_conformidade: Database["public"]["Enums"]["semaforo"] | null
          status_visual: string | null
          tipo: Database["public"]["Enums"]["manut_tipo"] | null
          titulo: string | null
          ultima_execucao: string | null
        }
        Relationships: [
          {
            foreignKeyName: "planos_manutencao_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      conformidade_historico_auditoria: {
        Row: {
          anexos: Json | null
          ativo_nome: string | null
          condominio_id: string | null
          data_execucao: string | null
          executado_por: string | null
          executado_por_nome: string | null
          item_id: string | null
          manutencao: string | null
          observacoes: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conformidade_itens_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conformidade_itens_executado_por_fkey"
            columns: ["executado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      conf_adiar_proximo: {
        Args: { p_item_id: string; p_motivo?: string; p_nova_data: string }
        Returns: undefined
      }
      conf_registrar_execucao: {
        Args: {
          p_data_execucao: string
          p_item_id: string
          p_observacoes?: string
        }
        Returns: undefined
      }
      generate_maintenance_plans_for_asset: {
        Args: { ativo_id: string }
        Returns: undefined
      }
      generate_os_numero: { Args: { p_condominio_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_auth: {
        Args: {
          _auth_user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      inicializar_ativos_padrao: {
        Args: { p_condominio_id: string }
        Returns: undefined
      }
      is_system_owner: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "sindico"
        | "zelador"
        | "morador"
        | "fornecedor"
        | "funcionario"
        | "conselho"
      conf_acao: "criacao" | "edicao" | "exclusao" | "validacao"
      manut_tipo: "preventiva" | "corretiva" | "preditiva"
      semaforo: "verde" | "amarelo" | "vermelho"
      status_exec: "pendente" | "em_execucao" | "concluida" | "cancelada"
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
      app_role: [
        "admin",
        "sindico",
        "zelador",
        "morador",
        "fornecedor",
        "funcionario",
        "conselho",
      ],
      conf_acao: ["criacao", "edicao", "exclusao", "validacao"],
      manut_tipo: ["preventiva", "corretiva", "preditiva"],
      semaforo: ["verde", "amarelo", "vermelho"],
      status_exec: ["pendente", "em_execucao", "concluida", "cancelada"],
    },
  },
} as const
