import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/login', form)
      setAuth(data.token, data.user)
      if (data.user.role === 'admin') navigate('/x-ctrl-panel')
      else if (data.user.role === 'vendor') navigate('/mitra/dashboard')
      else navigate('/mitra')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 via-primary to-blue-500 px-4">
      <div className="w-full max-w-4xl bg-dark-card rounded-3xl shadow-2xl overflow-hidden flex min-h-[520px]">

        {/* Left panel — branding */}
        <div className="hidden md:flex flex-col items-center justify-center w-2/5 bg-gradient-to-b from-primary to-blue-800 p-10 gap-6">
          <img src="/logo.png" alt="VendorApp" className="w-24 h-24 object-contain" />
          <div className="text-center">
            <p className="text-white/60 text-sm font-medium tracking-widest uppercase mb-1">Selamat datang di</p>
            <h1 className="text-white font-bold text-2xl tracking-widest">VENDOR APP</h1>
            <p className="text-white/50 text-xs mt-2">Indonesia</p>
          </div>
          <div className="border border-white/20 rounded-xl p-4 mt-4 w-full text-center">
            <p className="text-white/70 text-xs leading-relaxed">Platform terpercaya untuk vendor jasa acara di seluruh Indonesia</p>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 flex flex-col justify-center p-8 md:p-12">
          {/* Mobile logo */}
          <div className="flex md:hidden justify-center mb-6">
            <img src="/logo.png" alt="VendorApp" className="w-16 h-16 object-contain" />
          </div>

          <h2 className="text-white font-bold text-2xl mb-1">Selamat datang di</h2>
          <h2 className="text-white font-bold text-2xl mb-2">VendorApp Indonesia</h2>
          <p className="text-white/50 text-sm mb-8">Silahkan masuk dengan akun anda</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email" required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-dark border border-dark-border text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="contoh@email.com"
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wider">Kata Sandi</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-dark border border-dark-border text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors pr-12"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 text-sm">
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="text-right">
              <Link to="/mitra/forgot-password" className="text-white/50 hover:text-white text-xs transition-colors">Lupa password?</Link>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit" disabled={loading}
                className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-60 transition-colors"
              >
                {loading ? 'Masuk...' : 'Masuk'}
              </button>
              <Link
                to="/mitra/register"
                className="flex-1 border border-primary text-primary hover:bg-primary hover:text-white py-3 rounded-xl font-semibold text-sm text-center transition-colors"
              >
                Daftar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
