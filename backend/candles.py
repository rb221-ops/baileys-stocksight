"""
Add this to main.py — candles endpoint for the chart component
"""
import yfinance as yf
import pandas as pd
from fastapi import APIRouter

router = APIRouter()

def compute_ma(close, period):
    ma = close.rolling(period).mean()
    return ma

@router.get("/api/candles/{symbol}")
async def candles(symbol: str):
    """Return OHLCV + MA data formatted for lightweight-charts"""
    import asyncio
    loop = asyncio.get_event_loop()

    def _fetch():
        t = yf.Ticker(symbol.upper())
        df = t.history(period="6mo", interval="1d", auto_adjust=True)
        df.dropna(inplace=True)
        if df.empty:
            return None

        close = df["Close"]
        candles = []
        volume = []

        for ts, row in df.iterrows():
            # Convert timestamp to unix int
            time_val = int(ts.timestamp())
            candles.append({
                "time": time_val,
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
            })
            volume.append({
                "time": time_val,
                "value": int(row["Volume"]),
                "color": "rgba(34,197,94,0.3)" if row["Close"] >= row["Open"] else "rgba(239,68,68,0.3)"
            })

        # MA50
        ma50_series = compute_ma(close, 50)
        ma50 = [
            {"time": int(ts.timestamp()), "value": round(float(v), 2)}
            for ts, v in ma50_series.dropna().items()
        ]

        # MA200
        ma200_series = compute_ma(close, min(200, len(close)))
        ma200 = [
            {"time": int(ts.timestamp()), "value": round(float(v), 2)}
            for ts, v in ma200_series.dropna().items()
        ]

        return {"candles": candles, "volume": volume, "ma50": ma50, "ma200": ma200}

    result = await loop.run_in_executor(None, _fetch)
    if result is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"No data for {symbol}")
    return result
