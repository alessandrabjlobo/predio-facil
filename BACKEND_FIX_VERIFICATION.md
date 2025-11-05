# Backend Fix Verification Steps

## Root Cause Summary

**Problems:**
1. **404 on POST /rest/v1/ativos**: PostgREST wasn't exposing the `public` schema properly + missing grants
2. **Preventive plans not generating**: RPC function had wrong return type (void → boolean) and interval casting errors
3. **Missing trigger**: No automatic plan creation when assets are inserted
4. **Wrong backend URL**: Frontend was pointing to old Supabase project

**Fixes Applied:**
- Updated `.env` with correct Supabase URL and anon key
- Created comprehensive SQL migration fixing permissions, RLS, and functions
- Fixed `createAtivo` to always require `condominio_id`
- Fixed TypeScript errors in OsForm and OSNovo

---

## Step 1: Apply SQL Migration

**Using Supabase Dashboard:**
1. Go to https://supabase.com/dashboard/project/xpitekijedfhyizpgzac
2. Navigate to SQL Editor
3. Paste content from `supabase/migrations/20251105_fix_backend_404_and_preventive_plans.sql`
4. Click "Run"
5. Check for success messages in console

**Expected output:**
```
NOTICE:  ✓ Migration completed successfully
NOTICE:    - PostgREST config reloaded
NOTICE:    - Permissions granted to authenticated users
NOTICE:    - RLS policies created for ativos and planos_manutencao
NOTICE:    - criar_planos_preventivos function fixed with interval casting
NOTICE:    - Auto-generation trigger created for new assets
```

---

## Step 2: Verify Database Setup

Run these queries in SQL Editor to confirm setup:

### Check functions were created:
```sql
SELECT routine_name, routine_type, security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('criar_planos_preventivos', 'criar_planos_para_ativo');
```

**Expected:** 2 rows showing both functions as DEFINER

### Check trigger exists:
```sql
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public' 
  AND event_object_table = 'ativos';
```

**Expected:** `trg_after_insert_ativos_criar_planos` on INSERT

### Check RLS policies:
```sql
SELECT tablename, policyname, permissive, cmd 
FROM pg_policies 
WHERE tablename IN ('ativos', 'planos_manutencao')
ORDER BY tablename, policyname;
```

**Expected:** Policies for SELECT, INSERT, UPDATE, DELETE on both tables

---

## Step 3: Test RPC Function Manually

Replace `YOUR_CONDOMINIO_ID` with actual UUID from your database:

```sql
-- First, check which condominios exist
SELECT id, nome FROM condominios LIMIT 5;

-- Then test the RPC (use one of the IDs from above)
SELECT criar_planos_preventivos('YOUR_CONDOMINIO_ID_HERE');
```

**Expected output:**
```
NOTICE: [criar_planos_preventivos] Starting for condominio_id=xxx
NOTICE:   Checking asset: Elevador Social (tipo: Elevador)
NOTICE:     ✓ Created plan for: Elevador Social
...
NOTICE: [criar_planos_preventivos] Complete: created=5, skipped=0

criar_planos_preventivos
-------------------------
t
```

### Verify plans were created:
```sql
SELECT 
  pm.titulo,
  a.nome as ativo_nome,
  pm.tipo,
  pm.periodicidade,
  pm.proxima_execucao
FROM planos_manutencao pm
JOIN ativos a ON a.id = pm.ativo_id
WHERE pm.titulo LIKE 'Preventiva -%'
ORDER BY pm.created_at DESC
LIMIT 10;
```

**Expected:** Rows showing newly created preventive plans

---

## Step 4: Test Trigger (Auto-Generation)

Insert a test asset and verify plan is auto-created:

```sql
-- Get a valid tipo_id and condominio_id first:
SELECT id, nome FROM ativo_tipos WHERE periodicidade_default IS NOT NULL LIMIT 3;
SELECT id, nome FROM condominios LIMIT 3;

-- Insert test asset (replace IDs with actual values)
INSERT INTO ativos (nome, tipo_id, condominio_id, local, is_ativo)
VALUES ('TESTE - Elevador Trigger', 'YOUR_TIPO_ID_HERE', 'YOUR_CONDOMINIO_ID_HERE', 'Teste', true)
RETURNING id, nome;

-- Check if plan was auto-created (should happen immediately)
SELECT 
  pm.*
FROM planos_manutencao pm
WHERE pm.titulo LIKE 'Preventiva -%'
  AND pm.ativo_id IN (SELECT id FROM ativos WHERE nome LIKE 'TESTE -%')
ORDER BY pm.created_at DESC;
```

**Expected:** 1 row showing the auto-created plan

**Cleanup:**
```sql
-- Delete test data
DELETE FROM planos_manutencao WHERE ativo_id IN (SELECT id FROM ativos WHERE nome LIKE 'TESTE -%');
DELETE FROM ativos WHERE nome LIKE 'TESTE -%';
```

---

## Step 5: Test Frontend Integration

### 5.1 Check environment variables loaded:
1. Open browser console (F12)
2. Run: `console.log(import.meta.env)`
3. Verify:
   - `VITE_SUPABASE_URL` = `https://xpitekijedfhyizpgzac.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 5.2 Test asset creation via UI:
1. Log in to the app
2. Navigate to `/ativos` page
3. Click "Novo ativo"
4. Fill form:
   - Nome: "Teste Frontend Elevador"
   - Tipo: Select "Elevador" (or any tipo with periodicidade_default)
   - Local: "Hall Principal"
5. Click "Salvar"

**Expected:**
- Success message appears
- Asset appears in list
- Check browser Network tab → should see POST to `https://xpitekijedfhyizpgzac.supabase.co/rest/v1/ativos` returning 201

### 5.3 Verify plan was auto-created:
1. Click on the newly created asset
2. Check "Planos de Manutenção" tab
3. Should see "Preventiva - Elevador" (or corresponding tipo)

### 5.4 Test "Gerar Planos Preventivos" button:
1. On `/ativos` page, click "Gerar Planos Preventivos" button
2. Confirm dialog
3. Wait for success message

**Check in database:**
```sql
SELECT COUNT(*) as total_plans 
FROM planos_manutencao 
WHERE titulo LIKE 'Preventiva -%';
```

---

## Step 6: Check for Common Issues

### Issue: Still getting 404 on POST
**Check:**
```sql
-- Verify grants
SELECT grantee, privilege_type, table_name 
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
  AND table_name = 'ativos'
  AND grantee = 'authenticated';
```

**Expected:** SELECT, INSERT, UPDATE, DELETE for authenticated

**Fix if missing:**
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ativos TO authenticated;
SELECT pg_notify('pgrst', 'reload config');
```

### Issue: RLS blocking inserts
**Test RLS bypass:**
```sql
-- Temporarily create a permissive policy
CREATE POLICY "temp_allow_all" ON public.ativos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Try insert again in UI
-- If it works, the issue is with your scoped policies

-- Remove temp policy
DROP POLICY "temp_allow_all" ON public.ativos;
```

### Issue: Trigger not firing
**Check trigger is enabled:**
```sql
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'trg_after_insert_ativos_criar_planos';
```

**Expected:** `tgenabled = 'O'` (O = origin, meaning enabled)

---

## Step 7: Production Checklist

- [ ] `.env` updated with correct Supabase URL/key
- [ ] SQL migration applied successfully
- [ ] Functions created and return correct types
- [ ] Trigger created and enabled
- [ ] RLS policies in place and not blocking legitimate access
- [ ] Frontend can create assets without 404
- [ ] Preventive plans auto-generate on asset creation
- [ ] "Gerar Planos Preventivos" button works
- [ ] No console errors in browser
- [ ] No errors in Supabase logs

---

## Rollback Plan (if needed)

If something goes wrong:

```sql
-- Drop trigger
DROP TRIGGER IF EXISTS trg_after_insert_ativos_criar_planos ON public.ativos;

-- Drop functions
DROP FUNCTION IF EXISTS public.criar_planos_para_ativo(uuid);
DROP FUNCTION IF EXISTS public.criar_planos_preventivos(uuid);

-- Remove test data
DELETE FROM planos_manutencao WHERE titulo LIKE 'Preventiva -%' AND created_at > '2025-11-05';

-- Restore old .env (if you backed it up)
-- Redeploy app
```

---

## Support

If issues persist:
1. Check Supabase logs: Dashboard → Logs → Postgres Logs
2. Check browser console for JavaScript errors
3. Check Network tab for failed requests (status code, response body)
4. Verify you're logged in as a user with proper roles (sindico/admin)
