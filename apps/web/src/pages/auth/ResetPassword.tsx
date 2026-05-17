import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../services/api'
import Logo from '../../components/Logo'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', code: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) return setError('Password tidak cocok')
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/reset-password', { email: form.email, code: form.code, password: form.password })
      navigate('/mitra/login')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4"><Logo size="md" /></div>
          <h2 className="text-xl font-semibold">Buat Password Baru</h2>
          <p className="text-gray-500 text-sm mt-1">Masukkan kode 6 digit yang dikirim ke email Anda</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="contoh@email.com"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Kode Reset (dari email)</label>
            <input type="text" required maxLength={6} value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/g, '') })}
              placeholder="6 digit kode"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary tracking-widest text-center text-lg font-bold" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password Baru</label>
            <input type="password" required minLength={8} value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min. 8 karakter"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Konfirmasi Password</label>
            <input type="password" required value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="Ulangi password baru"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-primary text-white py-2.5 rounded-lg font-medium disabled:opacity-60">
            {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
          </button>
          <p className="text-center text-sm">
            <Link to="/mitra/forgot-password" className="text-gray-500 hover:text-primary">Belum dapat kode? Kirim ulang</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
