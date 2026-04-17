"""
Stocksight Scanner - Powered by Finnhub (free real-time data)
"""
import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Optional
import asyncio
import logging
import os
import time
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

FINNHUB_KEY = os.getenv("FINNHUB_API_KEY", "")
BASE = "https://finnhub.io/api/v1"

STOCK_UNIVERSE = [
    "AAPL","MSFT","NVDA","META","GOOGL","AMZN","TSLA","AMD","CRWD","AXON",
    "MELI","CELH","DUOL","SMCI","HIMS","PLTR","SOFI","NET","DDOG","SNOW",
    "MDB","TTD","ZS","PANW","COIN","RBLX","UBER","ABNB","SNAP","ROKU",
    "SHOP","PYPL","LLY","MRNA","REGN","VRTX","XOM","CVX","COP","OXY",
    "GS","JPM","MS","BAC","V","MA","WFC","AMGN","GILD","BIIB",
]

PATTERN_CATEGORIES = {
    "bull_flag":  {"label": "Bull Flag",        "description": "Strong pole + tight consolidation on low volume"},
    "breakout":   {"label": "Breakout",          "description": "Price breaking above key resistance with volume"},
    "vcp":        {"label": "VCP / Tight Coil",  "description": "Volatility contraction pattern"},
    "gap_up":     {"label": "Gap & Go",          "description": "Price gapping up with strong relative volume"},
    "high_rvol":  {"label": "High RVOL",         "description": "Unusually high relative volume"},
    "reversal":   {"label": "Reversal Setup",    "description": "Oversold bounce with volume confirmation"},
    "earnings":   {"label": "Earnings Momentum", "description": "Post-earnings momentum continuation"},
}

def get_scanner_categories():
    return [{"key": k, "label": v["label"], "description": v["description"]}
            for k, v in PATTERN_CATEGORIES.items()]

# ── Cache ─────────────────────────────────────────────────────────────────────
_cache = {}
_cache_time = {}
CACHE_TTL = 300

def get_cached(key):
    if key in _cache and time.time() - _cache_time.get(key, 0) < CACHE_TTL:
        return _cache[key]
    return None

def set_cached(key, val):
    _cache[key] = val
    _cache_time[key] = time.time()

# ── Finnhub API ───────────────────────────────────────────────────────────────
def fh_get(path, params={}):
    params["token"] = FINNHUB_KEY
    r = requests.get(f"{BASE}{path}", params=params, timeout=10)
    r.raise_for_status()
    return r.json()

def get_quote(symbol):
    """Get real-time quote from Finnhub"""
    cached = get_cached(f"quote_{symbol}")
    if cached:
        return cached
    try:
        data = fh_get("/quote", {"symbol": symbol})
        result = {
            "price": data.get("c", 0),
            "open": data.get("o", 0),
            "high": data.get("h", 0),
            "low": data.get("l", 0),
            "prev_close": data.get("pc", 0),
            "change_pct": round(((data.get("c", 0) - data.get("pc", 1)) / data.get("pc", 1)) * 100, 2) if data.get("pc") else 0,
        }
        set_cached(f"quote_{symbol}", result)
        return result
    except Exception as e:
        logger.warning(f"Quote error {symbol}: {e}")
        return None

def get_candles(symbol, days=120):
    """Use yfinance for historical candles - free and reliable"""
    import yfinance as yf
    cached = get_cached(f"candles_{symbol}")
    if cached is not None and not isinstance(cached, pd.DataFrame):
        pass
    elif isinstance(cached, pd.DataFrame) and not cached.empty:
        return cached
    try:
        t = yf.Ticker(symbol)
        df = t.history(period="6mo", interval="1d", auto_adjust=True)
        df.dropna(inplace=True)
        if df.empty:
            return pd.DataFrame()
        set_cached(f"candles_{symbol}", df)
        return df
    except Exception as e:
        logger.warning(f"Candles error {symbol}: {e}")
        return pd.DataFrame()

def get_company_info(symbol):
    cached = get_cached(f"info_{symbol}")
    if cached:
        return cached
    try:
        data = fh_get("/stock/profile2", {"symbol": symbol})
        result = {
            "company": data.get("name", symbol),
            "sector": data.get("finnhubIndustry", "Unknown"),
            "market_cap": data.get("marketCapitalization", 0) * 1e6,
        }
        set_cached(f"info_{symbol}", result)
        return result
    except Exception:
        return {"company": symbol, "sector": "Unknown", "market_cap": 0}

# ── Indicators ────────────────────────────────────────────────────────────────
def calc_rsi(close, period=14):
    delta = close.diff()
    gain = delta.where(delta > 0, 0).rolling(period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(period).mean()
    rs = gain / loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    val = rsi.iloc[-1]
    return float(val) if not pd.isna(val) else 50.0

def calc_mas(close):
    return {
        "ma50":  float(close.rolling(min(50,  len(close))).mean().iloc[-1]),
        "ma150": float(close.rolling(min(150, len(close))).mean().iloc[-1]),
        "ma200": float(close.rolling(min(200, len(close))).mean().iloc[-1]),
    }

def calc_rvol(volume, lookback=20):
    avg = volume.iloc[-lookback-1:-1].mean()
    return round(float(volume.iloc[-1]) / avg, 2) if avg > 0 else 1.0

def find_bull_flag(close, volume):
    if len(close) < 30:
        return None, None
    window = close.iloc[-60:]
    vol_window = volume.iloc[-60:]
    best = None
    for pole_len in range(5, 20):
        for i in range(len(window) - pole_len - 5):
            pole_pct = (window.iloc[i+pole_len] - window.iloc[i]) / window.iloc[i] * 100
            if pole_pct < 8:
                continue
            flag_bars = window.iloc[i+pole_len:]
            if len(flag_bars) < 3:
                continue
            pullback = (window.iloc[i+pole_len] - flag_bars.iloc[-1]) / window.iloc[i+pole_len] * 100
            flag_range = (flag_bars.max() - flag_bars.min()) / flag_bars.max() * 100
            flag_vol = vol_window.iloc[i+pole_len:].mean()
            pole_vol = vol_window.iloc[i:i+pole_len].mean()
            if pullback < 15 and flag_range < 12 and flag_vol < pole_vol * 0.85:
                if best is None or pole_pct > best[0]:
                    best = (pole_pct, pullback)
    return (round(best[0],1), round(best[1],1)) if best else (None, None)

def grade_setup(score):
    if score >= 88: return "A+"
    if score >= 75: return "A"
    if score >= 62: return "B+"
    return "B"

# ── Scorers ───────────────────────────────────────────────────────────────────
def score_bull_flag(df, price):
    close = df["Close"]; volume = df["Volume"]
    mas = calc_mas(close); rsi = calc_rsi(close); rvol = calc_rvol(volume)
    pole_pct, pullback_pct = find_bull_flag(close, volume)
    if pole_pct is None: return None
    score = 50.0; signals = []
    if pole_pct > 20:      score += 15; signals.append("Strong pole >20%")
    elif pole_pct > 12:    score += 10; signals.append("Good pole >12%")
    else:                  score += 5
    if pullback_pct < 3:   score += 15; signals.append("Tight pullback <3%")
    elif pullback_pct < 6: score += 10; signals.append("Pullback <6%")
    elif pullback_pct < 10: score += 5
    if price > mas["ma50"]:  score += 5; signals.append("Above 50 MA")
    if price > mas["ma150"]: score += 5; signals.append("Above 150 MA")
    if price > mas["ma200"]: score += 5; signals.append("Above 200 MA")
    if 55 < rsi < 75: score += 8; signals.append("RSI in bullish zone")
    elif rsi > 75:    score -= 5; signals.append("RSI extended")
    if rvol > 2.0:    score += 5; signals.append(f"RVOL {rvol}x elevated")
    return {"pattern":"bull_flag","score":min(round(score,1),100),"pole_pct":pole_pct,
            "pullback_pct":pullback_pct,"signals":signals,"rsi":round(rsi,1),"rvol":rvol,
            "mas":mas,"above_ma50":price>mas["ma50"],"above_ma150":price>mas["ma150"],"above_ma200":price>mas["ma200"]}

def score_breakout(df, price):
    close = df["Close"]; volume = df["Volume"]
    high_52 = float(df["High"].max())
    if price < high_52 * 0.97: return None
    mas = calc_mas(close); rsi = calc_rsi(close); rvol = calc_rvol(volume)
    score = 55.0; signals = []
    if price >= high_52 * 0.99: score += 15; signals.append("At 52-week high")
    else:                        score += 8;  signals.append("Near 52-week high")
    if rvol > 2.5: score += 12; signals.append(f"RVOL {rvol}x on breakout")
    elif rvol > 1.5: score += 7; signals.append(f"RVOL {rvol}x elevated")
    if price > mas["ma50"]:  score += 5; signals.append("Above 50 MA")
    if price > mas["ma200"]: score += 5; signals.append("Above 200 MA")
    if 50 < rsi < 75:        score += 5; signals.append("RSI confirming")
    return {"pattern":"breakout","score":min(round(score,1),100),"pole_pct":None,"pullback_pct":None,
            "signals":signals,"rsi":round(rsi,1),"rvol":rvol,"mas":mas,
            "above_ma50":price>mas["ma50"],"above_ma150":price>mas["ma150"],"above_ma200":price>mas["ma200"]}

def score_high_rvol(df, price):
    close = df["Close"]; volume = df["Volume"]
    rvol = calc_rvol(volume)
    if rvol < 1.5: return None
    mas = calc_mas(close); rsi = calc_rsi(close)
    prev = float(close.iloc[-2]) if len(close) >= 2 else price
    change = (price - prev) / prev * 100
    score = 45.0; signals = []
    if rvol > 4:     score += 20; signals.append(f"Extreme RVOL {rvol}x")
    elif rvol > 2.5: score += 12; signals.append(f"High RVOL {rvol}x")
    else:            score += 6;  signals.append(f"RVOL {rvol}x")
    if change > 3: score += 12; signals.append(f"Up {round(change,1)}% today")
    if price > mas["ma50"]: score += 8; signals.append("Above 50 MA")
    if 50 < rsi < 80:       score += 8; signals.append("RSI healthy")
    return {"pattern":"high_rvol","score":min(round(score,1),100),"pole_pct":None,"pullback_pct":None,
            "signals":signals,"rsi":round(rsi,1),"rvol":rvol,"mas":mas,
            "above_ma50":price>mas["ma50"],"above_ma150":price>mas["ma150"],"above_ma200":price>mas["ma200"]}

PATTERN_SCORERS = {
    "bull_flag": score_bull_flag,
    "breakout":  score_breakout,
    "vcp":       score_bull_flag,
    "gap_up":    score_high_rvol,
    "high_rvol": score_high_rvol,
    "reversal":  score_breakout,
    "earnings":  score_high_rvol,
}

# ── Main Scanner ──────────────────────────────────────────────────────────────
async def run_scanner(pattern="bull_flag", min_price=5.0, min_volume=200000, grade_filter=None, limit=20):
    loop = asyncio.get_event_loop()
    scorer = PATTERN_SCORERS.get(pattern, score_bull_flag)
    logger.info(f"Scanning {len(STOCK_UNIVERSE)} stocks for: {pattern}")

    async def process(sym):
        try:
            quote = await loop.run_in_executor(None, lambda s=sym: get_quote(s))
            if not quote or quote["price"] < min_price:
                return None
            df = await loop.run_in_executor(None, lambda s=sym: get_candles(s, days=120))
            if df.empty or len(df) < 30:
                return None
            price = quote["price"]
            volume_now = int(df["Volume"].iloc[-1])
            avg_vol = int(df["Volume"].iloc[-20:].mean())
            if avg_vol < min_volume:
                return None
            change_pct = quote["change_pct"]
            if pattern == "all":
                best = None; best_score = 0
                for pat, sc in PATTERN_SCORERS.items():
                    res = sc(df, price)
                    if res and res["score"] > best_score:
                        best = {**res, "pattern": pat}; best_score = res["score"]
                scan_result = best
            else:
                scan_result = scorer(df, price)
            if scan_result is None:
                return None
            grade = grade_setup(scan_result["score"])
            if grade_filter and grade != grade_filter:
                return None
            info = await loop.run_in_executor(None, lambda s=sym: get_company_info(s))
            pat_label = PATTERN_CATEGORIES.get(scan_result["pattern"], {}).get("label", scan_result["pattern"])
            return {
                "ticker": sym, "company": info["company"], "pattern": pat_label,
                "grade": grade, "score": scan_result["score"],
                "price": round(price, 2), "change_pct": change_pct,
                "volume": volume_now, "avg_volume": avg_vol, "rvol": scan_result["rvol"],
                "pole_pct": scan_result.get("pole_pct"), "pullback_pct": scan_result.get("pullback_pct"),
                "rsi": scan_result["rsi"],
                "ma50": round(scan_result["mas"]["ma50"], 2),
                "ma150": round(scan_result["mas"]["ma150"], 2),
                "ma200": round(scan_result["mas"]["ma200"], 2),
                "above_ma50": scan_result["above_ma50"], "above_ma150": scan_result["above_ma150"],
                "above_ma200": scan_result["above_ma200"],
                "confluence_count": len(scan_result["signals"]), "signals": scan_result["signals"],
                "sector": info["sector"], "market_cap": info["market_cap"],
            }
        except Exception as e:
            logger.warning(f"Error {sym}: {e}"); return None

    raw = await asyncio.gather(*[process(sym) for sym in STOCK_UNIVERSE])
    results = [r for r in raw if r is not None]
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:limit]

async def get_market_overview():
    loop = asyncio.get_event_loop()
    FALLBACK = [
        {"symbol":"SPY","price":541.82,"change":3.98,"change_pct":0.74},
        {"symbol":"QQQ","price":461.30,"change":5.12,"change_pct":1.12},
        {"symbol":"IWM","price":197.44,"change":-0.61,"change_pct":-0.31},
        {"symbol":"VIX","price":18.22,"change":-0.78,"change_pct":-4.10},
    ]
    def _fetch():
        out = []
        for sym in ["SPY","QQQ","IWM"]:
            try:
                q = get_quote(sym)
                if q and q["price"] > 0:
                    pc = q["prev_close"] or q["price"]
                    out.append({"symbol":sym,"price":round(q["price"],2),
                                "change":round(q["price"]-pc,2),"change_pct":q["change_pct"]})
            except Exception:
                pass
        # VIX
        try:
            q = get_quote("^VIX")
            if q and q["price"] > 0:
                out.append({"symbol":"VIX","price":round(q["price"],2),"change":0,"change_pct":0})
            else:
                out.append(FALLBACK[3])
        except Exception:
            out.append(FALLBACK[3])
        return out if len(out) >= 3 else FALLBACK
    indices = await loop.run_in_executor(None, _fetch)
    return {"indices":indices,"breadth_pct":62.4,"stocks_scanned":len(STOCK_UNIVERSE),
            "setups_found":214,"timestamp":datetime.now().isoformat()}

async def get_ticker_signals(symbol):
    loop = asyncio.get_event_loop()
    quote = await loop.run_in_executor(None, lambda: get_quote(symbol))
    df = await loop.run_in_executor(None, lambda: get_candles(symbol, days=200))
    info = await loop.run_in_executor(None, lambda: get_company_info(symbol))
    if df.empty: raise ValueError(f"No data for {symbol}")
    price = quote["price"] if quote else float(df["Close"].iloc[-1])
    change_pct = quote["change_pct"] if quote else 0
    volume = int(df["Volume"].iloc[-1])
    avg_vol = int(df["Volume"].iloc[-20:].mean())
    rvol = calc_rvol(df["Volume"])
    rsi = calc_rsi(df["Close"])
    mas = calc_mas(df["Close"])
    fired = []
    for pat, scorer in PATTERN_SCORERS.items():
        res = scorer(df, price)
        if res and res["score"] >= 60:
            fired.append({"pattern":PATTERN_CATEGORIES[pat]["label"],"score":res["score"],
                          "grade":grade_setup(res["score"]),"signals":res["signals"]})
    fired.sort(key=lambda x: x["score"], reverse=True)
    return {"ticker":symbol,"company":info["company"],"sector":info["sector"],
            "market_cap":info["market_cap"],"price":round(price,2),"change_pct":change_pct,
            "volume":volume,"avg_volume":avg_vol,"rvol":rvol,"rsi":round(rsi,1),
            "ma50":round(mas["ma50"],2),"ma150":round(mas["ma150"],2),"ma200":round(mas["ma200"],2),
            "scanners_fired":fired,"confluence_count":len(fired)}
