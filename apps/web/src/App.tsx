import { Routes, Route, Navigate } from 'react-router-dom'
import vendorRoutes from './router/vendorRoutes'
import adminRoutes from './router/adminRoutes'
import LandingPage from './pages/landing/LandingPage'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import WaitingVerify from './pages/auth/WaitingVerify'
import InvitePage from './pages/invite/InvitePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/mitra" replace />} />
      <Route path="/i/:refCode" element={<InvitePage />} />
      <Route path="/admin" element={<Navigate to="/x-ctrl-panel" replace />} />
      <Route path="/mitra" element={<LandingPage />} />
      <Route path="/mitra/login" element={<Login />} />
      <Route path="/mitra/register" element={<Register />} />
      <Route path="/mitra/waiting" element={<WaitingVerify />} />
      {vendorRoutes}
      {adminRoutes}
      <Route path="*" element={<div className="flex h-screen items-center justify-center text-2xl">404 — Halaman tidak ditemukan</div>} />
    </Routes>
  )
}
