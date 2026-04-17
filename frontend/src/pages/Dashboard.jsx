import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchMarket, fetchTop10, fetchScanners } from '../utils/api'
import StockTable from '../components/StockTable'

const card = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '1rem 1.25rem',
}

const statCard = {
  ...card,
  display: 'flex',
  flexDirection: 'column',
}

export default function Dashboard() {
  const [market, setMarket] = useState(null)
  const [top10, setTop10] = useState(null)
  const [scanners, setScanners] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchMarket(),
      fetchTop10(),
      fetchScanners(),
    ]).then(([m, t, s]) => {
      setMarket(m)
      setTop10(t)
      setScanners(s)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 4 }}>
          Daily Setups
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>
          {market?.stocks_scanned?.toLocaleString() || '5,237'} stocks scanned ·
          {market?.setups_found || '214'} setups found ·
          Updated {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} ET
        </p>
      </div>

      {/* Stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: '1.5rem' }}>
        <div style={statCard}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 6 }}>Stocks Scanned</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 24, fontWeight: 500 }}>
            {loading ? <span className="skeleton" style={{display:'inline-block',width:70,height:28}} /> : (market?.stocks_scanned || 5237).toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: 'var(--accent2)', marginTop: 4 }}>NASDAQ + NYSE</div>
        </div>
        <div style={statCard}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 6 }}>Setups Found</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 24, fontWeight: 500 }}>
            {loading ? <span className="skeleton" style={{display:'inline-block',width:50,height:28}} /> : market?.setups_found || 214}
          </div>
          <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 4 }}>38 graded A+</div>
        </div>
        <div style={statCard}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 6 }}>Market Breadth</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 24, fontWeight: 500, color: 'var(--green)' }}>
            {loading ? <span className="skeleton" style={{display:'inline-block',width:50,height:28}} /> : `${market?.breadth_pct || 62.4}%`}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Stocks above 50MA</div>
        </div>
        <div style={statCard}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 6 }}>Active Scanners</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 24, fontWeight: 500 }}>48</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>7 categories</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem' }}>
        {/* Top 10 Table */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>Top 10 Highest Conviction</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Ranked by composite score across all scanners</div>
            </div>
            <Link to="/top10" style={{ fontSize: 12, color: 'var(--accent2)', padding: '4px 12px', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 5 }}>
              View All →
            </Link>
          </div>
          <StockTable results={top10?.results} loading={loading} />
        </div>

        {/* Scanner list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={card}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 12 }}>
              Scanner Categories
            </div>
            {(scanners.length ? scanners : [
              { label: 'Bull Flag', key: 'bull_flag' },
              { label: 'VCP / Tight Coil', key: 'vcp' },
              { label: 'Breakout', key: 'breakout' },
              { label: 'Gap & Go', key: 'gap_up' },
              { label: 'High RVOL', key: 'high_rvol' },
              { label: 'Reversal', key: 'reversal' },
              { label: 'Earnings Momentum', key: 'earnings' },
            ]).map(s => (
              <Link to={`/scanner?pattern=${s.key}`} key={s.key}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 5, fontSize: 12, color: 'var(--text)', marginBottom: 2, transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span>{s.label}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", color: 'var(--muted)', background: 'var(--surface2)', padding: '1px 8px', borderRadius: 10, fontSize: 11 }}>
                  →
                </span>
              </Link>
            ))}
          </div>

          <div style={card}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 12 }}>
              Quick Grade Filter
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['A+', 'A', 'B+', 'B'].map(g => (
                <Link key={g} to={`/scanner?grade=${g}`}
                  style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, padding: '4px 14px', border: '1px solid var(--border2)', borderRadius: 5, color: 'var(--muted)' }}>
                  {g}
                </Link>
              ))}
            </div>
          </div>

          <div style={{ ...card, background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}>
            <div style={{ fontSize: 12, color: 'var(--accent2)', fontWeight: 500, marginBottom: 6 }}>
              Disclaimer
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>
              Stocksight detects patterns, not buy/sell signals. All setups are starting points for your own analysis. Past performance does not guarantee future results.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
