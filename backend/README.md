# Routine Backend

FastAPI backend for Routine application.

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. Run development server:
   ```bash
   uvicorn main:app --reload
   ```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/
│   ├── core/         # Configuration, database, auth
│   ├── routers/      # API route handlers
│   └── services/     # Business logic
├── supabase/         # Database schema
└── main.py          # FastAPI application
```
