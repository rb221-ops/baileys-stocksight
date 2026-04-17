import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Pricing() {
  const { user, isPro, isTrial } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    if (!user) { navigate('/login'); return }
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const r = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await r.json()
      if (data.url) window.location.href = data.url
    } catch (err) {
      alert('Error creating checkout. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const features = {
    free: [
      'Top 3 results per scanner',
      'Bull Flag scanner only',
      'Basic chart view',
      '7-day trial',
    ],
    pro: [
      'All 50+ results per scanner',
      'All 7 scanner categories',
      'Full candlestick charts',
      'Draw lines on charts',
      '1m / 5m / 1h / 1D / 1W timeframes',
      'Real-time price updates',
      'RSI, RVOL, MA signals',
      'Confluence detection',
      'A+ to B grading',
      'Priority support',
    ]
  }

  return (
    <div className="fade-in" style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, marginBottom: 8 }}>
          Simple Pricing
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 15 }}>
          Start free for 7 days. No credit card required.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Free */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '2rem' }}>
          <div style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Free Trial</div>
          <div style={{ fontSize: 36, fontFamily: "'DM Mono', monospace", fontWeight: 500, marginBottom: 4 }}>$0</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: '1.5rem' }}>7 days, no card needed</div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            {features.free.map(f => (
              <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, fontSize: 13 }}>
                <span style={{ color: 'var(--green)', fontSize: 16 }}>✓</span>
                <span style={{ color: 'var(--muted)' }}>{f}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/login')} style={{
            width: '100%', padding: '12px', marginTop: '1.5rem', borderRadius: 6,
            border: '1px solid var(--border2)', background: 'transparent',
            color: 'var(--text)', fontSize: 14, cursor: 'pointer',
          }}>
            {user ? 'Current Plan' : 'Get Started Free'}
          </button>
        </div>

        {/* Pro */}
        <div style={{ background: 'var(--surface)', border: '2px solid var(--accent)', borderRadius: 10, padding: '2rem', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: '#000', fontSize: 11, fontWeight: 500, padding: '3px 14px', borderRadius: 20 }}>
            MOST POPULAR
          </div>
          <div style={{ fontSize: 13, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Pro</div>
          <div style={{ fontSize: 36, fontFamily: "'DM Mono', monospace", fontWeight: 500, marginBottom: 4 }}>$29</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: '1.5rem' }}>per month, cancel anytime</div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            {features.pro.map(f => (
              <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, fontSize: 13 }}>
                <span style={{ color: 'var(--green)', fontSize: 16 }}>✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
          <button onClick={handleUpgrade} disabled={loading || isPro} style={{
            width: '100%', padding: '12px', marginTop: '1.5rem', borderRadius: 6,
            border: 'none', background: isPro ? 'var(--surface2)' : 'var(--accent)',
            color: isPro ? 'var(--muted)' : '#000', fontSize: 14, fontWeight: 500,
            cursor: loading || isPro ? 'not-allowed' : 'pointer',
          }}>
            {isPro ? 'Current Plan ✓' : loading ? 'Loading...' : 'Upgrade to Pro →'}
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: 12, color: 'var(--muted)' }}>
        Secure payments via Stripe · Cancel anytime · No hidden fees
      </div>
    </div>
  )
}
