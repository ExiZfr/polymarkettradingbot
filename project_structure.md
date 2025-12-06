# Polymarket TWA - Project Structure

## Overview
This project uses a monorepo-like structure or a clean separation between the Next.js Frontend and the Python Backend (for workers).

### Root Directory
```
/
├── frontend/                 # Next.js 14 Application
│   ├── app/                  # App Router
│   │   ├── layout.tsx        # Root Layout (Providers, Global Styles)
│   │   ├── page.tsx          # Landing / Auth Check
│   │   ├── dashboard/        # Protected Dashboard Routes
│   │   │   ├── page.tsx      # Main Dashboard (Metrics, Console)
│   │   │   ├── radar/        # Radar Module
│   │   │   │   └── page.tsx
│   │   │   ├── copy-trading/ # Copy Trading Module
│   │   │   │   └── page.tsx
│   │   │   └── settings/     # Settings
│   │   │       └── page.tsx
│   │   └── api/              # Next.js API Routes (Proxy to Backend)
│   ├── components/
│   │   ├── ui/               # Shadcn UI Components (Button, Card, Dialog...)
│   │   ├── layout/           # Sidebar, Header, MobileNav
│   │   ├── dashboard/        # Dashboard specific widgets (MetricsCard, ConsoleLog)
│   │   ├── radar/            # Radar components
│   │   │   ├── RadarFilters.tsx
│   │   │   ├── FlipCard.tsx
│   │   │   └── MarketList.tsx
│   │   └── copy-trading/     # Copy Trading components
│   │       ├── CopyConfigModal.tsx
│   │       ├── Leaderboard.tsx
│   │       └── WalletProfiler.tsx
│   ├── lib/
│   │   ├── utils.ts          # cn() helper, formatters
│   │   ├── supabase.ts       # Supabase client
│   │   └── telegram.ts       # Telegram WebApp helpers
│   ├── hooks/                # Custom hooks (useAuth, useWebSocket)
│   ├── types/                # TypeScript interfaces
│   └── public/               # Static assets
│
├── backend/                  # Python FastAPI (Workers & API)
│   ├── app/
│   │   ├── main.py           # FastAPI Entrypoint
│   │   ├── models/           # SQLModel/SQLAlchemy models
│   │   ├── routers/          # API Endpoints
│   │   ├── services/
│   │   │   ├── listener.py   # Polymarket/News Listener
│   │   │   ├── sniper.py     # Execution Logic
│   │   │   └── oracle.py     # Prediction Logic
│   │   └── core/             # Config, Database connection
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml        # Orchestration (Frontend, Backend, DB)
└── README.md
```

## Key Technologies
- **Frontend**: Next.js 14, Tailwind CSS, Shadcn/UI, Framer Motion, Lucide React.
- **Backend**: FastAPI, SQLAlchemy, AsyncPG.
- **Database**: PostgreSQL (Supabase/Neon compatible).
- **Infrastructure**: Docker.
