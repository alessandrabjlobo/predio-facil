# NBR 5674 Implementation Roadmap
**Date:** 2025-11-05
**Purpose:** Complete specification for remaining must-have compliance features

---

## Overview

This document specifies the **must-have** features required to achieve NBR 5674 compliance, building on the current system foundation. All implementations maintain existing UI/styling with zero visual changes.

---

## Part A: Must-Have Features (Compliance-Critical)

### 1. Execution Log Trail ⭐ CRITICAL

**Purpose:** Persist every lifecycle action for auditability and compliance proof.

#### Database Schema

```sql
-- Create execution logs table
CREATE TABLE IF NOT EXISTS public.exec_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('plano', 'manutencao', 'os', 'ativo', 'template')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  by_user UUID REFERENCES public.usuarios(id),
  at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  details JSONB DEFAULT '{}'::jsonb,
  condominio_id UUID REFERENCES public.condominios(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_exec_logs_entity ON public.exec_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_exec_logs_at ON public.exec_logs(at DESC);
CREATE INDEX IF NOT EXISTS idx_exec_logs_condo ON public.exec_logs(condominio_id);

-- RLS policies
ALTER TABLE public.exec_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see logs for their condominios"
  ON public.exec_logs FOR SELECT
  TO authenticated
  USING (
    condominio_id IN (
      SELECT condominio_id FROM public.usuarios_condominios
      WHERE usuario_id = auth.uid()
    )
  );

-- Service role can insert (called from backend functions)
CREATE POLICY "Service can insert logs"
  ON public.exec_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Comment
COMMENT ON TABLE public.exec_logs IS
  'Immutable audit trail for all maintenance lifecycle events. ' ||
  'Records WHO did WHAT, WHEN, and WHY for NBR compliance.';
```

#### Standard Actions

```typescript
// Action vocabulary (standardized strings)
const LOG_ACTIONS = {
  // Plans
  PLAN_CREATED_FROM_TEMPLATE: 'plan_created_from_template',
  PLAN_CREATED_DEFAULT: 'plan_created_default',
  PLAN_CREATED_MANUAL: 'plan_created_manual',
  PLAN_UPDATED: 'plan_updated',
  PLAN_PAUSED: 'plan_paused',
  PLAN_RESUMED: 'plan_resumed',
  PLAN_NEXT_DATE_ADVANCED: 'plan_next_date_advanced',
  PLAN_DELETED: 'plan_deleted',

  // Maintenances
  MANUTENCAO_SCHEDULED: 'manutencao_scheduled',
  MANUTENCAO_RESCHEDULED: 'manutencao_rescheduled',
  MANUTENCAO_STARTED: 'manutencao_started',
  MANUTENCAO_COMPLETED: 'manutencao_completed',
  MANUTENCAO_CANCELLED: 'manutencao_cancelled',

  // OS (Work Orders)
  OS_CREATED_FROM_PLAN: 'os_created_from_plan',
  OS_CREATED_MANUAL: 'os_created_manual',
  OS_STATUS_CHANGED: 'os_status_changed',
  OS_ASSIGNED: 'os_assigned',
  OS_STARTED: 'os_started',
  OS_AWAITING_VALIDATION: 'os_awaiting_validation',
  OS_VALIDATED: 'os_validated',
  OS_COMPLETED: 'os_completed',
  OS_CANCELLED: 'os_cancelled',
  OS_EVIDENCE_UPLOADED: 'os_evidence_uploaded',

  // Assets
  ATIVO_CREATED: 'ativo_created',
  ATIVO_UPDATED: 'ativo_updated',
  ATIVO_DELETED: 'ativo_deleted',
};
```

#### Helper Function (TypeScript)

```typescript
// src/lib/exec-logs.ts
import { supabase } from "@/integrations/supabase/client";

export async function logExecution(params: {
  entityType: 'plano' | 'manutencao' | 'os' | 'ativo' | 'template';
  entityId: string;
  action: string;
  details?: Record<string, any>;
  condominioId?: string;
}) {
  try {
    const { data: user } = await supabase.auth.getUser();

    const { error } = await supabase.from('exec_logs').insert({
      entity_type: params.entityType,
      entity_id: params.entityId,
      action: params.action,
      by_user: user?.user?.id || null,
      details: params.details || {},
      condominio_id: params.condominioId || null,
    });

    if (error) {
      console.warn('Failed to log execution:', error);
    }
  } catch (e) {
    console.warn('Exec log failed:', e);
  }
}

// Usage example:
// await logExecution({
//   entityType: 'os',
//   entityId: osId,
//   action: 'os_completed',
//   details: { previous_status: 'em_andamento', evidences_count: 3 },
//   condominioId: condo.id,
// });
```

---

### 2. Next-Date Advancement on Completion ⭐ CRITICAL

**Purpose:** Automatically reschedule preventive plans when maintenance is completed.

#### Database Function

```sql
-- Function to advance plan next execution date
CREATE OR REPLACE FUNCTION public.advance_plan_next_date(p_plano_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plano RECORD;
  v_new_date DATE;
BEGIN
  -- Get plan details
  SELECT * INTO v_plano
  FROM public.planos_manutencao
  WHERE id = p_plano_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan not found: %', p_plano_id;
  END IF;

  -- Calculate new next execution date
  v_new_date := v_plano.proxima_execucao + v_plano.periodicidade;

  -- Clamp to at least today (if calculation results in past date)
  IF v_new_date < CURRENT_DATE THEN
    v_new_date := CURRENT_DATE;
  END IF;

  -- Update plan
  UPDATE public.planos_manutencao
  SET
    proxima_execucao = v_new_date,
    ultima_execucao = CURRENT_DATE
  WHERE id = p_plano_id;

  -- Log the advancement
  INSERT INTO public.exec_logs (entity_type, entity_id, action, details)
  VALUES (
    'plano',
    p_plano_id,
    'plan_next_date_advanced',
    jsonb_build_object(
      'previous_date', v_plano.proxima_execucao,
      'new_date', v_new_date,
      'periodicidade', v_plano.periodicidade::text
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.advance_plan_next_date TO authenticated, service_role;
```

#### Trigger on Maintenance Completion

```sql
-- Trigger function to auto-advance plan when maintenance is completed
CREATE OR REPLACE FUNCTION public.trg_after_manutencao_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only advance if:
  -- 1. Status changed to 'concluida'
  -- 2. There's a linked plan
  -- 3. Previous status was not 'concluida' (prevent duplicate advances)
  IF NEW.status = 'concluida'
     AND NEW.plano_id IS NOT NULL
     AND (OLD.status IS NULL OR OLD.status != 'concluida')
  THEN
    PERFORM public.advance_plan_next_date(NEW.plano_id);
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS after_manutencao_completed ON public.manutencoes;
CREATE TRIGGER after_manutencao_completed
  AFTER UPDATE ON public.manutencoes
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_after_manutencao_completed();
```

#### Similar for OS Completion

```sql
-- Trigger function for OS completion
CREATE OR REPLACE FUNCTION public.trg_after_os_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plano_id UUID;
BEGIN
  -- Only process if OS is completed and has a linked maintenance
  IF NEW.status = 'concluida'
     AND NEW.manutencao_id IS NOT NULL
     AND (OLD.status IS NULL OR OLD.status != 'concluida')
  THEN
    -- Get plano_id from linked manutencao
    SELECT plano_id INTO v_plano_id
    FROM public.manutencoes
    WHERE id = NEW.manutencao_id;

    IF v_plano_id IS NOT NULL THEN
      PERFORM public.advance_plan_next_date(v_plano_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS after_os_completed ON public.os;
CREATE TRIGGER after_os_completed
  AFTER UPDATE ON public.os
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_after_os_completed();
```

---

### 3. State Machine / Workflow Validation ⭐ CRITICAL

**Purpose:** Enforce legal state transitions for OS and maintenances.

#### Valid Transitions

```typescript
// src/lib/workflow-validation.ts

export const OS_TRANSITIONS = {
  aberta: ['em_andamento', 'cancelada'],
  em_andamento: ['aguardando_validacao', 'concluida', 'cancelada'],
  aguardando_validacao: ['concluida', 'em_andamento'],
  concluida: [], // Terminal state
  cancelada: [], // Terminal state
};

export const MANUTENCAO_TRANSITIONS = {
  pendente: ['em_andamento', 'cancelada'],
  em_andamento: ['concluida', 'cancelada'],
  concluida: [], // Terminal state
  cancelada: [], // Terminal state
};

export function isValidTransition(
  currentStatus: string,
  newStatus: string,
  entityType: 'os' | 'manutencao'
): { valid: boolean; error?: string } {
  const transitions = entityType === 'os' ? OS_TRANSITIONS : MANUTENCAO_TRANSITIONS;

  if (!transitions[currentStatus]) {
    return { valid: false, error: `Invalid current status: ${currentStatus}` };
  }

  if (!transitions[currentStatus].includes(newStatus)) {
    return {
      valid: false,
      error: `Cannot transition from '${currentStatus}' to '${newStatus}'. ` +
             `Allowed: ${transitions[currentStatus].join(', ') || 'none (terminal state)'}`,
    };
  }

  return { valid: true };
}
```

#### Database Trigger for Validation

```sql
-- Trigger function to validate OS status transitions
CREATE OR REPLACE FUNCTION public.validate_os_status_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_allowed_statuses TEXT[];
BEGIN
  -- Define allowed transitions
  CASE OLD.status
    WHEN 'aberta' THEN
      v_allowed_statuses := ARRAY['em_andamento', 'cancelada'];
    WHEN 'em_andamento' THEN
      v_allowed_statuses := ARRAY['aguardando_validacao', 'concluida', 'cancelada'];
    WHEN 'aguardando_validacao' THEN
      v_allowed_statuses := ARRAY['concluida', 'em_andamento'];
    WHEN 'concluida', 'cancelada' THEN
      -- Terminal states - no further transitions
      IF NEW.status != OLD.status THEN
        RAISE EXCEPTION 'Cannot change status from terminal state "%". Current: %, Attempted: %',
          OLD.status, OLD.status, NEW.status;
      END IF;
      v_allowed_statuses := ARRAY[OLD.status];
    ELSE
      RAISE EXCEPTION 'Unknown status: %', OLD.status;
  END CASE;

  -- Check if new status is allowed
  IF NEW.status != OLD.status AND NOT (NEW.status = ANY(v_allowed_statuses)) THEN
    RAISE EXCEPTION 'Invalid status transition: % → %. Allowed: %',
      OLD.status, NEW.status, array_to_string(v_allowed_statuses, ', ');
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS validate_os_status ON public.os;
CREATE TRIGGER validate_os_status
  BEFORE UPDATE OF status ON public.os
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.validate_os_status_transition();

-- Similar for manutencoes
CREATE OR REPLACE FUNCTION public.validate_manutencao_status_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_allowed_statuses TEXT[];
BEGIN
  CASE OLD.status
    WHEN 'pendente' THEN
      v_allowed_statuses := ARRAY['em_andamento', 'cancelada'];
    WHEN 'em_andamento' THEN
      v_allowed_statuses := ARRAY['concluida', 'cancelada'];
    WHEN 'concluida', 'cancelada' THEN
      IF NEW.status != OLD.status THEN
        RAISE EXCEPTION 'Cannot change status from terminal state "%"', OLD.status;
      END IF;
      v_allowed_statuses := ARRAY[OLD.status];
    ELSE
      RAISE EXCEPTION 'Unknown status: %', OLD.status;
  END CASE;

  IF NEW.status != OLD.status AND NOT (NEW.status = ANY(v_allowed_statuses)) THEN
    RAISE EXCEPTION 'Invalid status transition: % → %. Allowed: %',
      OLD.status, NEW.status, array_to_string(v_allowed_statuses, ', ');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_manutencao_status ON public.manutencoes;
CREATE TRIGGER validate_manutencao_status
  BEFORE UPDATE OF status ON public.manutencoes
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.validate_manutencao_status_transition();
```

---

### 4. SLA Tracking + Breach Stamp ⭐ CRITICAL

**Purpose:** Track and flag overdue items for compliance reporting.

#### Schema Updates

```sql
-- Add SLA fields if not present
ALTER TABLE public.os
  ADD COLUMN IF NOT EXISTS sla_inicio TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sla_fim TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_breached BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS breach_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS breach_reason TEXT;

ALTER TABLE public.manutencoes
  ADD COLUMN IF NOT EXISTS sla_inicio TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sla_fim TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_breached BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS breach_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS breach_reason TEXT;

-- Indexes for SLA queries
CREATE INDEX IF NOT EXISTS idx_os_sla_fim ON public.os(sla_fim) WHERE status NOT IN ('concluida', 'cancelada');
CREATE INDEX IF NOT EXISTS idx_manutencoes_sla ON public.manutencoes(vencimento) WHERE status NOT IN ('concluida', 'cancelada');
```

#### Daily SLA Monitoring Function

```sql
-- Function to check and flag overdue items
CREATE OR REPLACE FUNCTION public.check_sla_breaches()
RETURNS TABLE(
  entity_type TEXT,
  entity_id UUID,
  breach_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_os_breaches INTEGER := 0;
  v_manut_breaches INTEGER := 0;
BEGIN
  -- Flag overdue OS
  UPDATE public.os
  SET
    is_breached = TRUE,
    breach_at = COALESCE(breach_at, NOW()),
    breach_reason = COALESCE(breach_reason, 'SLA exceeded')
  WHERE
    status NOT IN ('concluida', 'cancelada')
    AND sla_fim IS NOT NULL
    AND sla_fim < NOW()
    AND is_breached = FALSE;

  GET DIAGNOSTICS v_os_breaches = ROW_COUNT;

  -- Flag overdue maintenances
  UPDATE public.manutencoes
  SET
    is_breached = TRUE,
    breach_at = COALESCE(breach_at, NOW()),
    breach_reason = COALESCE(breach_reason, 'Vencimento excedido')
  WHERE
    status NOT IN ('concluida', 'cancelada')
    AND vencimento IS NOT NULL
    AND vencimento < CURRENT_DATE
    AND is_breached = FALSE;

  GET DIAGNOSTICS v_manut_breaches = ROW_COUNT;

  -- Return summary
  RETURN QUERY
  SELECT 'os'::TEXT, NULL::UUID, v_os_breaches
  UNION ALL
  SELECT 'manutencao'::TEXT, NULL::UUID, v_manut_breaches;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_sla_breaches TO service_role;

COMMENT ON FUNCTION public.check_sla_breaches IS
  'Daily cron job to flag overdue OS and maintenances for SLA compliance tracking.';
```

#### Supabase Edge Function for Scheduled Execution

```typescript
// supabase/functions/check-sla-daily/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Call the SLA check function
    const { data, error } = await supabase.rpc('check_sla_breaches');

    if (error) throw error;

    console.log('SLA check completed:', data);

    return new Response(
      JSON.stringify({ success: true, breaches: data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('SLA check failed:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```

---

### 5. Minimum Evidence & Attachments ⭐ CRITICAL

**Purpose:** Enforce evidence upload for critical/legal work orders.

#### Schema Update

```sql
-- Add evidence tracking
ALTER TABLE public.os
  ADD COLUMN IF NOT EXISTS evidence_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS requires_evidence BOOLEAN DEFAULT FALSE;

-- Trigger to update evidence count
CREATE OR REPLACE FUNCTION public.update_os_evidence_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Count evidence attachments in fotos_antes/fotos_depois
  SELECT
    COALESCE(jsonb_array_length(NEW.fotos_antes), 0) +
    COALESCE(jsonb_array_length(NEW.fotos_depois), 0)
  INTO v_count;

  NEW.evidence_count := v_count;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_evidence_count ON public.os;
CREATE TRIGGER update_evidence_count
  BEFORE INSERT OR UPDATE ON public.os
  FOR EACH ROW
  EXECUTE FUNCTION public.update_os_evidence_count();
```

#### Validation on Completion

```sql
-- Validate evidence before marking completed
CREATE OR REPLACE FUNCTION public.validate_os_completion()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If marking as completed and requires evidence
  IF NEW.status = 'concluida' AND OLD.status != 'concluida' THEN
    IF NEW.requires_evidence AND COALESCE(NEW.evidence_count, 0) = 0 THEN
      RAISE EXCEPTION 'Cannot complete OS without evidence. This OS requires at least one attachment.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_completion ON public.os;
CREATE TRIGGER validate_completion
  BEFORE UPDATE OF status ON public.os
  FOR EACH ROW
  WHEN (NEW.status = 'concluida' AND OLD.status != 'concluida')
  EXECUTE FUNCTION public.validate_os_completion();
```

---

### 6. Template Governance ⭐ CRITICAL

**Purpose:** Manage maintenance templates with versioning and soft-delete.

#### Schema Updates

```sql
-- Add governance fields to manut_templates
ALTER TABLE public.manut_templates
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.usuarios(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Track template usage in plans
ALTER TABLE public.planos_manutencao
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.manut_templates(id),
  ADD COLUMN IF NOT EXISTS template_version INTEGER;

-- Create index
CREATE INDEX IF NOT EXISTS idx_templates_active ON public.manut_templates(is_active) WHERE deleted_at IS NULL;
```

---

### 7. Role-Based Guards ⭐ CRITICAL

**Purpose:** Enforce RLS policies per role (sindico, zelador, morador, admin).

#### RLS Policies (Example for planos_manutencao)

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "plans_select" ON public.planos_manutencao;
DROP POLICY IF EXISTS "plans_insert" ON public.planos_manutencao;
DROP POLICY IF EXISTS "plans_update" ON public.planos_manutencao;
DROP POLICY IF EXISTS "plans_delete" ON public.planos_manutencao;

-- Sindico/Admin can manage plans for their condos
CREATE POLICY "Sindico and admin can manage plans"
  ON public.planos_manutencao
  FOR ALL
  TO authenticated
  USING (
    condominio_id IN (
      SELECT uc.condominio_id
      FROM public.usuarios_condominios uc
      JOIN public.user_roles ur ON ur.user_id = uc.usuario_id
      WHERE uc.usuario_id = auth.uid()
        AND ur.role IN ('sindico', 'admin')
    )
  )
  WITH CHECK (
    condominio_id IN (
      SELECT uc.condominio_id
      FROM public.usuarios_condominios uc
      JOIN public.user_roles ur ON ur.user_id = uc.usuario_id
      WHERE uc.usuario_id = auth.uid()
        AND ur.role IN ('sindico', 'admin')
    )
  );

-- Zelador can view and execute (update status)
CREATE POLICY "Zelador can view and update status"
  ON public.planos_manutencao
  FOR SELECT
  TO authenticated
  USING (
    condominio_id IN (
      SELECT uc.condominio_id
      FROM public.usuarios_condominios uc
      JOIN public.user_roles ur ON ur.user_id = uc.usuario_id
      WHERE uc.usuario_id = auth.uid()
        AND ur.role = 'zelador'
    )
  );

-- Morador can only view
CREATE POLICY "Morador can view plans"
  ON public.planos_manutencao
  FOR SELECT
  TO authenticated
  USING (
    condominio_id IN (
      SELECT condominio_id
      FROM public.usuarios_condominios
      WHERE usuario_id = auth.uid()
    )
  );
```

---

### 8. Condominium Scoping ⭐ CRITICAL

**Purpose:** Ensure all entities are scoped and RLS filters by condominio_id.

#### Audit & Fix Missing condominio_id

```sql
-- Check which tables need condominio_id
-- All should have it either directly or via FK chain

-- Example: exec_logs already has it
-- os table should have it
ALTER TABLE public.os
  ADD COLUMN IF NOT EXISTS condominio_id UUID REFERENCES public.condominios(id);

-- Backfill from ativo if missing
UPDATE public.os o
SET condominio_id = a.condominio_id
FROM public.ativos a
WHERE o.ativo_id = a.id
  AND o.condominio_id IS NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_os_condo ON public.os(condominio_id);
```

---

## Part B: Expected End-to-End Flows (Implementation)

### Flow 1: Asset Creation → Plan Generation

**Implemented via:**
- Trigger: `after_insert_ativos_criar_planos`
- RPC: `criar_planos_preventivos` (fixed in migration 20251105)
- Fallback: `ensureDefaultPlanoParaAtivo` in api.ts

**Guards:**
- De-dup: Skip if (ativo_id, titulo) exists
- Log: Insert into exec_logs on creation

**Acceptance:**
```bash
# Run test
npx tsx scripts/test_preventive_plans.ts

# Expected: Plans appear in PreventivePlansTab with INTERVAL format
# Expected: exec_logs contains 'plan_created_from_template' entries
```

---

### Flow 2: Rendering Asset Details (with guards)

**Already implemented** in previous fixes:
- `AssetChecklistModal.tsx`: Fallback for missing RPC
- `useManutTemplates.ts`: Guards for missing documento_tipos

**Acceptance:**
- Page loads without blank screen
- Console shows warnings, not errors
- Missing data returns empty arrays

---

### Flow 3: Generating OS from Plan

**Current:** Redirects to `/os/new` with query params
**Enhancement needed:** Add exec_log on creation

```typescript
// In createOS function (src/lib/api.ts)
// After successful insert:
await logExecution({
  entityType: 'os',
  entityId: data.id,
  action: 'os_created_from_plan',
  details: { plano_id: payload.plano_id, origin: payload.origin },
  condominioId: payload.condominio_id,
});
```

---

### Flow 4: Completing OS → Advancing Plan

**Implemented via:**
- Trigger: `after_os_completed` (new)
- Function: `advance_plan_next_date` (new)
- Log: Automatically inserted by function

**Acceptance:**
```sql
-- Test manually:
-- 1. Create plan with periodicidade '1 month', proxima_execucao = today
-- 2. Create OS linked to plan
-- 3. Update OS status to 'concluida'
-- 4. Check plan: proxima_execucao should be today + 1 month
-- 5. Check exec_logs: should have 'plan_next_date_advanced' entry
```

---

### Flow 5: SLA Monitoring (Daily Job)

**Implemented via:**
- Edge Function: `check-sla-daily` (new)
- RPC: `check_sla_breaches` (new)
- Schedule: Configure via Supabase cron (pg_cron extension)

**Setup:**
```sql
-- Enable pg_cron extension (if available)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily at 6 AM UTC
SELECT cron.schedule(
  'check-sla-breaches',
  '0 6 * * *', -- Every day at 6 AM
  $$SELECT public.check_sla_breaches()$$
);
```

**Acceptance:**
- Items past SLA get `is_breached = true`
- UI can filter/display overdue items
- Logs record breach timestamps

---

## Part C: Migration Files

Create these migrations in order:

1. `20251105_01_exec_logs_table.sql` - Execution logs table + policies
2. `20251105_02_next_date_advancement.sql` - Function + triggers
3. `20251105_03_workflow_validation.sql` - State machine triggers
4. `20251105_04_sla_tracking.sql` - SLA fields + check function
5. `20251105_05_evidence_validation.sql` - Evidence enforcement
6. `20251105_06_template_governance.sql` - Versioning fields
7. `20251105_07_role_based_rls.sql` - Updated RLS policies
8. `20251105_08_condominium_scoping.sql` - Ensure all tables have condo_id

---

## Part D: Acceptance Testing

### Test Checklist

```bash
# 1. Plan generation
npx tsx scripts/test_preventive_plans.ts
# Expected: ✓ Creates plans, ✓ INTERVAL format, ✓ Idempotent

# 2. Exec logs
psql $DB_URL -c "SELECT COUNT(*) FROM exec_logs WHERE action LIKE 'plan_%';"
# Expected: > 0 rows

# 3. Next date advancement
# Create OS from plan, complete it, check plan next date moved forward

# 4. Workflow validation
# Try invalid transition (aberta → concluida directly)
# Expected: Error "Invalid status transition"

# 5. SLA breaches
# Create OS with sla_fim in past, run check_sla_breaches
# Expected: is_breached = true

# 6. Evidence validation
# Create OS with requires_evidence=true, try to complete without attachments
# Expected: Error "Cannot complete OS without evidence"

# 7. Role guards
# Login as morador, try to create plan
# Expected: Permission denied (RLS blocks)

# 8. UI rendering
# Visit /ativos, /os/new, /preventivas
# Expected: No blank screens, no 404 errors in console
```

---

## Summary

**Must-Have Features Status:**
1. ✅ Execution Log Trail - Schema + helpers defined
2. ✅ Next-Date Advancement - Triggers + function defined
3. ✅ Workflow Validation - State machine triggers defined
4. ✅ SLA Tracking - Function + edge function defined
5. ✅ Evidence Enforcement - Triggers defined
6. ✅ Template Governance - Schema updates defined
7. ✅ Role-Based Guards - RLS policies defined
8. ✅ Condominium Scoping - Audit queries defined

**Next Steps:**
1. Apply migrations 01-08 via Supabase SQL Editor
2. Deploy edge function `check-sla-daily`
3. Schedule cron job for daily SLA checks
4. Run acceptance tests
5. Verify zero UI changes (build passes, no class modifications)

**Estimated Effort:**
- Migrations: 2-3 hours to apply + test
- Edge function: 1 hour to deploy
- Acceptance testing: 2 hours
- **Total: ~6 hours** for complete NBR compliance foundation
