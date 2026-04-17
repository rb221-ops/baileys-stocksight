import React, { useEffect, useState } from 'react'
import { fetchTop10 } from '../utils/api'
import StockTable from '../components/StockTable'

export default function Top10() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTop10()
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 4 }}>
          Top 10 Picks
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>
          Highest conviction setups across all scanner categories · Ranked by composite score
        </p>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: 14 }}>{data?.label || 'Top 10 Highest Conviction'}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              When 4+ scanners fire on the same stock, something real is happening.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'pulse-dot 2s infinite' }} />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Live</span>
          </div>
        </div>
        <StockTable results={data?.results} loading={loading} />
      </div>

      <div style={{ marginTop: '1rem', padding: '12px 16px', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 8, fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--accent2)' }}>How this works:</strong> Stocksight runs 48 scanners daily across 5,000+ stocks.
        Setups that trigger 4 or more scanners simultaneously are surfaced here as the highest-conviction opportunities.
        These are pattern detections — always do your own analysis before trading.
      </div>
    </div>
  )
}
