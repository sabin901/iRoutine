# iRoutine — Deploy Checklist

Everything in this repo is ready to deploy. Follow the steps below **in order**. Items marked **Your step** are things only you can do (accounts, secrets, deploy triggers).

---

## What you need to do (in order)

### Step 1: Supabase (database + auth)

1. **Create a Supabase project**
   - Go to [supabase.com/dashboard](https://supabase.com/dashboard) → New project.
   - Pick region, set a DB password, create.

2. **Run the schema**
   - In the project: **SQL Editor** → New query.
   - Paste the **entire** contents of `backend/supabase/complete_schema.sql`.
   - Run it. (Safe to run more than once.)

3. **Get your keys**
   - **Project Settings** → **API**: copy **Project URL** and **anon (public) key**.
   - Same page: copy **service_role** key (keep this secret; backend only).

4. **Configure Auth for production**
   - **Authentication** → **URL Configuration**:
     - **Site URL**: your production frontend URL (e.g. `https://iroutine.vercel.app`).
     - **Redirect URLs**: add the same URL and `https://iroutine.vercel.app/**` (or your real domain).

---

### Step 2: Backend (FastAPI) — e.g. Render

1. **Create a new Web Service** (Render, Fly.io, or similar).
2. **Connect** your GitHub repo; choose the repo and branch.
3. **Build**
   - Build command: `pip install -r requirements.txt` (or leave default if it runs from repo root and finds `backend/`).
   - If the app lives in `backend/`: set **Root Directory** to `backend` and build command `pip install -r requirements.txt`.
4. **Start**
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`  
   - Render provides `PORT`; on Fly.io use `PORT=8080` or their default.
5. **Environment variables** (set in the host’s dashboard, not in repo):

   | Variable | Value |
   |----------|--------|
   | `SUPABASE_URL` | Your Supabase Project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service_role key |
   | `SUPABASE_ANON_KEY` | Your Supabase anon key |
   | `CORS_ORIGINS` | Your frontend URL, e.g. `https://iroutine.vercel.app` |

6. **Deploy** and note the backend URL (e.g. `https://your-app.onrender.com`).

7. **Check**  
   Open `https://your-backend-url/health` → should return `{"status":"ok"}`.

---

### Step 3: Frontend (Next.js) — e.g. Vercel

1. **Create a new project** (Vercel: Import Git Repository → select your GitHub repo).
2. **Root directory**  
   The repo has a root `vercel.json` that runs the build from the `frontend` folder. You can either:
   - **Option A:** Leave Root Directory empty (default); the root `vercel.json` handles the monorepo.
   - **Option B:** Set Root Directory to `frontend` (Project Settings → General → Root Directory).
3. **Build**
   - Build command: `npm run build` (default).
   - Output: Next.js default (no change).
4. **Environment variables** (in Vercel project settings):

   | Variable | Value |
   |----------|--------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
   | `NEXT_PUBLIC_API_URL` | Your **backend** URL (e.g. `https://your-app.onrender.com`) |

5. **Deploy**.  
   After deploy, set **Supabase Auth** Site URL and Redirect URLs (Step 1.4) to this frontend URL if you didn’t already.

6. **Check**
   - Open the frontend URL → should redirect to login if not logged in.
   - Sign up → sign in → dashboard loads; log an activity and an interruption.

---

## Quick reference

| Concern | Where |
|--------|--------|
| API base URL | Frontend: `NEXT_PUBLIC_API_URL` (must be backend URL) |
| CORS | Backend: `CORS_ORIGINS` = frontend origin (e.g. `https://iroutine.vercel.app`) |
| Auth | Supabase; RLS on all user tables |
| Demo mode | If Supabase env is missing/placeholder, app uses localStorage; for production always set real Supabase env. |

---

## Optional: local .env for development

- **Frontend**: copy `frontend/.env.example` → `frontend/.env.local` and fill in the same three variables (use `http://localhost:8000` for `NEXT_PUBLIC_API_URL` when running backend locally).
- **Backend**: copy `backend/.env.example` → `backend/.env` and fill in Supabase vars; set `CORS_ORIGINS=http://localhost:3000`.

---

## Post-deploy checks

- [ ] Backend `/health` returns `{"status":"ok"}`.
- [ ] Frontend loads and redirects to login when not authenticated.
- [ ] Sign up and sign in work (Supabase Auth).
- [ ] Dashboard loads; logging an activity and an interruption works (Supabase DB + optional backend).
- [ ] Energy log and Daily reflection save (backend API).

For full architecture and API details, see `README.md` and `DOCUMENTATION.md`.
