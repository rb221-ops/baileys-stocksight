import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchScan } from '../utils/api'
import StockTable from '../components/StockTable'

const PATTERNS = [
  { key: 'bull_flag', label: 'Bull Flag' },
  { key: 'breakout', label: 'Breakout' },
  { key: 'gap_up', label: 'Gap & Go' },
  { key: 'vcp', label: 'VCP' },
  { key: 'high_rvol', label: 'High RVOL' },
  { key: 'reversal', label: 'Reversal' },
  { key: 'earnings', label: 'Earnings' },
]

const btn = (active) => ({
  padding: '6px 16px',
  borderRadius: 5,
  border: active ? '1px solid var(--accent)' : '1px solid var(--border2)',
  background: active ? 'rgba(201,168,76,0.1)' : 'var(--surface)',
  color: active ? 'var(--accent2)' : 'var(--muted)',
  fontSize: 13,
  cursor: 'pointer',
  transition: 'all 0.15s',
})

const card = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
}

export default function Scanner() {
  const [params, setParams] = useSearchParams()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const pattern = params.get('pattern') || 'bull_flag'
  const grade = params.get('grade') || ''
  const minPrice = Number(params.get('minPrice') || 5)
  const minVol = Number(params.get('minVol') || 200000)

  const runScan = () => {
    setLoading(true)
    setError(null)
    fetchScan({ pattern, grade: grade || undefined, minPrice, minVolume: minVol, limit: 30 })
      .then(d => { setResults(d.results || []); setLoading(false) })
      .catch(e => { setError('Scanner error. Is the backend running?'); setLoading(false) })
  }

  useEffect(() => { runScan() }, [pattern, grade, minPrice, minVol])

  const set = (key, val) => {
    const p = new URLSearchParams(params)
    if (val) p.set(key, val)
    else p.delete(key)
    setParams(p)
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 4 }}>Scanner</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>
          Real-time pattern detection · {results.length} setups found
        </p>
      </div>

      {/* Pattern tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {PATTERNS.map(p => (
          <button key={p.key} style={btn(pattern === p.key)} onClick={() => set('pattern', p.key)}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Grade:</span>
          {['', 'A+', 'A', 'B+', 'B'].map(g => (
            <button key={g} style={btn(grade === g)} onClick={() => set('grade', g)}>
              {g || 'All'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Min Price:</span>
          <select
            value={minPrice}
            onChange={e => set('minPrice', e.target.value)}
            style={{ background: 'var(--surface)', border: '1px solid var(--border2)', color: 'var(--text)', padding: '5px 10px', borderRadius: 5, fontSize: 13 }}
          >
            {[1, 5, 10, 20, 50].map(v => <option key={v} value={v}>${v}+</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Min Vol:</span>
          <select
            value={minVol}
            onChange={e => set('minVol', e.target.value)}
            style={{ background: 'var(--surface)', border: '1px solid var(--border2)', color: 'var(--text)', padding: '5px 10px', borderRadius: 5, fontSize: 13 }}
          >
            <option value={100000}>100K+</option>
            <option value={200000}>200K+</option>
            <option value={500000}>500K+</option>
            <option value={1000000}>1M+</option>
          </select>
        </div>
        <button onClick={runScan} style={{ ...btn(false), background: 'var(--accent)', color: '#000', borderColor: 'var(--accent)', fontWeight: 500 }}>
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div style={{ padding: 16, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)', marginBottom: '1rem', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={card}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>
            {PATTERNS.find(p => p.key === pattern)?.label} Setups
          </span>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>
            {loading ? 'Scanning…' : `${results.length} results`}
          </span>
        </div>
        <StockTable results={results} loading={loading} />
      </div>
    </div>
  )
}
