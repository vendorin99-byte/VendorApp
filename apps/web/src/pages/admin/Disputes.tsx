import { useState, useEffect } from 'react'
import api from '../../services/api'
import { formatRp } from '../../utils/currency'

const STATUS_BADGE: Record<string, string> = {
  dispute: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
  dispute_resolved: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
}

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [action, setAction] = useState<'full_refund' | 'partial_refund' | 'no_refund' | ''>('')
  const [partialAmount, setPartialAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    const r = await api.get('/admin/disputes')
    setDisputes(r.data || [])
  }

  useEffect(() => { load() }, [])

  function openModal(dispute: any) {
    setSelected(dispute)
    setAction('')
    setPartialAmount('')
    setNotes('')
  }

  function closeModal() {
    setSelected(null)
    setAction('')
  }

  async function resolve() {
    if (!action) return
    if (action === 'partial_refund' && !partialAmount) return

    setLoading(true)
    try {
      await api.post(`/admin/disputes/${selected.id}/resolve`, {
        action,
        refund_amount: action === 'partial_refund' ? Number(partialAmount) : undefined,
        notes: notes || undefined,
      })
      closeModal()
      load()
    } finally {
      setLoading(false)
    }
  }

  const maxRefund = selected ? selected.total_amount : 0

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Manajemen Dispute</h1>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              {['Vendor', 'Layanan', 'Tgl Event', 'Total', 'DP', 'Status', 'Aksi'].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {disputes.map((d) => (
              <tr key={d.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{d.vendors?.business_name}</td>
                <td className="px-4 py-3 text-gray-500">{d.services?.name}</td>
                <td className="px-4 py-3">{d.event_date}</td>
                <td className="px-4 py-3">{formatRp(d.total_amount)}</td>
                <td className="px-4 py-3">{formatRp(d.dp_amount)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[d.status] || 'bg-gray-100 text-gray-600'}`}>
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {d.status === 'dispute' && (
                    <button onClick={() => openModal(d)} className="text-primary text-xs hover:underline font-medium">
                      Selesaikan
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!disputes.length && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  Tidak ada dispute aktif
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold">Selesaikan Dispute</h2>

            <div className="space-y-1 text-sm bg-gray-50 rounded-xl p-4">
              {[
                ['Vendor', selected.vendors?.business_name],
                ['Layanan', selected.services?.name],
                ['Tgl Event', selected.event_date],
                ['Total', formatRp(selected.total_amount)],
                ['DP Dibayar', formatRp(selected.dp_amount)],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between">
                  <span className="text-gray-400">{l}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Pilih Tindakan:</p>
              {[
                { value: 'full_refund', label: 'Refund Penuh', desc: `Refund ${formatRp(selected.total_amount)} ke customer`, color: 'border-green-400 bg-green-50' },
                { value: 'partial_refund', label: 'Refund Sebagian', desc: 'Tentukan jumlah refund manual', color: 'border-yellow-400 bg-yellow-50' },
                { value: 'no_refund', label: 'Tidak Refund', desc: 'Vendor menang — escrow dilepas ke vendor', color: 'border-red-400 bg-red-50' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAction(opt.value as typeof action)}
                  className={`w-full text-left border-2 rounded-xl p-3 transition-all ${action === opt.value ? opt.color : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <p className="font-medium text-sm">{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>

            {action === 'partial_refund' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Jumlah Refund (maks {formatRp(maxRefund)})
                </label>
                <input
                  type="number"
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  max={maxRefund}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="0"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Catatan Admin (opsional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                placeholder="Alasan keputusan..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={closeModal} className="flex-1 border rounded-xl py-2.5 text-sm font-medium">
                Batal
              </button>
              <button
                onClick={resolve}
                disabled={!action || loading}
                className="flex-1 bg-primary text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Memproses...' : 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
