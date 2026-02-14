-- =============================================
-- PERSONAL LIFE OPERATING SYSTEM - COMPLETE SCHEMA
-- =============================================
-- Run this in Supabase SQL Editor
-- This creates ALL tables, policies, functions, and views
-- Safe to run multiple times (uses IF EXISTS / IF NOT EXISTS)
-- Handles both new installations and upgrades from old schema
-- =============================================

-- Enable UUID extension
-- Note: Some SQL linters may flag this, but it's valid PostgreSQL syntax
-- Supabase typically has this enabled by default, but we check to be safe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        EXECUTE 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"';
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Extension might already exist or not be available - ignore
    NULL;
END $$;

-- =============================================
-- CORE TABLES (Time & Focus)
-- =============================================

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activities table (enhanced with energy_cost, work_type, planned vs actual)
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('Study', 'Coding', 'Work', 'Reading', 'Rest', 'Social', 'Other')),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_time > start_time)
);

-- Add enhanced columns to activities if they don't exist
DO $$ 
BEGIN
    -- Add energy_cost column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'energy_cost') THEN
        ALTER TABLE activities ADD COLUMN energy_cost TEXT CHECK (energy_cost IN ('light', 'medium', 'heavy'));
    END IF;
    
    -- Add work_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'work_type') THEN
        ALTER TABLE activities ADD COLUMN work_type TEXT CHECK (work_type IN ('deep', 'shallow', 'mixed', 'rest'));
    END IF;
    
    -- Add planned_start_time column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'planned_start_time') THEN
        ALTER TABLE activities ADD COLUMN planned_start_time TIMESTAMPTZ;
    END IF;
    
    -- Add planned_end_time column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'planned_end_time') THEN
        ALTER TABLE activities ADD COLUMN planned_end_time TIMESTAMPTZ;
    END IF;
    
    -- Add task_id column (foreign key constraint added later after tasks table exists)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'task_id') THEN
        ALTER TABLE activities ADD COLUMN task_id UUID;
    END IF;
END $$;

-- Interruptions table
CREATE TABLE IF NOT EXISTS interruptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
    time TIMESTAMPTZ NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Phone', 'Social Media', 'Noise', 'Other')),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add end_time and duration_minutes to interruptions if they don't exist (for app/API compatibility)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'interruptions' AND column_name = 'end_time') THEN
        ALTER TABLE interruptions ADD COLUMN end_time TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'interruptions' AND column_name = 'duration_minutes') THEN
        ALTER TABLE interruptions ADD COLUMN duration_minutes INTEGER CHECK (duration_minutes IS NULL OR (duration_minutes >= 1 AND duration_minutes <= 480));
    END IF;
END $$;

-- =============================================
-- FINANCES TABLES
-- =============================================

-- Transactions table (enhanced with intent, emotion, worth_it)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add enhanced columns to transactions if they don't exist
DO $$ 
BEGIN
    -- Add intent column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'intent') THEN
        ALTER TABLE transactions ADD COLUMN intent TEXT CHECK (intent IN ('planned', 'unplanned', 'impulse'));
    END IF;
    
    -- Add emotion column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'emotion') THEN
        ALTER TABLE transactions ADD COLUMN emotion TEXT CHECK (emotion IN ('joy', 'convenience', 'stress', 'necessity', 'guilt', 'neutral', 'other'));
    END IF;
    
    -- Add worth_it column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'worth_it') THEN
        ALTER TABLE transactions ADD COLUMN worth_it BOOLEAN;
    END IF;
END $$;

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    month DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, category, month)
);

-- Savings goals table
CREATE TABLE IF NOT EXISTS savings_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    target_amount DECIMAL(12,2) NOT NULL CHECK (target_amount > 0),
    current_amount DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
    deadline DATE,
    color TEXT DEFAULT '#6172f3',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recurring transactions
CREATE TABLE IF NOT EXISTS recurring_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly')),
    start_date DATE NOT NULL,
    next_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- PLANNER TABLES
-- =============================================

-- Tasks table (enhanced with energy_required, avoidance tracking)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    due_time TIME,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    category TEXT DEFAULT 'Personal',
    estimated_minutes INTEGER CHECK (estimated_minutes > 0),
    actual_minutes INTEGER CHECK (actual_minutes > 0),
    completed_at TIMESTAMPTZ,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_pattern TEXT CHECK (recurring_pattern IN ('daily', 'weekdays', 'weekly', 'monthly')),
    parent_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add enhanced columns to tasks if they don't exist
DO $$ 
BEGIN
    -- Add energy_required column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'energy_required') THEN
        ALTER TABLE tasks ADD COLUMN energy_required TEXT CHECK (energy_required IN ('light', 'medium', 'heavy'));
    END IF;
    
    -- Add avoidance_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'avoidance_count') THEN
        ALTER TABLE tasks ADD COLUMN avoidance_count INTEGER DEFAULT 0 CHECK (avoidance_count >= 0);
    END IF;
    
    -- Add last_postponed_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'last_postponed_at') THEN
        ALTER TABLE tasks ADD COLUMN last_postponed_at TIMESTAMPTZ;
    END IF;
    
    -- Add breakdown_suggested column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'breakdown_suggested') THEN
        ALTER TABLE tasks ADD COLUMN breakdown_suggested BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'Personal' CHECK (category IN ('Career', 'Health', 'Learning', 'Financial', 'Personal', 'Relationships', 'Other')),
    target_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    milestones JSONB DEFAULT '[]'::jsonb,
    color TEXT DEFAULT '#6172f3',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habits table
CREATE TABLE IF NOT EXISTS habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekdays', 'weekly')),
    target_count INTEGER NOT NULL DEFAULT 1 CHECK (target_count > 0),
    color TEXT DEFAULT '#6172f3',
    icon TEXT DEFAULT '✓',
    is_active BOOLEAN DEFAULT TRUE,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habit logs
CREATE TABLE IF NOT EXISTS habit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    count INTEGER DEFAULT 1,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(habit_id, date)
);

-- =============================================
-- ENERGY & MOOD TRACKING
-- =============================================

CREATE TABLE IF NOT EXISTS energy_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    energy_level INTEGER NOT NULL CHECK (energy_level >= 1 AND energy_level <= 5),
    stress_level INTEGER NOT NULL CHECK (stress_level >= 1 AND stress_level <= 5),
    mood TEXT CHECK (mood IN ('excited', 'happy', 'neutral', 'tired', 'stressed', 'anxious', 'calm', 'focused', 'other')),
    sleep_hours DECIMAL(3,1) CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- =============================================
-- REFLECTIONS SYSTEM
-- =============================================

CREATE TABLE IF NOT EXISTS daily_reflections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    what_worked TEXT,
    what_didnt TEXT,
    why TEXT,
    adjustment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS weekly_reflections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    time_vs_plan TEXT,
    money_vs_budget TEXT,
    energy_vs_workload TEXT,
    adjustment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, week_start)
);

CREATE TABLE IF NOT EXISTS monthly_reflections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    trends TEXT,
    stability TEXT,
    burnout_signals TEXT,
    financial_safety_progress TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, month)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_start_time ON activities(start_time);
CREATE INDEX IF NOT EXISTS idx_activities_work_type ON activities(user_id, work_type);
CREATE INDEX IF NOT EXISTS idx_activities_task_id ON activities(task_id);
CREATE INDEX IF NOT EXISTS idx_interruptions_user_id ON interruptions(user_id);
CREATE INDEX IF NOT EXISTS idx_interruptions_time ON interruptions(time);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(user_id, category);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_user ON recurring_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_due ON tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON habit_logs(user_id, date);

CREATE INDEX IF NOT EXISTS idx_energy_logs_user_date ON energy_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_energy_logs_date ON energy_logs(date);
CREATE INDEX IF NOT EXISTS idx_daily_reflections_user_date ON daily_reflections(user_id, date);
CREATE INDEX IF NOT EXISTS idx_weekly_reflections_user_week ON weekly_reflections(user_id, week_start);
CREATE INDEX IF NOT EXISTS idx_monthly_reflections_user_month ON monthly_reflections(user_id, month);

-- =============================================
-- ADD FOREIGN KEY CONSTRAINTS (after all tables exist)
-- =============================================

-- Add foreign key constraint on activities.task_id (tasks table must exist first)
DO $$ 
BEGIN
    -- Check if column exists but constraint doesn't
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'activities' AND column_name = 'task_id')
       AND NOT EXISTS (
           SELECT 1 FROM information_schema.table_constraints tc
           JOIN information_schema.key_column_usage kcu 
             ON tc.constraint_name = kcu.constraint_name
           WHERE tc.table_name = 'activities' 
             AND kcu.column_name = 'task_id'
             AND tc.constraint_type = 'FOREIGN KEY'
       ) THEN
        ALTER TABLE activities 
        ADD CONSTRAINT fk_activities_task_id 
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Constraint might already exist or tasks table might not exist yet - ignore
    NULL;
END $$;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get week start (Monday)
CREATE OR REPLACE FUNCTION get_week_start(input_date DATE)
RETURNS DATE AS $$
BEGIN
    RETURN input_date - (EXTRACT(DOW FROM input_date)::INTEGER - 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to detect task avoidance patterns
CREATE OR REPLACE FUNCTION detect_task_avoidance(p_user_id UUID, p_days INTEGER DEFAULT 7)
RETURNS TABLE(
    task_id UUID,
    title TEXT,
    avoidance_count INTEGER,
    days_overdue INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.title,
        t.avoidance_count,
        (CURRENT_DATE - t.due_date)::INTEGER as days_overdue
    FROM tasks t
    WHERE t.user_id = p_user_id
        AND t.status = 'pending'
        AND t.due_date < CURRENT_DATE
        AND (t.avoidance_count > 0 OR (CURRENT_DATE - t.due_date) > p_days)
    ORDER BY t.avoidance_count DESC, t.due_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, timezone)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- TRIGGERS FOR updated_at
-- =============================================

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
CREATE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_savings_goals_updated_at ON savings_goals;
CREATE TRIGGER update_savings_goals_updated_at
    BEFORE UPDATE ON savings_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recurring_transactions_updated_at ON recurring_transactions;
CREATE TRIGGER update_recurring_transactions_updated_at
    BEFORE UPDATE ON recurring_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_goals_updated_at ON goals;
CREATE TRIGGER update_goals_updated_at
    BEFORE UPDATE ON goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_habits_updated_at ON habits;
CREATE TRIGGER update_habits_updated_at
    BEFORE UPDATE ON habits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_energy_logs_updated_at ON energy_logs;
CREATE TRIGGER update_energy_logs_updated_at
    BEFORE UPDATE ON energy_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_reflections_updated_at ON daily_reflections;
CREATE TRIGGER update_daily_reflections_updated_at
    BEFORE UPDATE ON daily_reflections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_weekly_reflections_updated_at ON weekly_reflections;
CREATE TRIGGER update_weekly_reflections_updated_at
    BEFORE UPDATE ON weekly_reflections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_monthly_reflections_updated_at ON monthly_reflections;
CREATE TRIGGER update_monthly_reflections_updated_at
    BEFORE UPDATE ON monthly_reflections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE interruptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_reflections ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - CORE TABLES
-- =============================================

-- Drop existing policies if they exist (safe to run multiple times)
DO $$ 
BEGIN
    -- Profiles
    DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
    
    -- Activities
    DROP POLICY IF EXISTS "Users can view own activities" ON activities;
    DROP POLICY IF EXISTS "Users can insert own activities" ON activities;
    DROP POLICY IF EXISTS "Users can update own activities" ON activities;
    DROP POLICY IF EXISTS "Users can delete own activities" ON activities;
    
    -- Interruptions
    DROP POLICY IF EXISTS "Users can view own interruptions" ON interruptions;
    DROP POLICY IF EXISTS "Users can insert own interruptions" ON interruptions;
    DROP POLICY IF EXISTS "Users can update own interruptions" ON interruptions;
    DROP POLICY IF EXISTS "Users can delete own interruptions" ON interruptions;
END $$;

-- Profiles policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Activities policies
CREATE POLICY "Users can view own activities"
    ON activities FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
    ON activities FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities"
    ON activities FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities"
    ON activities FOR DELETE
    USING (auth.uid() = user_id);

-- Interruptions policies
CREATE POLICY "Users can view own interruptions"
    ON interruptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interruptions"
    ON interruptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interruptions"
    ON interruptions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interruptions"
    ON interruptions FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES - FINANCES
-- =============================================

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users crud own transactions" ON transactions;
    DROP POLICY IF EXISTS "Users crud own budgets" ON budgets;
    DROP POLICY IF EXISTS "Users crud own savings_goals" ON savings_goals;
    DROP POLICY IF EXISTS "Users crud own recurring_transactions" ON recurring_transactions;
END $$;

CREATE POLICY "Users crud own transactions"
    ON transactions FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users crud own budgets"
    ON budgets FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users crud own savings_goals"
    ON savings_goals FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users crud own recurring_transactions"
    ON recurring_transactions FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES - PLANNER
-- =============================================

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users crud own tasks" ON tasks;
    DROP POLICY IF EXISTS "Users crud own goals" ON goals;
    DROP POLICY IF EXISTS "Users crud own habits" ON habits;
    DROP POLICY IF EXISTS "Users crud own habit_logs" ON habit_logs;
END $$;

CREATE POLICY "Users crud own tasks"
    ON tasks FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users crud own goals"
    ON goals FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users crud own habits"
    ON habits FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users crud own habit_logs"
    ON habit_logs FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES - ENERGY & REFLECTIONS
-- =============================================

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users crud own energy_logs" ON energy_logs;
    DROP POLICY IF EXISTS "Users crud own daily_reflections" ON daily_reflections;
    DROP POLICY IF EXISTS "Users crud own weekly_reflections" ON weekly_reflections;
    DROP POLICY IF EXISTS "Users crud own monthly_reflections" ON monthly_reflections;
END $$;

CREATE POLICY "Users crud own energy_logs"
    ON energy_logs FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users crud own daily_reflections"
    ON daily_reflections FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users crud own weekly_reflections"
    ON weekly_reflections FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users crud own monthly_reflections"
    ON monthly_reflections FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

GRANT ALL ON profiles TO postgres, service_role;
GRANT ALL ON activities TO postgres, service_role;
GRANT ALL ON interruptions TO postgres, service_role;
GRANT ALL ON transactions TO postgres, service_role;
GRANT ALL ON budgets TO postgres, service_role;
GRANT ALL ON savings_goals TO postgres, service_role;
GRANT ALL ON recurring_transactions TO postgres, service_role;
GRANT ALL ON tasks TO postgres, service_role;
GRANT ALL ON goals TO postgres, service_role;
GRANT ALL ON habits TO postgres, service_role;
GRANT ALL ON habit_logs TO postgres, service_role;
GRANT ALL ON energy_logs TO postgres, service_role;
GRANT ALL ON daily_reflections TO postgres, service_role;
GRANT ALL ON weekly_reflections TO postgres, service_role;
GRANT ALL ON monthly_reflections TO postgres, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON interruptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON budgets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON savings_goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON recurring_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON habits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON habit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON energy_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON daily_reflections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON weekly_reflections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON monthly_reflections TO authenticated;

-- =============================================
-- CROSS-DOMAIN VIEWS (for analytics)
-- =============================================

CREATE OR REPLACE VIEW time_money_correlation AS
SELECT 
    a.user_id,
    DATE(a.start_time) as date,
    COUNT(DISTINCT a.id) as activity_count,
    SUM(EXTRACT(EPOCH FROM (a.end_time - a.start_time))/3600) as total_hours,
    COUNT(DISTINCT i.id) as interruption_count,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as daily_expenses,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as daily_income
FROM activities a
LEFT JOIN interruptions i ON i.user_id = a.user_id AND DATE(i.time) = DATE(a.start_time)
LEFT JOIN transactions t ON t.user_id = a.user_id AND t.date = DATE(a.start_time)
GROUP BY a.user_id, DATE(a.start_time);

CREATE OR REPLACE VIEW energy_spending_correlation AS
SELECT 
    e.user_id,
    e.date,
    e.energy_level,
    e.stress_level,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as daily_expenses,
    COUNT(CASE WHEN t.type = 'expense' THEN 1 END) as expense_count
FROM energy_logs e
LEFT JOIN transactions t ON t.user_id = e.user_id AND t.date = e.date
GROUP BY e.user_id, e.date, e.energy_level, e.stress_level;

CREATE OR REPLACE VIEW interruption_task_correlation AS
SELECT 
    t.user_id,
    DATE(t.due_date) as task_date,
    COUNT(DISTINCT t.id) as total_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
    COUNT(DISTINCT i.id) as interruption_count,
    ROUND(COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END)::numeric / NULLIF(COUNT(DISTINCT t.id), 0) * 100, 1) as completion_rate
FROM tasks t
LEFT JOIN interruptions i ON i.user_id = t.user_id AND DATE(i.time) = DATE(t.due_date)
WHERE t.due_date IS NOT NULL
GROUP BY t.user_id, DATE(t.due_date);

-- =============================================
-- GRANT PERMISSIONS ON VIEWS
-- =============================================

GRANT SELECT ON time_money_correlation TO authenticated;
GRANT SELECT ON energy_spending_correlation TO authenticated;
GRANT SELECT ON interruption_task_correlation TO authenticated;

GRANT SELECT ON time_money_correlation TO postgres, service_role;
GRANT SELECT ON energy_spending_correlation TO postgres, service_role;
GRANT SELECT ON interruption_task_correlation TO postgres, service_role;

-- =============================================
-- GRANT EXECUTE ON FUNCTIONS
-- =============================================

GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION get_week_start(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION detect_task_avoidance(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;

GRANT EXECUTE ON FUNCTION update_updated_at_column() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION get_week_start(DATE) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION detect_task_avoidance(UUID, INTEGER) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION handle_new_user() TO postgres, service_role;

-- =============================================
-- SCHEMA COMPLETE!
-- =============================================
-- All tables, policies, functions, triggers, and views are now set up.
-- This schema is safe to run multiple times and handles upgrades from old schemas.
-- Enhanced columns (work_type, energy_cost, intent, emotion, worth_it, etc.) are
-- automatically added to existing tables if they don't exist.
-- =============================================
