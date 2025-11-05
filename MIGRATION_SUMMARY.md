# Migration Summary: Fix Backend 404s & Preventive Plan Generation

## Changes Made

### 1. Environment Configuration (`.env`)
- ✅ Updated `VITE_SUPABASE_URL` → `https://xpitekijedfhyizpgzac.supabase.co`
- ✅ Updated `VITE_SUPABASE_ANON_KEY` → `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 2. Database Migration (`supabase/migrations/20251105_fix_backend_404_and_preventive_plans.sql`)

**Schema Exposure & Permissions:**
- Reloaded PostgREST config with `pg_notify('pgrst', 'reload config')`
- Granted schema USAGE and table permissions (SELECT, INSERT, UPDATE, DELETE) to `authenticated` role
- Enabled RLS on `ativos`, `ativo_tipos`, and `planos_manutencao`

**RLS Policies:**
- Created scoped policies for `ativos` table (by condomínio + role)
- Created policies for `planos_manutencao` allowing function-based inserts
- Removed old "test" policies that allowed unrestricted access

**RPC Function Fixes:**
- `criar_planos_preventivos(p_condominio_id uuid)`:
  - Fixed return type from `void` → `boolean`
  - Added proper interval casting: `periodicidade_default::interval`
  - Added RAISE NOTICE logging for debugging
  - Made idempotent (won't create duplicate plans)
  - Set as `SECURITY DEFINER` to bypass RLS

- `criar_planos_para_ativo(p_ativo_id uuid)`:
  - Created new trigger function for auto-generation
  - Returns `integer` (count of plans created)
  - Handles interval casting safely
  - Set as `SECURITY DEFINER`

**Trigger Creation:**
- Created `trg_after_insert_ativos_criar_planos` on `ativos` table
- Fires AFTER INSERT to auto-create preventive plan for new assets
- Calls `criar_planos_para_ativo(NEW.id)`

### 3. Frontend Fixes

**`src/components/os/OsForm.tsx`:**
- Fixed: `useCondominioAtual()` returns `{ condominio }`, not `{ condominioId }`
- Changed: `const { condominioId }` → `const { condominio }`
- Changed: `condominio_id: condominioId` → `condominio_id: condominio?.id`

**`src/pages/OSNovo.tsx`:**
- Fixed TypeScript error with `ativo_tipos` join result
- Added proper type casting: `const ativoTipos = ativo?.ativo_tipos as { slug?: string } | { slug?: string }[] | null`
- Handle both single object and array return from join

**`src/lib/api.ts` - `createAtivo()`:**
- Added mandatory `condominio_id` check
- Falls back to `localStorage.getItem("currentCondominioId")` if not provided
- Throws clear error if no condomínio selected
- Removed manual plan creation (now handled by trigger)

**`src/pages/Ativos.tsx`:**
- Added "Gerar Planos Preventivos" button
- Calls `gerarPlanosPreventivos(condominio.id)` RPC
- Shows loading state and success/error toasts

---

## Root Cause Analysis

### Problem 1: POST /rest/v1/ativos → 404
**Cause:** 
- PostgREST wasn't exposing the `public` schema tables to the REST API
- Missing `GRANT` statements for `authenticated` role
- RLS was enabled but no policies existed to allow inserts

**Solution:**
- Reloaded PostgREST config
- Granted necessary permissions to `authenticated`
- Created proper scoped RLS policies

### Problem 2: Preventive Plans Not Generating
**Cause:**
- RPC `criar_planos_preventivos` had wrong return type (`void` instead of `boolean`)
- Interval casting error: `periodicidade_default` (TEXT) → `periodicidade` (INTERVAL) failed
- No trigger to auto-create plans on asset insertion

**Solution:**
- Recreated RPC with correct signature and proper casting: `v_periodicidade := v_ativo.periodicidade_default::interval`
- Created trigger function + trigger to auto-generate on INSERT
- Made both functions `SECURITY DEFINER` to bypass RLS during execution

### Problem 3: TypeScript Build Errors
**Cause:**
- `useCondominioAtual` hook returns different shape than expected
- Supabase join results can be array or object (type mismatch)

**Solution:**
- Fixed destructuring to match actual return type
- Added proper type guards for join results

---

## Testing Checklist

- [ ] **Backend connection:** App connects to `xpitekijedfhyizpgzac.supabase.co`
- [ ] **Asset creation:** POST to `/rest/v1/ativos` returns 201 (not 404)
- [ ] **Auto-generation:** New asset automatically gets preventive plan
- [ ] **RPC call:** "Gerar Planos Preventivos" button works
- [ ] **Build:** No TypeScript errors
- [ ] **RLS:** Users can only see/modify their condomínio's data
- [ ] **Logs:** Check Supabase logs for any errors

---

## Deployment Steps

1. **Apply migration:**
   - Go to Supabase Dashboard → SQL Editor
   - Paste migration SQL
   - Run and verify success messages

2. **Deploy frontend:**
   - Code changes are already committed
   - Vercel will auto-deploy on push
   - Verify `.env` is updated in deployment settings

3. **Verify:**
   - Follow steps in `BACKEND_FIX_VERIFICATION.md`
   - Test asset creation end-to-end
   - Check preventive plans are auto-generated

---

## Files Changed

- `.env` - Backend credentials updated
- `src/components/os/OsForm.tsx` - Fixed condominio destructuring
- `src/pages/OSNovo.tsx` - Fixed TypeScript type guard
- `src/lib/api.ts` - Enhanced `createAtivo` with condominio validation
- `src/pages/Ativos.tsx` - Added "Generate Plans" button
- `BACKEND_FIX_VERIFICATION.md` - Testing guide
- `MIGRATION_SUMMARY.md` - This file

**Migration file (to be applied manually):**
- Content provided in `supabase/migrations/20251105_fix_backend_404_and_preventive_plans.sql`
