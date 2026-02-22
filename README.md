# iRoutine

[![CI](https://github.com/sabin901/iRoutine/actions/workflows/ci.yml/badge.svg)](https://github.com/sabin901/iRoutine/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> A personal life operating system that connects time, money, energy, and focus into a single feedback loop.

**Live demo:** [i-routine.vercel.app](https://i-routine.vercel.app)

---

## What it does

iRoutine unifies five domains that most productivity apps treat as separate silos:

| Domain | What it tracks |
|--------|---------------|
| **Time & Focus** | Activities, interruptions, deep vs shallow work, focus quality scores |
| **Finances** | Income, expenses, budgets, savings goals |
| **Energy** | Energy levels, stress, mood, sleep hours |
| **Planning** | Tasks, habits, goals, daily plans |
| **Reflection** | Daily reflections, weekly reviews, monthly trends |

The cross-domain intelligence layer connects these: how busy days affect spending, how low energy leads to impulse purchases, how interruptions impact task completion. Every insight is explainable — no black boxes.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, Recharts |
| **Backend** | Python 3.11+, FastAPI, Pydantic |
| **Database** | Supabase (PostgreSQL), Row Level Security |
| **Auth** | Supabase Auth, JWT tokens |
| **CI/CD** | GitHub Actions |
| **Hosting** | Vercel (frontend), Render/Fly.io (backend) |

---

## Project Structure

```
iRoutine/
├── frontend/                   # Next.js 14 App Router
│   ├── app/
│   │   ├── auth/               # Login, signup pages
│   │   └── dashboard/          # Main app pages
│   │       ├── page.tsx        # Today (home)
│   │       ├── finances/       # Financial tracking
│   │       ├── planner/        # Tasks, habits, goals
│   │       ├── insights/       # Analytics & patterns
│   │       └── settings/       # User preferences
│   ├── components/dashboard/   # 24 dashboard components
│   ├── lib/
│   │   ├── api.ts              # Authenticated API client
│   │   ├── types.ts            # TypeScript interfaces
│   │   ├── supabase/           # Supabase client, server, middleware
│   │   ├── interruption-metrics.ts
│   │   ├── pdf-export.ts
│   │   └── __tests__/          # Unit tests
│   └── middleware.ts           # Auth route protection
│
├── backend/                    # FastAPI
│   ├── main.py                 # App entrypoint
│   ├── app/
│   │   ├── core/               # Auth, config, database, rate limiting
│   │   ├── routers/            # API route handlers
│   │   │   ├── activities.py
│   │   │   ├── finances.py
│   │   │   ├── planner.py
│   │   │   ├── energy.py
│   │   │   ├── reflections.py
│   │   │   ├── cross_domain.py
│   │   │   ├── analytics.py
│   │   │   ├── insights.py
│   │   │   ├── interruptions.py
│   │   │   └── export.py
│   │   └── services/           # Business logic
│   └── supabase/
│       └── complete_schema.sql # Full database schema with RLS
│
├── .github/workflows/ci.yml   # CI pipeline
└── vercel.json                 # Deployment config
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- A [Supabase](https://supabase.com) account (free tier works)

### 1. Clone & install

```bash
git clone https://github.com/sabin901/iRoutine.git
cd iRoutine

# Frontend
cd frontend && npm install

# Backend
cd ../backend && pip install -r requirements.txt
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `backend/supabase/complete_schema.sql` in the SQL editor
3. Copy your project URL and keys from Settings → API

### 3. Configure environment

**Frontend** — create `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend** — create `backend/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
CORS_ORIGINS=http://localhost:3000
```

### 4. Run

```bash
# Terminal 1 — Backend
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open [localhost:3000](http://localhost:3000) and sign up.

> **Demo mode:** The frontend works without Supabase for UI exploration — just run `npm run dev` without env vars. Data won't persist.

---

## Running Tests

```bash
# Frontend
cd frontend
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage

# Backend
cd backend
pytest                      # Run all tests
pytest --cov=app            # With coverage
```

CI runs automatically on every push to `main` or `develop`. See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

---

## Deployment

### Frontend → Vercel

1. Import the repository on [vercel.com](https://vercel.com)
2. Leave **Root Directory** empty (the root `vercel.json` handles everything)
3. Add the three `NEXT_PUBLIC_*` environment variables
4. Deploy — automatic on every push

### Backend → Render

1. Connect your GitHub repo
2. **Build command:** `pip install -r requirements.txt`
3. **Start command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add the `SUPABASE_*` and `CORS_ORIGINS` environment variables

See [`DEPLOY.md`](./DEPLOY.md) for a full step-by-step guide.

---

## API Overview

All endpoints require `Authorization: Bearer <jwt_token>`. Full interactive docs available at `/docs` when the backend is running.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/activities` | Log an activity |
| `GET` | `/api/activities` | List activities |
| `POST` | `/api/interruptions` | Log an interruption |
| `POST` | `/api/finances/transactions` | Create transaction |
| `GET` | `/api/finances/summary` | Monthly financial summary |
| `POST` | `/api/planner/tasks` | Create task |
| `GET` | `/api/planner/today` | Today's planner summary |
| `POST` | `/api/energy` | Log energy/mood/sleep |
| `POST` | `/api/reflections/daily` | Submit daily reflection |
| `GET` | `/api/cross-domain/time-money` | Time ↔ Money correlation |
| `GET` | `/api/cross-domain/energy-spending` | Energy ↔ Spending correlation |
| `GET` | `/api/export` | Export all data (CSV) |

---

## Security

- **Auth:** JWT tokens via Supabase Auth
- **RLS:** Row Level Security on all 14+ tables — users can only access their own data
- **Validation:** Pydantic schemas validate all inputs, reject unexpected fields
- **Rate limiting:** 100 reads/min, 30 writes/min per IP
- **Secrets:** All credentials in environment variables, never committed
- **CORS:** Restricted to configured origins
- **Password:** Minimum 8 characters enforced on signup

See [`SECURITY.md`](./SECURITY.md) for the full threat model.

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **Explainable analytics** over ML | Users see the math: `cost = duration × type_weight × context_weight`. Builds trust. |
| **UTC storage** everywhere | Prevents timezone bugs, handles DST automatically. Display converts to user timezone. |
| **Supabase RLS** | Data isolation at the database level — even a compromised backend can't leak cross-user data. |
| **Component-per-feature** | 24 dashboard components, each self-contained. Easy to test, replace, or extend. |
| **Cross-domain correlation** | The core differentiator. Connecting time + money + energy + focus reveals patterns single-domain apps miss. |

---

## Documentation

| File | Contents |
|------|----------|
| [`DEPLOY.md`](./DEPLOY.md) | Step-by-step deployment guide |
| [`SECURITY.md`](./SECURITY.md) | Security practices & threat model |
| [`DOCUMENTATION.md`](./DOCUMENTATION.md) | Full technical documentation |
| [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) | Database setup guide |

---

## License

MIT
