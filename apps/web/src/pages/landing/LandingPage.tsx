import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import api from '../../services/api'

const CATEGORIES = [
  { key: '', label: 'Semua', icon: '🏠' },
  { key: 'Wedding Organizer', label: 'Wedding', icon: '💒' },
  { key: 'Fotografer', label: 'Foto/Video', icon: '📷' },
  { key: 'Event Organizer', label: 'EO', icon: '🎪' },
  { key: 'Katering', label: 'Katering', icon: '🍽️' },
  { key: 'Dekorasi', label: 'Dekorasi', icon: '🎀' },
  { key: 'Musik', label: 'Musik', icon: '🎵' },
]

function makeIcon(emoji: string) {
  return L.divIcon({
    className: '',
    html: `<div style="background:#3B5BDB;border-radius:50% 50% 50% 0;width:36px;height:36px;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><span style="transform:rotate(45deg);font-size:16px">${emoji}</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  })
}

export default function LandingPage() {
  const [vendors, setVendors] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [center] = useState<[number, number]>([-6.2, 106.816])

  useEffect(() => {
    const params: Record<string, string> = {}
    if (search) params.search = search
    if (category) params.category = category
    api.get('/vendors', { params }).then((r) => setVendors(r.data.data || [])).catch(() => {})
  }, [search, category])

  function getCatIcon(cat: string) {
    const found = CATEGORIES.find((c) => c.key === cat)
    return found?.icon || '📍'
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-dark">
      {/* Full-screen map */}
      <MapContainer
        center={center}
        zoom={12}
        className="absolute inset-0 w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {vendors.filter((v) => v.latitude && v.longitude).map((v) => (
          <Marker
            key={v.id}
            position={[parseFloat(v.latitude), parseFloat(v.longitude)]}
            icon={makeIcon(getCatIcon(v.category))}
          >
            <Popup>
              <div className="p-1 min-w-[180px]">
                <p className="font-bold text-sm text-gray-900">{v.business_name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{v.category}</p>
                <p className="text-xs text-gray-500">{v.city}</p>
                {v.avg_rating && (
                  <p className="text-xs text-yellow-600 mt-1">⭐ {Number(v.avg_rating).toFixed(1)} · {v.total_reviews} ulasan</p>
                )}
                <a
                  href={`/vendor/${v.id}`}
                  className="block mt-2 text-center text-xs bg-primary text-white rounded-lg py-1.5 font-medium hover:bg-primary-dark transition-colors"
                >
                  Lihat Profil
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Overlay — flex column so items stack naturally */}
      <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">

        {/* ── Mobile top bar (< sm) ── */}
        <div className="sm:hidden pointer-events-auto px-3 pt-4 pb-2 flex flex-col gap-2">
          {/* Row 1: Logo + Auth buttons */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-dark-card/90 backdrop-blur-sm px-3 py-2 rounded-2xl shadow-lg border border-dark-border shrink-0">
              <img src="/Logo.png" alt="VendorApp" className="w-6 h-6 object-contain" />
              <span className="text-primary font-bold text-sm tracking-wider">VENDOR APP</span>
            </div>
            <div className="flex-1" />
            <Link
              to="/mitra/login"
              className="bg-dark-card/90 backdrop-blur-sm text-white border border-dark-border px-3 py-2 rounded-xl text-xs font-medium hover:border-primary transition-colors shadow-lg whitespace-nowrap"
            >
              Masuk
            </Link>
            <Link
              to="/mitra/register"
              className="bg-primary text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-primary-dark transition-colors shadow-lg whitespace-nowrap"
            >
              Daftar
            </Link>
          </div>

          {/* Row 2: Search full width */}
          <div className="flex items-center bg-dark-card/90 backdrop-blur-sm rounded-2xl px-3 py-2.5 shadow-lg border border-dark-border gap-2">
            <span className="text-white/40 text-sm shrink-0">🔍</span>
            <input
              type="text"
              placeholder="Cari vendor EO, fotografer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-white/30 text-sm outline-none min-w-0"
            />
          </div>
        </div>

        {/* ── Desktop top bar (≥ sm) ── */}
        <div className="hidden sm:flex pointer-events-auto items-center gap-3 px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 bg-dark-card/90 backdrop-blur-sm px-4 py-2.5 rounded-2xl shadow-lg border border-dark-border shrink-0">
            <img src="/Logo.png" alt="VendorApp" className="w-7 h-7 object-contain" />
            <span className="text-primary font-bold text-base tracking-wider">VENDOR APP</span>
          </div>

          <div className="flex-1 flex items-center bg-dark-card/90 backdrop-blur-sm rounded-2xl px-4 py-2.5 shadow-lg border border-dark-border gap-2">
            <span className="text-white/40 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Cari vendor EO, fotografer, katering..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-white/30 text-sm outline-none"
            />
          </div>

          <div className="flex gap-2 shrink-0">
            <Link
              to="/mitra/login"
              className="bg-dark-card/90 backdrop-blur-sm text-white border border-dark-border px-4 py-2.5 rounded-2xl text-sm font-medium hover:border-primary transition-colors shadow-lg"
            >
              Masuk
            </Link>
            <Link
              to="/mitra/register"
              className="bg-primary text-white px-4 py-2.5 rounded-2xl text-sm font-semibold hover:bg-primary-dark transition-colors shadow-lg"
            >
              Daftar Vendor
            </Link>
          </div>
        </div>

        {/* ── Category chips (both mobile & desktop) ── */}
        <div className="pointer-events-auto px-3 sm:px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shadow-md border ${
                  category === c.key
                    ? 'bg-primary text-white border-primary'
                    : 'bg-dark-card/90 backdrop-blur-sm text-white/80 border-dark-border hover:border-primary'
                }`}
              >
                <span>{c.icon}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Map click-through area */}
        <div className="flex-1" />

        {/* Bottom info bar */}
        <div className="pointer-events-none flex justify-center pb-4">
          <div className="bg-dark-card/90 backdrop-blur-sm text-white/60 text-xs px-5 py-2 rounded-full border border-dark-border shadow-lg">
            {vendors.length > 0
              ? `${vendors.length} vendor ditemukan di peta`
              : 'Vendor ditampilkan sebagai pin di peta'}
          </div>
        </div>
      </div>
    </div>
  )
}
