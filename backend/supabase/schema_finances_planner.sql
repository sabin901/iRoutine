-- =============================================
-- ROUTINE APP - FINANCES & PLANNER SCHEMA
-- =============================================
-- Run this AFTER the main schema is set up
-- This adds Finances and Planner tables
-- =============================================

-- =============================================
-- FINANCES TABLES
-- =============================================

-- Drop existing policies if needed (for clean setup)
-- Using DO block to handle cases where policies might not exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
    DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
    DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
    DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
    
    DROP POLICY IF EXISTS "Users can view own budgets" ON budgets;
    DROP POLICY IF EXISTS "Users can insert own budgets" ON budgets;
    DROP POLICY IF EXISTS "Users can update own budgets" ON budgets;
    DROP POLICY IF EXISTS "Users can delete own budgets" ON budgets;
    
    DROP POLICY IF EXISTS "Users can view own savings_goals" ON savings_goals;
    DROP POLICY IF EXISTS "Users can insert own savings_goals" ON savings_goals;
    DROP POLICY IF EXISTS "Users can update own savings_goals" ON savings_goals;
    DROP POLICY IF EXISTS "Users can delete own savings_goals" ON savings_goals;
    
    DROP POLICY IF EXISTS "Users can view own recurring_transactions" ON recurring_transactions;
    DROP POLICY IF EXISTS "Users can insert own recurring_transactions" ON recurring_transactions;
    DROP POLICY IF EXISTS "Users can update own recurring_transactions" ON recurring_transactions;
    DROP POLICY IF EXISTS "Users can delete own recurring_transactions" ON recurring_transactions;
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors if policies don't exist
    NULL;
END $$;

DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS budgets;
DROP TABLE IF EXISTS savings_goals;
DROP TABLE IF EXISTS recurring_transactions;

-- Transactions table (all income and expenses)
CREATE TABLE transactions (
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

-- Valid categories constraint (flexible - stored as text for extensibility)
-- Income: Salary, Freelance, Investment, Gift, Refund, Other
-- Expense: Food, Transport, Entertainment, Shopping, Bills, Health, Education, Rent, Utilities, Subscriptions, Other

-- Budgets table (monthly spending limits per category)
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    month DATE NOT NULL, -- First day of month (e.g., 2024-01-01)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, category, month)
);

-- Savings goals table
CREATE TABLE savings_goals (
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

-- Recurring transactions (subscriptions, salary, etc.)
CREATE TABLE recurring_transactions (
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

-- Indexes for finances
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX idx_transactions_category ON transactions(user_id, category);
CREATE INDEX idx_budgets_user_month ON budgets(user_id, month);
CREATE INDEX idx_savings_goals_user ON savings_goals(user_id);
CREATE INDEX idx_recurring_user ON recurring_transactions(user_id);

-- =============================================
-- PLANNER TABLES
-- =============================================

-- Drop existing policies if needed
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
    DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
    DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
    DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
    
    DROP POLICY IF EXISTS "Users can view own goals" ON goals;
    DROP POLICY IF EXISTS "Users can insert own goals" ON goals;
    DROP POLICY IF EXISTS "Users can update own goals" ON goals;
    DROP POLICY IF EXISTS "Users can delete own goals" ON goals;
    
    DROP POLICY IF EXISTS "Users can view own habits" ON habits;
    DROP POLICY IF EXISTS "Users can insert own habits" ON habits;
    DROP POLICY IF EXISTS "Users can update own habits" ON habits;
    DROP POLICY IF EXISTS "Users can delete own habits" ON habits;
    
    DROP POLICY IF EXISTS "Users can view own habit_logs" ON habit_logs;
    DROP POLICY IF EXISTS "Users can insert own habit_logs" ON habit_logs;
    DROP POLICY IF EXISTS "Users can update own habit_logs" ON habit_logs;
    DROP POLICY IF EXISTS "Users can delete own habit_logs" ON habit_logs;
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors if policies don't exist
    NULL;
END $$;

DROP TABLE IF EXISTS habit_logs;
DROP TABLE IF EXISTS habits;
DROP TABLE IF EXISTS goals;
DROP TABLE IF EXISTS tasks;

-- Tasks table (daily/weekly to-dos)
CREATE TABLE tasks (
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

-- Goals table (long-term objectives)
CREATE TABLE goals (
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
CREATE TABLE habits (
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

-- Habit logs (daily check-ins)
CREATE TABLE habit_logs (
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

-- Indexes for planner
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_user_due ON tasks(user_id, due_date);
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_status ON goals(user_id, status);
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habit_logs_habit ON habit_logs(habit_id);
CREATE INDEX idx_habit_logs_user_date ON habit_logs(user_id, date);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - FINANCES
-- =============================================

-- Transactions
CREATE POLICY "Users can view own transactions"
    ON transactions FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
    ON transactions FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
    ON transactions FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
    ON transactions FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Budgets
CREATE POLICY "Users can view own budgets"
    ON budgets FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
    ON budgets FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
    ON budgets FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
    ON budgets FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Savings Goals
CREATE POLICY "Users can view own savings_goals"
    ON savings_goals FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own savings_goals"
    ON savings_goals FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings_goals"
    ON savings_goals FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own savings_goals"
    ON savings_goals FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Recurring Transactions
CREATE POLICY "Users can view own recurring_transactions"
    ON recurring_transactions FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring_transactions"
    ON recurring_transactions FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring_transactions"
    ON recurring_transactions FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring_transactions"
    ON recurring_transactions FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES - PLANNER
-- =============================================

-- Tasks
CREATE POLICY "Users can view own tasks"
    ON tasks FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
    ON tasks FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
    ON tasks FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
    ON tasks FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Goals
CREATE POLICY "Users can view own goals"
    ON goals FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
    ON goals FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
    ON goals FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
    ON goals FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Habits
CREATE POLICY "Users can view own habits"
    ON habits FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits"
    ON habits FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits"
    ON habits FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits"
    ON habits FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Habit Logs
CREATE POLICY "Users can view own habit_logs"
    ON habit_logs FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habit_logs"
    ON habit_logs FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habit_logs"
    ON habit_logs FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit_logs"
    ON habit_logs FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

GRANT ALL ON transactions TO postgres, service_role;
GRANT ALL ON budgets TO postgres, service_role;
GRANT ALL ON savings_goals TO postgres, service_role;
GRANT ALL ON recurring_transactions TO postgres, service_role;
GRANT ALL ON tasks TO postgres, service_role;
GRANT ALL ON goals TO postgres, service_role;
GRANT ALL ON habits TO postgres, service_role;
GRANT ALL ON habit_logs TO postgres, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON budgets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON savings_goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON recurring_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON habits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON habit_logs TO authenticated;

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
$$ language 'plpgsql';

-- Triggers for updated_at
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

-- =============================================
-- DONE! Finances & Planner tables ready.
-- =============================================
