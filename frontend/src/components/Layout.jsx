import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { fetchMarket } from '../utils/api'
import { useAuth } from '../hooks/useAuth'

const NAV = [
  { path: '/', label: 'Dashboard' },
  { path: '/scanner', label: 'Scanner' },
  { path: '/top10', label: 'Top 10' },
  { path: '/pricing', label: 'Pricing' },
]

export default function Layout({ children }) {
  const loc = useLocation()
  const navigate = useNavigate()
  const [market, setMarket] = useState(null)
  const { user, logout, isPro } = useAuth()

  useEffect(() => {
    fetchMarket().then(setMarket).catch(() => {})
    const interval = setInterval(() => {
      fetchMarket().then(setMarket).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <header style={{
        height: 52, background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 1.5rem', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/">
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--accent2)' }}>
              Baileys Stocksight<span style={{ fontFamily: "'DM Sans'", fontSize: 11, color: 'var(--muted)', fontWeight: 300, marginLeft: 6 }}>Pro</span>
            </span>
          </Link>
          <nav style={{ display: 'flex', gap: 4, alignItems: 'center', marginLeft: 24 }}>
            {NAV.map(n => (
              <Link key={n.path} to={n.path} style={{
                padding: '5px 12px', borderRadius: 5, fontSize: 13,
                color: loc.pathname === n.path ? 'var(--text)' : 'var(--muted)',
                background: loc.pathname === n.path ? 'rgba(255,255,255,0.06)' : 'transparent',
              }}>{n.label}</Link>
            ))}
            {user?.is_admin && (
              <Link to="/admin" style={{
                padding: '5px 12px', borderRadius: 5, fontSize: 13,
                color: loc.pathname === '/admin' ? 'var(--accent2)' : 'var(--accent)',
                background: loc.pathname === '/admin' ? 'rgba(201,168,76,0.12)' : 'transparent',
              }}>Admin</Link>
            )}
          </nav>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          {/* Market ticker */}
          {market?.indices?.map(idx => (
            <div key={idx.symbol} style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, display: 'flex', gap: 6 }}>
              <span style={{ color: 'var(--muted)' }}>{idx.symbol}</span>
              <span>{idx.price?.toLocaleString()}</span>
              <span style={{ color: idx.change_pct >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {idx.change_pct >= 0 ? '+' : ''}{idx.change_pct?.toFixed(2)}%
              </span>
            </div>
          ))}

          {/* Live dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'pulse-dot 2s infinite' }} />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Live</span>
          </div>

          {/* User menu */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'var(--text)' }}>{user.name}</div>
                <div style={{ fontSize: 10, color: isPro ? 'var(--green)' : 'var(--accent2)' }}>
                  {isPro ? '⭐ Pro' : '🎯 Trial'}
                </div>
              </div>
              {!isPro && (
                <Link to="/pricing" style={{ fontSize: 12, padding: '4px 12px', borderRadius: 5, background: 'var(--accent)', color: '#000', fontWeight: 500 }}>
                  Upgrade
                </Link>
              )}
              <button onClick={handleLogout} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 5, border: '1px solid var(--border2)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer' }}>
                Sign Out
              </button>
            </div>
          ) : (
            <Link to="/login" style={{ fontSize: 13, padding: '5px 14px', borderRadius: 5, background: 'var(--accent)', color: '#000', fontWeight: 500 }}>
              Sign In
            </Link>
          )}
        </div>
      </header>

      <main style={{ flex: 1, padding: '1.5rem', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        {children}
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '12px 1.5rem', fontSize: 11, color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
        <span>Baileys Stocksight Pro · Pattern detection only, not financial advice.</span>
        <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      </footer>
    </div>
  )
}
