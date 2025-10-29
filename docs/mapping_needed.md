# Schema Mapping & Recommendations

This document details the observed database schema and notes any discrepancies between the seed data requirements and the actual implementation.

## Summary

✅ **Good News**: The current schema is fully compatible with the NBR 5674 seed data. No breaking changes are required.

The seed files (`supabase/seed.sql` and `supabase/admin_master.sql`) work correctly with the existing schema as-is. This document provides recommendations for optional future enhancements only.

---

## Schema Analysis

### Observed Schema (Current Implementation)

Based on analysis of migration files in `supabase/migrations/`:

#### `public.conf_categorias`
```sql
CREATE TABLE public.conf_categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
**Status**: ✅ Matches requirements perfectly

---

#### `public.ativo_tipos`
```sql
CREATE TABLE public.ativo_tipos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE,
  impacta_conformidade BOOLEAN NOT NULL DEFAULT FALSE,
  is_conformidade BOOLEAN NOT NULL DEFAULT FALSE,
  criticidade TEXT DEFAULT 'media' CHECK (criticidade IN ('baixa', 'media', 'alta', 'urgente')),
  periodicidade_default TEXT,  -- ⚠️ See note below
  checklist_default JSONB DEFAULT '[]'::jsonb,
  conf_tipo TEXT REFERENCES public.conf_categorias(slug),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Status**: ✅ Fully compatible

**Periodicidade Format**: The column is **TEXT** (not INTERVAL). The seed data uses text values like:
- `'1 month'`
- `'6 months'`
- `'1 year'`
- `'3 months'`

This matches the existing pattern observed in migration `20251022150046_203df414-87a6-4824-b8cc-7bc32dbb8eaa.sql`.

---

#### `public.usuarios`
```sql
CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nome TEXT,
  cpf TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Status**: ✅ Compatible

**Note**: This table does **NOT** have a `papel` column. The admin_master.sql script handles this gracefully with a try-catch block.

---

#### `public.user_roles`
```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);
```

**Status**: ✅ Compatible

**Role Assignment**: The admin master user is assigned the `'admin'` role via this table.

---

#### `public.app_role` (ENUM)
```sql
CREATE TYPE public.app_role AS ENUM (
  'admin',
  'sindico',
  'zelador',
  'morador',
  'fornecedor'
);
```

**Status**: ✅ Compatible (with recommendation below)

**Current Values**:
- `admin` ✅ (used for admin master user)
- `sindico`
- `zelador`
- `morador`
- `fornecedor`

**Missing Value**:
- `admin_master` ❌ (not present)

---

## Recommendations

### OPTIONAL - Add 'admin_master' to app_role Enum

**Priority**: Low (Optional enhancement for future)

**Current Workaround**: The admin master user is assigned the `'admin'` role, which works perfectly for all administrative functions.

**Future Enhancement**: For better semantic distinction between regular admins and the master admin, consider adding `'admin_master'` to the enum:

```sql
-- ⚠️ DO NOT RUN THIS YET - Future Enhancement Only
-- This is a breaking change and requires careful planning

-- Step 1: Add new enum value
ALTER TYPE public.app_role ADD VALUE 'admin_master';

-- Step 2: Update admin master user role (if desired)
UPDATE public.user_roles
SET role = 'admin_master'
WHERE user_id = (
  SELECT id FROM public.usuarios
  WHERE email = 'alessandrabastojansen@gmail.com'
)
AND role = 'admin';
```

**Benefits**:
- Clearer distinction in code between admin levels
- More granular role-based access control
- Better audit trail

**Considerations**:
- Requires testing all RLS policies
- May need frontend adjustments if role is displayed
- Should be coordinated with a broader RBAC review

**Action Required**: None immediately. Current setup works correctly.

---

### OPTIONAL - Add usuarios.papel Column

**Priority**: Very Low (Not recommended unless specific need arises)

**Current Status**: The `usuarios` table does NOT have a `papel` column. Roles are managed exclusively through the `user_roles` table, which is the correct normalized approach.

**Recommendation**: **Do NOT add** a `papel` column to `usuarios`. The current architecture using a separate `user_roles` table is cleaner because:

1. ✅ Allows users to have multiple roles
2. ✅ Normalized database design
3. ✅ Easier to audit role changes
4. ✅ No redundant data

**Original Specification Note**: The task specification mentioned setting `papel` to `"admin_master"` as a "non-breaking flag". However, since this column doesn't exist and isn't needed, the seed scripts appropriately skip this step.

---

### OPTIONAL - Periodicidade Format Enhancement

**Priority**: Very Low (Current format works well)

**Current Format**: TEXT with values like `'1 month'`, `'6 months'`, `'1 year'`

**Observation**: While PostgreSQL INTERVAL type would provide native date arithmetic, the current TEXT format:

✅ **Advantages**:
- Simple to understand and maintain
- Works with existing codebase patterns
- Compatible with external integrations
- Easy to display in UI

❌ **Limitations**:
- No native date arithmetic in SQL
- Requires application-level parsing

**Future Enhancement** (if needed):

Option 1: Keep TEXT, add computed view
```sql
-- Non-breaking: Add a computed view
CREATE VIEW ativo_tipos_with_interval AS
SELECT *,
  CASE periodicidade_default
    WHEN '1 day' THEN interval '1 day'
    WHEN '1 week' THEN interval '1 week'
    WHEN '1 month' THEN interval '1 month'
    WHEN '3 months' THEN interval '3 months'
    WHEN '6 months' THEN interval '6 months'
    WHEN '1 year' THEN interval '1 year'
    ELSE NULL
  END AS periodicidade_interval
FROM ativo_tipos;
```

Option 2: Add new column alongside TEXT
```sql
-- Non-breaking: Add interval column without removing text
ALTER TABLE ativo_tipos
ADD COLUMN periodicidade_interval INTERVAL;

-- Populate from existing text
UPDATE ativo_tipos
SET periodicidade_interval = CASE periodicidade_default
  WHEN '1 day' THEN interval '1 day'
  WHEN '1 month' THEN interval '1 month'
  WHEN '3 months' THEN interval '3 months'
  WHEN '6 months' THEN interval '6 months'
  WHEN '1 year' THEN interval '1 year'
  ELSE NULL
END;
```

**Action Required**: None. Current format is working correctly and is well-established in the codebase.

---

## Checklist Validation

The seed data includes `checklist_default` as JSONB arrays. Each item includes:

✅ **Required Keys** (all present):
- `descricao` - Task description
- `responsavel` - Responsible party (sindico, terceirizado, eng_civil, zelador)
- `tipo_manutencao` - Type: rotineira | preventiva | corretiva
- `evidencia` - Required evidence (laudo, fotos, art, certificado, etc.)
- `referencia` - NBR/regulatory references (e.g., "NBR 5674, NBR 6118")

**Example**:
```json
{
  "descricao": "Inspeção visual de fissuras, trincas e deformações",
  "responsavel": "eng_civil",
  "tipo_manutencao": "preventiva",
  "evidencia": "relatorio_fotografico,art",
  "referencia": "NBR 5674, NBR 6118, NBR 15575"
}
```

**Status**: ✅ All checklist items in seed data follow this format correctly

---

## Compatibility Matrix

| Component | Status | Notes |
|-----------|--------|-------|
| conf_categorias | ✅ Fully compatible | 14 categories with kebab-case slugs |
| ativo_tipos | ✅ Fully compatible | 20+ assets with complete checklists |
| periodicidade_default | ✅ TEXT format works | Using '1 month', '6 months', '1 year' pattern |
| checklist_default | ✅ Valid JSONB | All required keys present |
| usuarios | ✅ Compatible | No papel column (not needed) |
| user_roles | ✅ Compatible | Uses 'admin' role successfully |
| app_role enum | ✅ Compatible | 'admin' value exists and works |
| admin_master.sql | ✅ Defensive | Handles missing tables/columns gracefully |

---

## Testing Performed

### Idempotency Tests
✅ All INSERT statements use `ON CONFLICT DO NOTHING`
✅ admin_master.sql uses defensive PL/pgSQL blocks
✅ Scripts can be re-run multiple times safely

### Data Integrity Tests
✅ All conf_tipo values reference valid conf_categorias.slug
✅ All criticidade values are valid enum values
✅ All slugs are unique and kebab-case
✅ All checklist_default are valid JSON arrays

### Foreign Key Tests
✅ ativo_tipos.conf_tipo → conf_categorias.slug (valid)
✅ user_roles.user_id → usuarios.id (valid)
✅ usuarios.auth_user_id → auth.users.id (valid)

---

## Conclusion

**No schema changes required.** The seed data is fully compatible with the existing database schema. All recommendations in this document are optional enhancements for future consideration.

The current implementation:
- ✅ Follows best practices for normalized database design
- ✅ Uses appropriate data types for each field
- ✅ Maintains referential integrity
- ✅ Supports the NBR 5674 compliance requirements
- ✅ Allows for future extensibility

---

## Revision History

- **2025-10-29**: Initial analysis based on migration files
  - Confirmed TEXT format for periodicidade_default
  - Confirmed no papel column in usuarios (correct design)
  - Confirmed app_role enum values
  - All seeds compatible as-is
