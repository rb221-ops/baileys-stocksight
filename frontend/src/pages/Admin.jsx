import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const PLAN_COLORS = {
  pro:     { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e',  label: 'Pro' },
  trial:   { bg: 'rgba(96,165,250,0.12)', color: '#60a5fa',  label: 'Trial' },
  expired: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444',  label: 'Expired' },
}

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = () => {
    const token = localStorage.getItem('token')
    fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error('Unauthorized'); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { navigate('/'); })
  }

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (!user.is_admin) { navigate('/'); return }
    fetchData()
  }, [user])

  const action = async (url, method = 'POST') => {
    const token = localStorage.getItem('token')
    await fetch(url, { method, headers: { Authorization: `Bearer ${token}` } })
    fetchData()
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading admin panel...</div>

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 4 }}>
          Admin Dashboard
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>Manage users and subscriptions</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Users', value: data?.total || 0, color: 'var(--text)' },
          { label: 'Pro Members', value: data?.pro || 0, color: 'var(--green)' },
          { label: 'On Trial', value: data?.trial || 0, color: 'var(--blue)' },
          { label: 'Expired', value: data?.expired || 0, color: 'var(--red)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, fontWeight: 500, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Monthly revenue estimate */}
      <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 8, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Estimated Monthly Revenue</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 24, color: 'var(--accent2)' }}>
            ${((data?.pro || 0) * 29).toLocaleString()}/mo
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{data?.pro || 0} × $29/month</div>
      </div>

      {/* Users table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 500, fontSize: 14 }}>
          All Users ({data?.total || 0})
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Name', 'Email', 'Plan', 'Trial Ends', 'Joined', 'Actions'].map(h => (
                <th key={h} style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', fontWeight: 400, padding: '8px 14px', textAlign: 'left', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.users?.map(u => {
              const p = PLAN_COLORS[u.plan] || PLAN_COLORS.expired
              return (
                <tr key={u.email} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500 }}>{u.name}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>{u.email}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: p.bg, color: p.color, fontFamily: "'DM Mono', monospace" }}>
                      {p.label}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--muted)' }}>
                    {u.trial_ends ? new Date(u.trial_ends).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--muted)' }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {u.plan !== 'pro' && (
                        <button onClick={() => action(`/api/admin/upgrade/${u.email}`)}
                          style={{ fontSize: 11, padding: '3px 10px', borderRadius: 4, border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.08)', color: '#22c55e', cursor: 'pointer' }}>
                          Upgrade
                        </button>
                      )}
                      {u.plan === 'pro' && (
                        <button onClick={() => action(`/api/admin/downgrade/${u.email}`)}
                          style={{ fontSize: 11, padding: '3px 10px', borderRadius: 4, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer' }}>
                          Downgrade
                        </button>
                      )}
                      <button onClick={() => { if(confirm(`Delete ${u.email}?`)) action(`/api/admin/delete/${u.email}`, 'DELETE') }}
                        style={{ fontSize: 11, padding: '3px 10px', borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer' }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
