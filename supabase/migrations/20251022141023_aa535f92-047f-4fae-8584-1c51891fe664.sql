-- Criar tipos enum
CREATE TYPE public.manut_tipo AS ENUM ('preventiva', 'corretiva', 'preditiva');
CREATE TYPE public.status_exec AS ENUM ('pendente', 'em_execucao', 'concluida', 'cancelada');
CREATE TYPE public.semaforo AS ENUM ('verde', 'amarelo', 'vermelho');
CREATE TYPE public.conf_acao AS ENUM ('criacao', 'edicao', 'exclusao', 'validacao');
CREATE TYPE public.app_role AS ENUM ('admin', 'sindico', 'zelador', 'morador', 'fornecedor');

-- Tabela de condomínios
CREATE TABLE public.condominios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  endereco TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.condominios ENABLE ROW LEVEL SECURITY;

-- Tabela de usuários (perfis)
CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nome TEXT,
  cpf TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Tabela de roles de usuários
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Tabela de relação usuários-condomínios
CREATE TABLE public.usuarios_condominios (
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  papel app_role NOT NULL,
  is_principal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (usuario_id, condominio_id)
);

ALTER TABLE public.usuarios_condominios ENABLE ROW LEVEL SECURITY;

-- Tabela de categorias de conformidade
CREATE TABLE public.conf_categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.conf_categorias ENABLE ROW LEVEL SECURITY;

-- Tabela de tipos de ativos
CREATE TABLE public.ativo_tipos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE,
  impacta_conformidade BOOLEAN NOT NULL DEFAULT FALSE,
  is_conformidade BOOLEAN NOT NULL DEFAULT FALSE,
  criticidade TEXT DEFAULT 'media' CHECK (criticidade IN ('baixa', 'media', 'alta', 'urgente')),
  periodicidade_default TEXT,
  checklist_default JSONB DEFAULT '[]'::jsonb,
  conf_tipo TEXT REFERENCES public.conf_categorias(slug),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ativo_tipos ENABLE ROW LEVEL SECURITY;

-- Tabela de ativos
CREATE TABLE public.ativos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID REFERENCES public.condominios(id) ON DELETE CASCADE,
  tipo_id UUID REFERENCES public.ativo_tipos(id),
  nome TEXT NOT NULL,
  descricao TEXT,
  local TEXT,
  fabricante TEXT,
  modelo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ativos ENABLE ROW LEVEL SECURITY;

-- Tabela de planos de manutenção
CREATE TABLE public.planos_manutencao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ativo_id UUID REFERENCES public.ativos(id) ON DELETE CASCADE,
  condominio_id UUID REFERENCES public.condominios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  tipo manut_tipo NOT NULL DEFAULT 'preventiva',
  periodicidade INTERVAL NOT NULL,
  proxima_execucao DATE NOT NULL,
  checklist JSONB DEFAULT '[]'::jsonb,
  responsavel TEXT DEFAULT 'sindico',
  is_legal BOOLEAN DEFAULT FALSE,
  conf_categoria_id UUID REFERENCES public.conf_categorias(id),
  antecedencia_dias SMALLINT DEFAULT 15,
  sla_dias SMALLINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.planos_manutencao ENABLE ROW LEVEL SECURITY;

-- Tabela de manutenções
CREATE TABLE public.manutencoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id UUID REFERENCES public.planos_manutencao(id) ON DELETE SET NULL,
  ativo_id UUID REFERENCES public.ativos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo manut_tipo NOT NULL DEFAULT 'preventiva',
  status status_exec NOT NULL DEFAULT 'pendente',
  vencimento DATE,
  executada_em TIMESTAMP WITH TIME ZONE,
  fornecedor_id UUID,
  anexo_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.manutencoes ENABLE ROW LEVEL SECURITY;

-- Tabela de OS (Ordem de Serviço)
CREATE TABLE public.os (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'programada', 'em_execucao', 'aguardando_validacao', 'concluida_ok', 'concluida_nc', 'cancelada', 'reprogramada')),
  origem TEXT DEFAULT 'corretiva' CHECK (origem IN ('preventiva', 'corretiva')),
  prioridade TEXT NOT NULL DEFAULT 'media',
  manutencao_id UUID REFERENCES public.manutencoes(id),
  plano_id UUID REFERENCES public.planos_manutencao(id),
  ativo_id UUID REFERENCES public.ativos(id),
  condominio_id UUID REFERENCES public.condominios(id) ON DELETE CASCADE,
  local TEXT,
  solicitante_id UUID REFERENCES public.usuarios(id),
  executante_id UUID REFERENCES public.usuarios(id),
  validado_por UUID REFERENCES public.usuarios(id),
  executor_nome TEXT,
  executor_contato TEXT,
  responsavel TEXT,
  data_abertura TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  data_prevista DATE,
  sla_vencimento DATE,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  aceite_em TIMESTAMP WITH TIME ZONE,
  validado_em TIMESTAMP WITH TIME ZONE,
  data_fechamento TIMESTAMP WITH TIME ZONE,
  custo_previsto NUMERIC,
  custo_aprovado NUMERIC,
  custo_final NUMERIC,
  centro_custo TEXT,
  pdf_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.os ENABLE ROW LEVEL SECURITY;

-- Tabela de anexos de OS
CREATE TABLE public.os_anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID NOT NULL REFERENCES public.os(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.os_anexos ENABLE ROW LEVEL SECURITY;

-- Tabela de logs de OS
CREATE TABLE public.os_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID NOT NULL REFERENCES public.os(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES public.usuarios(id),
  acao TEXT NOT NULL,
  detalhes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.os_logs ENABLE ROW LEVEL SECURITY;

-- Tabela de não conformidades
CREATE TABLE public.nao_conformidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID NOT NULL REFERENCES public.os(id) ON DELETE CASCADE,
  descricao TEXT,
  gravidade TEXT DEFAULT 'P2' CHECK (gravidade IN ('P1', 'P2', 'P3')),
  gerou_os_corretiva_id UUID REFERENCES public.os(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.nao_conformidades ENABLE ROW LEVEL SECURITY;

-- Tabela de itens de conformidade
CREATE TABLE public.conformidade_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo manut_tipo NOT NULL,
  periodicidade INTERVAL NOT NULL,
  ultimo DATE,
  proximo DATE NOT NULL,
  status semaforo NOT NULL DEFAULT 'amarelo',
  observacoes TEXT,
  plano_id UUID REFERENCES public.planos_manutencao(id),
  ativo_id UUID REFERENCES public.ativos(id),
  condominio_id UUID REFERENCES public.condominios(id) ON DELETE CASCADE,
  conf_categoria_id UUID REFERENCES public.conf_categorias(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.conformidade_itens ENABLE ROW LEVEL SECURITY;

-- Tabela de anexos de conformidade
CREATE TABLE public.conformidade_anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.conformidade_itens(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.conformidade_anexos ENABLE ROW LEVEL SECURITY;

-- Tabela de logs de conformidade
CREATE TABLE public.conformidade_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.conformidade_itens(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id),
  acao conf_acao NOT NULL,
  detalhes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.conformidade_logs ENABLE ROW LEVEL SECURITY;

-- Tabela de chamados
CREATE TABLE public.chamados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID REFERENCES public.condominios(id) ON DELETE CASCADE,
  ativo_id UUID REFERENCES public.ativos(id),
  titulo TEXT NOT NULL,
  descricao TEXT,
  local TEXT,
  categoria TEXT,
  prioridade TEXT DEFAULT 'baixa' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  status TEXT DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_andamento', 'concluido', 'cancelado')),
  criado_por UUID REFERENCES public.usuarios(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.chamados ENABLE ROW LEVEL SECURITY;

-- Tabela de locais
CREATE TABLE public.locais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.locais ENABLE ROW LEVEL SECURITY;

-- Tabela de templates de manutenção
CREATE TABLE public.manut_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sistema TEXT NOT NULL,
  titulo_plano TEXT NOT NULL,
  descricao TEXT,
  periodicidade INTERVAL NOT NULL,
  responsavel TEXT,
  evidencia TEXT,
  checklist JSONB DEFAULT '[]'::jsonb,
  is_conformidade BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.manut_templates ENABLE ROW LEVEL SECURITY;

-- Função para verificar role do usuário (security definer para evitar recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

-- Função para criar perfil de usuário automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usuarios (auth_user_id, email, nome)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'name')
  );
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_os_updated_at
  BEFORE UPDATE ON public.os
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_chamados_updated_at
  BEFORE UPDATE ON public.chamados
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- RLS Policies

-- Políticas para condominios (admins podem ver todos, usuários veem apenas os seus)
CREATE POLICY "Admins podem ver todos os condomínios"
  ON public.condominios FOR SELECT
  USING (public.has_role((SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid()), 'admin'));

CREATE POLICY "Usuários podem ver seus condomínios"
  ON public.condominios FOR SELECT
  USING (
    id IN (
      SELECT condominio_id FROM public.usuarios_condominios uc
      JOIN public.usuarios u ON uc.usuario_id = u.id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Políticas para usuarios
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.usuarios FOR SELECT
  USING (auth_user_id = auth.uid());

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.usuarios FOR UPDATE
  USING (auth_user_id = auth.uid());

-- Políticas para user_roles (apenas admins podem gerenciar)
CREATE POLICY "Admins podem ver todas as roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role((SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid()), 'admin'));

CREATE POLICY "Admins podem inserir roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role((SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid()), 'admin'));

-- Políticas para usuarios_condominios
CREATE POLICY "Usuários podem ver suas relações com condomínios"
  ON public.usuarios_condominios FOR SELECT
  USING (
    usuario_id IN (SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid())
  );

-- Políticas para ativos (acesso baseado em condomínio)
CREATE POLICY "Usuários podem ver ativos de seus condomínios"
  ON public.ativos FOR SELECT
  USING (
    condominio_id IN (
      SELECT condominio_id FROM public.usuarios_condominios uc
      JOIN public.usuarios u ON uc.usuario_id = u.id
      WHERE u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Síndicos e zeladores podem inserir ativos"
  ON public.ativos FOR INSERT
  WITH CHECK (
    condominio_id IN (
      SELECT condominio_id FROM public.usuarios_condominios uc
      JOIN public.usuarios u ON uc.usuario_id = u.id
      WHERE u.auth_user_id = auth.uid()
      AND uc.papel IN ('sindico', 'zelador', 'admin')
    )
  );

-- Políticas para OS
CREATE POLICY "Usuários podem ver OS de seus condomínios"
  ON public.os FOR SELECT
  USING (
    condominio_id IN (
      SELECT condominio_id FROM public.usuarios_condominios uc
      JOIN public.usuarios u ON uc.usuario_id = u.id
      WHERE u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários autenticados podem criar OS"
  ON public.os FOR INSERT
  WITH CHECK (
    condominio_id IN (
      SELECT condominio_id FROM public.usuarios_condominios uc
      JOIN public.usuarios u ON uc.usuario_id = u.id
      WHERE u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar OS de seus condomínios"
  ON public.os FOR UPDATE
  USING (
    condominio_id IN (
      SELECT condominio_id FROM public.usuarios_condominios uc
      JOIN public.usuarios u ON uc.usuario_id = u.id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Políticas para chamados
CREATE POLICY "Usuários podem ver chamados de seus condomínios"
  ON public.chamados FOR SELECT
  USING (
    condominio_id IN (
      SELECT condominio_id FROM public.usuarios_condominios uc
      JOIN public.usuarios u ON uc.usuario_id = u.id
      WHERE u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem criar chamados"
  ON public.chamados FOR INSERT
  WITH CHECK (
    condominio_id IN (
      SELECT condominio_id FROM public.usuarios_condominios uc
      JOIN public.usuarios u ON uc.usuario_id = u.id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Políticas básicas para tabelas de referência (público)
CREATE POLICY "Todos podem ver categorias de conformidade"
  ON public.conf_categorias FOR SELECT
  USING (true);

CREATE POLICY "Todos podem ver tipos de ativos"
  ON public.ativo_tipos FOR SELECT
  USING (true);

CREATE POLICY "Todos podem ver locais"
  ON public.locais FOR SELECT
  USING (true);

CREATE POLICY "Todos podem ver templates de manutenção"
  ON public.manut_templates FOR SELECT
  USING (true);

-- Políticas para planos de manutenção
CREATE POLICY "Usuários podem ver planos de seus condomínios"
  ON public.planos_manutencao FOR SELECT
  USING (
    condominio_id IN (
      SELECT condominio_id FROM public.usuarios_condominios uc
      JOIN public.usuarios u ON uc.usuario_id = u.id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Políticas para manutenções
CREATE POLICY "Usuários podem ver manutenções de ativos de seus condomínios"
  ON public.manutencoes FOR SELECT
  USING (
    ativo_id IN (
      SELECT a.id FROM public.ativos a
      WHERE a.condominio_id IN (
        SELECT condominio_id FROM public.usuarios_condominios uc
        JOIN public.usuarios u ON uc.usuario_id = u.id
        WHERE u.auth_user_id = auth.uid()
      )
    )
  );

-- Políticas para conformidade_itens
CREATE POLICY "Usuários podem ver itens de conformidade de seus condomínios"
  ON public.conformidade_itens FOR SELECT
  USING (
    condominio_id IN (
      SELECT condominio_id FROM public.usuarios_condominios uc
      JOIN public.usuarios u ON uc.usuario_id = u.id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Políticas para logs (apenas leitura para usuários relacionados)
CREATE POLICY "Usuários podem ver logs de OS de seus condomínios"
  ON public.os_logs FOR SELECT
  USING (
    os_id IN (
      SELECT id FROM public.os
      WHERE condominio_id IN (
        SELECT condominio_id FROM public.usuarios_condominios uc
        JOIN public.usuarios u ON uc.usuario_id = u.id
        WHERE u.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Usuários podem ver logs de conformidade de seus condomínios"
  ON public.conformidade_logs FOR SELECT
  USING (
    item_id IN (
      SELECT id FROM public.conformidade_itens
      WHERE condominio_id IN (
        SELECT condominio_id FROM public.usuarios_condominios uc
        JOIN public.usuarios u ON uc.usuario_id = u.id
        WHERE u.auth_user_id = auth.uid()
      )
    )
  );

-- Políticas para anexos
CREATE POLICY "Usuários podem ver anexos de OS de seus condomínios"
  ON public.os_anexos FOR SELECT
  USING (
    os_id IN (
      SELECT id FROM public.os
      WHERE condominio_id IN (
        SELECT condominio_id FROM public.usuarios_condominios uc
        JOIN public.usuarios u ON uc.usuario_id = u.id
        WHERE u.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Usuários podem ver anexos de conformidade de seus condomínios"
  ON public.conformidade_anexos FOR SELECT
  USING (
    item_id IN (
      SELECT id FROM public.conformidade_itens
      WHERE condominio_id IN (
        SELECT condominio_id FROM public.usuarios_condominios uc
        JOIN public.usuarios u ON uc.usuario_id = u.id
        WHERE u.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Usuários podem ver não conformidades de OS de seus condomínios"
  ON public.nao_conformidades FOR SELECT
  USING (
    os_id IN (
      SELECT id FROM public.os
      WHERE condominio_id IN (
        SELECT condominio_id FROM public.usuarios_condominios uc
        JOIN public.usuarios u ON uc.usuario_id = u.id
        WHERE u.auth_user_id = auth.uid()
      )
    )
  );