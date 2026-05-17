import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import Logo from '../../components/Logo'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch {}
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4"><Logo size="md" /></div>
          <h2 className="text-xl font-semibold">Lupa Password</h2>
          <p className="text-gray-500 text-sm mt-1">Masukkan email akun vendor Anda</p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="text-5xl">📧</div>
            <p className="font-semibold text-gray-800">Email terkirim!</p>
            <p className="text-sm text-gray-500">Cek inbox Anda dan klik link reset password. Link berlaku 1 jam.</p>
            <Link to="/mitra/login" className="block text-primary text-sm hover:underline">← Kembali ke Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email" required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contoh@email.com"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-lg font-medium disabled:opacity-60">
              {loading ? 'Mengirim...' : 'Kirim Link Reset'}
            </button>
            <p className="text-center text-sm">
              <Link to="/mitra/login" className="text-primary hover:underline">← Kembali ke Login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
