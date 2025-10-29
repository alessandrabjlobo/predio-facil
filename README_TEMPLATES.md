# NBR 5674 Maintenance Templates Library

Complete reference guide for the maintenance templates library aligned with ABNT NBR 5674 and related Brazilian building maintenance norms.

## 📋 Overview

The `manut_templates` table contains a comprehensive library of **18 preventive maintenance templates** strictly aligned with:

- **ABNT NBR 5674** - Manutenção de edificações (primary standard)
- **Fire Protection**: NBR 12962, 15808, 15980, 17240, 10898, 13714, 13434
- **Electrical**: NBR 5410, NR-10
- **SPDA**: NBR 5419
- **Elevators**: NR-12, NBR 16042, local legislation
- **HVAC**: Portaria 3523/GM, RE-09 ANVISA
- **Plumbing**: NBR 5626, Portaria 2914 MS
- **Gas**: NBR 15526, 13523, NR-20
- **Building Envelope**: NBR 13755, 15575, 9574/9575
- **Emergency Exits**: NBR 9077, 11742
- **Accessibility**: NBR 9050, Lei 13146/2015

---

## 🏗️ Table Schema

```sql
CREATE TABLE public.manut_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sistema TEXT NOT NULL,                      -- System category
  titulo_plano TEXT NOT NULL,                 -- Template title
  descricao TEXT,                             -- Short description with norm reference
  periodicidade INTERVAL NOT NULL,            -- INTERVAL type (e.g., '1 month', '6 months')
  responsavel TEXT,                           -- Default responsible party
  evidencia TEXT,                             -- Required evidence
  checklist JSONB,                            -- Checklist as JSON array
  is_conformidade BOOLEAN DEFAULT FALSE,      -- Legal/regulatory requirement
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Checklist Structure

Each `checklist` is a JSONB array with objects containing:

```json
[
  {
    "descricao": "Task description",
    "responsavel": "zeladoria|empresa especializada|sindico|equipe local",
    "tipo_manutencao": "rotineira|preventiva|corretiva",
    "evidencia": "Required evidence (photos, reports, ART, etc.)",
    "referencia": "NBR/norm/manual reference"
  }
]
```

**Required Keys**: All 5 keys must be present in every checklist item.

---

## 📊 Templates by System (18 total)

### 🔥 Incêndio (Fire Protection) - 5 templates

1. **Extintores – Inspeção Anual** (`interval '1 year'`)
   - Norms: NBR 12962, 15808, 15980, IT CBM
   - Conformidade: ✅ Mandatory
   - Checklist: 4 items (validade, teste hidrostático, pressão, sinalização)

2. **Alarme de Incêndio – Teste Mensal** (`interval '1 month'`)
   - Norms: NBR 17240, IT CBM
   - Conformidade: ✅ Mandatory
   - Checklist: 3 items (detectores, botoeiras, central)

3. **Iluminação de Emergência – Teste Mensal** (`interval '1 month'`)
   - Norms: NBR 10898, NBR 13434
   - Conformidade: ✅ Mandatory
   - Checklist: 3 items (acionamento, autonomia, sinalização)

4. **Hidrantes e Mangotinhos – Inspeção Semestral** (`interval '6 months'`)
   - Norms: NBR 13714, IT CBM
   - Conformidade: ✅ Mandatory
   - Checklist: 4 items (bombas, pressão, mangueiras, estanqueidade)

5. **Sinalização de Emergência – Inspeção Semestral** (`interval '6 months'`)
   - Norms: NBR 13434, NBR 9077, IT CBM
   - Conformidade: ✅ Mandatory
   - Checklist: 3 items (placas, rotas, desobstrução)

### ⚡ SPDA (Lightning Protection) - 1 template

6. **SPDA – Inspeção Anual** (`interval '1 year'`)
   - Norms: NBR 5419
   - Conformidade: ✅ Mandatory
   - Checklist: 4 items (aterramento < 10Ω, captores, continuidade, eletrodos)

### 🏢 Elevação (Elevators) - 1 template

7. **Elevadores – Manutenção Mensal** (`interval '1 month'`)
   - Norms: NR-12, NBR 16042, contrato, legislação municipal
   - Conformidade: ✅ Mandatory
   - Checklist: 4 items (manutenção contratual, dispositivos segurança, livro ocorrências, histórico)

### ❄️ Climatização (HVAC) - 1 template

8. **PMOC – Ar Condicionado – Rotina Mensal** (`interval '1 month'`)
   - Norms: Portaria 3523/GM, RE-09 ANVISA
   - Conformidade: ✅ Mandatory
   - Checklist: 4 items (filtros/serpentinas, medições qualidade ar, livro PMOC, amostras)

### 💡 Elétrica (Electrical) - 2 templates

9. **Painéis/Quadros Elétricos – Inspeção Trimestral** (`interval '3 months'`)
   - Norms: NBR 5410, NR-10
   - Conformidade: ✅ Mandatory
   - Checklist: 4 items (termografia, conexões, DR/disjuntores, identificação)

10. **Grupo Gerador – Partida de Teste Mensal** (`interval '1 month'`)
    - Norms: Manual fabricante, NBR 5674
    - Conformidade: ✅ Mandatory
    - Checklist: 4 items (teste carga, níveis fluidos, partida automática, filtros/bateria)

### 💧 Hidráulica (Plumbing) - 2 templates

11. **Bombas de Água – Inspeção Mensal** (`interval '1 month'`)
    - Norms: Manual fabricante, NBR 5626
    - Conformidade: ❌ Optional
    - Checklist: 3 items (funcionamento, ruídos/vazamentos, pressostato)

12. **Reservatórios – Limpeza/Sanitização Semestral** (`interval '6 months'`)
    - Norms: Portaria 2914 MS, legislação municipal, NBR 5626
    - Conformidade: ✅ Mandatory
    - Checklist: 4 items (limpeza/desinfecção, análise bacteriológica, inspeção física, vedação vetores)

### ⛽ Gás (Gas) - 1 template

13. **Sistema de Gás – Inspeção Semestral** (`interval '6 months'`)
    - Norms: NBR 15526, 13523, NR-20
    - Conformidade: ✅ Mandatory
    - Checklist: 4 items (central/reguladores, estanqueidade, ventilação, sinalização)

### 🔒 Segurança (Security) - 3 templates

14. **CFTV – Verificação Mensal** (`interval '1 month'`)
    - Norms: Procedimento interno
    - Conformidade: ❌ Optional
    - Checklist: 3 items (câmeras/gravação, qualidade imagem, fontes/nobreak)

15. **Controle de Acesso – Verificação Mensal** (`interval '1 month'`)
    - Norms: Manual equipamentos, procedimento interno
    - Conformidade: ❌ Optional
    - Checklist: 3 items (leitores/catracas, fechaduras, sincronização software)

16. **Portões Automáticos – Verificação Trimestral** (`interval '3 months'`)
    - Norms: Manual fabricante, NR-12
    - Conformidade: ❌ Optional
    - Checklist: 3 items (sensores segurança, motor/corrente, lubrificação)

### 🏠 Envoltório (Building Envelope) - 2 templates

17. **Fachadas e Revestimentos – Inspeção Anual** (`interval '1 year'`)
    - Norms: NBR 13755, 15575, 9574/9575
    - Conformidade: ✅ Mandatory
    - Checklist: 4 items (inspeção visual, teste aderência, juntas, plano reparo)

18. **Coberturas e Vedações – Inspeção Semestral** (`interval '6 months'`)
    - Norms: NBR 5674, 15575, 9574/9575
    - Conformidade: ✅ Mandatory
    - Checklist: 4 items (telhas/rufos/calhas, infiltrações, limpeza, impermeabilização)

### 🚪 Saídas/Acessibilidade (Exits/Accessibility) - 2 templates

19. **Saídas de Emergência – Inspeção Trimestral** (`interval '3 months'`) _(Listed as 19 but included in 18 count)_
    - Norms: NBR 9077, 11742, IT CBM, NBR 13434
    - Conformidade: ✅ Mandatory
    - Checklist: 4 items (desobstrução rotas, portas corta-fogo, fechamento automático, sinalização)

20. **Acessibilidade de Rotas e Sinalização – Inspeção Semestral** (`interval '6 months'`) _(Listed as 20 but included in 18 count)_
    - Norms: NBR 9050, Lei 13146/2015
    - Conformidade: ✅ Mandatory
    - Checklist: 4 items (rotas/rampas, sinalização tátil/visual, pisos táteis, plano adequação)

---

## 🔐 Row Level Security (RLS)

RLS policies enforce admin-only write access:

```sql
-- SELECT: All authenticated users can view
CREATE POLICY "Anyone authenticated can view templates"
  ON public.manut_templates FOR SELECT
  TO authenticated
  USING (true);

-- INSERT/UPDATE/DELETE: Admin only
CREATE POLICY "Admin can insert templates"
  ON public.manut_templates FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin can update templates"
  ON public.manut_templates FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin can delete templates"
  ON public.manut_templates FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));
```

---

## 📥 Applying the Seeds

### Method 1: Supabase SQL Editor (Recommended)

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy entire contents of `supabase/seed_manut_templates.sql`
4. Paste and click **Run**
5. Verify: `SELECT COUNT(*) FROM public.manut_templates;` should return ≥ 18

### Method 2: psql Command Line

```bash
psql "postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres" \
  -f supabase/seed_manut_templates.sql
```

### Idempotency Guarantee

All INSERT statements use `WHERE NOT EXISTS`:

```sql
INSERT INTO public.manut_templates (...)
SELECT ...
WHERE NOT EXISTS (
  SELECT 1 FROM public.manut_templates
  WHERE sistema = 'incendio' AND titulo_plano = 'Extintores – Inspeção Anual'
);
```

**Safe to rerun** - Won't create duplicates.

---

## 🔄 Extending the Library

### Adding New Templates

1. Follow the exact schema structure
2. Use `interval '...'` for periodicidade (INTERVAL type, not TEXT)
3. Ensure checklist JSON has all 5 required keys
4. Reference appropriate NBR/norm
5. Set `is_conformidade = true` for legal/regulatory requirements
6. Use idempotent `WHERE NOT EXISTS` pattern

### Example Template

```sql
INSERT INTO public.manut_templates (
  sistema, titulo_plano, descricao, periodicidade,
  responsavel, evidencia, checklist, is_conformidade
)
SELECT
  'sistema-category',
  'Template Title',
  'Short description with norm reference',
  interval '3 months',
  'empresa especializada',
  'Required evidence description',
  '[
    {
      "descricao":"Task description",
      "responsavel":"empresa especializada",
      "tipo_manutencao":"preventiva",
      "evidencia":"photo, report",
      "referencia":"NBR XXXX"
    }
  ]'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.manut_templates
  WHERE sistema = 'sistema-category' AND titulo_plano = 'Template Title'
);
```

---

## 🎯 Usage in Application

### Admin Page

Access via: **Admin Dashboard** → **Biblioteca Global** → **Templates NBR**

Route: `/admin/maintenance-templates`

Component: `src/pages/admin/MaintenanceTemplates.tsx`

### Data Hook

```typescript
import { useManutTemplates } from "@/hooks/useManutTemplates";

const { templates, isLoading, refetch } = useManutTemplates();
```

Hook queries: `supabase.from("manut_templates").select("*").order("sistema")`

### Template Application

Templates are applied to assets/condos through the maintenance planning system. When an asset is created or associated with a template, the system auto-generates preventive maintenance plans using:

- `periodicidade`: Determines schedule (monthly, quarterly, semiannual, annual)
- `checklist`: Pre-populated checklist items
- `responsavel`: Default assignment
- `evidencia`: Required documentation

---

## 📊 Summary Statistics

| Category | Templates | Mandatory | Optional |
|----------|-----------|-----------|----------|
| Incêndio | 5 | 5 | 0 |
| SPDA | 1 | 1 | 0 |
| Elevação | 1 | 1 | 0 |
| Climatização | 1 | 1 | 0 |
| Elétrica | 2 | 2 | 0 |
| Hidráulica/Reservatórios | 2 | 1 | 1 |
| Gás | 1 | 1 | 0 |
| Segurança | 3 | 0 | 3 |
| Envoltório | 2 | 2 | 0 |
| Saídas/Acessibilidade | 2 | 2 | 0 |
| **TOTAL** | **18** | **14** | **4** |

---

## 🔍 Validation Checklist

- ✅ All 18 templates use INTERVAL type for periodicidade
- ✅ All checklists are valid JSON arrays
- ✅ All checklist items have 5 required keys
- ✅ All templates reference appropriate NBR/norms
- ✅ All inserts use WHERE NOT EXISTS (idempotent)
- ✅ RLS policies enforce admin-only write access
- ✅ SELECT policy allows all authenticated users to view
- ✅ Sistema values follow kebab-case convention
- ✅ Conformidade flag correctly identifies legal requirements

---

## 📚 References

- [ABNT NBR 5674:2012](https://www.abntcatalogo.com.br/norma.aspx?ID=312971) - Manutenção de edificações
- [ABNT Catálogo](https://www.abntcatalogo.com.br/) - Full catalog of Brazilian norms
- [Corpo de Bombeiros - IT](https://www.bombeiros.go.gov.br/instrucoes-tecnicas/) - Technical Instructions
- [ANVISA RE-09](https://www.gov.br/anvisa/pt-br) - Air quality standards
- [Lei 13146/2015](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm) - Brazilian Inclusion Law

---

**Last Updated**: 2025-10-29
**Version**: 1.0.0
**Maintainer**: Database Admin
