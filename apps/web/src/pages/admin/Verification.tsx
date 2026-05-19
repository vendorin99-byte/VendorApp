import { useState, useEffect } from 'react'
import api from '../../services/api'

const TABS = ['pending', 'approved', 'rejected']

function DocViewer({ url, label }: { url: string; label: string }) {
  const [lightbox, setLightbox] = useState(false)
  const [err, setErr] = useState(false)
  const isPdf = url.match(/\.pdf(\?|$)/i)

  if (isPdf) {
    return (
      <div className="border rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 border-b flex items-center justify-between">
          {label}
          <a href={url} target="_blank" rel="noreferrer" className="text-primary hover:underline">Buka di tab baru ↗</a>
        </div>
        <iframe src={url} className="w-full h-64" title={label} />
      </div>
    )
  }

  return (
    <>
      <div className="border rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 border-b flex items-center justify-between">
          {label}
          <a href={url} target="_blank" rel="noreferrer" className="text-primary hover:underline">Buka di tab baru ↗</a>
        </div>
        {err ? (
          <div className="p-6 text-center text-gray-400 text-sm">Gagal memuat gambar. <a href={url} target="_blank" rel="noreferrer" className="text-primary underline">Buka langsung</a></div>
        ) : (
          <img
            src={url} alt={label}
            className="w-full object-contain max-h-72 cursor-zoom-in hover:opacity-90 transition-opacity"
            onError={() => setErr(true)}
            onClick={() => setLightbox(true)}
          />
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 text-white text-2xl font-bold hover:text-gray-300">✕</button>
          <img src={url} alt={label} className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
          <p className="absolute bottom-4 text-white/60 text-sm">{label} — klik di luar untuk tutup</p>
        </div>
      )}
    </>
  )
}

function RejectModal({ onConfirm, onClose }: { onConfirm: (reason: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
        <h3 className="font-bold text-lg">Alasan Penolakan</h3>
        <textarea
          rows={4} autoFocus
          value={reason} onChange={(e) => setReason(e.target.value)}
          className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
          placeholder="Tuliskan alasan penolakan dokumen..."
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border rounded-lg py-2 text-sm text-gray-600">Batal</button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
          >Tolak Vendor</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminVerification() {
  const [tab, setTab] = useState('pending')
  const [vendors, setVendors] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [detail, setDetail] = useState<any>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [acting, setActing] = useState(false)

  async function reload() {
    const r = await api.get(`/admin/verification?status=${tab}`)
    setVendors(r.data.data || [])
  }

  useEffect(() => { reload() }, [tab])

  async function openDetail(vendor: any) {
    setSelected(vendor)
    setDetail(null)
    setLoadingDetail(true)
    try {
      const r = await api.get(`/admin/verification/${vendor.id}`)
      setDetail(r.data)
    } catch {
      setDetail({ error: true })
    } finally {
      setLoadingDetail(false)
    }
  }

  function closeDetail() { setSelected(null); setDetail(null) }

  async function approve() {
    setActing(true)
    try {
      await api.post(`/admin/verification/${selected.id}/approve`)
      closeDetail(); reload()
    } finally { setActing(false) }
  }

  async function handleReject(reason: string) {
    setActing(true)
    try {
      await api.post(`/admin/verification/${selected.id}/reject`, { reason })
      setShowReject(false); closeDetail(); reload()
    } finally { setActing(false) }
  }

  const INFO_ROWS = detail ? [
    ['Nama Bisnis', detail.business_name],
    ['Nama Pemilik', detail.users?.name],
    ['Email', detail.users?.email],
    ['Telepon', detail.users?.phone],
    ['Kategori', detail.category],
    ['Kota', detail.city],
    ['NPWP', detail.npwp],
    ['Deskripsi', detail.description],
    ['Jangkauan', detail.service_radius_km ? `${detail.service_radius_km} km` : null],
    ['WhatsApp', detail.whatsapp],
    ['Alamat', detail.address],
    ['Ditolak karena', detail.rejected_reason],
  ].filter(([, v]) => v) : []

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Verifikasi Vendor</h1>

      <div className="flex gap-2 border-b">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}>
            {t === 'pending' ? 'Menunggu' : t === 'approved' ? 'Disetujui' : 'Ditolak'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>{['Nama Bisnis', 'Kategori', 'Kota', 'Daftar', 'Aksi'].map((h) => (
              <th key={h} className="px-4 py-3 font-medium">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{v.business_name}</td>
                <td className="px-4 py-3 text-gray-600">{v.category}</td>
                <td className="px-4 py-3 text-gray-600">{v.city}</td>
                <td className="px-4 py-3 text-gray-400">{new Date(v.created_at).toLocaleDateString('id-ID')}</td>
                <td className="px-4 py-3">
                  <button onClick={() => openDetail(v)} className="text-primary text-xs font-medium hover:underline">Lihat Detail →</button>
                </td>
              </tr>
            ))}
            {!vendors.length && <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">Tidak ada data</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Side drawer */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={closeDetail} />
          <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white z-50 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
              <div>
                <h2 className="font-bold text-lg">{selected.business_name}</h2>
                <p className="text-sm text-gray-400">{selected.category} · {selected.city}</p>
              </div>
              <button onClick={closeDetail} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">✕</button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingDetail && (
                <div className="flex items-center justify-center py-20 text-gray-400">Memuat detail...</div>
              )}

              {detail?.error && (
                <div className="text-red-500 text-sm text-center py-10">Gagal memuat detail. Coba lagi.</div>
              )}

              {detail && !detail.error && (
                <>
                  {/* Info fields */}
                  <section>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Informasi Bisnis</h3>
                    <div className="bg-gray-50 rounded-xl divide-y">
                      {INFO_ROWS.map(([label, value]) => (
                        <div key={label} className="flex gap-4 px-4 py-3 text-sm">
                          <span className="text-gray-400 w-36 shrink-0">{label}</span>
                          <span className="font-medium text-gray-900 break-all">{value}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Documents */}
                  <section>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Dokumen Identitas</h3>
                    <div className="space-y-4">
                      {detail.ktp_signed_url
                        ? <DocViewer url={detail.ktp_signed_url} label="Foto KTP" />
                        : <div className="border border-dashed rounded-xl p-6 text-center text-gray-400 text-sm">KTP belum diupload</div>
                      }
                      {detail.nib_signed_url
                        ? <DocViewer url={detail.nib_signed_url} label="NIB / AKTA Perusahaan" />
                        : <div className="border border-dashed rounded-xl p-6 text-center text-gray-400 text-sm">NIB / AKTA belum diupload</div>
                      }
                    </div>
                  </section>

                  {/* Status badge */}
                  <section>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Status</h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      detail.verified ? 'bg-green-100 text-green-700' :
                      detail.rejected_reason ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {detail.verified ? 'Disetujui' : detail.rejected_reason ? 'Ditolak' : 'Menunggu Verifikasi'}
                    </span>
                  </section>
                </>
              )}
            </div>

            {/* Footer actions */}
            {tab === 'pending' && detail && !detail.error && (
              <div className="flex gap-3 px-6 py-4 border-t flex-shrink-0 bg-white">
                <button onClick={closeDetail} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">Tutup</button>
                <div className="flex-1" />
                <button
                  onClick={() => setShowReject(true)}
                  disabled={acting}
                  className="px-5 py-2 text-sm bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50"
                >Tolak</button>
                <button
                  onClick={approve}
                  disabled={acting}
                  className="px-5 py-2 text-sm bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50"
                >{acting ? 'Memproses...' : 'Setujui'}</button>
              </div>
            )}
            {tab !== 'pending' && (
              <div className="px-6 py-4 border-t flex-shrink-0">
                <button onClick={closeDetail} className="w-full py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">Tutup</button>
              </div>
            )}
          </div>
        </>
      )}

      {showReject && (
        <RejectModal onConfirm={handleReject} onClose={() => setShowReject(false)} />
      )}
    </div>
  )
}
