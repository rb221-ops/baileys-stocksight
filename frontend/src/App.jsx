import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Scanner from './pages/Scanner'
import Top10 from './pages/Top10'
import TickerDetail from './pages/TickerDetail'
import Login from './pages/Login'
import Pricing from './pages/Pricing'
import Admin from './pages/Admin'
import Success from './pages/Success'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/scanner" element={<Layout><Scanner /></Layout>} />
        <Route path="/top10" element={<Layout><Top10 /></Layout>} />
        <Route path="/ticker/:symbol" element={<Layout><TickerDetail /></Layout>} />
        <Route path="/pricing" element={<Layout><Pricing /></Layout>} />
        <Route path="/admin" element={<Layout><Admin /></Layout>} />
        <Route path="/success" element={<Layout><Success /></Layout>} />
      </Routes>
    </AuthProvider>
  )
}
