import { useState, useEffect } from 'react'
import api from '../../services/api'

const TABS = ['pending', 'approved', 'rejected']

export default function AdminVerification() {
  const [tab, setTab] = useState('pending')
  const [vendors, setVendors] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [detail, setDetail] = useState<any>(null)

  async function reload() {
    const r = await api.get(`/admin/verification?status=${tab}`)
    setVendors(r.data.data || [])
  }

  useEffect(() => { reload() }, [tab])

  async function openDetail(vendor: any) {
    setSelected(vendor)
    const r = await api.get(`/admin/verification/${vendor.id}`)
    setDetail(r.data)
  }

  async function approve() {
    await api.post(`/admin/verification/${selected.id}/approve`)
    setSelected(null); setDetail(null)
    reload()
  }

  async function reject() {
    const reason = window.prompt('Alasan penolakan:')
    if (!reason) return
    await api.post(`/admin/verification/${selected.id}/reject`, { reason })
    setSelected(null); setDetail(null)
    reload()
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Verifikasi Vendor</h1>

      <div className="flex gap-2 border-b">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${tab === t ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}
          >
            {t === 'pending' ? 'Menunggu' : t === 'approved' ? 'Disetujui' : 'Ditolak'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>{['Nama Bisnis', 'Kategori', 'Kota', 'Daftar', 'Aksi'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{v.business_name}</td>
                <td className="px-4 py-3">{v.category}</td>
                <td className="px-4 py-3">{v.city}</td>
                <td className="px-4 py-3 text-gray-400">{new Date(v.created_at).toLocaleDateString('id-ID')}</td>
                <td className="px-4 py-3">
                  <button onClick={() => openDetail(v)} className="text-primary text-xs hover:underline">Lihat Detail</button>
                </td>
              </tr>
            ))}
            {!vendors.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Tidak ada data</td></tr>}
          </tbody>
        </table>
      </div>

      {selected && detail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Detail Vendor</h2>
            <div className="space-y-2 text-sm mb-4">
              {[
                ['Nama Bisnis', detail.business_name],
                ['Nama Pemilik', detail.users?.name],
                ['Email', detail.users?.email],
                ['Telepon', detail.users?.phone],
                ['Kategori', detail.category],
                ['Kota', detail.city],
                ['Deskripsi', detail.description],
              ].map(([l, v]) => v ? (
                <div key={l} className="flex gap-2">
                  <span className="text-gray-400 w-32 shrink-0">{l}:</span>
                  <span className="font-medium">{v}</span>
                </div>
              ) : null)}
            </div>

            {detail.npwp && (
              <div className="flex gap-2 text-sm">
                <span className="text-gray-400 w-32 shrink-0">NPWP:</span>
                <span className="font-medium font-mono">{detail.npwp}</span>
              </div>
            )}

            {detail.ktp_signed_url && (
              <div className="mb-2">
                <p className="text-sm text-gray-500 mb-2 font-medium">Foto KTP:</p>
                <img src={detail.ktp_signed_url} alt="KTP" className="max-w-full rounded-lg border" />
              </div>
            )}

            {detail.nib_signed_url && (
              <div className="mb-2">
                <p className="text-sm text-gray-500 mb-2 font-medium">NIB / AKTA Perusahaan:</p>
                {detail.nib_signed_url.match(/\.(pdf)$/i)
                  ? <a href={detail.nib_signed_url} target="_blank" rel="noreferrer" className="text-primary text-sm underline">Buka dokumen NIB (PDF)</a>
                  : <img src={detail.nib_signed_url} alt="NIB" className="max-w-full rounded-lg border" />
                }
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setSelected(null); setDetail(null) }} className="flex-1 border rounded-lg py-2 text-sm">Tutup</button>
              {tab === 'pending' && (
                <>
                  <button onClick={approve} className="flex-1 bg-green-500 text-white rounded-lg py-2 text-sm font-medium">✅ Approve</button>
                  <button onClick={reject} className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-medium">❌ Reject</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
