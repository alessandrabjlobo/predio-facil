# NBR 5674 Compliance Gap Report
**Date:** 2025-11-05
**System:** Predio Fácil - Building Maintenance Management System

---

## Executive Summary

This report assesses the current system's compliance with NBR 5674 (Building Maintenance - Requirements for the Maintenance Management System) and identifies gaps preventing full alignment with preventive, corrective, and predictive maintenance standards.

---

## Part A: Current System Overview

### 1. Database Schema & Core Tables

#### Asset Management
- **`ativos`**: Physical assets requiring maintenance
  - Links to `ativo_tipos` via `tipo_id` (UUID foreign key)
  - Tracks: nome, descricao, local, fabricante, modelo
  - Belongs to `condominios` (multi-tenant)

- **`ativo_tipos`**: Asset type library with default maintenance schedules
  - Fields: nome, slug, periodicidade_default (INTERVAL), checklist_default (JSONB)
  - Criticality levels: baixa, media, alta
  - Conformidade flags: is_conformidade, impacta_conformidade

#### Maintenance Planning
- **`planos_manutencao`**: Preventive maintenance schedules
  - Fields:
    - `titulo`: Plan name
    - `tipo`: Enum (preventiva, corretiva, preditiva)
    - `periodicidade`: INTERVAL (e.g., '3 months', '1 month')
    - `proxima_execucao`: DATE for next scheduled run
    - `checklist`: JSONB array of inspection items
    - `responsavel`: TEXT (executor designation)
    - `is_legal`: BOOLEAN (legal requirement flag)
  - Links: ativo_id, condominio_id, conf_categoria_id

- **`manut_templates`**: Reusable maintenance plan templates
  - Fields: sistema (asset category), titulo_plano, periodicidade (INTERVAL), checklist (JSONB)
  - Used by `criar_planos_preventivos` RPC to auto-generate plans

#### Execution & Work Orders
- **`manutencoes`**: Scheduled maintenance tasks
  - Generated from planos_manutencao
  - Status: pendente, em_andamento, concluida, cancelada
  - Tracks: vencimento (due date), conclusao (completion date)

- **`os` (ordens_servico)**: Work orders (NBR 5674 compliant structure)
  - Comprehensive fields for:
    - Basic info: titulo, descricao, tipo_manutencao, prioridade
    - Execution: responsavel, fornecedor_nome/contato
    - Safety: risco_nivel, riscos_identificados, epi_lista, pt_numero
    - Resources: checklist, materiais, equipe
    - Costs: custo_estimado, custo_materiais, custo_total
    - Validation: aceite_responsavel, aceite_data, validacao_obs
    - Evidence: fotos_antes, fotos_depois
  - Status: aberta, em_andamento, aguardando_validacao, concluida, cancelada

### 2. Current Workflows

#### A) Plan Generation Flow
1. **Manual Creation**: Users create preventive plans via UI
2. **Template-Based**: When ativo is created:
   - `createAtivo()` in `src/lib/api.ts` calls `listTemplatesBySistema(tipo)`
   - Matches templates by sistema field (case-insensitive text match)
   - Creates plans with periodicidade from template (INTERVAL)
   - Falls back to `ensureDefaultPlanoParaAtivo()` using ativo_tipos.periodicidade_default
3. **RPC Generation**: `criar_planos_preventivos(uuid)` can be called manually
   - Currently has bugs: calls non-existent `_to_interval()` function
   - Intended to bulk-create plans for all assets in a condominium

#### B) OS (Work Order) Creation Flow
1. **From Plans**: Generated via "Gerar OS" button
   - Previously used modal (now redirects to `/os/new` form)
   - Prefills data from plan
2. **Manual**: User creates ad-hoc work order via `/os/new`
3. **API**: Uses `createOS()` function (not RPC)
   - Normalizes prioridade, tipo_manutencao to enums
   - Validates dates to YYYY-MM-DD format
   - Encodes status via `osDbEncodeStatus()`

#### C) Periodicity Handling
- Database column `planos_manutencao.periodicidade` is **INTERVAL type**
- Templates store intervals: `'3 months'`, `'1 month'`, `'7 days'`
- **No TEXT conversion** - intervals are native PostgreSQL type
- Next execution calculated: `CURRENT_DATE + periodicidade`

---

## Part B: Compatibility with NBR 5674 Baseline

### ✅ Currently Implemented

1. **Maintenance Type Classification**
   - ✓ Preventiva (scheduled, proactive)
   - ✓ Corretiva (reactive, failure-based)
   - ✓ Preditiva (condition-based)
   - Stored in: `planos_manutencao.tipo`, `os.tipo_manutencao`

2. **Periodic Scheduling**
   - ✓ Interval-based recurrence (INTERVAL type)
   - ✓ Next execution tracking (`proxima_execucao`)
   - ✓ Advance warning (`antecedencia_dias`)

3. **Checklists & Procedures**
   - ✓ JSONB checklist items with `obrigatorio` flag
   - ✓ Item structure: `{item: string, obrigatorio: boolean}`
   - ✓ Editable during OS creation

4. **Responsibility Assignment**
   - ✓ `responsavel` field (text: "sindico", "tecnico", "interno", "externo")
   - ✓ Executor info: `executor_nome`, `executor_contato` in OS

5. **Priority Levels**
   - ✓ Enum: baixa, media, alta, urgente
   - ✓ Mapped to visual indicators (🟢🟡🟠🔴)

6. **Basic Traceability**
   - ✓ created_at timestamps on all tables
   - ✓ updated_at on key tables
   - ✓ Linking: OS → ativo → plano → manutencoes

7. **Evidence Attachments (Partial)**
   - ✓ Fields exist: `fotos_antes`, `fotos_depois` (JSONB arrays)
   - ⚠️  Storage integration incomplete (see gaps)

### ⚠️ Partially Implemented

8. **SLA Tracking**
   - ✓ `sla_dias` field in planos_manutencao
   - ✓ `sla_inicio`, `sla_fim` in OS table
   - ❌ No automatic SLA violation detection/alerts
   - ❌ No SLA performance reports

9. **Approval/Validation Workflow**
   - ✓ Fields: `aceite_responsavel`, `aceite_data`, `validacao_obs`
   - ✓ Status: `aguardando_validacao`
   - ❌ No enforced workflow (status transitions not validated)
   - ❌ No approval history log

10. **Safety & Risk Management**
    - ✓ Fields: `risco_nivel`, `riscos_identificados`, `epi_lista`
    - ✓ PT (Work Permit) fields: `pt_numero`, `pt_tipo`
    - ❌ No PT generation/validation workflow
    - ❌ No safety incident tracking

---

## Part C: Gaps for Full NBR Alignment

### CRITICAL GAPS

#### 1. **Execution Logs & Progress Tracking**
**Status:** ❌ Missing

**Current State:**
- OS has status field, but no detailed execution log
- No timestamped activity records
- Cannot track WHO did WHAT and WHEN during execution

**Required:**
- `os_logs` table or `os.execution_history` JSONB field
- Structure: `[{timestamp, user_id, action, notes, evidences}]`
- Actions: started, paused, resumed, checkpoint_completed, completed

**Impact:** Cannot demonstrate compliance with execution procedures for audits.

---

#### 2. **Attachment/Evidence Management**
**Status:** ⚠️  Partial (fields exist, integration incomplete)

**Current State:**
- `fotos_antes`, `fotos_depois` fields are JSONB but rarely populated
- `documento_tipos` table referenced but does not exist (404 errors)
- No document upload workflow in OS forms

**Required:**
- Supabase Storage integration for:
  - Before/after photos
  - Certificates, reports, test results
  - Supplier invoices/work orders
- Metadata: `{path, legenda, timestamp, uploaded_by}`
- Table: `os_anexos` (id, os_id, tipo, storage_key, nome, mime_type, uploaded_at)

**Impact:** Cannot prove work was completed per spec (photos, certificates).

---

#### 3. **Audit Trail & Change Tracking**
**Status:** ❌ Missing

**Current State:**
- Only `created_at`, `updated_at` timestamps
- No record of who changed what, when, why

**Required:**
- `audit_logs` table: `(table_name, record_id, action, old_values, new_values, user_id, timestamp)`
- Triggers on: planos_manutencao, os, manutencoes (UPDATE/DELETE)
- Immutable log (append-only)

**Impact:** Cannot trace accountability or investigate discrepancies.

---

#### 4. **SLA Auto-Enforcement & Alerts**
**Status:** ⚠️  Fields exist, logic missing

**Current State:**
- SLA dates stored but not monitored
- No alerts when SLA approaches/exceeds

**Required:**
- Background job/cron: check overdue OS and manutencoes
- Notification system: email/SMS/push to responsible parties
- Dashboard: SLA performance metrics (% on-time, avg delay)

**Impact:** Reactive only; no proactive SLA management.

---

#### 5. **Workflow State Machine & Validation**
**Status:** ❌ Missing

**Current State:**
- Status changes are free-form (no validation)
- Can jump from "aberta" → "concluida" without intermediate steps

**Required:**
- Enforce transitions: `aberta → em_andamento → aguardando_validacao → concluida`
- Require validation: cannot mark "concluida" without:
  - Checklist 100% completed
  - Acceptance signature (`aceite_responsavel` filled)
  - Evidence uploaded (if mandatory)

**Impact:** Quality gates bypassed; non-compliant closures possible.

---

#### 6. **Preventive Plan Auto-Generation (RPC Bug)**
**Status:** 🐛 Broken

**Current State:**
- Trigger exists: `after_insert_ativos_criar_planos`
- RPC `criar_planos_preventivos` calls old function with `_to_interval()` error
- Plans not created on new asset insertion

**Required:**
- Apply migration: `20251105_fix_preventive_plans_rpc.sql`
- Drops/recreates RPC with proper INTERVAL handling
- Returns integer count (not void)
- Matches templates by sistema or tipo_nome
- Idempotent (checks for existing plans)

**Impact:** Users must manually create plans; defeats automation purpose.

---

### MODERATE GAPS

#### 7. **PT (Work Permit) Workflow**
**Status:** ⚠️  Fields exist, no workflow

**Fields:** `pt_numero`, `pt_tipo`
**Missing:**
- PT generation/approval flow
- PT expiration tracking
- High-risk work validation (requires valid PT before execution)

---

#### 8. **Supplier/Contractor Management**
**Status:** ⚠️  Basic fields only

**Current:** `fornecedor_nome`, `fornecedor_contato` (text)
**Missing:**
- `fornecedores` table with: CNPJ, certifications, insurance, ratings
- Performance tracking (on-time delivery, quality scores)
- Qualification/blacklist status

---

#### 9. **Spare Parts & Materials Inventory**
**Status:** ⚠️  Fields exist, no inventory system

**Current:** `materiais` JSONB in OS
**Missing:**
- `estoque` table (inventory management)
- Material consumption tracking
- Low-stock alerts
- Cost center allocation

---

#### 10. **Recurring Maintenance Trigger**
**Status:** ❌ Missing

**Current State:**
- Plans have `proxima_execucao`, but no auto-generation of manutencoes
- Users must manually create tasks

**Required:**
- Daily/weekly cron job:
  - Query planos_manutencao where `proxima_execucao <= CURRENT_DATE + antecedencia_dias`
  - INSERT into manutencoes (or os)
  - UPDATE plano: `proxima_execucao = proxima_execucao + periodicidade`

**Impact:** Manual burden; late/missed maintenance.

---

## Part D: Implementation Priority

### Phase 1 (Immediate - System Functional)
1. **Fix `criar_planos_preventivos` RPC** (apply migration)
2. **Remove 404 errors** (guards for missing RPC/tables) ✅ Done
3. **Test preventive plan generation** (run test script)

### Phase 2 (Short-term - Compliance Foundation)
4. **Execution logs** (`os_logs` table + UI)
5. **Attachment workflow** (Supabase Storage + upload UI)
6. **Workflow validation** (state machine + checklist enforcement)

### Phase 3 (Mid-term - Operational Excellence)
7. **SLA monitoring** (cron + alerts)
8. **Recurring maintenance trigger** (auto-generate tasks)
9. **Audit trail** (triggers + immutable log)

### Phase 4 (Long-term - Advanced Features)
10. **PT workflow** (approval + expiration tracking)
11. **Supplier management** (fornecedores table + ratings)
12. **Inventory system** (estoque + material tracking)

---

## Part E: Detailed Gaps Table

| Feature | NBR 5674 Requirement | Current State | Gap | Priority |
|---------|---------------------|---------------|-----|----------|
| Maintenance Classification | Preventiva/Corretiva/Preditiva | ✅ Implemented | None | - |
| Periodic Scheduling | Recurrence with INTERVAL | ✅ Implemented | None | - |
| Checklists | Documented procedures | ✅ Implemented | None | - |
| Responsibility | Clear assignment | ✅ Implemented | None | - |
| Priority Levels | Risk-based prioritization | ✅ Implemented | None | - |
| Execution Logs | Timestamped activity records | ❌ Missing | No execution history | **Critical** |
| Evidence Attachments | Photos, certificates, reports | ⚠️  Fields only | No storage integration | **Critical** |
| Audit Trail | Immutable change log | ❌ Missing | No accountability | **Critical** |
| SLA Monitoring | Auto-detection of violations | ⚠️  Fields only | No alerts/reports | **High** |
| Workflow Validation | Enforced state transitions | ❌ Missing | No quality gates | **High** |
| Auto-Plan Generation | Trigger on asset creation | 🐛 Broken | RPC has `_to_interval` error | **High** |
| Recurring Tasks | Auto-generate from schedules | ❌ Missing | Manual task creation | **High** |
| PT Workflow | Work permit approval/tracking | ⚠️  Fields only | No approval flow | **Medium** |
| Supplier Management | Contractor qualifications | ⚠️  Basic only | No ratings/tracking | **Medium** |
| Inventory System | Spare parts tracking | ⚠️  Fields only | No stock management | **Low** |

---

## Conclusion

The system has a **strong foundation** for NBR 5674 compliance:
- Core data model supports preventive, corrective, and predictive maintenance
- INTERVAL-based scheduling is correctly implemented
- Work orders capture comprehensive NBR-required fields

**Primary blockers:**
1. **RPC bug** preventing automatic plan generation (fix available: apply migration)
2. **No execution logs** (cannot prove compliance)
3. **No attachment workflow** (cannot provide evidence)

**Recommended Next Steps:**
1. Apply `supabase/migrations/20251105_fix_preventive_plans_rpc.sql`
2. Implement `os_logs` table and execution tracking UI
3. Integrate Supabase Storage for attachments
4. Add workflow validation (state machine)
5. Build SLA monitoring dashboard

With these additions, the system will achieve **80%+ NBR 5674 alignment** and pass most audits.
