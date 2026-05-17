import { useState, useEffect } from 'react'
import api from '../../services/api'
import { formatRp } from '../../utils/currency'

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  success: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  rejected: 'bg-gray-100 text-gray-600',
}

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [filter, setFilter] = useState('pending')

  async function reload() {
    const r = await api.get(`/admin/withdrawals?status=${filter}`)
    setWithdrawals(r.data.data || [])
  }

  useEffect(() => { reload() }, [filter])

  async function approve(id: string) {
    await api.post(`/admin/withdrawals/${id}/approve`)
    setSelected(null)
    reload()
  }

  async function reject(id: string) {
    const reason = window.prompt('Alasan penolakan:')
    if (!reason) return
    await api.post(`/admin/withdrawals/${id}/reject`, { reason })
    setSelected(null)
    reload()
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Manajemen Pencairan</h1>

      <div className="flex gap-2">
        {['pending', 'processing', 'success', 'failed'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-lg border capitalize ${filter === s ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {s === 'pending' ? 'Menunggu' : s === 'processing' ? 'Diproses' : s === 'success' ? 'Berhasil' : 'Gagal'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>{['Vendor', 'Bank', 'Nominal', 'Diterima', 'Status', 'Aksi'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {withdrawals.map((w) => (
              <tr key={w.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{w.vendors?.business_name}</td>
                <td className="px-4 py-3 text-gray-500">{w.vendor_bank_accounts?.bank_code} {w.vendor_bank_accounts?.account_number}</td>
                <td className="px-4 py-3">{formatRp(w.amount)}</td>
                <td className="px-4 py-3 font-medium text-green-600">{formatRp(w.amount_received)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[w.status]}`}>{w.status}</span>
                  {!w.vendor_bank_accounts?.is_verified && <span className="ml-1 text-xs text-orange-600">⚠️ Rekening baru</span>}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => setSelected(w)} className="text-primary text-xs hover:underline">Detail</button>
                </td>
              </tr>
            ))}
            {!withdrawals.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Tidak ada data</td></tr>}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Detail Pencairan</h2>
            <div className="space-y-2 text-sm mb-5">
              {[
                ['Vendor', selected.vendors?.business_name],
                ['Email', selected.vendors?.users?.email],
                ['Bank', selected.vendor_bank_accounts?.bank_code],
                ['No. Rekening', selected.vendor_bank_accounts?.account_number],
                ['Atas Nama', selected.vendor_bank_accounts?.account_name],
                ['Nominal', formatRp(selected.amount)],
                ['Biaya Admin', formatRp(selected.admin_fee)],
                ['Yang Diterima', formatRp(selected.amount_received)],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between">
                  <span className="text-gray-400">{l}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSelected(null)} className="flex-1 border rounded-lg py-2 text-sm">Tutup</button>
              {selected.status === 'pending' && (
                <>
                  <button onClick={() => approve(selected.id)} className="flex-1 bg-green-500 text-white rounded-lg py-2 text-sm font-medium">✅ Approve</button>
                  <button onClick={() => reject(selected.id)} className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-medium">❌ Tolak</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
