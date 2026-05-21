import { useState, useEffect, useRef } from 'react'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'

const CATEGORIES = ['Wedding Organizer', 'Fotografer', 'Event Organizer', 'Katering', 'Dekorasi', 'Sewa Mobil', 'Musik', 'Videotron', 'Lighting', 'Venue']

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

const DEFAULT_HOURS: Record<string, { open: string; close: string; is_open: boolean }> = Object.fromEntries(
  DAYS.map((d) => [d, { open: '08:00', close: '17:00', is_open: true }])
)

function parseHours(raw: any): Record<string, { open: string; close: string; is_open: boolean }> {
  if (!raw) return { ...DEFAULT_HOURS }
  return Object.fromEntries(
    DAYS.map((d) => {
      const val = raw[d]
      if (!val || val === 'Tutup') return [d, { open: '08:00', close: '17:00', is_open: false }]
      const [open, close] = val.split('-')
      return [d, { open: open || '08:00', close: close || '17:00', is_open: true }]
    })
  )
}

function serializeHours(hours: Record<string, { open: string; close: string; is_open: boolean }>) {
  return Object.fromEntries(
    DAYS.map((d) => [d, hours[d].is_open ? `${hours[d].open}-${hours[d].close}` : 'Tutup'])
  )
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng.lat, e.latlng.lng) })
  return null
}

function FlyTo({ pos }: { pos: [number, number] | null }) {
  const map = useMap()
  useEffect(() => { if (pos) map.flyTo(pos, 16, { duration: 1 }) }, [pos])
  return null
}

function LocationMap({ lat, lng, onChange }: { lat: number; lng: number; onChange: (lat: number, lng: number) => void }) {
  const [flyPos, setFlyPos] = useState<[number, number] | null>(null)
  const [searchQ, setSearchQ] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function onSearchChange(q: string) {
    setSearchQ(q)
    if (timer.current) clearTimeout(timer.current)
    if (!q.trim()) { setSuggestions([]); return }
    timer.current = setTimeout(() => doSearch(q), 600)
  }

  async function doSearch(q: string) {
    setSearching(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=id`)
      setSuggestions(await res.json())
    } catch {}
    setSearching(false)
  }

  function pickSuggestion(item: any) {
    const plat = parseFloat(item.lat), plng = parseFloat(item.lon)
    setSuggestions([])
    setSearchQ(item.display_name.split(',').slice(0, 2).join(', '))
    setFlyPos([plat, plng])
    onChange(plat, plng)
  }

  const icon = L.divIcon({
    className: '',
    html: '<div style="width:20px;height:20px;background:#3B5BDB;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
    iconSize: [20, 20], iconAnchor: [10, 20],
  })

  const center: [number, number] = (lat && lng) ? [lat, lng] : [-6.2, 106.816]

  return (
    <div className="space-y-2">
      {/* Search */}
      <div className="relative">
        <div className="flex items-center gap-2 border rounded px-3 py-2 focus-within:ring-2 focus-within:ring-primary">
          <span className="text-gray-400 text-sm">🔍</span>
          <input
            type="text" value={searchQ} onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari alamat, nama jalan, gedung..."
            className="flex-1 text-sm outline-none"
          />
          {searching && <span className="text-xs text-gray-400">Mencari...</span>}
        </div>
        {suggestions.length > 0 && (
          <div className="absolute z-[1000] w-full bg-white border rounded shadow-lg mt-1 max-h-48 overflow-y-auto">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => pickSuggestion(s)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-0">
                📍 {s.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="rounded overflow-hidden border" style={{ height: 300 }}>
        <MapContainer center={center} zoom={lat && lng ? 15 : 11} style={{ height: '100%', width: '100%' }} zoomControl>
          <TileLayer
            attribution='© OpenStreetMap © CARTO'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <FlyTo pos={flyPos} />
          <MapClickHandler onMapClick={(lt, ln) => { onChange(lt, ln); setFlyPos([lt, ln]) }} />
          {lat && lng && <Marker position={[lat, lng]} icon={icon} />}
        </MapContainer>
      </div>

      {lat && lng ? (
        <p className="text-xs text-gray-500">📍 {lat.toFixed(5)}, {lng.toFixed(5)} — Klik peta untuk pindah titik</p>
      ) : (
        <p className="text-xs text-gray-400">Cari alamat atau klik langsung di peta untuk menentukan lokasi</p>
      )}
    </div>
  )
}

export default function Settings() {
  const { logout } = useAuthStore()
  const [profile, setProfile] = useState<any>(null)
  const [hours, setHours] = useState<Record<string, { open: string; close: string; is_open: boolean }>>(DEFAULT_HOURS)
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get('/vendor/profile').then((r) => {
      setProfile(r.data)
      setHours(parseHours(r.data.operating_hours))
    }).catch(() => setLoadError(true))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/vendor/profile', { ...profile, operating_hours: serializeHours(hours) })
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
          <Field label="Lokasi Usaha di Peta">
            <LocationMap
              lat={profile.lat}
              lng={profile.lng}
              onChange={(lat, lng) => setProfile({ ...profile, lat, lng })}
            />
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
          <h2 className="font-semibold text-gray-800">Jam Operasional</h2>
          <div className="space-y-3">
            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-3">
                <div className="w-16 text-sm text-gray-600 font-medium">{day}</div>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hours[day].is_open}
                    onChange={(e) => setHours({ ...hours, [day]: { ...hours[day], is_open: e.target.checked } })}
                    className="accent-primary w-4 h-4"
                  />
                  <span className="text-sm text-gray-500">{hours[day].is_open ? 'Buka' : 'Tutup'}</span>
                </label>
                {hours[day].is_open && (
                  <>
                    <input
                      type="time"
                      value={hours[day].open}
                      onChange={(e) => setHours({ ...hours, [day]: { ...hours[day], open: e.target.value } })}
                      className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-gray-400 text-sm">—</span>
                    <input
                      type="time"
                      value={hours[day].close}
                      onChange={(e) => setHours({ ...hours, [day]: { ...hours[day], close: e.target.value } })}
                      className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
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
