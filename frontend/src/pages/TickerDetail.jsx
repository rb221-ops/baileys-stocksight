import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchTicker } from '../utils/api'

const GRADE_COLORS = {
  'A+': 'var(--green)', 'A': 'var(--blue)', 'B+': 'var(--accent2)', 'B': 'var(--muted2)'
}

const card = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '1rem 1.25rem',
}

function StatRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontFamily: "'DM Mono', monospace", color: color || 'var(--text)' }}>{value}</span>
    </div>
  )
}

export default function TickerDetail() {
  const { symbol } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetchTicker(symbol)
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError('Could not load data for ' + symbol); setLoading(false) })
  }, [symbol])

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
      Loading {symbol}…
    </div>
  )

  if (error) return (
    <div style={{ padding: 40 }}>
      <div style={{ color: 'var(--red)', marginBottom: 12 }}>{error}</div>
      <button onClick={() => navigate(-1)} style={{ color: 'var(--accent2)', background: 'none', border: 'none', cursor: 'pointer' }}>← Back</button>
    </div>
  )

  const up = data.change_pct >= 0

  return (
    <div className="fade-in">
      <button onClick={() => navigate(-1)} style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16, fontSize: 13 }}>
        ← Back
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 32, fontWeight: 500, color: 'var(--accent2)' }}>
            {symbol}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>{data.company}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{data.sector}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, fontWeight: 500 }}>
            ${data.price?.toLocaleString()}
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: up ? 'var(--green)' : 'var(--red)', marginTop: 4 }}>
            {up ? '+' : ''}{data.change_pct?.toFixed(2)}% today
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Key stats */}
        <div style={card}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 12 }}>
            Key Metrics
          </div>
          <StatRow label="Volume" value={data.volume >= 1e6 ? (data.volume/1e6).toFixed(1)+'M' : (data.volume/1e3).toFixed(0)+'K'} />
          <StatRow label="Avg Volume" value={data.avg_volume >= 1e6 ? (data.avg_volume/1e6).toFixed(1)+'M' : (data.avg_volume/1e3).toFixed(0)+'K'} />
          <StatRow label="RVOL" value={data.rvol?.toFixed(2)+'x'} color={data.rvol >= 2 ? 'var(--green)' : undefined} />
          <StatRow label="RSI (14)" value={data.rsi?.toFixed(1)} color={data.rsi > 70 ? 'var(--red)' : data.rsi < 40 ? 'var(--blue)' : undefined} />
          <StatRow label="Market Cap" value={data.market_cap >= 1e9 ? '$'+(data.market_cap/1e9).toFixed(1)+'B' : '$'+(data.market_cap/1e6).toFixed(0)+'M'} />
        </div>

        {/* Moving averages */}
        <div style={card}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 12 }}>
            Moving Averages
          </div>
          <StatRow label="Price" value={`$${data.price?.toFixed(2)}`} />
          <StatRow label="50 MA" value={`$${data.ma50?.toFixed(2)}`} color={data.price > data.ma50 ? 'var(--green)' : 'var(--red)'} />
          <StatRow label="150 MA" value={`$${data.ma150?.toFixed(2)}`} color={data.price > data.ma150 ? 'var(--green)' : 'var(--red)'} />
          <StatRow label="200 MA" value={`$${data.ma200?.toFixed(2)}`} color={data.price > data.ma200 ? 'var(--green)' : 'var(--red)'} />
        </div>

        {/* Scanners fired */}
        <div style={{ ...card, gridColumn: 'span 2' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 12 }}>
            Scanners Fired — {data.confluence_count} patterns detected
          </div>
          {data.scanners_fired?.length === 0 && (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>No strong patterns detected for this ticker.</div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {data.scanners_fired?.map(s => (
              <div key={s.pattern} style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{s.pattern}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: GRADE_COLORS[s.grade] }}>
                    {s.grade} · {s.score}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {s.signals?.map(sig => (
                    <span key={sig} style={{
                      fontSize: 10, padding: '2px 8px',
                      background: 'var(--surface)',
                      borderRadius: 10,
                      color: 'var(--muted2)',
                      border: '1px solid var(--border)',
                    }}>{sig}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
