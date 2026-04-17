import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Success() {
  const navigate = useNavigate()

  useEffect(() => {
    setTimeout(() => navigate('/'), 4000)
  }, [])

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ fontSize: 64 }}>🎉</div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: 'var(--accent2)' }}>
        Welcome to Pro!
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 14 }}>
        Your subscription is active. Redirecting to dashboard...
      </p>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--green)' }}>
        ✓ Full scanner access unlocked
      </div>
    </div>
  )
}
