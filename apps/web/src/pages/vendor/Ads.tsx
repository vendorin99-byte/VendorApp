import { useState } from 'react'

const PLANS = [
  { key: 'trial', label: 'Trial', price: 'GRATIS', duration: '14 hari', features: ['Semua fitur dasar', '20 foto portofolio', 'Profil di pencarian'] },
  { key: 'starter', label: 'Starter', price: 'Rp 39.000', duration: '/bulan', features: ['Profil aktif', '20 foto portofolio', 'Pencarian biasa'] },
  { key: 'pro', label: 'Pro', price: 'Rp 99.000', duration: '/bulan', features: ['Prioritas pencarian', 'Badge Pro', 'Foto tak terbatas', 'Statistik lanjutan'] },
  { key: 'premium', label: 'Premium', price: 'Rp 199.000', duration: '/bulan', features: ['Semua fitur Pro', 'Iklan teratas', 'Iklan highlight', 'Push notif ke customer'] },
]

const AD_TYPES = [
  { key: 'boosted', label: 'Iklan Vendor', desc: 'Tampil di bagian atas hasil pencarian customer', price: 'Rp 100.000 / hari' },
  { key: 'highlight', label: 'Iklan Highlight', desc: 'Banner di halaman beranda aplikasi customer', price: 'Rp 150.000 / hari' },
  { key: 'lokasi', label: 'Iklan Lokasi', desc: 'Marker khusus di halaman maps customer', price: 'Rp 80.000 / hari' },
]

export default function Ads() {
  const [currentPlan] = useState('trial')
  const [showAdForm, setShowAdForm] = useState(false)
  const [selectedAd, setSelectedAd] = useState('')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Iklan & Langganan</h1>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm">
        <span className="font-medium text-yellow-800">Paket saat ini: Trial</span>
        <span className="text-yellow-700 ml-2">— Upgrade untuk fitur lebih lengkap</span>
      </div>

      <div>
        <h2 className="font-semibold text-lg mb-4">Pilihan Paket Langganan</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((p) => (
            <div key={p.key} className={`bg-white rounded-xl border-2 p-5 flex flex-col gap-3 ${p.key === 'pro' ? 'border-primary' : 'border-gray-200'}`}>
              {p.key === 'pro' && <div className="text-xs bg-primary text-white px-2 py-0.5 rounded-full self-start font-medium">Terpopuler</div>}
              <div>
                <div className="text-lg font-bold">{p.label}</div>
                <div className="text-2xl font-bold text-primary mt-1">{p.price}</div>
                <div className="text-sm text-gray-400">{p.duration}</div>
              </div>
              <ul className="text-sm text-gray-600 space-y-1 flex-1">
                {p.features.map((f) => <li key={f} className="flex items-start gap-1.5"><span className="text-green-500 mt-0.5">✓</span>{f}</li>)}
              </ul>
              <button
                disabled={currentPlan === p.key}
                className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${currentPlan === p.key ? 'bg-gray-100 text-gray-400 cursor-default' : 'bg-primary text-white hover:bg-primary-dark'}`}
              >
                {currentPlan === p.key ? 'Paket Aktif' : 'Pilih Paket'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-lg mb-4">Beli Iklan</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {AD_TYPES.map((a) => (
            <div key={a.key} className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold mb-1">{a.label}</h3>
              <p className="text-sm text-gray-500 mb-3">{a.desc}</p>
              <p className="text-sm font-bold text-primary mb-4">{a.price}</p>
              <button
                onClick={() => { setSelectedAd(a.key); setShowAdForm(true) }}
                className="w-full bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
              >
                Pasang Iklan
              </button>
            </div>
          ))}
        </div>
      </div>

      {showAdForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Ajukan Iklan</h2>
            <p className="text-sm text-gray-500 mb-4">Tipe: <span className="font-medium">{AD_TYPES.find(a => a.key === selectedAd)?.label}</span></p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Kota Target</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Jakarta, Surabaya, ..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Durasi (hari)</label>
                <input type="number" min={1} className="w-full border rounded-lg px-3 py-2 text-sm" defaultValue={3} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdForm(false)} className="flex-1 border rounded-lg py-2 text-sm">Batal</button>
              <button onClick={() => setShowAdForm(false)} className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-medium">Ajukan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
