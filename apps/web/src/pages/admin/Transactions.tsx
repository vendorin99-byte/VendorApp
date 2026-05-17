import { useState, useEffect } from 'react'
import api from '../../services/api'
import { formatRp } from '../../utils/currency'

const TYPE_LABEL: Record<string, string> = {
  dp: 'DP',
  remaining: 'Pelunasan',
  refund: 'Refund',
  withdrawal: 'Pencairan',
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  success: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-500',
}

const TYPE_COLOR: Record<string, string> = {
  dp: 'text-blue-600',
  remaining: 'text-green-600',
  refund: 'text-red-500',
  withdrawal: 'text-orange-500',
}

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const PAGE_SIZE = 20

  async function load(p = page) {
    const params = new URLSearchParams({ page: String(p) })
    if (status) params.set('status', status)
    if (from) params.set('from', from)
    if (to) params.set('to', to)

    const r = await api.get(`/admin/transactions?${params}`)
    setTransactions(r.data.data || [])
    setTotal(r.data.total || 0)
  }

  useEffect(() => {
    setPage(1)
    load(1)
  }, [status, from, to])

  useEffect(() => { load() }, [page])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Semua Transaksi</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Semua</option>
            <option value="pending">Pending</option>
            <option value="success">Sukses</option>
            <option value="failed">Gagal</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Dari Tanggal</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Sampai Tanggal</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {(status || from || to) && (
          <button
            onClick={() => { setStatus(''); setFrom(''); setTo('') }}
            className="text-sm text-gray-400 hover:text-gray-600 mt-4"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* Summary pill */}
      <div className="text-sm text-gray-500">
        Total <span className="font-semibold text-gray-800">{total}</span> transaksi ditemukan
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              {['Tipe', 'Nominal', 'Status', 'Booking ID', 'Invoice Xendit', 'Tanggal'].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className={`font-semibold ${TYPE_COLOR[t.type] || 'text-gray-700'}`}>
                    {TYPE_LABEL[t.type] || t.type}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">{formatRp(t.amount)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[t.status] || 'bg-gray-100 text-gray-600'}`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                  {t.booking_id ? t.booking_id.slice(0, 8) + '…' : '—'}
                </td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                  {t.xendit_invoice_id ? t.xendit_invoice_id.slice(0, 12) + '…' : '—'}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(t.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
              </tr>
            ))}
            {!transactions.length && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  Tidak ada transaksi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40"
          >
            ← Sebelumnya
          </button>
          <span className="text-sm text-gray-500">
            Halaman {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40"
          >
            Berikutnya →
          </button>
        </div>
      )}
    </div>
  )
}
