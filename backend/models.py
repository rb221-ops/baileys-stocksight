from pydantic import BaseModel
from typing import Optional, List

class MarketIndex(BaseModel):
    symbol: str
    price: float
    change: float
    change_pct: float

class MarketOverview(BaseModel):
    indices: List[MarketIndex]
    breadth_pct: float
    stocks_scanned: int
    setups_found: int
    timestamp: str

class ScanResult(BaseModel):
    ticker: str
    company: str
    pattern: str
    grade: str
    score: float
    price: float
    change_pct: float
    volume: int
    avg_volume: int
    rvol: float
    pole_pct: Optional[float] = None
    pullback_pct: Optional[float] = None
    rsi: float
    ma50: float
    ma150: float
    ma200: float
    above_ma50: bool
    above_ma150: bool
    above_ma200: bool
    confluence_count: int
    signals: List[str]
    sector: str
    market_cap: float
