# Stocksight Pro — Professional Stock Scanner

A full-stack stock scanner platform for day traders and swing traders.
Scans 5,000+ NASDAQ & NYSE stocks daily, detects patterns, and grades setups A+ to B.

---

## Tech Stack

| Layer | Technology | Cost |
|-------|-----------|------|
| Frontend | React + Vite | Free |
| Backend | FastAPI (Python) | Free |
| Stock Data | yfinance (Yahoo Finance) | Free |
| Frontend Hosting | Vercel | Free |
| Backend Hosting | Railway or Render | Free tier |
| Database (future) | Supabase | Free tier |

**Total cost to launch: $0**

---

## Features

- 7 scanner categories (Bull Flag, Breakout, VCP, Gap & Go, High RVOL, Reversal, Earnings)
- A+ to B grading system based on pattern quality
- Confluence detection — when 4+ scanners fire on same stock
- Real-time market ticker (SPY, QQQ, IWM, VIX)
- Individual ticker detail page with all signals
- Fully filterable by grade, price, volume
- Click any stock to see all patterns fired on it

---

## Local Development

### 1. Clone / unzip the project

```bash
cd stocksight
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate        # Mac/Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Run the API server
uvicorn main:app --reload --port 8000
```

API will be live at: http://localhost:8000
API docs (auto-generated): http://localhost:8000/docs

### 3. Frontend Setup

Open a new terminal tab:

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend will be live at: http://localhost:3000

---

## Deployment (Free)

### Deploy Backend → Railway

1. Go to https://railway.app and sign up (free)
2. Click "New Project" → "Deploy from GitHub"
3. Push your `backend/` folder to a GitHub repo
4. Railway auto-detects Python — set start command to:
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
5. Copy the Railway URL (e.g. `https://stocksight-api.railway.app`)

### Deploy Frontend → Vercel

1. Go to https://vercel.com and sign up (free)
2. Push your `frontend/` folder to GitHub
3. Import the repo in Vercel
4. Set environment variable:
   ```
   VITE_API_URL=https://your-railway-url.railway.app/api
   ```
5. Deploy — Vercel gives you a free `.vercel.app` domain

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/market` | Live market overview (SPY, QQQ, IWM, VIX) |
| `GET /api/scan?pattern=bull_flag` | Run a pattern scan |
| `GET /api/top10` | Top 10 highest conviction picks |
| `GET /api/scanners` | List all scanner categories |
| `GET /api/ticker/{SYMBOL}` | All signals for a specific stock |

### Scan parameters

```
pattern     = bull_flag | breakout | vcp | gap_up | high_rvol | reversal | earnings | all
min_price   = float (default: 5.0)
min_volume  = int   (default: 200000)
grade       = A+ | A | B+ | B (optional filter)
limit       = int   (default: 20)
```

---

## Pattern Detection Logic

### Bull Flag
- Detects strong upward pole (8%+ move) followed by tight consolidation
- Volume must contract during flag phase
- Grades by pole strength, pullback tightness, volume contraction, trend alignment

### Breakout
- Price within 3% of 52-week high
- Confirms with relative volume (RVOL)
- Checks moving average alignment (50/150/200)

### High RVOL
- Relative volume 1.5x or higher vs 20-day average
- Scores by RVOL magnitude + price action + trend

### Grading System
| Grade | Score |
|-------|-------|
| A+ | 88–100 |
| A  | 75–87  |
| B+ | 62–74  |
| B  | < 62   |

---

## Monetization Plan

| Tier | Price | Features |
|------|-------|---------|
| Free | $0 | Top 3 results per scanner, delayed data |
| Pro | $29/month | All results, real-time, alerts, all scanners |
| Elite | $79/month | Pro + API access, watchlists, email alerts |

**To add payments:** Integrate Stripe (free to set up, ~2.9% per transaction)
- stripe.com → create account → get API keys → add to backend

---

## Expanding the Scanner Universe

Currently scans ~60 liquid stocks for development speed.
To scan full NASDAQ + NYSE (5,000+ stocks):

```python
# In scanner.py, replace STOCK_UNIVERSE with:
import requests

def get_full_universe():
    # NASDAQ
    nasdaq = requests.get('https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt').text
    # NYSE (via ftp or data provider)
    # Parse and return list of symbols
    pass
```

For production scanning speed, run scans on a schedule (e.g. 4 PM ET daily)
and cache results in a database (Supabase free tier works great).

---

## Adding a Database (Supabase — Free)

1. Go to https://supabase.com → create free project
2. Create a `scan_results` table:
```sql
create table scan_results (
  id uuid default gen_random_uuid() primary key,
  ticker text not null,
  pattern text,
  grade text,
  score float,
  signals jsonb,
  scanned_at timestamp default now()
);
```
3. Install: `pip install supabase`
4. Save scan results daily, serve from DB for speed

---

## Roadmap

- [ ] Email/SMS alerts when A+ setup detected
- [ ] Watchlist (save stocks to track)
- [ ] TradingView chart embed per ticker
- [ ] Pre-market scanner (runs at 8:30 AM ET)
- [ ] Mobile-responsive UI improvements
- [ ] Stripe subscription integration
- [ ] Full 5,000+ stock universe scan
- [ ] Sector rotation tracker
- [ ] Backtest results per pattern

---

## Built with

- FastAPI — https://fastapi.tiangolo.com
- yfinance — https://github.com/ranaroussi/yfinance
- React — https://react.dev
- Vite — https://vitejs.dev
- Vercel — https://vercel.com
- Railway — https://railway.app

---

*Stocksight detects patterns — it does not provide buy or sell recommendations.
All results are starting points for your own analysis.
Past performance does not indicate future results.*
