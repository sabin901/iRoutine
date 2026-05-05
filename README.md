# iRoutine

A personal wellness analytics dashboard that connects daily activity, planning, interruptions, energy, spending, and reflection into one feedback loop.

Live demo: [i-routine.vercel.app](https://i-routine.vercel.app)

## Why it exists

Most productivity tools track tasks. iRoutine tracks the day around the tasks: focus blocks, energy dips, interruptions, spending drift, habits, goals, and reflection. The result is a practical dashboard that helps a user understand what happened today and what to adjust tomorrow.

## Product Scope

- Public homepage, signup, login, and demo workspace
- Dashboard with sample data seeding for a full realistic day
- Today timeline, activity logging, interruption logging, energy tracking, and daily reflection
- Finances with transactions, budgets, savings goals, and weekly export
- Planner with tasks, habits, goals, and daily plans
- Insights with pattern review, recommendations, cross-domain analytics, and founder analytics
- Settings with profile, data export, weekly digest, calendar import, beta feedback, and tester tracking
- FastAPI backend with routers for auth-isolated user data
- Playwright coverage for major user flows
- Backend test coverage currently above the 60% target

## Tech Stack

| Layer | Tools |
| --- | --- |
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, Recharts |
| Backend | FastAPI, Pydantic, Supabase Python client |
| Database/Auth | Supabase Postgres, Supabase Auth, Row Level Security |
| Testing | Jest, Playwright, Pytest, pytest-cov |
| Deployment | Vercel frontend, Render-compatible backend |

## Quick Start

### Requirements

- Node.js 18.17+
- Python 3.11+
- Supabase project for production data

### Install

```bash
npm install --prefix frontend
pip install -r backend/requirements.txt
```

### Run locally

Terminal 1:

```bash
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Terminal 2:

```bash
cd frontend
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

The app can run in demo mode without Supabase credentials. Demo mode seeds browser-local sample data so every dashboard section is populated.

## Environment

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# Or use Supabase's newer publishable key name:
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Create `backend/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
CORS_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
```

Run `backend/database/complete_schema.sql` in the Supabase SQL editor before using real accounts.

## Test Commands

```bash
cd frontend
npm run lint
npm run test
npm run build
npm run test:e2e
```

```bash
cd backend
python -m pytest
```

## Deployment

### Pre-deploy checklist

1. Run `npm run lint`, `npm run test`, `npm run build`, and `npm run test:e2e` in `frontend/`.
2. Run `python -m pytest` in `backend/`.
3. Apply `backend/database/complete_schema.sql` in Supabase if you use production auth.
4. Point `NEXT_PUBLIC_API_URL` at your deployed API URL (not `localhost`).

### Frontend (Vercel)

- Create a Vercel project from this repo and keep the **repository root** as the project root (the root `vercel.json` runs install/build inside `frontend/`).
- Alternatively, set Vercel **Root Directory** to `frontend` and use default Next.js build settings; then you can ignore the root `vercel.json` or remove it for that project.
- Add environment variables from `frontend/.env.example` (production values for Supabase and `NEXT_PUBLIC_API_URL`).

### Backend (Render or similar)

- Deploy the `backend/` folder (see root `render.yaml` as a template).
- Build command: `pip install -r requirements.txt`
- Start command: `python -m uvicorn main:app --host 0.0.0.0 --port $PORT`
- Set Supabase keys and production `CORS_ORIGINS` (comma-separated frontend origins, e.g. `https://your-app.vercel.app`).

## License

MIT
