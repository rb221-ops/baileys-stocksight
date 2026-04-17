import React, { useState } from 'react'
import StockChart from './StockChart'

const GRADE_STYLES = {
  'A+': { bg: 'rgba(34,197,94,0.12)',   color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' },
  'A':  { bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' },
  'B+': { bg: 'rgba(201,168,76,0.15)',  color: '#e8c97a', border: '1px solid rgba(201,168,76,0.25)' },
  'B':  { bg: 'rgba(107,114,128,0.18)', color: '#9ca3af', border: '1px solid rgba(107,114,128,0.25)' },
}

function Grade({ grade }) {
  const s = GRADE_STYLES[grade] || GRADE_STYLES['B']
  return (
    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, fontWeight:500, padding:'2px 8px', borderRadius:4, background:s.bg, color:s.color, border:s.border }}>
      {grade}
    </span>
  )
}

function Dots({ count }) {
  return (
    <div style={{ display:'flex', gap:4 }}>
      {[1,2,3,4,5].map(i => (
        <div key={i} style={{ width:7, height:7, borderRadius:'50%', background: i <= count ? (count >= 4 ? '#22c55e' : '#c9a84c') : 'rgba(255,255,255,0.1)' }} />
      ))}
    </div>
  )
}

export default function StockTable({ results, loading }) {
  const [openChart, setOpenChart] = useState(null)

  if (loading) {
    return (
      <div style={{ padding:24 }}>
        {[...Array(8)].map((_,i) => (
          <div key={i} className="skeleton" style={{ height:42, marginBottom:6, borderRadius:4 }} />
        ))}
      </div>
    )
  }

  if (!results?.length) {
    return <div style={{ padding:40, textAlign:'center', color:'var(--muted)' }}>No setups found.</div>
  }

  const headers = ['#','Ticker','Pattern','Grade','Price','Change','Volume','RVOL','RSI','Pole %','Pullback','Confluence','Signals']
  const rightAlign = ['Price','Change','Volume','RVOL','RSI','Pole %','Pullback']

  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} style={{
                fontSize:10, textTransform:'uppercase', letterSpacing:'0.1em',
                color:'var(--muted)', fontWeight:400, padding:'8px 14px',
                textAlign: rightAlign.includes(h) ? 'right' : 'left',
                borderBottom:'1px solid var(--border)',
                background:'var(--surface2)', whiteSpace:'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((s, i) => (
            <React.Fragment key={s.ticker}>
              <tr
                onClick={() => setOpenChart(p => p === s.ticker ? null : s.ticker)}
                style={{ cursor:'pointer', transition:'background 0.1s', background: openChart === s.ticker ? 'rgba(201,168,76,0.06)' : 'transparent' }}
                onMouseEnter={e => { if (openChart !== s.ticker) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                onMouseLeave={e => { if (openChart !== s.ticker) e.currentTarget.style.background = 'transparent' }}
              >
                <td style={{ padding:'10px 14px', fontSize:11, color:'var(--muted)', fontFamily:"'DM Mono',monospace", borderBottom:'1px solid var(--border)' }}>{i+1}</td>
                <td style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:14, fontWeight:500, color:'var(--accent2)' }}>{s.ticker}</div>
                  <div style={{ fontSize:11, color:'var(--muted)', marginTop:1 }}>{s.company?.length > 22 ? s.company.slice(0,22)+'…' : s.company}</div>
                </td>
                <td style={{ padding:'10px 14px', fontSize:12, color:'var(--muted)', borderBottom:'1px solid var(--border)' }}>{s.pattern}</td>
                <td style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)' }}><Grade grade={s.grade} /></td>
                <td style={{ padding:'10px 14px', textAlign:'right', fontFamily:"'DM Mono',monospace", fontSize:13, borderBottom:'1px solid var(--border)' }}>${s.price?.toLocaleString()}</td>
                <td style={{ padding:'10px 14px', textAlign:'right', fontFamily:"'DM Mono',monospace", fontSize:13, color: s.change_pct >= 0 ? '#22c55e' : '#ef4444', borderBottom:'1px solid var(--border)' }}>
                  {s.change_pct >= 0 ? '+' : ''}{s.change_pct?.toFixed(2)}%
                </td>
                <td style={{ padding:'10px 14px', textAlign:'right', fontFamily:"'DM Mono',monospace", fontSize:13, color:'var(--muted)', borderBottom:'1px solid var(--border)' }}>
                  {s.volume >= 1e6 ? (s.volume/1e6).toFixed(1)+'M' : (s.volume/1e3).toFixed(0)+'K'}
                </td>
                <td style={{ padding:'10px 14px', textAlign:'right', fontFamily:"'DM Mono',monospace", fontSize:13, color: s.rvol >= 2 ? '#22c55e' : 'var(--text)', borderBottom:'1px solid var(--border)' }}>
                  {s.rvol?.toFixed(1)}x
                </td>
                <td style={{ padding:'10px 14px', textAlign:'right', fontFamily:"'DM Mono',monospace", fontSize:13, color: s.rsi > 70 ? '#ef4444' : s.rsi < 40 ? '#60a5fa' : 'var(--text)', borderBottom:'1px solid var(--border)' }}>
                  {s.rsi?.toFixed(0)}
                </td>
                <td style={{ padding:'10px 14px', textAlign:'right', fontFamily:"'DM Mono',monospace", fontSize:13, color:'#22c55e', borderBottom:'1px solid var(--border)' }}>
                  {s.pole_pct ? `+${s.pole_pct}%` : '—'}
                </td>
                <td style={{ padding:'10px 14px', textAlign:'right', fontFamily:"'DM Mono',monospace", fontSize:13, color:'var(--muted)', borderBottom:'1px solid var(--border)' }}>
                  {s.pullback_pct ? `${s.pullback_pct}%` : '—'}
                </td>
                <td style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)' }}><Dots count={s.confluence_count} /></td>
                <td style={{ padding:'10px 14px', maxWidth:200, borderBottom:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                    {s.signals?.slice(0,2).map(sig => (
                      <span key={sig} style={{ fontSize:10, padding:'1px 7px', background:'var(--surface2)', borderRadius:10, color:'var(--muted)', border:'1px solid var(--border)' }}>
                        {sig}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
              {openChart === s.ticker && (
                <tr>
                  <td colSpan={13} style={{ padding:'0 8px 12px', background:'rgba(0,0,0,0.2)', borderBottom:'1px solid var(--border)' }}>
                    <StockChart ticker={s.ticker} onClose={() => setOpenChart(null)} />
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
