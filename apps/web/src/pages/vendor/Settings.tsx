import { useState, useEffect } from 'react'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'

const CATEGORIES = ['Wedding Organizer', 'Fotografer', 'Event Organizer', 'Katering', 'Dekorasi', 'Sewa Mobil', 'Musik', 'Videotron', 'Lighting', 'Venue']

export default function Settings() {
  const { logout } = useAuthStore()
  const [profile, setProfile] = useState<any>(null)
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get('/vendor/profile').then((r) => setProfile(r.data)).catch(() => setLoadError(true))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/vendor/profile', profile)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  if (loadError) return (
    <div className="p-8 text-center">
      <p className="text-red-500 mb-3">Gagal memuat profil. Coba logout lalu login ulang.</p>
      <button onClick={logout} className="text-sm text-red-600 border border-red-300 px-4 py-2 rounded-lg hover:bg-red-50">Logout</button>
    </div>
  )

  if (!profile) return <div className="text-gray-400 p-8">Memuat...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Pengaturan</h1>

      <form onSubmit={handleSave} className="space-y-5">
        <section className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Profil Bisnis</h2>

          <Field label="Nama Bisnis">
            <input className={input} value={profile.business_name || ''} onChange={(e) => setProfile({ ...profile, business_name: e.target.value })} />
          </Field>
          <Field label="Deskripsi">
            <textarea rows={4} className={input} value={profile.description || ''} onChange={(e) => setProfile({ ...profile, description: e.target.value })} placeholder="Ceritakan tentang bisnis Anda..." />
          </Field>
          <Field label="Kategori Utama">
            <select className={input + ' bg-white'} value={profile.category || ''} onChange={(e) => setProfile({ ...profile, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Kota Operasional">
              <input className={input} value={profile.city || ''} onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
            </Field>
            <Field label="No. WhatsApp (opsional)">
              <input className={input} value={profile.whatsapp || ''} onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })} placeholder="08xxxxxxxxxx" />
            </Field>
          </div>
          <Field label="Alamat Lengkap (opsional)">
            <input className={input} value={profile.address || ''} onChange={(e) => setProfile({ ...profile, address: e.target.value })} placeholder="Jl. Contoh No. 1, Kelurahan, Kecamatan" />
          </Field>
          <Field label={`Jangkauan Layanan: ${profile.service_radius_km || 25} km`}>
            <div className="space-y-2">
              <input
                type="range" min={1} max={200} step={1}
                value={profile.service_radius_km || 25}
                onChange={(e) => setProfile({ ...profile, service_radius_km: parseInt(e.target.value) })}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>1 km</span>
                <span>50 km</span>
                <span>100 km</span>
                <span>200 km</span>
              </div>
              <p className="text-xs text-gray-500">Vendor Anda akan muncul di peta customer dalam radius ini</p>
            </div>
          </Field>
        </section>

        <section className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Informasi Akun</h2>
          <Field label="Email">
            <input className={input + ' bg-gray-50'} value={profile.users?.email || ''} readOnly />
          </Field>
          <p className="text-xs text-gray-400">Untuk mengubah email atau kata sandi, hubungi support kami.</p>
        </section>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60 transition-colors">
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
          {saved && <span className="text-green-600 text-sm">✅ Tersimpan</span>}
        </div>
      </form>

      <div className="bg-red-50 border border-red-100 rounded-xl p-5">
        <h2 className="font-semibold text-red-700 mb-2">Zona Berbahaya</h2>
        <button onClick={logout} className="text-sm text-red-600 border border-red-300 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors">
          Keluar dari Akun
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

const input = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary'
