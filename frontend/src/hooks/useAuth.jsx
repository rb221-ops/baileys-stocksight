import React, { createContext, useContext, useState, useEffect } from 'react'

const API = 'https://baileys-stocksight-production.up.railway.app/api'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.email) setUser({ ...data, token })
        else localStorage.removeItem('token')
      })
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const r = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await r.json()
    if (!r.ok) throw new Error(data.detail || 'Login failed')
    localStorage.setItem('token', data.token)
    setUser(data)
    return data
  }

  const register = async (email, password, name) => {
    const r = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    })
    const data = await r.json()
    if (!r.ok) throw new Error(data.detail || 'Registration failed')
    localStorage.setItem('token', data.token)
    setUser(data)
    return data
  }

  const logout = () => { localStorage.removeItem('token'); setUser(null) }

  const isPro = user?.plan === 'pro' || user?.is_admin
  const isTrial = user?.plan === 'trial'
  const isExpired = user?.plan === 'expired'

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0a0b0d', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280', fontSize:13 }}>
      Loading...
    </div>
  )

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isPro, isTrial, isExpired }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
