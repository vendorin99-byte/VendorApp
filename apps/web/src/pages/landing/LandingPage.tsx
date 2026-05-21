import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'

const CATEGORIES = [
  { key: '', label: 'Semua', icon: '🏠' },
  { key: 'Wedding Organizer', label: 'Wedding', icon: '💒' },
  { key: 'Fotografer', label: 'Foto/Video', icon: '📷' },
  { key: 'Event Organizer', label: 'EO', icon: '🎪' },
  { key: 'Katering', label: 'Katering', icon: '🍽️' },
  { key: 'Dekorasi', label: 'Dekorasi', icon: '🎀' },
  { key: 'Musik', label: 'Musik', icon: '🎵' },
]

function FlyToUser({ pos }: { pos: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (pos) map.flyTo(pos, 14, { duration: 1.5 })
  }, [pos])
  return null
}

function makeVendorIcon(emoji: string) {
  return L.divIcon({
    className: '',
    html: `<div style="background:#3B5BDB;border-radius:50% 50% 50% 0;width:36px;height:36px;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><span style="transform:rotate(45deg);font-size:16px">${emoji}</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  })
}

function makePromoIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;display:inline-block">
      <div style="background:#F59E0B;color:#fff;border-radius:10px;padding:4px 10px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,0.3)">⚡ PROMO</div>
      <div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:7px solid #F59E0B"></div>
    </div>`,
    iconSize: [70, 30],
    iconAnchor: [35, 36],
    popupAnchor: [0, -36],
  })
}

function makeRequestIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="background:#0D9488;border-radius:50% 50% 50% 0;width:36px;height:36px;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><span style="transform:rotate(45deg);font-size:18px">🙋</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  })
}

function formatRp(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

export default function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isVendor = user?.role === 'vendor'

  const [vendors, setVendors] = useState<any[]>([])
  const [promos, setPromos] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [center] = useState<[number, number]>([-6.2, 106.816])
  const [userPos, setUserPos] = useState<[number, number] | null>(null)

  // Bid modal state
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [bidPrice, setBidPrice] = useState('')
  const [bidNote, setBidNote] = useState('')
  const [bidSubmitting, setBidSubmitting] = useState(false)
  const [bidDone, setBidDone] = useState(false)

  useEffect(() => {
    api.get('/map-promos/active').then(r => setPromos(r.data || [])).catch(() => {})
    api.get('/map-requests/active').then(r => setRequests(r.data || [])).catch(() => {})
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
        () => {} // tetap di Jakarta jika ditolak
      )
    }
  }, [])

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

  function openBid(req: any) {
    if (!isVendor) {
      navigate('/mitra/login')
      return
    }
    setSelectedRequest(req)
    setBidPrice('')
    setBidNote('')
    setBidDone(false)
  }

  async function submitBid() {
    if (!selectedRequest || !bidPrice || parseInt(bidPrice) <= 0) return
    setBidSubmitting(true)
    try {
      await api.post(`/map-requests/${selectedRequest.id}/bids`, {
        price: parseInt(bidPrice),
        note: bidNote.trim() || undefined,
      })
      setBidDone(true)
    } catch (e: any) {
      alert(e.response?.data?.error || 'Gagal mengirim penawaran')
    } finally {
      setBidSubmitting(false)
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors'

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-dark">
      {/* Full-screen map */}
      <MapContainer center={center} zoom={12} className="absolute inset-0 w-full h-full z-0" zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <FlyToUser pos={userPos} />

        {/* User location dot */}
        {userPos && (
          <Marker position={userPos} icon={L.divIcon({
            className: '',
            html: `<div style="width:16px;height:16px;background:#3B5BDB;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 3px rgba(59,91,219,0.3)"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          })}>
            <Popup><div className="text-sm font-semibold text-gray-800">📍 Lokasi Anda</div></Popup>
          </Marker>
        )}

        {/* Vendor pins */}
        {vendors.filter((v) => v.latitude && v.longitude).map((v) => (
          <Marker key={v.id} position={[parseFloat(v.latitude), parseFloat(v.longitude)]} icon={makeVendorIcon(getCatIcon(v.category))}>
            <Popup>
              <div className="p-1 min-w-[180px]">
                <p className="font-bold text-sm text-gray-900">{v.business_name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{v.category}</p>
                <p className="text-xs text-gray-500">{v.city}</p>
                {v.avg_rating && <p className="text-xs text-yellow-600 mt-1">⭐ {Number(v.avg_rating).toFixed(1)} · {v.total_reviews} ulasan</p>}
                <a href={`/vendor/${v.id}`} className="block mt-2 text-center text-xs bg-primary text-white rounded py-1.5 font-medium hover:bg-primary-dark transition-colors">
                  Lihat Profil
                </a>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Promo balloons */}
        {promos.filter((p) => p.vendors?.lat && p.vendors?.lng).map((p) => (
          <Marker key={p.id} position={[p.vendors.lat, p.vendors.lng]} icon={makePromoIcon()}>
            <Popup>
              <div className="p-1 min-w-[190px]">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-amber-500 font-bold text-xs">⚡ PROMO</span>
                  <span className="text-gray-400 text-xs">·</span>
                  <span className="text-gray-700 text-xs font-semibold">{p.vendors.business_name}</span>
                </div>
                <p className="text-sm text-gray-800 leading-snug mb-2">{p.text}</p>
                {p.vendors.avg_rating && <p className="text-xs text-yellow-600 mb-2">⭐ {Number(p.vendors.avg_rating).toFixed(1)}</p>}
                <a href={`/vendor/${p.vendors.id}`} className="block text-center text-xs bg-amber-500 text-white rounded py-1.5 font-medium hover:bg-amber-600 transition-colors">
                  Lihat Profil Vendor
                </a>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Request pins */}
        {requests.filter((r) => r.lat && r.lng).map((r) => (
          <Marker key={r.id} position={[r.lat, r.lng]} icon={makeRequestIcon()}>
            <Popup>
              <div className="p-1 min-w-[200px]">
                <div className="inline-block bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded mb-1.5">
                  🙋 {r.category || 'Umum'}
                </div>
                <p className="text-sm text-gray-800 leading-snug mb-1.5">{r.description}</p>
                {r.event_date && <p className="text-xs text-gray-500">📅 {r.event_date}</p>}
                {r.budget && <p className="text-xs text-gray-500">💰 Budget {formatRp(r.budget)}</p>}
                <button
                  onClick={() => openBid(r)}
                  className="mt-2 w-full text-center text-xs bg-teal-600 text-white rounded py-1.5 font-medium hover:bg-teal-700 transition-colors"
                >
                  {isVendor ? '💼 Kirim Penawaran' : '🔑 Login untuk Menawar'}
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">

        {/* ── Mobile top bar (< sm) ── */}
        <div className="sm:hidden pointer-events-auto px-3 pt-4 pb-2 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-dark-card/90 backdrop-blur-sm px-3 py-2 rounded shadow-lg border border-dark-border shrink-0">
              <img src="/Logo.png" alt="VendorApp" className="w-6 h-6 object-contain" />
              <span className="text-primary font-bold text-sm tracking-wider">VENDOR APP</span>
            </div>
            <div className="flex-1" />
            <Link to="/mitra/login" className="bg-dark-card/90 backdrop-blur-sm text-white border border-dark-border px-3 py-2 rounded text-xs font-medium hover:border-primary transition-colors shadow-lg whitespace-nowrap">
              Masuk
            </Link>
            <Link to="/mitra/register" className="bg-primary text-white px-3 py-2 rounded text-xs font-semibold hover:bg-primary-dark transition-colors shadow-lg whitespace-nowrap">
              Daftar
            </Link>
          </div>
          <div className="flex items-center bg-dark-card/90 backdrop-blur-sm rounded px-3 py-2.5 shadow-lg border border-dark-border gap-2">
            <span className="text-white/40 text-sm shrink-0">🔍</span>
            <input type="text" placeholder="Cari vendor EO, fotografer..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-white/30 text-sm outline-none min-w-0" />
          </div>
        </div>

        {/* ── Desktop top bar (≥ sm) ── */}
        <div className="hidden sm:flex pointer-events-auto items-center gap-3 px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 bg-dark-card/90 backdrop-blur-sm px-4 py-2.5 rounded shadow-lg border border-dark-border shrink-0">
            <img src="/Logo.png" alt="VendorApp" className="w-7 h-7 object-contain" />
            <span className="text-primary font-bold text-base tracking-wider">VENDOR APP</span>
          </div>
          <div className="flex-1 flex items-center bg-dark-card/90 backdrop-blur-sm rounded px-4 py-2.5 shadow-lg border border-dark-border gap-2">
            <span className="text-white/40 text-sm">🔍</span>
            <input type="text" placeholder="Cari vendor EO, fotografer, katering..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-white/30 text-sm outline-none" />
          </div>
          <div className="flex gap-2 shrink-0">
            <Link to="/mitra/login" className="bg-dark-card/90 backdrop-blur-sm text-white border border-dark-border px-4 py-2.5 rounded text-sm font-medium hover:border-primary transition-colors shadow-lg">Masuk</Link>
            <Link to="/mitra/register" className="bg-primary text-white px-4 py-2.5 rounded text-sm font-semibold hover:bg-primary-dark transition-colors shadow-lg">Daftar Vendor</Link>
          </div>
        </div>

        {/* Category chips */}
        <div className="pointer-events-auto px-3 sm:px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {CATEGORIES.map((c) => (
              <button key={c.key} onClick={() => setCategory(c.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-all shadow-md border ${
                  category === c.key ? 'bg-primary text-white border-primary' : 'bg-dark-card/90 backdrop-blur-sm text-white/80 border-dark-border hover:border-primary'
                }`}>
                <span>{c.icon}</span><span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Map legend */}
        <div className="pointer-events-auto px-3 sm:px-4">
          <div className="inline-flex items-center gap-3 bg-dark-card/80 backdrop-blur-sm px-3 py-1.5 rounded border border-dark-border text-xs text-white/60">
            <span>📍 {vendors.length} vendor</span>
            <span>⚡ {promos.length} promo</span>
            <span>🙋 {requests.length} permintaan</span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom hint */}
        <div className="pointer-events-none flex justify-center pb-4">
          <div className="bg-dark-card/90 backdrop-blur-sm text-white/60 text-xs px-5 py-2 rounded border border-dark-border shadow-lg">
            Klik pin untuk melihat detail vendor
          </div>
        </div>
      </div>

      {/* ── Bid Modal ── */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={() => setSelectedRequest(null)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-[4px] sm:rounded p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {bidDone ? (
              <div className="text-center py-4">
                <div className="text-5xl mb-3">✅</div>
                <p className="font-bold text-gray-900 text-lg">Penawaran Terkirim!</p>
                <p className="text-gray-500 text-sm mt-1 mb-5">Customer akan mendapat notifikasi dan menghubungi Anda jika tertarik.</p>
                <button onClick={() => setSelectedRequest(null)} className="w-full bg-primary text-white py-3 rounded font-semibold text-sm">
                  Tutup
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-bold text-gray-900 text-lg mb-1">💼 Kirim Penawaran</h3>
                <div className="bg-teal-50 rounded p-3 mb-4">
                  <span className="inline-block bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded mb-1">{selectedRequest.category || 'Umum'}</span>
                  <p className="text-gray-800 text-sm leading-snug">{selectedRequest.description}</p>
                  {selectedRequest.event_date && <p className="text-gray-500 text-xs mt-1">📅 {selectedRequest.event_date}</p>}
                  {selectedRequest.budget && <p className="text-gray-500 text-xs">💰 Budget {formatRp(selectedRequest.budget)}</p>}
                </div>

                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Harga Penawaran Anda (Rp) *</label>
                <input
                  type="number"
                  placeholder="Masukkan harga"
                  value={bidPrice}
                  onChange={(e) => setBidPrice(e.target.value)}
                  className={inputCls + ' mb-3'}
                />

                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Catatan (opsional)</label>
                <textarea
                  placeholder="Jelaskan apa yang termasuk dalam harga ini..."
                  value={bidNote}
                  onChange={(e) => setBidNote(e.target.value)}
                  rows={3}
                  className={inputCls + ' resize-none mb-4'}
                />

                <div className="flex gap-3">
                  <button onClick={() => setSelectedRequest(null)} className="flex-1 border border-gray-200 text-gray-500 py-3 rounded text-sm font-medium hover:bg-gray-50">
                    Batal
                  </button>
                  <button onClick={submitBid} disabled={bidSubmitting || !bidPrice}
                    className="flex-2 flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-3 rounded text-sm font-bold transition-colors">
                    {bidSubmitting ? 'Mengirim...' : 'Kirim Penawaran'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
