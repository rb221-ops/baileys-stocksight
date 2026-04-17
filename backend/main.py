from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from scanner import run_scanner, get_scanner_categories, get_market_overview
from models import ScanResult, MarketOverview
from auth import router as auth_router
from typing import Optional
import asyncio
import yfinance as yf
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Baileys Stocksight Pro API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

@app.get("/")
def root():
    return {"status": "Baileys Stocksight Pro API running", "version": "1.0.0"}

@app.get("/api/market")
async def market_overview():
    try:
        data = await get_market_overview()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scan")
async def scan(
    pattern: str = Query("bull_flag"),
    min_price: float = Query(5.0),
    min_volume: int = Query(200000),
    grade: Optional[str] = Query(None),
    limit: int = Query(20)
):
    try:
        results = await run_scanner(pattern=pattern, min_price=min_price,
                                    min_volume=min_volume, grade_filter=grade, limit=limit)
        return {"pattern": pattern, "count": len(results), "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scanners")
async def scanners():
    return get_scanner_categories()

@app.get("/api/top10")
async def top10():
    try:
        results = await run_scanner(pattern="all", limit=10)
        return {"count": len(results), "results": results, "label": "Top 10 Highest Conviction"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ticker/{symbol}")
async def ticker_detail(symbol: str):
    from scanner import get_ticker_signals
    try:
        data = await get_ticker_signals(symbol.upper())
        return data
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Could not load data for {symbol}")

@app.get("/api/candles/{symbol}")
async def candles(symbol: str, resolution: str = Query("D")):
    loop = asyncio.get_event_loop()
    def _fetch():
        import time as t
        from scanner import get_candles
        # Map resolution to period
        period_map = {"1": "5d", "5": "1mo", "15": "1mo", "60": "3mo", "D": "6mo", "W": "2y", "M": "5y"}
        period = period_map.get(resolution, "6mo")
        interval_map = {"1": "1m", "5": "5m", "15": "15m", "60": "1h", "D": "1d", "W": "1wk", "M": "1mo"}
        interval = interval_map.get(resolution, "1d")
        try:
            import yfinance as yf
            ticker = yf.Ticker(symbol.upper())
            df = ticker.history(period=period, interval=interval, auto_adjust=True)
            df.dropna(inplace=True)
            if df.empty:
                return None
            candle_list, vol_list = [], []
            for ts, row in df.iterrows():
                time_val = int(ts.timestamp())
                candle_list.append({"time": time_val, "open": round(float(row["Open"]),2),
                                    "high": round(float(row["High"]),2), "low": round(float(row["Low"]),2),
                                    "close": round(float(row["Close"]),2)})
                vol_list.append({"time": time_val, "value": int(row["Volume"]),
                                 "color": "rgba(34,197,94,0.3)" if row["Close"] >= row["Open"] else "rgba(239,68,68,0.3)"})
            close = df["Close"]
            ma50 = close.rolling(min(50,len(close))).mean()
            ma50_list = [{"time": int(ts.timestamp()), "value": round(float(v),2)} for ts,v in ma50.dropna().items()]
            ma200 = close.rolling(min(200,len(close))).mean()
            ma200_list = [{"time": int(ts.timestamp()), "value": round(float(v),2)} for ts,v in ma200.dropna().items()]
            return {"candles": candle_list, "volume": vol_list, "ma50": ma50_list, "ma200": ma200_list}
        except Exception as e:
            return None
    result = await loop.run_in_executor(None, _fetch)
    if result is None:
        raise HTTPException(status_code=404, detail=f"No candle data for {symbol}")
    return result

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
