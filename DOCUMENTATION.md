# Routine - Complete Documentation

This document consolidates all technical documentation for the Routine application.

---

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Engineering Decisions](#engineering-decisions)
3. [Deployment Guide](#deployment-guide)
4. [Time Handling](#time-handling)
5. [Security](#security)
6. [Database Schema](#database-schema)
7. [API Reference](#api-reference)
8. [Development Guide](#development-guide)

---

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────────┐
│   Frontend      │  Next.js 14 (App Router)
│   (Vercel)      │  React 18 + TypeScript
└────────┬────────┘
         │
         │ HTTPS + JWT
         │
┌────────▼────────┐
│   Backend       │  FastAPI (Python)
│   (Render)      │  REST API
└────────┬────────┘
         │
         │ PostgreSQL
         │
┌────────▼────────┐
│   Supabase      │  Database + Auth
│   (Cloud)       │  Row Level Security
└─────────────────┘
```

### Project Structure

```
routine/
├── frontend/              # Next.js + TypeScript + React
│   ├── app/              # Next.js App Router pages
│   │   ├── dashboard/    # Dashboard pages (Today, Finances, Planner, Insights, Settings)
│   │   └── auth/         # Authentication pages
│   ├── components/       # React components
│   │   └── dashboard/    # Dashboard components
│   ├── lib/              # Utilities and business logic
│   │   ├── interruption-metrics.ts  # Metrics engine
│   │   ├── pdf-export.ts            # PDF generation
│   │   └── supabase/     # Supabase client
│   └── __tests__/        # Unit tests
├── backend/              # FastAPI + Python
│   ├── app/              # Application code
│   │   ├── core/         # Config, database, auth
│   │   ├── routers/      # API endpoints
│   │   ├── services/     # Business logic
│   │   └── __tests__/    # Unit tests
│   └── supabase/         # Database schema
├── .github/
│   └── workflows/        # CI/CD pipelines
├── DOCUMENTATION.md      # This file
├── SECURITY.md           # Security documentation
└── README.md             # Main readme
```

---

## 🎯 Engineering Decisions

### 1. Monorepo Structure

**Decision**: Single repository with `frontend/` and `backend/` directories

**Rationale**:
- Easier to maintain consistency
- Shared types and utilities
- Single deployment pipeline
- Better for small teams

### 2. Next.js App Router

**Decision**: Use Next.js 14 App Router (not Pages Router)

**Rationale**:
- Modern React patterns (Server Components)
- Better performance (automatic code splitting)
- Built-in API routes
- Better TypeScript support

### 3. Supabase for Backend

**Decision**: Use Supabase for database and auth

**Rationale**:
- Fast development
- Built-in auth (JWT)
- Row Level Security
- Real-time capabilities (future)
- PostgreSQL (powerful, reliable)

### 4. Explainable Analytics (Non-ML)

**Decision**: Use simple, explainable calculations instead of ML

**Rationale**:
- Transparent to users
- No "black box" concerns
- Fast calculations
- Easy to debug
- No training data needed

### 5. Interruption Cost Model

**Decision**: Cost = duration × type_weight × context_weight

**Weights**:
- Social Media (1.4) - Highest distraction
- Phone (1.2) - Medium distraction
- Noise (1.0) - Baseline
- Early focus (1.3) - Most disruptive timing
- Deep work window (1.2) - Important time

### 6. UTC Time Storage

**Decision**: Store all times in UTC, convert for display

**Rationale**:
- Avoids timezone bugs
- Handles DST correctly
- Consistent across users
- Standard practice

### 7. Component Architecture

**Decision**: Feature-based component organization

**Structure**:
```
components/
  dashboard/
    activity-form.tsx
    interruption-form.tsx
    today-timeline.tsx
    ...
```

### 8. Metrics Engine Design

**Decision**: Separate utility functions, not class-based

**Rationale**:
- Pure functions (easier to test)
- No state management needed
- Composable
- Tree-shakeable

---

## 🚀 Deployment Guide

### Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase account
- Vercel account (for frontend)
- Render or Fly.io account (for backend)

### Frontend Deployment (Vercel)

1. **Go to [vercel.com](https://vercel.com)**
2. **Import Project** from GitHub
3. **Configure Project**:
   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. **Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
   ```

5. **Deploy** - Vercel auto-deploys on push to `main`

### Backend Deployment (Render)

1. **Go to [render.com](https://render.com)**
2. **New** → **Web Service**
3. **Connect GitHub** repository
4. **Configure**:
   - Name: `routine-api`
   - Environment: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

5. **Environment Variables**:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_ANON_KEY=your-anon-key
   CORS_ORIGINS=https://your-app.vercel.app
   ```

### Database Setup (Supabase)

1. **Create Project** at [supabase.com](https://supabase.com)
2. **Run Schema**:
   - Go to SQL Editor
   - Copy contents of `backend/supabase/schema.sql`
   - Run the SQL
   - Copy contents of `backend/supabase/schema_finances_planner.sql`
   - Run the SQL

3. **Verify RLS**:
   - Go to Authentication → Policies
   - Verify RLS is enabled on all tables

4. **Get Keys**:
   - Go to Settings → API
   - Copy Project URL, `anon` key, and `service_role` key

### Security Checklist

- [ ] RLS policies enabled on all tables
- [ ] Service role key only in backend (never frontend)
- [ ] CORS origins restricted to your domains
- [ ] HTTPS enabled (automatic on Vercel/Render)
- [ ] Environment variables set (not hardcoded)
- [ ] Error messages don't leak sensitive info

---

## ⏰ Time Handling

### Storage Format

**All times stored in UTC (ISO 8601)**
- Format: `YYYY-MM-DDTHH:mm:ssZ` (e.g., `2024-01-15T10:30:00Z`)
- Database columns: `TIMESTAMP WITH TIME ZONE` (PostgreSQL)

**Why UTC?**
- Avoids timezone bugs
- Handles DST transitions correctly
- Consistent calculations across users
- Standard practice for time-series data

### Timezone Conversion

**User Timezone**
- Stored in `profiles.timezone` (e.g., `America/New_York`)
- Default: `UTC` if not set
- User can update in settings

**Display Conversion**
- Uses `date-fns-tz` library
- Converts UTC to user timezone for display only
- All calculations use UTC internally

### DST (Daylight Saving Time) Edge Cases

**Solution**: UTC Storage Avoids DST Issues
- All times stored in UTC (no DST)
- Display conversions handle DST automatically
- `date-fns-tz` handles transitions correctly

### Time Validation

**Server-Side Validation (Pydantic)**
- End time must be after start time
- No negative durations
- Maximum duration: 24 hours
- Valid ISO 8601 format required

---

## 🔒 Security

See `SECURITY.md` for complete security documentation.

### Key Security Features

- ✅ JWT authentication (Supabase Auth)
- ✅ Row Level Security (RLS) - Verified user isolation
- ✅ Rate limiting (IP and user-based, 100/min read, 30/min write)
- ✅ Input validation (Pydantic schema-based)
- ✅ Input sanitization (trim, reject unexpected fields)
- ✅ CORS configuration (restricted origins)
- ✅ Environment variable management (no hardcoded keys)
- ✅ UTC time storage
- ✅ Timezone-safe calculations

---

## 🗄️ Database Schema

### Core Tables

- **profiles** - User profiles with timezone
- **activities** - Time tracking activities
- **interruptions** - Interruption logs with duration
- **transactions** - Financial transactions (income/expense)
- **budgets** - Monthly spending budgets
- **savings_goals** - Savings goals tracking
- **recurring_transactions** - Recurring income/expenses
- **tasks** - Daily/weekly tasks
- **goals** - Long-term goals
- **habits** - Habit tracking
- **habit_logs** - Daily habit check-ins

### Schema Files

- `backend/supabase/schema.sql` - Core schema (profiles, activities, interruptions)
- `backend/supabase/schema_finances_planner.sql` - Finances and Planner tables

### Row Level Security (RLS)

All tables have RLS enabled with policies:
- Users can only view their own data
- Users can only insert their own data
- Users can only update their own data
- Users can only delete their own data

---

## 📡 API Reference

### Base URL

- Local: `http://localhost:8000`
- Production: `https://your-backend.onrender.com`

### Authentication

All endpoints require Bearer token authentication:
```
Authorization: Bearer <jwt_token>
```

### Endpoints

#### Activities
- `POST /api/activities` - Create activity
- `GET /api/activities` - List activities (filtered by user)

#### Interruptions
- `POST /api/interruptions` - Create interruption
- `GET /api/interruptions` - List interruptions (filtered by user)

#### Finances
- `POST /api/finances/transactions` - Create transaction
- `GET /api/finances/transactions` - List transactions
- `POST /api/finances/budgets` - Create/update budget
- `GET /api/finances/budgets` - Get budgets
- `POST /api/finances/goals` - Create savings goal
- `GET /api/finances/goals` - Get savings goals
- `GET /api/finances/summary` - Get financial summary

#### Planner
- `POST /api/planner/tasks` - Create task
- `GET /api/planner/tasks` - List tasks
- `PATCH /api/planner/tasks/{id}` - Update task
- `DELETE /api/planner/tasks/{id}` - Delete task
- `POST /api/planner/goals` - Create goal
- `GET /api/planner/goals` - List goals
- `POST /api/planner/habits` - Create habit
- `GET /api/planner/habits` - List habits
- `POST /api/planner/habits/log` - Log habit completion
- `GET /api/planner/today` - Get today's summary

#### Insights
- `GET /api/insights` - Get insights (cost, quality, patterns)

#### Export
- `GET /api/export` - Export data as CSV

#### Health
- `GET /health` - Health check endpoint

### API Documentation

When backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## 💻 Development Guide

### Local Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd Routine-final
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your Supabase credentials
   uvicorn main:app --reload
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   npm run dev
   ```

4. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Testing

**Frontend Tests**
```bash
cd frontend
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

**Backend Tests**
```bash
cd backend
pytest                # Run tests
pytest --cov          # With coverage
```

### Code Quality

**Backend**
```bash
cd backend
black .               # Format code
black --check .       # Check formatting
flake8 .              # Lint code
```

**Frontend**
```bash
cd frontend
npm run lint          # ESLint
```

### CI/CD

Tests run automatically on:
- Push to `main` or `develop`
- Pull requests

See `.github/workflows/ci.yml` for configuration.

---

## 📚 Additional Resources

- **README.md** - Main project readme with features and quick start
- **SECURITY.md** - Complete security documentation including threat model
- **Backend README** - `backend/README.md` - Backend-specific documentation

---

**Last Updated**: January 2025
