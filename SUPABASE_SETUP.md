# Supabase Setup Guide

## Step 1: Run the Complete Schema

1. Go to your Supabase project dashboard: [supabase.com/dashboard](https://supabase.com/dashboard) → select your project
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the entire contents of `backend/supabase/complete_schema.sql`
5. Click **Run** (or press Cmd/Ctrl + Enter)

**Important Notes:**
- This schema is **safe to run multiple times** - it uses `IF EXISTS` and `IF NOT EXISTS` checks
- If you see errors about policies already existing, that's okay - the schema handles it
- The schema will create all tables, policies, functions, triggers, and views needed

## Step 2: Verify Tables Created

After running the schema, verify these tables exist in **Table Editor**:

### Core Tables:
- ✅ `profiles`
- ✅ `activities`
- ✅ `interruptions`

### Finances Tables:
- ✅ `transactions`
- ✅ `budgets`
- ✅ `savings_goals`
- ✅ `recurring_transactions`

### Planner Tables:
- ✅ `tasks`
- ✅ `goals`
- ✅ `habits`
- ✅ `habit_logs`

### Energy & Reflections:
- ✅ `energy_logs`
- ✅ `daily_reflections`
- ✅ `weekly_reflections`
- ✅ `monthly_reflections`

## Step 3: Verify Row Level Security (RLS)

1. Go to **Authentication** → **Policies**
2. Check that all tables have RLS enabled
3. Each table should have policies allowing users to access only their own data

## Step 4: Test the Connection

The environment variables are already configured:
- Backend: `backend/.env`
- Frontend: `frontend/.env.local`

Both servers should now connect to your Supabase instance automatically.

## Troubleshooting

### Error: "policy already exists"
- This is normal if you've run the schema before
- The schema uses `DROP POLICY IF EXISTS` to handle this
- You can safely ignore these warnings

### Error: "table already exists"
- The schema uses `CREATE TABLE IF NOT EXISTS`
- Existing data will be preserved
- New columns will be added if they don't exist

### Can't get past login page
- Check that the `handle_new_user()` trigger is created
- Verify RLS policies allow profile insertion
- Check browser console for errors

### "new row violates row-level security policy"
- The `handle_new_user()` trigger should auto-create profiles
- If this fails, check that the trigger exists in Supabase
- You may need to manually create a profile for testing

## What the Schema Includes

1. **All Tables**: Core, Finances, Planner, Energy, Reflections
2. **Enhanced Fields**: 
   - Activities: energy_cost, work_type, planned vs actual
   - Transactions: intent, emotion, worth_it
   - Tasks: energy_required, avoidance_count
3. **RLS Policies**: Secure access control for all tables
4. **Functions**: 
   - `update_updated_at_column()` - Auto-update timestamps
   - `get_week_start()` - Calculate week start dates
   - `detect_task_avoidance()` - Find avoided tasks
   - `handle_new_user()` - Auto-create profiles on signup
5. **Triggers**: Auto-update timestamps on all tables
6. **Views**: Cross-domain correlation views for analytics

## Production: Auth URL configuration

When you deploy the frontend (e.g. to Vercel), configure Supabase so login/signup redirects work:

1. In Supabase: **Authentication** → **URL Configuration**
2. **Site URL**: set to your production frontend URL (e.g. `https://your-app.vercel.app`)
3. **Redirect URLs**: add the same URL and `https://your-app.vercel.app/**`

Without this, users may get redirect errors after sign up or sign in. See **DEPLOY.md** for the full deployment checklist.

## Next Steps

After running the schema:
1. Start the backend: `cd backend && uvicorn main:app --reload`
2. Start the frontend: `cd frontend && npm run dev`
3. Visit http://localhost:3000
4. Sign up for a new account
5. The profile will be auto-created by the trigger
