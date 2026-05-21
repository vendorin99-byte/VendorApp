import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import api from '../../services/api'

const REQ_CATEGORIES = ['EO', 'Fotografer', 'Wedding', 'Katering', 'Dekorasi', 'Sewa Mobil', 'Musik', 'Lainnya']

function FlyToUser({ pos }: { pos: [number, number] | null }) {
  const map = useMap()
  useEffect(() => { if (pos) map.flyTo(pos, 14, { duration: 1.5 }) }, [pos])
  return null
}

function MapController({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap()
  useEffect(() => { mapRef.current = map }, [map])
  return null
}

function formatRp(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

const requestIcon = L.divIcon({
  className: '',
  html: `<div style="background:#0D9488;border-radius:50% 50% 50% 0;width:36px;height:36px;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><span style="transform:rotate(45deg);font-size:18px">🙋</span></div>`,
  iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -40],
})

export default function VendorMaps() {
  const [requests, setRequests] = useState<any[]>([])
  const [category, setCategory] = useState('')
  const [userPos, setUserPos] = useState<[number, number] | null>(null)
  const mapRef = useRef<L.Map | null>(null)

  // Bid modal
  const [selectedReq, setSelectedReq] = useState<any>(null)
  const [bidPrice, setBidPrice] = useState('')
  const [bidNote, setBidNote] = useState('')
  const [bidSubmitting, setBidSubmitting] = useState(false)
  const [bidDone, setBidDone] = useState(false)

  useEffect(() => {
    fetchRequests()
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      )
    }
  }, [])

  function fetchRequests() {
    api.get('/map-requests/active').then(r => setRequests(r.data || [])).catch(() => {})
  }

  const filtered = category ? requests.filter(r => r.category === category) : requests

  function openBid(req: any) {
    mapRef.current?.closePopup()
    setSelectedReq(req)
    setBidPrice('')
    setBidNote('')
    setBidDone(false)
  }

  async function submitBid() {
    if (!selectedReq || !bidPrice || parseInt(bidPrice) <= 0) return
    setBidSubmitting(true)
    try {
      await api.post(`/map-requests/${selectedReq.id}/bids`, {
        price: parseInt(bidPrice),
        note: bidNote.trim() || undefined,
      })
      setBidDone(true)
      fetchRequests()
    } catch (e: any) {
      alert(e.response?.data?.error || 'Gagal mengirim penawaran')
    } finally {
      setBidSubmitting(false)
    }
  }

  const center: [number, number] = userPos || [-6.2, 106.816]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">🗺️ Peta Permintaan Jasa</h1>
        <span className="text-sm text-gray-500">{filtered.length} permintaan terbuka</span>
      </div>

      {/* Filter kategori */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setCategory('')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${!category ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
        >
          Semua
        </button>
        {REQ_CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${category === c ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Map */}
        <div className="xl:col-span-2 bg-white rounded-xl border overflow-hidden">
          <MapContainer center={center} zoom={12} style={{ height: 460, width: '100%' }} zoomControl>
            <TileLayer
              attribution='© OpenStreetMap © CARTO'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            <FlyToUser pos={userPos} />
            <MapController mapRef={mapRef} />

            {userPos && (
              <Marker position={userPos} icon={L.divIcon({
                className: '',
                html: `<div style="width:14px;height:14px;background:#3B5BDB;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 3px rgba(59,91,219,0.3)"></div>`,
                iconSize: [14, 14], iconAnchor: [7, 7],
              })}>
                <Popup><span className="text-sm font-semibold">📍 Lokasi Anda</span></Popup>
              </Marker>
            )}

            {filtered.filter(r => r.lat && r.lng).map(r => (
              <Marker key={r.id} position={[r.lat, r.lng]} icon={requestIcon}>
                <Popup>
                  <div className="p-1 min-w-[200px] space-y-1">
                    <p className="font-bold text-sm text-teal-700">{r.category || 'Jasa Umum'}</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{r.description}</p>
                    {r.event_date && <p className="text-xs text-gray-500">📅 {r.event_date}</p>}
                    {r.budget && <p className="text-xs text-gray-500">💰 Budget {formatRp(r.budget)}</p>}
                    <p className="text-xs text-gray-400">👤 {r.users?.name || 'Customer'}</p>
                    <button
                      onClick={() => openBid(r)}
                      className="w-full mt-2 bg-teal-600 text-white text-xs font-semibold py-1.5 rounded hover:bg-teal-700 transition-colors"
                    >
                      💼 Kirim Penawaran
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* List permintaan */}
        <div className="bg-white rounded-xl border overflow-hidden flex flex-col" style={{ height: 462 }}>
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-800">Daftar Permintaan</h2>
          </div>
          <div className="flex-1 overflow-y-auto divide-y">
            {filtered.length === 0 && (
              <div className="p-6 text-center text-gray-400 text-sm">
                Tidak ada permintaan{category ? ` kategori ${category}` : ''} saat ini
              </div>
            )}
            {filtered.map(r => (
              <div key={r.id} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => {
                if (r.lat && r.lng && mapRef.current) mapRef.current.flyTo([r.lat, r.lng], 16, { duration: 1 })
                openBid(r)
              }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="inline-block text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded mb-1">{r.category || 'Umum'}</span>
                    <p className="text-sm text-gray-700 line-clamp-2">{r.description}</p>
                    {r.budget && <p className="text-xs text-primary font-semibold mt-1">{formatRp(r.budget)}</p>}
                    {r.event_date && <p className="text-xs text-gray-400 mt-0.5">📅 {r.event_date}</p>}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{r.users?.name?.split(' ')[0] || 'Customer'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bid modal — portal ke body agar tidak tertumpuk stacking context layout */}
      {selectedReq && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-bold text-gray-800">💼 Kirim Penawaran</h2>
                <button onClick={() => setSelectedReq(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
              </div>

              {!bidDone ? (
                <>
                  <div className="bg-teal-50 rounded-xl p-4 space-y-1">
                    <p className="text-xs font-semibold text-teal-700">{selectedReq.category}</p>
                    <p className="text-sm text-gray-700">{selectedReq.description}</p>
                    {selectedReq.event_date && <p className="text-xs text-gray-500">📅 {selectedReq.event_date}</p>}
                    {selectedReq.budget && <p className="text-xs text-gray-500">💰 Budget {formatRp(selectedReq.budget)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Harga Penawaran Anda (Rp) *</label>
                    <input
                      type="number"
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="contoh: 5000000"
                      value={bidPrice}
                      onChange={e => setBidPrice(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
                    <textarea
                      rows={3}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Jelaskan apa yang termasuk dalam harga ini..."
                      value={bidNote}
                      onChange={e => setBidNote(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setSelectedReq(null)} className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                      Batal
                    </button>
                    <button
                      onClick={submitBid}
                      disabled={bidSubmitting || !bidPrice}
                      className="flex-1 bg-teal-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-teal-700 disabled:opacity-60 transition-colors"
                    >
                      {bidSubmitting ? 'Mengirim...' : 'Kirim Penawaran'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 space-y-3">
                  <div className="text-4xl">✅</div>
                  <p className="font-semibold text-gray-800">Penawaran Terkirim!</p>
                  <p className="text-sm text-gray-500">Customer akan mendapat notifikasi dan bisa menerima penawaran Anda.</p>
                  <button onClick={() => setSelectedReq(null)} className="bg-primary text-white rounded-lg px-6 py-2 text-sm font-medium">
                    Tutup
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
