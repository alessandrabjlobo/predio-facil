# Backend OS (Work Order) Infrastructure

## Overview

This document describes the backend infrastructure for the Work Order (OS - Ordem de Serviço) system after the comprehensive repair migration applied on 2025-11-03.

The backend was hardened to support **two frontend dialog patterns** without requiring any UI changes, ensuring backward compatibility while adding missing features.

---

## Architecture

### Tables

#### `os` (Work Orders)
Main table storing all work orders.

**Key Columns:**
- `id` (uuid, PK): Unique identifier
- `numero_os` (text, unique per condo): Human-readable OS number (format: OS-YYYY-0001)
- `condominio_id` (uuid, FK): References condominios
- `ativo_id` (uuid, FK): References ativos (assets)
- `plano_id` (uuid, FK, optional): References planos_manutencao
- `solicitante_id` (uuid, FK): User who requested the OS
- `responsavel_id` (uuid, FK, optional): User responsible for execution
- `executante_id` (uuid, FK, optional): Internal executor
- `titulo` (text, required): OS title
- `descricao` (text): Detailed description
- `status` (text): aberta, programada, em_execucao, aguardando_validacao, concluida_ok, concluida_nc, cancelada, reprogramada
- `prioridade` (text): baixa, media, alta, urgente
- `tipo_os` (text): preventiva, corretiva, emergencial, preditiva
- `tipo_manutencao` (text): Maintenance type
- `tipo_executor` (text): interno, externo
- `executor_nome` (text): External executor name
- `executor_contato` (text): External executor contact
- `data_abertura` (timestamptz): Creation timestamp
- `data_prevista` (date): Expected execution date
- `sla_vencimento` (date): SLA deadline
- `data_conclusao` (timestamptz): Completion timestamp
- `nbr_referencias` (jsonb): Array of NBR standard references
- `checklist_items` (jsonb): Execution checklist items
- `checklist` (jsonb): Backward-compatible checklist field

**Constraints:**
- `os_condominio_numero_key`: UNIQUE (condominio_id, numero_os) - ensures unique OS numbers per condominio

**Indexes:**
- `os_pkey`: PRIMARY KEY (id)
- `os_condominio_numero_key`: UNIQUE (condominio_id, numero_os)
- `os_numero_key`: UNIQUE (numero_os)
- `idx_os_condominio_status`: (condominio_id, status)
- `idx_os_condominio_data`: (condominio_id, data_abertura DESC)
- `idx_os_ativo`, `idx_os_plano`, `idx_os_solicitante`, etc.

#### `os_logs` (Audit Trail)
Tracks all actions performed on work orders.

**Columns:**
- `id` (uuid, PK)
- `os_id` (uuid, FK): References os
- `usuario_id` (uuid, FK): User who performed the action
- `acao` (text): Action description
- `detalhes` (jsonb): Additional details
- `created_at` (timestamptz)

#### `os_anexos` (Attachments)
Stores file attachments for work orders.

**Columns:**
- `id` (uuid, PK)
- `os_id` (uuid, FK): References os
- `file_path` (text): Path in Supabase Storage
- `created_at` (timestamptz)

#### `os_sequence` (Sequence Generator)
Helper table for generating sequential OS numbers per condominium/year.

**Columns:**
- `condominio_id` (uuid, PK)
- `ano` (int, PK): Year
- `seq` (int): Current sequence number

---

## Functions (RPCs)

### `public.criar_os_detalhada(...)`

**Unified RPC** that creates work orders supporting both frontend dialog patterns.

#### Signature

```sql
public.criar_os_detalhada(
  -- Required parameters
  p_condominio_id uuid,
  p_ativo_id uuid,
  p_titulo text,

  -- Optional parameters with defaults
  p_plano_id uuid DEFAULT NULL,
  p_responsavel_id uuid DEFAULT NULL,
  p_solicitante_id uuid DEFAULT NULL,
  p_descricao text DEFAULT NULL,
  p_prioridade text DEFAULT 'media',
  p_tipo_os text DEFAULT 'corretiva',
  p_status text DEFAULT 'aberta',
  p_data_prevista date DEFAULT NULL,

  -- Second dialog specific parameters
  p_tipo_manutencao text DEFAULT NULL,
  p_tipo_executor text DEFAULT NULL,
  p_executor_nome text DEFAULT NULL,
  p_executor_contato text DEFAULT NULL,
  p_nbr_referencias jsonb DEFAULT NULL,
  p_checklist_items jsonb DEFAULT NULL
)
RETURNS public.os
```

#### Behavior

1. **Validates** required parameters (condominio_id, ativo_id, titulo)
2. **Resolves** solicitante_id from auth.uid() if not provided
3. **Generates** unique OS number via `generate_os_numero()`
4. **Calculates** SLA (data_prevista + 30 days)
5. **Inserts** OS record with all provided fields
6. **Creates** audit log entry in `os_logs`
7. **Returns** the created OS row

#### Error Handling

- `unique_violation`: "Número de OS duplicado. Tente novamente."
- `foreign_key_violation`: "Referência inválida: verifique condomínio, ativo ou usuários"
- Other errors: "Erro ao criar OS: {message}"

#### Security

- Uses `SECURITY DEFINER` to bypass RLS during insert
- Validates user permissions via `usuarios_condominios` table
- Respects existing RLS policies for SELECT/UPDATE

#### Example Calls

**Dialog Pattern 1** (useOrdemServico.ts):
```typescript
const { data, error } = await supabase.rpc('criar_os_detalhada', {
  p_condominio_id: condominio.id,
  p_ativo_id: ativoId,
  p_plano_id: planoId || null,
  p_responsavel_id: usuario.id,
  p_titulo: titulo,
  p_descricao: descricao || '',
  p_prioridade: prioridade,
  p_tipo_os: tipo,
  p_data_prevista: dataPrevista || null,
});
```

**Dialog Pattern 2** (maintenance/CreateOSDialog.tsx):
```typescript
const { data, error } = await supabase.rpc('criar_os_detalhada', {
  p_condominio_id: condominio.id,
  p_ativo_id: ativo.id,
  p_titulo: titulo,
  p_plano_id: plano?.id || null,
  p_descricao: descricao,
  p_tipo_manutencao: tipoManutencao,
  p_prioridade: prioridade,
  p_tipo_executor: tipoExecutor,
  p_executor_nome: executorNome || null,
  p_executor_contato: executorContato || null,
  p_data_prevista: dataPrevista ? format(dataPrevista, 'yyyy-MM-dd') : null,
  p_nbr_referencias: nbrRequisitos.map(nbr => nbr.nbr_codigo),
  p_checklist_items: checklistItems,
});
```

---

### `public.generate_os_numero(p_condominio_id, p_data)`

Generates unique OS numbers in format `OS-YYYY-0001`.

#### Signature

```sql
public.generate_os_numero(
  p_condominio_id uuid,
  p_data date DEFAULT CURRENT_DATE
)
RETURNS text
```

#### Behavior

1. Extracts year from `p_data` (or CURRENT_DATE)
2. Calls `next_os_seq()` to get next sequence number
3. Returns formatted string: `OS-{YEAR}-{SEQ:04d}`

#### Concurrency Safety

Uses `os_sequence` table with `ON CONFLICT DO UPDATE` to ensure atomic sequence generation even under high concurrency.

---

### `public.next_os_seq(p_condominio_id, p_data)`

Helper function for atomic sequence generation.

#### Signature

```sql
public.next_os_seq(
  p_condominio_id uuid,
  p_data date DEFAULT CURRENT_DATE
)
RETURNS integer
```

#### Behavior

```sql
INSERT INTO public.os_sequence (condominio_id, ano, seq)
VALUES (p_condominio_id, EXTRACT(YEAR FROM p_data), 1)
ON CONFLICT (condominio_id, ano)
DO UPDATE SET seq = os_sequence.seq + 1
RETURNING seq;
```

---

## Row-Level Security (RLS)

All tables have RLS enabled and enforce multi-tenant isolation by `condominio_id`.

### `os` Table Policies

1. **SELECT**: Users can view OS within their condominios
   ```sql
   condominio_id IN (
     SELECT uc.condominio_id
     FROM usuarios_condominios uc
     JOIN usuarios u ON uc.usuario_id = u.id
     WHERE u.auth_user_id = auth.uid()
   )
   ```

2. **INSERT**: Authenticated users can create OS in their condominios
   - Enforced via `WITH CHECK` clause
   - Also validated in `criar_os_detalhada` RPC

3. **UPDATE**: Users can update OS in their condominios
   - Enforced via `USING` and `WITH CHECK`

### `os_logs` Table Policies

1. **SELECT**: Users can view logs for OS in their condominios
2. **INSERT**: Authenticated users can insert logs (enforced via os FK)

### `os_anexos` Table Policies

1. **SELECT**: Users can view attachments for OS in their condominios
2. **INSERT**: Authenticated users can upload attachments (enforced via os FK)

---

## Migration History

### 20251103000000_fix_os_backend_comprehensive.sql

**Applied**: 2025-11-03

**Changes**:
1. Added missing columns to `os` table:
   - `responsavel_id`
   - `tipo_os`
   - `tipo_manutencao`
   - `nbr_referencias`
   - `checklist_items`

2. Fixed `generate_os_numero`:
   - Dropped overloaded function variants
   - Created single authoritative version

3. Created unified `criar_os_detalhada` RPC:
   - Supports both dialog patterns
   - 17 parameters (3 required, 14 optional)
   - Returns full OS row

4. Added RLS INSERT policies:
   - `os_logs_insert_authenticated`
   - `os_anexos_insert_authenticated`

5. All changes are idempotent and safe to re-run

---

## Testing

### E2E Verification Script

Run the comprehensive test suite:

```bash
npx tsx scripts/verify_os_backend.ts
```

**Tests Performed**:
1. ✅ Dialog Pattern 1 (useOrdemServico)
2. ✅ Dialog Pattern 2 (maintenance/CreateOSDialog)
3. ✅ OS Number Format (OS-YYYY-0001)
4. ✅ Unique Constraint on (condominio_id, numero_os)
5. ✅ RLS Policies (SELECT on os and os_logs)
6. ✅ OS Number Sequence Generation

**Expected Output**:
```
🚀 Starting OS Backend Verification Tests
...
📊 TEST SUMMARY
================================================================================
Total Tests: 10
Passed: 10 ✅
Failed: 0 ❌
Success Rate: 100.0%

✅ ALL TESTS PASSED!
```

### Manual Testing

#### Create OS via Supabase Studio

```sql
SELECT * FROM public.criar_os_detalhada(
  p_condominio_id := 'YOUR_CONDO_UUID',
  p_ativo_id := 'YOUR_ASSET_UUID',
  p_titulo := 'Test Manual OS',
  p_descricao := 'Testing manual creation',
  p_prioridade := 'alta'
);
```

#### Query OS

```sql
SELECT
  id, numero_os, titulo, status, prioridade, tipo_os,
  data_abertura, data_prevista, executor_nome,
  nbr_referencias, checklist_items
FROM os
WHERE condominio_id = 'YOUR_CONDO_UUID'
ORDER BY data_abertura DESC
LIMIT 10;
```

#### Check Sequence

```sql
SELECT * FROM os_sequence
WHERE condominio_id = 'YOUR_CONDO_UUID'
ORDER BY ano DESC;
```

---

## Troubleshooting

### "function does not exist" Error

**Cause**: Function signature mismatch or not granted to role.

**Fix**:
```sql
-- Check function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'criar_os_detalhada';

-- Reapply migration if missing
```

### "Número de OS duplicado" Error

**Cause**: Concurrent OS creation with same numero_os (rare race condition).

**Fix**: Retry the operation. The `os_sequence` table handles this atomically.

### Missing Columns Error

**Cause**: Migration not fully applied.

**Fix**: Reapply migration (it's idempotent):
```bash
# Using Supabase CLI
supabase db push

# Or run migration SQL directly
```

### RLS Policy Blocks Insert

**Cause**: User not associated with condominio via `usuarios_condominios`.

**Fix**: Ensure user has entry in `usuarios_condominios`:
```sql
INSERT INTO usuarios_condominios (usuario_id, condominio_id, papel)
VALUES ('USER_UUID', 'CONDO_UUID', 'sindico')
ON CONFLICT DO NOTHING;
```

---

## Best Practices

### Creating Work Orders

1. **Always provide required fields**: condominio_id, ativo_id, titulo
2. **Use appropriate tipo_os**: preventiva, corretiva, emergencial
3. **Include NBR references** for compliance-critical work
4. **Attach checklists** for preventive maintenance
5. **Set realistic data_prevista** for proper SLA calculation

### Querying Work Orders

1. **Filter by condominio_id** first (indexed)
2. **Use status** for workflow filtering
3. **Order by data_abertura DESC** for recent-first
4. **Include related data** via JOINs:
   ```sql
   SELECT
     os.*,
     ativos.nome as ativo_nome,
     solicitante.nome as solicitante_nome
   FROM os
   JOIN ativos ON os.ativo_id = ativos.id
   JOIN usuarios solicitante ON os.solicitante_id = solicitante.id
   WHERE os.condominio_id = 'CONDO_UUID';
   ```

### Updating Work Orders

1. **Use specific UPDATE queries** (not via RPC)
2. **Track changes in os_logs** manually if needed
3. **Respect status transitions** (e.g., aberta → em_execucao → concluida)

---

## Type Generation

After schema changes, regenerate TypeScript types:

```bash
# Using Supabase CLI
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts

# Or using direct connection
npx supabase gen types typescript --db-url "$SUPABASE_DB_URL" --schema public > src/integrations/supabase/types.ts
```

**Note**: Only type definitions change. No UI code is modified.

---

## Questions & Answers

### Q1: Did you remove all previous overloads of criar_os_detalhada?

**A**: Yes. The migration explicitly drops all known signatures using:
```sql
DROP FUNCTION IF EXISTS public.criar_os_detalhada CASCADE;
```
This removes all overloaded variants, leaving only the unified function.

### Q2: Did you ensure numero_os unique per (condominio_id, ano)?

**A**: Yes. The migration:
1. Uses `os_sequence` table with PK (condominio_id, ano)
2. `generate_os_numero` calls `next_os_seq` which performs atomic increment
3. Unique constraint `os_condominio_numero_key` on (condominio_id, numero_os)

### Q3: Which seeds required dynamic lookups?

**A**: The existing `seed.sql` already uses `ON CONFLICT DO NOTHING` which is idempotent. No hard-coded UUIDs were found. The seed inserts reference data (conf_categorias, ativo_tipos) by natural keys (slug, nome).

### Q4: Confirm RLS still gates data by condominio_id?

**A**: Yes. All existing RLS policies remain in place. The `criar_os_detalhada` function uses `SECURITY DEFINER` but still validates user membership via `usuarios_condominios` table. The function only bypasses RLS for the INSERT operation itself, not for validation.

### Q5: Sample RPC calls for each dialog pattern?

**A**: See section "Example Calls" under `public.criar_os_detalhada(...)` above.

---

## Support

For issues or questions:
1. Check this documentation first
2. Run `scripts/verify_os_backend.ts` to diagnose
3. Review migration file: `supabase/migrations/20251103000000_fix_os_backend_comprehensive.sql`
4. Check Supabase logs for detailed error messages

---

**Last Updated**: 2025-11-03
**Migration Version**: 20251103000000
**Status**: ✅ Production Ready
