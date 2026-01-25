# iRoutine - Personal Life Operating System

A comprehensive system that helps you understand, manage, and improve your daily life across **Time, Money, Energy, Focus, Planning, and Reflection**.

## 🎯 Mission

This is not just a task manager, finance tracker, or habit app. This is a **personal feedback system** that explains why days go well or badly, and guides the next small improvement.

**Core Promise**: "Understand why your days go the way they do — and improve them without burning out."

**Philosophy**: Reflect reality honestly, explain patterns simply, suggest the next best action gently. No guilt. No pressure. No noise.

---

## ✨ Features

### 🕐 Time & Focus (Execution Reality)
- ✅ **Activity Tracking** - Track actual activities with start/end time
- ✅ **Interruption Tracking** - Type, time, frequency tracking
- ✅ **Deep vs Shallow Work** - Classify work types
- ✅ **Planned vs Actual** - Compare planned time with reality
- ✅ **Focus Breakdown** - Identify where focus breaks down
- ✅ **Today Timeline** - Interactive visual timeline
- ✅ **Focus Heatmap** - Visual pattern of when you focus best

### 💰 Finances & Security (Daily Money Reality)
- ✅ **Income & Expense Tracking** - Manual-first transaction logging
- ✅ **Category Management** - Organize by income/expense categories
- ✅ **Monthly Budgets** - Set spending limits per category
- ✅ **Savings Goals** - Track progress toward financial goals
- ✅ **Recurring Transactions** - Manage subscriptions and bills
- ✅ **Emotional Money Layer** - Track intent (planned/unplanned), emotion, "worth it?"
- ✅ **Financial Summaries** - Monthly overview with budget status
- ✅ **Safe-to-Spend Awareness** - Daily spending insights

### ⚡ Energy & Momentum (Missing Variable)
- ✅ **Daily Energy Tracking** - Energy level (1-5), stress level (1-5)
- ✅ **Mood Tracking** - Optional mood logging
- ✅ **Sleep Hours** - Track sleep patterns
- ✅ **Energy Cost Classification** - Light/medium/heavy for activities and tasks
- ✅ **Energizing vs Draining** - Classify activities by energy impact
- ✅ **Energy-Aware Insights** - Correlate energy with performance

### 📅 Planning (Daily & Weekly)
- ✅ **Daily Planning** - Top 3 priorities, time blocks
- ✅ **Weekly Planning** - Weekly goals, workload distribution
- ✅ **Task Management** - Priority, status, due dates
- ✅ **Energy-Aware Suggestions** - Match tasks to energy levels
- ✅ **Task Avoidance Detection** - Identify postponed tasks
- ✅ **Smart Task Breakdown** - Suggest breaking down large tasks
- ✅ **Auto-Rollover** - Intelligent task carryover

### 🔄 Habits & Behavior Change
- ✅ **Habit Definition** - Name, frequency, target count
- ✅ **Daily Habit Logging** - Track completion
- ✅ **Streak Tracking** - Current and best streaks
- ✅ **Flexible Completion** - "Bad-day version" support
- ✅ **Habit-Outcome Correlation** - Link habits to results

### 🎯 Goals & Direction
- ✅ **Long-Term Goals** - Categories, milestones, progress
- ✅ **Progress Tracking** - 0-100% progress with milestones
- ✅ **Goal Status** - Active, completed, paused, abandoned
- ✅ **Goal Inactivity Detection** - Identify stalled goals

### 📝 Reflection & Awareness (Critical)
- ✅ **Daily Reflection** (≤2 min) - What worked? What didn't? Why? One adjustment
- ✅ **Weekly Review** - Time vs plan, money vs budget, energy vs workload
- ✅ **Monthly Review** - Trends, stability, burnout signals, financial progress

### 🔗 Cross-Domain Intelligence (Unfair Advantage)
- ✅ **Time ↔ Money** - Correlate busy days with spending
- ✅ **Energy ↔ Spending** - Low energy → higher spending insights
- ✅ **Interruptions ↔ Task Failure** - Impact of interruptions on completion
- ✅ **Planning ↔ Reality Gaps** - Identify overplanning patterns
- ✅ **Visual Dashboards** - Charts and graphs for all correlations
- ✅ **Deterministic Insights** - No AI, just clear data analysis

### Advanced Analytics (AI-Powered)
- ✅ **AI Pattern Detection** - Automatically discovers behavioral patterns (5+ types)
- ✅ **Productivity Curve** - 24-hour analysis with quality scoring
- ✅ **Smart Recommendations** - Personalized action items based on your data
- ✅ **Interruption Metrics Engine** - Deep analytics on interruptions
- ✅ **Cost Score Calculation** - Explainable cost model (duration × type × context)
- ✅ **Recovery Time Analysis** - Time to resume focus after interruptions
- ✅ **Interruption Heatmap** - Visual pattern by day/hour (minutes or cost view)
- ✅ **Focus Heatmap** - When and where you focus best
- ✅ **Focus Quality Score** - 0-100 quality metric per session
- ✅ **"What Changed This Week?"** - Auto-generated weekly comparison
- ✅ **Streaks Tracking** - Current and longest activity streaks
- ✅ **Achievements System** - 5 unlockable achievements with progress
- ✅ **Category Breakdown** - Pie chart and detailed time distribution

### Export & Reports
- ✅ **CSV Export** - Complete data export with all fields
- ✅ **PDF Weekly Report** - Professional one-page summary

---

## 🏗️ Architecture

### System Overview

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
│   │   ├── dashboard/    # Dashboard pages
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
├── DOCUMENTATION.md      # Complete technical documentation
├── SECURITY.md           # Security & time handling
└── README.md             # This file
```

---

## 🎓 Engineering Decisions

### Key Decisions

1. **Explainable Analytics (Non-ML)**
   - Simple, transparent calculations
   - Users understand the logic
   - No "black box" concerns
   - See `DOCUMENTATION.md` for details

2. **UTC Time Storage**
   - All times stored in UTC (ISO 8601)
   - Convert to user timezone for display
   - Prevents timezone bugs and DST issues
   - See `SECURITY.md` for time handling details

3. **Interruption Cost Model**
   - Formula: `duration × type_weight × context_weight`
   - Explainable and adjustable
   - Type weights: Social Media (1.4), Phone (1.2), Noise (1.0)
   - Context weights: Early focus (1.3), Deep work (1.2)

4. **Component Architecture**
   - Feature-based organization
   - Reusable components
   - Clear separation of concerns

5. **Testing Strategy**
   - Unit tests for core logic
   - Integration tests for components
   - CI/CD pipeline for quality assurance

**See `DOCUMENTATION.md` for detailed explanations of all decisions.**

---

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Recharts (visualizations)
- Supabase Client
- date-fns / date-fns-tz (time handling)

**Backend:**
- Python 3.11+
- FastAPI
- Pydantic (validation)
- Supabase Python Client
- python-jose (JWT)

**Database & Auth:**
- Supabase (PostgreSQL)
- Row Level Security (RLS)
- Supabase Auth (JWT)

**Testing:**
- Jest + React Testing Library (frontend)
- pytest (backend)
- GitHub Actions (CI/CD)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- npm or yarn
- Git

### Quick Start (Demo Mode)

```bash
# Frontend
cd frontend
npm install
npm run dev
```

Visit **http://localhost:3000** - Works without Supabase setup!

### Full Setup (With Supabase)

**Quick Setup:**
1. Run the complete schema in Supabase SQL Editor: `backend/supabase/complete_schema.sql`
2. Environment variables are already configured in `.env` files
3. Start both servers (see commands below)

**Detailed Setup:**
See `SUPABASE_SETUP.md` for step-by-step instructions.

**Start Servers:**
```bash
# Terminal 1 - Backend
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Visit **http://localhost:3000** and sign up!

---

## 🧪 Testing

### Frontend Tests

```bash
cd frontend
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Backend Tests

```bash
cd backend
pytest                # Run tests
pytest --cov          # With coverage
```

### CI/CD

Tests run automatically on:
- Push to `main` or `develop`
- Pull requests

See `.github/workflows/ci.yml` for configuration.

---

## 📦 Deployment

### Frontend (Vercel)

1. Push to GitHub
2. Import in Vercel
3. Set environment variables
4. Deploy automatically

**Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`

### Backend (Render/Fly.io)

**Render:**
- Connect GitHub repo
- Set build: `pip install -r requirements.txt`
- Set start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Add environment variables

**Fly.io:**
- `fly launch`
- `fly secrets set SUPABASE_URL=...`
- `fly deploy`

See `DOCUMENTATION.md` for detailed instructions.

---

## 📚 Documentation

- **`DOCUMENTATION.md`** - Complete technical documentation (architecture, deployment, time handling, API reference)
- **`SECURITY.md`** - Security practices, threat model, and OWASP compliance

---

## 🔒 Security

### Implemented

- ✅ JWT authentication (Supabase Auth)
- ✅ Row Level Security (RLS) - Verified user isolation
- ✅ Rate limiting (IP and user-based, 100/min read, 30/min write)
- ✅ Input validation (Pydantic schema-based, type checks, length limits)
- ✅ Input sanitization (trim, reject unexpected fields)
- ✅ CORS configuration (restricted origins)
- ✅ Environment variable management (no hardcoded keys)
- ✅ Secure API key handling (OWASP best practices)
- ✅ UTC time storage
- ✅ Timezone-safe calculations

### Security Features

**Authentication & Authorization:**
- All endpoints require Bearer token
- RLS policies enforce user data isolation
- Unauthenticated requests rejected (401)

**Input Validation:**
- Schema-based validation (Pydantic)
- Type checking and length limits
- Unexpected fields rejected
- Business logic validation (time ranges, durations)

**Rate Limiting:**
- IP-based rate limiting
- Graceful 429 responses
- Different limits for read/write operations

**See `SECURITY.md` for complete security documentation including threat model.**

---

## ⏰ Time Handling

### Principles

1. **Storage**: All times in UTC (ISO 8601)
2. **Display**: Convert to user timezone
3. **Calculations**: Always use UTC internally
4. **Validation**: End time must be after start time
5. **DST**: UTC storage avoids DST edge cases

### Implementation

- `date-fns` for date manipulation
- `date-fns-tz` for timezone conversions
- User timezone stored in profile
- All date comparisons use UTC
- DST transitions handled automatically

**See `DOCUMENTATION.md` for detailed time handling documentation.**

---

## 📊 API Endpoints

### Core
- `POST /api/activities` - Create activity (with energy_cost, work_type)
- `GET /api/activities` - List activities
- `POST /api/interruptions` - Create interruption
- `GET /api/interruptions` - List interruptions

### Finances
- `POST /api/finances/transactions` - Create transaction (with intent, emotion, worth_it)
- `GET /api/finances/transactions` - List transactions
- `POST /api/finances/budgets` - Create/update budget
- `GET /api/finances/budgets` - Get budgets
- `GET /api/finances/summary` - Monthly financial summary

### Planner
- `POST /api/planner/tasks` - Create task
- `GET /api/planner/tasks` - List tasks
- `GET /api/planner/today` - Today's summary
- `POST /api/planner/goals` - Create goal
- `POST /api/planner/habits` - Create habit
- `POST /api/planner/habit-logs` - Log habit completion

### Energy & Reflections
- `POST /api/energy` - Log energy/mood
- `GET /api/energy/today` - Today's energy log
- `POST /api/reflections/daily` - Daily reflection
- `POST /api/reflections/weekly` - Weekly reflection
- `POST /api/reflections/monthly` - Monthly reflection

### Cross-Domain Analytics
- `GET /api/cross-domain/time-money` - Time vs Money correlation
- `GET /api/cross-domain/energy-spending` - Energy vs Spending correlation
- `GET /api/cross-domain/interruption-tasks` - Interruptions vs Task completion
- `GET /api/cross-domain/insights` - Cross-domain insights

### Analytics & Export
- `GET /api/analytics/summary` - Analytics summary
- `GET /api/insights` - Get insights
- `GET /api/export` - Export data as CSV

**All endpoints require Bearer token authentication.**

See FastAPI docs at `http://localhost:8000/docs` when backend is running.

---

## 🎨 Design Philosophy

Routine follows Apple-like principles:
- **Less, but better** - Every feature justifies its existence
- **Calm UI** - No unnecessary colors or animations
- **Clear typography** - Readable and accessible
- **Respectful** - No pressure, gamification, or noise
- **Explainable** - Users understand how insights are calculated

---

## 🧪 Testing & Quality

### Test Coverage

- **Unit Tests**: Core calculation logic (metrics, cost, quality)
- **Integration Tests**: Component behavior
- **CI/CD**: Automated testing on every push

### Code Quality

- TypeScript strict mode
- ESLint configuration
- Prettier (recommended)
- Type safety throughout

---

## 📸 Screenshots

### Dashboard Overview
![Dashboard](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=Dashboard+View)
*Clean, minimal interface showing today's timeline and activity forms*

### Weekly Insights
![Insights](https://via.placeholder.com/800x400/10B981/FFFFFF?text=Weekly+Insights)
*Interruption heatmap, focus quality, and "What Changed This Week?" panel*

### Interruption Heatmap
![Heatmap](https://via.placeholder.com/800x400/F59E0B/FFFFFF?text=Interruption+Heatmap)
*Visual pattern of interruptions by day and hour, toggleable between minutes and cost views*

**Note**: Replace placeholder images with actual screenshots after deployment.

---

## 📈 Performance

### Optimizations Implemented

**Frontend:**
- ✅ Code splitting (automatic with Next.js App Router)
- ✅ Lazy loading for chart components (Recharts)
- ✅ Memoization for heavy calculations (useMemo)
- ✅ Efficient date calculations (date-fns)
- ✅ Optimized re-renders (React.memo where needed)

**Backend:**
- ✅ Efficient database queries (indexed on user_id, start_time)
- ✅ Connection pooling (via Supabase)
- ✅ Rate limiting to prevent abuse

**Metrics:**
- Page load: < 2s (target)
- Time to interactive: < 3s (target)
- API response: < 200ms (typical)
- Bundle size: Optimized with tree-shaking

### Future Optimizations

**Planned:**
- [ ] Cache weekly insights (Redis)
- [ ] Database indexes on frequently queried columns
- [ ] CDN for static assets
- [ ] Service worker for offline support
- [ ] Virtual scrolling for long timelines

**Scalability Considerations:**
- Current: Suitable for 100-1000 users
- Next: Add caching layer (Redis)
- Future: Read replicas, horizontal scaling

---

## 🛡️ Reliability

### Error Handling

**Frontend:**
- ✅ Global error boundary (catches React errors)
- ✅ Empty states for all charts and lists
- ✅ Loading states for async operations
- ✅ Graceful fallbacks for failed API calls
- ✅ PDF export error handling

**Backend:**
- ✅ Generic error messages (no sensitive data)
- ✅ Proper HTTP status codes
- ✅ Rate limit error responses (429)
- ✅ Validation error messages

### Empty States

**Implemented:**
- ✅ "No data yet" for timeline
- ✅ "No interruptions" for heatmap
- ✅ "No activities" for weekly insights
- ✅ "Start logging" prompts

### Loading States

**Implemented:**
- ✅ Skeleton loaders for charts
- ✅ Loading spinners for forms
- ✅ Disabled buttons during submission

---

## 🚀 Production Readiness

### Checklist

**Features:**
- [x] All P0 features implemented
- [x] Tests written and passing
- [x] CI/CD pipeline configured

**Security:**
- [x] Rate limiting on all endpoints
- [x] Input validation (server-side)
- [x] RLS policies verified
- [x] No hardcoded keys
- [x] CORS configured

**Reliability:**
- [x] Error boundaries implemented
- [x] Empty states for all views
- [x] Loading states
- [x] Error handling robust

**Quality:**
- [x] Time handling correct (UTC storage)
- [x] Documentation complete
- [x] Performance optimized
- [x] Type safety (TypeScript)

---

## 📝 License

MIT

---

## 🙏 Acknowledgments

Built with intention and care. Inspired by Apple's philosophy of simplicity and clarity.

---

**For complete technical documentation, see `DOCUMENTATION.md`**

**For security details, see `SECURITY.md`**
