import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handle = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password, name)
      }
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: 'var(--accent2)', marginBottom: 8 }}>
            Baileys Stocksight
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Professional Stock Scanner</div>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '2rem' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem', background: 'var(--surface2)', borderRadius: 6, padding: 4 }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '7px', borderRadius: 4, border: 'none',
                background: mode === m ? 'var(--surface)' : 'transparent',
                color: mode === m ? 'var(--text)' : 'var(--muted)',
                fontSize: 13, cursor: 'pointer', fontWeight: mode === m ? 500 : 400,
              }}>
                {m === 'login' ? 'Sign In' : 'Start Free Trial'}
              </button>
            ))}
          </div>

          {mode === 'register' && (
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 6, padding: '10px 14px', marginBottom: '1rem', fontSize: 12, color: '#22c55e' }}>
              🎉 7-day free trial — no credit card required!
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '10px 14px', marginBottom: '1rem', fontSize: 13, color: 'var(--red)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handle}>
            {mode === 'register' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Full Name</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Riley Bailey" required
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 6, color: 'var(--text)', fontSize: 14 }}
                />
              </div>
            )}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required
                style={{ width: '100%', padding: '10px 12px', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 6, color: 'var(--text)', fontSize: 14 }}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                style={{ width: '100%', padding: '10px 12px', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 6, color: 'var(--text)', fontSize: 14 }}
              />
            </div>
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '12px', borderRadius: 6, border: 'none',
              background: 'var(--accent)', color: '#000', fontSize: 14, fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Start Free Trial'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: 12, color: 'var(--muted)' }}>
          Pattern detection only · Not financial advice
        </div>
      </div>
    </div>
  )
}
