# 🚀 Pre-Deployment Checklist

## ✅ Database & Schema

- [x] **Supabase Schema Applied**
  - ✅ Complete schema (`backend/supabase/complete_schema.sql`) has been run in Supabase SQL Editor
  - ✅ All 14 tables created successfully
  - ✅ All RLS policies enabled
  - ✅ All triggers and functions created
  - ✅ Cross-domain views created

- [ ] **Verify Schema in Supabase Dashboard**
  - Go to Supabase Dashboard → Table Editor
  - Verify these tables exist:
    - `profiles`, `activities`, `interruptions`
    - `transactions`, `budgets`, `savings_goals`, `recurring_transactions`
    - `tasks`, `goals`, `habits`, `habit_logs`
    - `energy_logs`, `daily_reflections`, `weekly_reflections`, `monthly_reflections`
  - Check that `activities` table has: `work_type`, `energy_cost`, `planned_start_time`, `planned_end_time`, `task_id`
  - Check that `transactions` table has: `intent`, `emotion`, `worth_it`
  - Check that `tasks` table has: `energy_required`, `avoidance_count`, `last_postponed_at`, `breakdown_suggested`

## ✅ Environment Variables

### Backend (`.env` - DO NOT COMMIT)
- [x] `SUPABASE_URL` - Set to your Supabase project URL
- [x] `SUPABASE_SERVICE_ROLE_KEY` - Set (keep secret!)
- [x] `SUPABASE_ANON_KEY` - Set
- [ ] `CORS_ORIGINS` - Update for production (comma-separated list of allowed origins)

**For Production:**
```env
CORS_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com
```

### Frontend (`.env.local` - DO NOT COMMIT)
- [x] `NEXT_PUBLIC_SUPABASE_URL` - Set
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Set
- [ ] `NEXT_PUBLIC_API_URL` - Update for production backend URL

**For Production:**
```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

## ✅ Code Quality

- [x] **Backend Formatting**
  - ✅ Run `black --check .` in `backend/` directory
  - ✅ All files pass formatting check

- [x] **Frontend Dependencies**
  - ✅ Run `npm ci --dry-run` in `frontend/` directory
  - ✅ All dependencies synced

- [x] **No TODO/FIXME Comments**
  - ✅ No critical TODOs in source code
  - ✅ No hardcoded localhost URLs (only fallbacks)

- [x] **Security**
  - ✅ `.env` and `.env.local` in `.gitignore`
  - ✅ Service role key only in backend (never exposed to frontend)
  - ✅ RLS enabled on all tables
  - ✅ Authentication required for all API endpoints

## ✅ Local Testing

- [ ] **Backend Server**
  ```bash
  cd backend
  uvicorn main:app --reload --port 8000
  ```
  - [ ] Server starts without errors
  - [ ] Health check works: `curl http://localhost:8000/health`
  - [ ] API docs accessible: `http://localhost:8000/docs`

- [ ] **Frontend Server**
  ```bash
  cd frontend
  npm run dev
  ```
  - [ ] Server starts without errors
  - [ ] App loads at `http://localhost:3000`
  - [ ] No console errors in browser

- [ ] **Authentication Flow**
  - [ ] Can sign up for new account
  - [ ] Profile auto-created in Supabase
  - [ ] Can log in with credentials
  - [ ] Can log out
  - [ ] Session persists on page refresh

- [ ] **Core Features Test**
  - [ ] **Time & Focus**
    - [ ] Create activity with start/end time
    - [ ] Add energy_cost and work_type to activity
    - [ ] Log interruption
    - [ ] View today's timeline
  
  - [ ] **Finances**
    - [ ] Add income transaction
    - [ ] Add expense transaction with intent/emotion/worth_it
    - [ ] Create budget
    - [ ] Create savings goal
    - [ ] View financial dashboard
  
  - [ ] **Planner**
    - [ ] Create task with energy_required
    - [ ] Mark task as completed
    - [ ] Create goal
    - [ ] Log habit completion
    - [ ] View planner dashboard
  
  - [ ] **Energy & Mood**
    - [ ] Log daily energy (1-5)
    - [ ] Log stress level (1-5)
    - [ ] Select mood
    - [ ] Enter sleep hours
    - [ ] View energy tracker
  
  - [ ] **Reflections**
    - [ ] Complete daily reflection
    - [ ] View reflection history
  
  - [ ] **Cross-Domain Insights**
    - [ ] View time vs money correlation chart
    - [ ] View energy vs spending chart
    - [ ] View generated insights

## ✅ Production Deployment

### Backend (Render/Railway/Heroku)

- [ ] **Environment Variables Set**
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `SUPABASE_ANON_KEY`
  - [ ] `CORS_ORIGINS` (your frontend URL)

- [ ] **Build Configuration**
  - [ ] Build command: `pip install -r requirements.txt`
  - [ ] Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
  - [ ] Python version: 3.11+ (check `requirements.txt` compatibility)

- [ ] **Health Check**
  - [ ] Backend URL accessible: `https://your-backend.com/health`
  - [ ] Returns `{"status": "ok"}`

### Frontend (Vercel/Netlify)

- [ ] **Environment Variables Set**
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `NEXT_PUBLIC_API_URL` (your backend URL)

- [ ] **Build Configuration**
  - [ ] Framework: Next.js
  - [ ] Build command: `npm run build` (auto-detected)
  - [ ] Output directory: `.next` (auto-detected)

- [ ] **Domain & SSL**
  - [ ] Custom domain configured (if applicable)
  - [ ] SSL certificate active

## ✅ Post-Deployment Verification

- [ ] **End-to-End Test**
  - [ ] Visit production frontend URL
  - [ ] Sign up for new account
  - [ ] Complete one activity
  - [ ] Add one transaction
  - [ ] Log energy for today
  - [ ] View insights page
  - [ ] All features work as expected

- [ ] **Performance Check**
  - [ ] Page load times acceptable (< 3s)
  - [ ] API response times acceptable (< 500ms)
  - [ ] No console errors in production

- [ ] **Security Check**
  - [ ] HTTPS enabled
  - [ ] CORS configured correctly
  - [ ] No sensitive data in browser console
  - [ ] Service role key not exposed

## 📋 Additional Recommendations

### Monitoring & Logging
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom, etc.)
- [ ] Configure Supabase database backups

### Documentation
- [ ] Update README with production URLs
- [ ] Document API endpoints (already in `/docs` via FastAPI)
- [ ] Create user guide/documentation

### Backup & Recovery
- [ ] Supabase automatic backups enabled
- [ ] Know how to restore from backup
- [ ] Document recovery procedures

## 🎯 Quick Deployment Commands

### Backend (Render/Railway)
```bash
# Build command
pip install -r requirements.txt

# Start command
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Frontend (Vercel)
```bash
# Auto-detected, but verify:
npm run build
npm start
```

## ⚠️ Common Issues to Watch For

1. **CORS Errors**
   - Ensure `CORS_ORIGINS` includes your frontend URL
   - Check for trailing slashes in URLs

2. **Authentication Failures**
   - Verify Supabase keys are correct
   - Check RLS policies are enabled
   - Ensure `handle_new_user` trigger is active

3. **Missing Columns**
   - If you see "column does not exist" errors, re-run `complete_schema.sql`
   - The schema handles upgrades automatically

4. **Environment Variables**
   - Frontend: Must use `NEXT_PUBLIC_` prefix
   - Backend: No prefix needed
   - Never commit `.env` files

5. **Build Failures**
   - Check Python version (3.11+)
   - Check Node version (18+)
   - Verify all dependencies in `requirements.txt` and `package.json`

## ✅ Final Checklist

Before going live:
- [ ] All tests pass locally
- [ ] All environment variables set in production
- [ ] Database schema applied and verified
- [ ] Both servers running in production
- [ ] End-to-end test completed
- [ ] Monitoring set up
- [ ] Documentation updated

---

**Status:** Ready for deployment! 🚀

Once you've completed the local testing checklist, you're ready to deploy to production.
