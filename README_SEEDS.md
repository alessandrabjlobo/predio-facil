# Supabase Seeds - NBR 5674 Compliance & Admin Setup

This guide explains how to populate your Supabase database with the global Asset Library compliant with ABNT NBR 5674 standards and set up the admin master user.

## Overview

The seed files provide:

- **14 Compliance Categories** aligned with Brazilian building maintenance regulations
- **20+ Asset Types** with normative preventive maintenance checklists
- **Admin Master User** setup for system administration

### Important Architecture Notes

1. **Global Asset Library**: The `ativo_tipos` table contains master asset definitions that are shared across all condos. These are NOT condo-specific records.

2. **Auto-Generated Plans**: When a condo selects an asset from the library, the system automatically generates a condo-specific maintenance plan using the asset's `periodicidade_default` and `checklist_default` values.

3. **No UI Changes**: These seeds only affect database tables. The application's appearance, colors, and styles remain unchanged.

## Files Included

- `supabase/seed.sql` - Asset library and categories (idempotent)
- `supabase/admin_master.sql` - Admin user profile and role setup (idempotent)
- `scripts/create_admin_master.ts` - Automated user creation (optional, requires Service Role key)

## Prerequisites

- Supabase project with database access
- SQL Editor access OR `psql` command-line tool
- (Optional) Service Role key for automated user creation

---

## Step 1: Populate Asset Library

The asset library seeds are **completely idempotent** - you can run them multiple times safely.

### Option A: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `supabase/seed.sql`
5. Paste into the editor
6. Click **Run** (or press Ctrl+Enter)

You should see:
```
Success. No rows returned
```

This means all data was inserted successfully (or already existed due to conflict handling).

### Option B: Using psql Command Line

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres" \
  -f supabase/seed.sql
```

Replace:
- `[YOUR-PASSWORD]` with your database password
- `[YOUR-PROJECT-REF]` with your project reference (find in Project Settings)

### Verification

After running the seeds, verify the data:

```sql
-- Check categories
SELECT slug, nome FROM public.conf_categorias ORDER BY slug;

-- Check asset types
SELECT slug, nome, conf_tipo, periodicidade_default
FROM public.ativo_tipos
ORDER BY conf_tipo, nome;
```

You should see:
- 14 compliance categories
- 20+ asset types with complete checklist data

---

## Step 2: Create Admin Master User

The admin user setup has **two workflows** depending on whether you have access to the Service Role key.

### Workflow A: With Service Role Key (Automated)

**Step 2A-1: Configure Environment**

Add to your `.env` file (or environment):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE=your_service_role_key_here
```

To find your Service Role key:
1. Go to Supabase Dashboard → **Settings** → **API**
2. Copy the `service_role` key (NOT the `anon` key)
3. **⚠️ IMPORTANT**: Keep this key secure. Never commit to version control.

**Step 2A-2: Run the Creation Script**

```bash
# Using npx with tsx (recommended)
npx tsx scripts/create_admin_master.ts

# OR using Node with ts-node
npm install -g ts-node typescript
node --loader ts-node/esm scripts/create_admin_master.ts
```

The script will:
- Check if user already exists
- Create the user in `auth.users` with email confirmed
- Save the `auth_user_id` to `scripts/.admin_master.json`

**Step 2A-3: Link User to Database**

Run the SQL script to create the profile and assign role:

```bash
# Using psql
psql "postgresql://..." -f supabase/admin_master.sql

# OR using Supabase SQL Editor
# Copy/paste contents of supabase/admin_master.sql
```

You should see success messages:
```
✓ Found auth user: alessandrabastojansen@gmail.com
✓ Created user profile in public.usuarios
✓ Assigned role 'admin' in public.user_roles
```

### Workflow B: Without Service Role Key (Manual)

**Step 2B-1: Create User via Dashboard**

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Click **Add User**
3. Fill in:
   - **Email**: `alessandrabastojansen@gmail.com`
   - **Password**: `Vl2301;;`
   - **Auto Confirm User**: ☑️ YES (check this box)
4. Click **Create User**

**Step 2B-2: Link User to Database**

Run the SQL script:

```bash
# Using psql
psql "postgresql://..." -f supabase/admin_master.sql

# OR using Supabase SQL Editor
# Copy/paste contents of supabase/admin_master.sql
```

The script will automatically find the auth user and create the profile.

---

## Step 3: Verify Setup

### Login Test

1. Go to your application login page
2. Use credentials:
   - **Email**: `alessandrabastojansen@gmail.com`
   - **Password**: `Vl2301;;`
3. Verify you have admin access

### Database Verification

```sql
-- Check user profile
SELECT u.id, u.email, u.nome, u.auth_user_id
FROM public.usuarios u
WHERE u.email = 'alessandrabastojansen@gmail.com';

-- Check user role
SELECT ur.role
FROM public.user_roles ur
JOIN public.usuarios u ON u.id = ur.user_id
WHERE u.email = 'alessandrabastojansen@gmail.com';
```

Expected result:
- 1 user profile with matching auth_user_id
- Role: `admin`

---

## Security Notes

### 🔴 CRITICAL - Change Password in Production

The default password (`Vl2301;;`) is for **initial setup only**.

**Immediately after first login**, change the password:

1. Go to user profile/settings
2. Change password to a strong, unique password
3. Use a password manager for secure storage

### 🟡 Service Role Key Security

If you used the Service Role key:

- **NEVER** commit `.env` to version control
- Add `.env` to `.gitignore` (already included)
- Rotate the key if accidentally exposed
- Use different keys for development/production

### 🟢 Data Security

The seed data contains:

- ✅ No sensitive information
- ✅ No user credentials
- ✅ No condo-specific data
- ✅ Only global asset definitions and compliance categories

---

## Troubleshooting

### "Auth user not found"

**Cause**: User doesn't exist in `auth.users`

**Solution**: Run the creation script or manually create user via Dashboard (see Step 2)

### "Table public.usuarios not found"

**Cause**: Database migrations haven't been run

**Solution**: Ensure all migrations in `supabase/migrations/` have been applied

### "Role 'admin' not valid for app_role enum"

**Cause**: Unexpected - `admin` should be valid

**Solution**: Check `docs/mapping_needed.md` for schema discrepancies

### "Permission denied"

**Cause**: Insufficient database permissions

**Solution**: Use the database owner credentials or Service Role key

### Script won't run - TypeScript error

**Solution**: Install dependencies

```bash
npm install @supabase/supabase-js
npm install -g tsx
```

---

## Re-running Seeds

All seed files are **idempotent** and can be run multiple times safely:

- `seed.sql` uses `ON CONFLICT DO NOTHING`
- `admin_master.sql` uses `DO $$` block with existence checks

To refresh data:
1. Simply re-run the seed files
2. Existing records won't be duplicated
3. New records will be inserted if missing

---

## Next Steps

After completing the seed setup:

1. ✅ Login as admin user
2. ✅ Explore the asset library in the admin panel
3. ✅ Create test condos and select assets
4. ✅ Verify automatic maintenance plan generation
5. ✅ Review compliance categories and checklists

---

## Schema Notes

For technical details about schema compatibility and future enhancements, see:

- `docs/mapping_needed.md` - Schema discrepancies and recommendations

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review console/SQL error messages
3. Verify database migrations are up to date
4. Check `docs/mapping_needed.md` for schema information

---

**Important Reminder**: These seeds populate the **global asset library** only. No UI or styling changes are included. Your application will look exactly the same - only the database contains new master data for asset management.
