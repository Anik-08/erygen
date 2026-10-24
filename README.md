# Energy Gen

This app lets you check how accurate UK wind forecasts were. It pulls data from the Elexon BMRS API, matches forecasted wind generation with actual wind output for the same time periods, and shows error metrics on a simple dashboard.

## What's in this repo

```
erygen/
├── backend/        # FastAPI backend (Python)
├── frontend/       # Next.js dashboard (TypeScript + Tailwind + Recharts)
├── docker-compose.yml
└── README.md
```

### Backend structure
```
backend/
├── app/
│   ├── api/        # Routes (endpoints)
│   ├── services/   # Elexon API calls + comparison logic
│   ├── schemas/    # Pydantic schemas
│   ├── config.py   # Settings & env
│   └── main.py     # FastAPI app entry
├── .env            # Backend env vars
├── requirements.txt
└── Dockerfile
```

### Frontend structure
```
frontend/
├── app/
│   ├── components/ # UI components (WindDashboard)
│   ├── lib/        # API calls
│   ├── globals.css
│   └── page.tsx    # Entry page
├── public/
├── .env.local      # Frontend env vars
├── next.config.ts
├── package.json
└── Dockerfile
```

## Environment variables

### Backend (`backend/.env`)
| Variable | Default | Notes |
| --- | --- | --- |
| `FRONTEND_ORIGINS` | `http://localhost:3000` | Comma-separated list of allowed frontend origins for CORS |
| `REQUEST_TIMEOUT` | `60` | Timeout in seconds for requests to Elexon API |

### Frontend (`frontend/.env.local`)
| Variable | Default | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://127.0.0.1:8000` | Base URL of the backend API |

## How to run it

### Option 1: Docker (recommended)
From the project root:

```bash
docker-compose up --build
```

Once it's up:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs

### Option 2: Run locally

**Start the backend**
```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Start the frontend** (in a new terminal)
```bash
cd frontend
npm install
npm run dev
```

Then go to http://localhost:3000

## Live demo
- Frontend (Vercel): [https://energy-gen.vercel.app](https://energy-gen.vercel.app)
- Backend (Heroku): [https://energy-gen-api.herokuapp.com](https://energy-gen-api.herokuapp.com)

## About
Just pick a start/end date and a forecast publish time on the dashboard. It'll show actual vs forecasted wind generation, plus MAE, RMSE, bias and how many time slots matched up.
