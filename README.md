# iRoutine

**A personal life operating system that helps you understand why your days go the way they do — and improve them without burning out.**

Most productivity apps tell you what to do. iRoutine helps you understand what actually happened, why it happened, and what small change might make tomorrow better. It's not another task manager or habit tracker. It's a feedback system for your life.

---

## The Problem I Built This To Solve

Ever have one of those days where everything just... works? And then the next day, nothing does? I wanted to understand why. Not just track tasks or habits in isolation, but see how time, money, energy, focus, and planning all connect.

Traditional apps treat these as separate domains. But they're not. When you're low on energy, you spend more money on convenience. When you're interrupted constantly, tasks don't get done. When you overplan, reality feels like failure.

iRoutine connects the dots. It shows you patterns you wouldn't see otherwise, explains them simply, and suggests the next best action—without the guilt, pressure, or noise that most productivity apps add.

---

## What Makes This Different

### It's Actually Explainable

No black-box AI that just tells you "you're less productive on Tuesdays." Every insight shows you the math. The interruption cost model? It's `duration × type_weight × context_weight`—and you can see exactly why that social media break during deep work cost you more than a quick phone call.

### It Connects Everything

This is the unfair advantage: cross-domain intelligence. See how your busy days correlate with spending. Understand why low energy leads to impulse purchases. Discover how interruptions actually impact task completion. Most apps can't do this because they silo your data. iRoutine doesn't.

### It Respects Your Time

Daily reflection takes 2 minutes. Weekly reviews are automatic. Monthly insights just appear. No endless logging, no gamification pressure, no notifications begging for attention. Just clean data and clear insights.

---

## Features

### Time & Focus Tracking

Track what you actually do, not just what you plan. See your day as a timeline, identify when focus breaks down, and understand your productivity patterns. The system tracks activities, interruptions, deep vs shallow work, and compares your plans to reality.

**Key Features:**
- Activity tracking with start/end times
- Interruption logging (type, duration, context)
- Focus heatmaps showing when you work best
- Planned vs actual time comparison
- Interactive daily timeline

### Financial Tracking with Emotional Context

Money isn't just numbers. It's emotional. iRoutine tracks not just what you spent, but whether it was planned, how you felt about it, and whether it was worth it. This emotional layer helps you understand spending patterns that pure budgeting misses.

**Key Features:**
- Income and expense tracking
- Category management and monthly budgets
- Savings goals with progress tracking
- Recurring transaction management
- Emotional money layer (intent, emotion, "worth it?")
- Safe-to-spend daily insights

### Energy & Momentum Tracking

Energy is the missing variable in most productivity systems. Track your energy levels, stress, mood, and sleep—then see how they correlate with everything else. Match tasks to your energy levels. Understand what drains you and what energizes you.

**Key Features:**
- Daily energy and stress tracking (1-5 scale)
- Mood logging
- Sleep hour tracking
- Energy cost classification for activities
- Energy-aware task suggestions

### Smart Planning

Plan your day and week with energy awareness. The system suggests which tasks match your current energy level, detects when you're avoiding something, and helps break down large tasks. Tasks intelligently roll over when needed.

**Key Features:**
- Daily planning (top 3 priorities, time blocks)
- Weekly planning and goal setting
- Task management with priorities and due dates
- Energy-aware task matching
- Task avoidance detection
- Smart task breakdown suggestions

### Habits & Goals

Track habits with flexibility—because some days you need a "bad-day version" of your habit. Set long-term goals with milestones and see real progress. The system correlates habits with outcomes so you know what actually works.

**Key Features:**
- Habit definition and daily logging
- Streak tracking (current and best)
- Flexible completion (bad-day versions)
- Long-term goals with milestones
- Goal inactivity detection
- Habit-outcome correlation

### Reflection & Awareness

The most important feature: reflection. Daily 2-minute reflections, weekly reviews, and monthly insights help you learn from your data. What worked? What didn't? Why? What's one small adjustment for tomorrow?

**Key Features:**
- Daily reflection (≤2 minutes)
- Weekly review (time vs plan, money vs budget, energy vs workload)
- Monthly review (trends, stability, burnout signals)

### Cross-Domain Intelligence

This is where iRoutine shines. It connects time, money, energy, focus, and planning to show you patterns you'd never see otherwise.

**Insights Include:**
- Time ↔ Money: How busy days affect spending
- Energy ↔ Spending: Low energy leads to higher spending
- Interruptions ↔ Task Failure: The real cost of distractions
- Planning ↔ Reality: When you overplan and why

### Advanced Analytics

Automatically discover behavioral patterns, see your 24-hour productivity curve, get personalized recommendations, and dive deep into interruption metrics. All with explainable calculations—no black boxes.

**Analytics Features:**
- AI pattern detection (5+ behavioral pattern types)
- 24-hour productivity curve with quality scoring
- Smart recommendations based on your data
- Interruption metrics engine with cost calculations
- Recovery time analysis
- Interruption and focus heatmaps
- Focus quality scores (0-100 per session)
- "What Changed This Week?" auto-comparisons
- Streaks and achievements system
- Category breakdown visualizations

### Export & Reports

Export all your data as CSV or generate a professional one-page PDF weekly report.

---

## Tech Stack

I built this as a full-stack application to demonstrate modern web development practices:

**Frontend:**
- Next.js 14 (App Router) - Server-side rendering and routing
- React 18 - Component architecture
- TypeScript - Type safety throughout
- Tailwind CSS - Utility-first styling
- Recharts - Data visualizations
- Supabase Client - Real-time database integration
- date-fns / date-fns-tz - Robust time handling

**Backend:**
- Python 3.11+ - Modern Python features
- FastAPI - High-performance async API framework
- Pydantic - Schema validation and data modeling
- Supabase Python Client - Database operations
- python-jose - JWT authentication

**Database & Infrastructure:**
- Supabase (PostgreSQL) - Managed database with Row Level Security
- JWT Authentication - Secure token-based auth
- Row Level Security (RLS) - User data isolation at the database level

**Testing & Quality:**
- Jest + React Testing Library - Frontend unit and integration tests
- pytest - Backend testing framework
- GitHub Actions - CI/CD pipeline

**Deployment:**
- Vercel - Frontend hosting (optimized for Next.js)
- Render/Fly.io - Backend hosting options

---

## Architecture

The system follows a clean separation of concerns:

```
Frontend (Next.js) → Backend (FastAPI) → Database (Supabase/PostgreSQL)
```

**Frontend:** React components organized by feature, with shared utilities for API calls, time handling, and business logic. The interruption metrics engine lives here as a pure TypeScript module.

**Backend:** RESTful API with FastAPI, organized into routers (activities, finances, planner, etc.), core services (auth, database, rate limiting), and business logic services.

**Database:** PostgreSQL via Supabase with Row Level Security policies ensuring users can only access their own data.

All times are stored in UTC and converted to user timezones for display—this prevents the timezone bugs that plague most apps.

---

## Key Engineering Decisions

### 1. Explainable Analytics Over Machine Learning

I chose transparent, calculable metrics over ML models. Users can see exactly how their interruption cost score is calculated (`duration × type_weight × context_weight`). This builds trust and helps users understand their data.

### 2. UTC Time Storage

All times stored in UTC (ISO 8601), converted to user timezone for display. This prevents timezone bugs, handles DST transitions automatically, and makes calculations reliable across timezones.

### 3. Component-Based Architecture

Feature-based organization with reusable components. Clear separation between UI components, business logic, and API integration. This makes the codebase maintainable and testable.

### 4. Security First

- JWT authentication via Supabase
- Row Level Security at the database level
- Rate limiting (100/min read, 30/min write)
- Input validation with Pydantic schemas
- CORS configuration
- No hardcoded secrets

### 5. Testing Strategy

Unit tests for core calculation logic (metrics, cost models, time handling), integration tests for components, and CI/CD that runs on every push. This ensures quality and prevents regressions.

---

## Getting Started

### Prerequisites

You'll need:
- Node.js 18+ (for the frontend)
- Python 3.11+ (for the backend)
- npm or yarn
- A Supabase account (free tier works fine)

### Quick Start (Demo Mode)

Want to see it in action without setting up Supabase? The frontend works in demo mode:

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` and explore the interface. It won't save data, but you can see how everything works.

### Full Setup

1. **Set up Supabase:**
   - Create a project at [supabase.com](https://supabase.com)
   - Run the complete schema: `backend/supabase/complete_schema.sql`
   - Copy your project URL and anon key

2. **Configure environment variables:**
   - Frontend: Create `frontend/.env.local` with your Supabase credentials
   - Backend: Create `backend/.env` with your Supabase credentials
   - See `.env.example` files for the exact variables needed

3. **Start the servers:**

```bash
# Terminal 1 - Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` and sign up!

For detailed setup instructions, see `SUPABASE_SETUP.md`.

---

## Running Tests

**Frontend:**
```bash
cd frontend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

**Backend:**
```bash
cd backend
pytest                # Run all tests
pytest --cov          # With coverage report
```

Tests run automatically on push via GitHub Actions. See `.github/workflows/ci.yml` for the CI/CD configuration.

---

## Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL`
4. Deploy (automatic on every push)

### Backend (Render or Fly.io)

**Render:**
- Connect your GitHub repo
- Set build command: `pip install -r requirements.txt`
- Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Add environment variables

**Fly.io:**
```bash
fly launch
fly secrets set SUPABASE_URL=...
fly deploy
```

See `DOCUMENTATION.md` for detailed deployment instructions.

---

## API Reference

The backend exposes a RESTful API with the following endpoints:

**Core:**
- `POST /api/activities` - Create activity
- `GET /api/activities` - List activities
- `POST /api/interruptions` - Log interruption
- `GET /api/interruptions` - List interruptions

**Finances:**
- `POST /api/finances/transactions` - Create transaction
- `GET /api/finances/transactions` - List transactions
- `POST /api/finances/budgets` - Create/update budget
- `GET /api/finances/budgets` - Get budgets
- `GET /api/finances/summary` - Monthly summary

**Planner:**
- `POST /api/planner/tasks` - Create task
- `GET /api/planner/tasks` - List tasks
- `GET /api/planner/today` - Today's summary
- `POST /api/planner/goals` - Create goal
- `POST /api/planner/habits` - Create habit

**Energy & Reflections:**
- `POST /api/energy` - Log energy/mood
- `GET /api/energy/today` - Today's energy log
- `POST /api/reflections/daily` - Daily reflection
- `POST /api/reflections/weekly` - Weekly reflection
- `POST /api/reflections/monthly` - Monthly reflection

**Analytics:**
- `GET /api/cross-domain/time-money` - Time vs Money correlation
- `GET /api/cross-domain/energy-spending` - Energy vs Spending correlation
- `GET /api/cross-domain/interruption-tasks` - Interruptions vs Task completion
- `GET /api/insights` - Get insights
- `GET /api/export` - Export data as CSV

All endpoints require Bearer token authentication. When the backend is running, see `http://localhost:8000/docs` for interactive API documentation (FastAPI auto-generates this).

---

## Security & Privacy

Security was a priority from day one:

**Authentication & Authorization:**
- JWT tokens via Supabase Auth
- Row Level Security (RLS) policies ensure users can only access their own data
- All endpoints require authentication (401 for unauthenticated requests)

**Input Validation:**
- Pydantic schemas validate all inputs
- Type checking and length limits
- Unexpected fields are rejected
- Business logic validation (e.g., end time must be after start time)

**Rate Limiting:**
- IP-based rate limiting
- Different limits for read (100/min) and write (30/min) operations
- Graceful 429 responses when limits are exceeded

**Data Protection:**
- No hardcoded secrets (all in environment variables)
- CORS configured to restrict origins
- UTC time storage prevents timezone-related vulnerabilities
- Secure API key handling following OWASP best practices

For complete security documentation including threat model, see `SECURITY.md`.

---

## Performance & Reliability

**Frontend Optimizations:**
- Code splitting (automatic with Next.js App Router)
- Lazy loading for chart components
- Memoization for heavy calculations
- Efficient date handling with date-fns
- Optimized re-renders with React.memo

**Backend Optimizations:**
- Efficient database queries (indexed on user_id, start_time)
- Connection pooling via Supabase
- Rate limiting to prevent abuse

**Error Handling:**
- Global error boundary catches React errors
- Empty states for all views
- Loading states for async operations
- Graceful fallbacks for failed API calls
- Proper HTTP status codes

**Target Metrics:**
- Page load: < 2s
- Time to interactive: < 3s
- API response: < 200ms

---

## Design Philosophy

iRoutine follows Apple-like design principles:

- **Less, but better** - Every feature justifies its existence
- **Calm UI** - No unnecessary colors or animations
- **Clear typography** - Readable and accessible
- **Respectful** - No pressure, gamification, or noise
- **Explainable** - Users understand how insights are calculated

The goal is to feel like a tool that helps, not an app that demands attention.

---

## Documentation

- **`DOCUMENTATION.md`** - Complete technical documentation (architecture, deployment, time handling, API reference)
- **`SECURITY.md`** - Security practices, threat model, and OWASP compliance
- **`SUPABASE_SETUP.md`** - Step-by-step Supabase setup guide

---

## What I Learned Building This

This project was an opportunity to build something meaningful while demonstrating full-stack capabilities:

**Technical Skills Demonstrated:**
- Full-stack development (React/Next.js + Python/FastAPI)
- Database design and Row Level Security
- Authentication and authorization
- API design and RESTful principles
- Time handling and timezone management
- Data visualization and analytics
- Testing strategies (unit, integration, CI/CD)
- Deployment and DevOps

**Product Thinking:**
- User experience design
- Feature prioritization
- Explainable analytics over black-box AI
- Cross-domain data correlation
- Privacy and security considerations

**Engineering Practices:**
- Type safety with TypeScript
- Schema validation with Pydantic
- Component architecture
- Error handling and edge cases
- Documentation and code organization

---

## License

MIT License - feel free to use this as inspiration for your own projects.

---

## Acknowledgments

Built with intention and care. Inspired by Apple's philosophy of simplicity and clarity, and by the idea that the best productivity tools are the ones that help you understand yourself better—not the ones that try to optimize you into a machine.

---

**Questions?** Check out `DOCUMENTATION.md` for technical details, or `SECURITY.md` for security information.
