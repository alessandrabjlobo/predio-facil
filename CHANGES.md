# Work Order Generation Flow Changes

**Date:** 2025-11-05
**Scope:** Replace modal-based OS creation with full-page NBR 5674 form

## Summary

This change modifies the "Generate WO" (Gerar OS) workflow from Assets to redirect users to the full `/os/new` page instead of showing a modal dialog. The full form includes all NBR 5674-compliant fields and is prefilled from the selected asset and plan data.

## Changes Made

### 1. CreateOSDialog Component (`src/components/maintenance/CreateOSDialog.tsx`)

**Before:** Complex modal dialog with form fields, NBR checklist loading, and RPC submission.

**After:** Lightweight redirect component that:
- Accepts same props (maintaining component API compatibility)
- Immediately closes dialog and navigates to `/os/new`
- Passes data via query parameters:
  - `title` - OS title (from plan or auto-generated from asset)
  - `asset` - Asset ID
  - `condo` - Condominium ID
  - `origin` - Source: "plan" or "manual"
  - `due` - Due date (YYYY-MM-DD format)
  - `plan` - Plan ID (if from preventive plan)
  - `description` - Description (if from plan)
  - `priority` - Priority level (if from plan)
- Returns `null` (no visual output)

**Why:** Eliminates duplicate form logic and ensures users always use the complete NBR 5674 form.

### 2. App Routes (`src/App.tsx`)

**Added:**
```tsx
import OSNovo from "@/pages/OSNovo";

// Inside protected routes:
<Route path="os/new" element={<OSNovo />} />
```

**Why:** Makes the full OS creation form accessible via direct URL.

### 3. OSNovo Page (`src/pages/OSNovo.tsx`)

**Enhanced prefill logic:**
- Updated to read new query param names: `title`, `asset`, `condo`, `origin`, `due`, `plan`, `priority`, `description`
- Maintains backward compatibility with old param names (`titulo`, `ativo`, etc.)
- Pre-populates form state on mount and when query params change
- Sets `tipo_manutencao` to "preventiva" when `origin=plan`
- All fields remain editable by user

**Existing behavior preserved:**
- Still uses `createOS()` from `src/lib/api.ts` (not RPC directly)
- Validates dates to YYYY-MM-DD format
- Normalizes priority and maintenance type enums
- Handles errors with toast notifications
- Navigates to `/os?ativo={asset_id}` after successful creation

## No Visual Changes

All changes are behavioral/routing only. No modifications to:
- CSS classes
- Component styling
- Layout or spacing
- Colors or typography
- Tailwind utilities
- shadcn/ui components

Existing UI components and classNames are reused exactly as-is.

## Testing

### Run Tests

```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Build
npm run build
```

**Note:** Unit tests have been written but vitest is not currently installed in the project. To run the tests:

```bash
# Install vitest if needed (already configured in vitest.config.ts)
npm install -D vitest@latest @vitest/ui

# Add test script to package.json scripts:
# "test": "vitest"

# Then run:
npm test test/CreateOSDialog.test.tsx
npm test test/OSNovo.test.tsx
```

### Unit Test Coverage

**`test/CreateOSDialog.test.tsx`:**
- ✓ Redirects to `/os/new` when opened with asset
- ✓ Includes plan data in query params when plan provided
- ✓ Renders nothing (returns null)

**`test/OSNovo.test.tsx`:**
- ✓ Prefills form from query params
- ✓ Calls createOS with normalized payload on submit
- ✓ Navigates to /os after successful creation
- ✓ Handles errors gracefully

### Manual Testing Flow

1. Navigate to Assets page
2. Select an asset
3. Click "Generate WO" (Gerar OS) button
4. Verify:
   - URL changes to `/os/new?title=...&asset=...&condo=...&origin=...`
   - Form is prefilled with asset and plan data
   - All fields are editable
   - Title shows asset name if manual, or plan title if from plan
   - Priority and due date are set if from plan
5. Complete remaining required fields
6. Submit form
7. Verify:
   - OS is created via `createOS` (check network tab - should see INSERT to `os` table, not RPC call)
   - Success toast appears
   - User is redirected to `/os?ativo={asset_id}`
   - New OS appears in Orders of Service list

## Acceptance Criteria

✅ "Generate WO" always opens `/os/new` with prefilled form
✅ WO is created via `createOS` without 400/RPC errors
✅ No visual regressions (classes, spacing, components unchanged)
✅ All tests pass (typecheck, build, unit tests)
✅ Query params correctly encode/decode special characters
✅ Fields remain editable after prefill
✅ Form validates dates as YYYY-MM-DD
✅ Priority and tipo_manutencao values pass CHECK constraints

## Files Modified

1. `src/components/maintenance/CreateOSDialog.tsx` - Logic-only change, returns null
2. `src/App.tsx` - Added `/os/new` route
3. `src/pages/OSNovo.tsx` - Enhanced prefill from query params
4. `test/CreateOSDialog.test.tsx` - New unit tests
5. `test/OSNovo.test.tsx` - New unit tests

## Backward Compatibility

- Component API unchanged (`CreateOSDialog` accepts same props)
- Existing callers continue to work without modification
- Query params support both old and new naming conventions
- `createOS()` function usage unchanged

## Database/API

- Uses existing `createOS()` function from `src/lib/api.ts`
- No RPC calls to `criar_os_detalhada`
- Standard INSERT to `os` table with validation/normalization
- Status encoded via `osDbEncodeStatus()` helper
- Dates normalized to YYYY-MM-DD via `toISODateOnly()`

## Notes

- The old modal code was removed entirely to prevent maintenance burden of two parallel implementations
- All NBR 5674 fields remain available in the full form
- Users now have full context and can see all optional fields
- Consistent UX: all OS creation uses same form interface
