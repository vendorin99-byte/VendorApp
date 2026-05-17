import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import Logo from '../../components/Logo'

const CATEGORIES = ['Wedding Organizer', 'Fotografer', 'Event Organizer', 'Katering', 'Dekorasi', 'Sewa Mobil', 'Musik', 'Videotron', 'Lighting', 'Venue']

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    business_name: '', name: '', email: '', phone: '',
    category: '', city: '', password: '',
  })
  const [ktp, setKtp] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ktp) return setError('KTP wajib diupload')
    setLoading(true)
    setError('')

    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      fd.append('ktp', ktp)
      await api.post('/auth/register-vendor', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      navigate('/mitra/waiting')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Pendaftaran gagal')
    } finally {
      setLoading(false)
    }
  }

  const field = (label: string, key: keyof typeof form, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type} required
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder={placeholder}
      />
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border p-8">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Logo size="md" />
          </div>
          <h2 className="text-xl font-semibold">Daftar Sebagai Vendor</h2>
          <p className="text-gray-500 text-sm">Kembangkan Bisnis Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {field('Nama Bisnis', 'business_name', 'text', 'Masukkan nama bisnis Anda')}
          {field('Nama Lengkap (sesuai KTP)', 'name', 'text', 'Nama sesuai KTP')}
          {field('Alamat Email', 'email', 'email', 'contoh@email.com')}
          {field('Nomor Telepon', 'phone', 'tel', '08123456789')}

          <div>
            <label className="block text-sm font-medium mb-1">Jenis Layanan</label>
            <select
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              <option value="">Pilih jenis layanan</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {field('Kota Operasional', 'city', 'text', 'Jakarta')}
          {field('Kata Sandi', 'password', 'password', 'Min. 8 karakter')}

          <div>
            <label className="block text-sm font-medium mb-1">Upload KTP <span className="text-red-500">*</span></label>
            <input
              type="file" accept="image/*,.pdf" required
              onChange={(e) => setKtp(e.target.files?.[0] || null)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Format: JPG, PNG, PDF. Maks 5MB</p>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary-dark disabled:opacity-60 transition-colors"
          >
            {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Sudah punya akun?{' '}
          <Link to="/mitra/login" className="text-primary font-medium hover:underline">Masuk di sini</Link>
        </p>
      </div>
    </div>
  )
}
