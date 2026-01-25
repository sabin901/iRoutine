-- =============================================
-- PERSONAL LIFE OPERATING SYSTEM - COMPLETE SCHEMA
-- =============================================
-- This schema extends the existing system with:
-- - Energy & Mood tracking
-- - Enhanced Activities (energy_cost, work_type, planned vs actual)
-- - Enhanced Transactions (intent, emotion, worth_it)
-- - Daily/Weekly/Monthly Reflections
-- - Cross-domain intelligence
-- =============================================

-- =============================================
-- ENERGY & MOOD TRACKING
-- =============================================

-- Drop existing policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view own energy_logs" ON energy_logs;
    DROP POLICY IF EXISTS "Users can insert own energy_logs" ON energy_logs;
    DROP POLICY IF EXISTS "Users can update own energy_logs" ON energy_logs;
    DROP POLICY IF EXISTS "Users can delete own energy_logs" ON energy_logs;
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors if policies don't exist
    NULL;
END $$;

DROP TABLE IF EXISTS energy_logs;

-- Daily energy, stress, and mood tracking
CREATE TABLE energy_logs (
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

CREATE INDEX idx_energy_logs_user_date ON energy_logs(user_id, date);
CREATE INDEX idx_energy_logs_date ON energy_logs(date);

-- =============================================
-- ENHANCED ACTIVITIES
-- =============================================

-- Add new columns to activities table (if not exists)
DO $$ 
BEGIN
    -- Add energy_cost column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='activities' AND column_name='energy_cost') THEN
        ALTER TABLE activities ADD COLUMN energy_cost TEXT CHECK (energy_cost IN ('light', 'medium', 'heavy'));
    END IF;
    
    -- Add work_type column (deep vs shallow work)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='activities' AND column_name='work_type') THEN
        ALTER TABLE activities ADD COLUMN work_type TEXT CHECK (work_type IN ('deep', 'shallow', 'mixed', 'rest'));
    END IF;
    
    -- Add planned_start_time and planned_end_time
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='activities' AND column_name='planned_start_time') THEN
        ALTER TABLE activities ADD COLUMN planned_start_time TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='activities' AND column_name='planned_end_time') THEN
        ALTER TABLE activities ADD COLUMN planned_end_time TIMESTAMPTZ;
    END IF;
    
    -- Add task_id to link activities to tasks
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='activities' AND column_name='task_id') THEN
        ALTER TABLE activities ADD COLUMN task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_activities_work_type ON activities(user_id, work_type);
CREATE INDEX IF NOT EXISTS idx_activities_task_id ON activities(task_id);

-- =============================================
-- ENHANCED TRANSACTIONS
-- =============================================

-- Add emotional/intent fields to transactions
DO $$ 
BEGIN
    -- Add intent (planned vs unplanned)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='transactions' AND column_name='intent') THEN
        ALTER TABLE transactions ADD COLUMN intent TEXT CHECK (intent IN ('planned', 'unplanned', 'impulse'));
    END IF;
    
    -- Add emotion
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='transactions' AND column_name='emotion') THEN
        ALTER TABLE transactions ADD COLUMN emotion TEXT CHECK (emotion IN ('joy', 'convenience', 'stress', 'necessity', 'guilt', 'neutral', 'other'));
    END IF;
    
    -- Add worth_it toggle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='transactions' AND column_name='worth_it') THEN
        ALTER TABLE transactions ADD COLUMN worth_it BOOLEAN;
    END IF;
END $$;

-- =============================================
-- REFLECTIONS SYSTEM
-- =============================================

-- Drop existing reflection policies if needed
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view own daily_reflections" ON daily_reflections;
    DROP POLICY IF EXISTS "Users can insert own daily_reflections" ON daily_reflections;
    DROP POLICY IF EXISTS "Users can update own daily_reflections" ON daily_reflections;
    DROP POLICY IF EXISTS "Users can delete own daily_reflections" ON daily_reflections;
    
    DROP POLICY IF EXISTS "Users can view own weekly_reflections" ON weekly_reflections;
    DROP POLICY IF EXISTS "Users can insert own weekly_reflections" ON weekly_reflections;
    DROP POLICY IF EXISTS "Users can update own weekly_reflections" ON weekly_reflections;
    DROP POLICY IF EXISTS "Users can delete own weekly_reflections" ON weekly_reflections;
    
    DROP POLICY IF EXISTS "Users can view own monthly_reflections" ON monthly_reflections;
    DROP POLICY IF EXISTS "Users can insert own monthly_reflections" ON monthly_reflections;
    DROP POLICY IF EXISTS "Users can update own monthly_reflections" ON monthly_reflections;
    DROP POLICY IF EXISTS "Users can delete own monthly_reflections" ON monthly_reflections;
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors if policies don't exist
    NULL;
END $$;

DROP TABLE IF EXISTS daily_reflections;
DROP TABLE IF EXISTS weekly_reflections;
DROP TABLE IF EXISTS monthly_reflections;

-- Daily Reflections (≤2 minutes)
CREATE TABLE daily_reflections (
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

-- Weekly Reflections
CREATE TABLE weekly_reflections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL, -- Monday of the week
    time_vs_plan TEXT,
    money_vs_budget TEXT,
    energy_vs_workload TEXT,
    adjustment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, week_start)
);

-- Monthly Reflections
CREATE TABLE monthly_reflections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month DATE NOT NULL, -- First day of month
    trends TEXT,
    stability TEXT,
    burnout_signals TEXT,
    financial_safety_progress TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, month)
);

CREATE INDEX idx_daily_reflections_user_date ON daily_reflections(user_id, date);
CREATE INDEX idx_weekly_reflections_user_week ON weekly_reflections(user_id, week_start);
CREATE INDEX idx_monthly_reflections_user_month ON monthly_reflections(user_id, month);

-- =============================================
-- ENHANCED TASKS (Task Avoidance Detection)
-- =============================================

-- Add fields to tasks for better tracking
DO $$ 
BEGIN
    -- Add energy_required
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='energy_required') THEN
        ALTER TABLE tasks ADD COLUMN energy_required TEXT CHECK (energy_required IN ('light', 'medium', 'heavy'));
    END IF;
    
    -- Add avoidance_count (track how many times task was postponed)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='avoidance_count') THEN
        ALTER TABLE tasks ADD COLUMN avoidance_count INTEGER DEFAULT 0 CHECK (avoidance_count >= 0);
    END IF;
    
    -- Add last_postponed_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='last_postponed_at') THEN
        ALTER TABLE tasks ADD COLUMN last_postponed_at TIMESTAMPTZ;
    END IF;
    
    -- Add breakdown_suggested (flag if system suggested breaking down)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='breakdown_suggested') THEN
        ALTER TABLE tasks ADD COLUMN breakdown_suggested BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- =============================================
-- CROSS-DOMAIN CORRELATIONS (Materialized Views)
-- =============================================

-- View for time-money correlations
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

-- View for energy-spending correlations
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

-- View for interruption-task failure correlation
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
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE energy_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_reflections ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - ENERGY & REFLECTIONS
-- =============================================

-- Energy Logs
CREATE POLICY "Users crud own energy_logs"
    ON energy_logs FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Daily Reflections
CREATE POLICY "Users crud own daily_reflections"
    ON daily_reflections FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Weekly Reflections
CREATE POLICY "Users crud own weekly_reflections"
    ON weekly_reflections FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Monthly Reflections
CREATE POLICY "Users crud own monthly_reflections"
    ON monthly_reflections FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

GRANT ALL ON energy_logs TO postgres, service_role;
GRANT ALL ON daily_reflections TO postgres, service_role;
GRANT ALL ON weekly_reflections TO postgres, service_role;
GRANT ALL ON monthly_reflections TO postgres, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON energy_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON daily_reflections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON weekly_reflections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON monthly_reflections TO authenticated;

-- =============================================
-- TRIGGERS
-- =============================================

-- Update triggers for energy_logs
DROP TRIGGER IF EXISTS update_energy_logs_updated_at ON energy_logs;
CREATE TRIGGER update_energy_logs_updated_at
    BEFORE UPDATE ON energy_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update triggers for reflections
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
-- HELPER FUNCTIONS
-- =============================================

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

-- =============================================
-- DONE! Personal Life OS schema complete.
-- =============================================
