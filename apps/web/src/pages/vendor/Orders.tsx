import { useState, useEffect } from 'react'
import api from '../../services/api'
import { formatRp } from '../../utils/currency'

const TABS = ['Semua', 'Menunggu', 'Aktif', 'Selesai', 'Dibatalkan']

const STATUS_MAP: Record<string, string[]> = {
  Semua: [],
  Menunggu: ['pending_dp'],
  Aktif: ['dp_paid', 'confirmed', 'fully_paid', 'in_progress'],
  Selesai: ['done'],
  Dibatalkan: ['cancelled'],
}

const STATUS_STYLE: Record<string, string> = {
  pending_dp: 'bg-yellow-100 text-yellow-700',
  dp_paid: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
  done: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function Orders() {
  const [tab, setTab] = useState('Semua')
  const [orders, setOrders] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)

  async function reload() {
    const r = await api.get('/vendor/orders?page=1')
    setOrders(r.data.data || [])
  }

  useEffect(() => { reload() }, [])

  const filtered = tab === 'Semua' ? orders : orders.filter((o) => STATUS_MAP[tab]?.includes(o.status))

  async function confirm(id: string) {
    await api.patch(`/vendor/orders/${id}/confirm`)
    setSelected(null)
    reload()
  }

  async function reject(id: string) {
    const reason = window.prompt('Alasan penolakan:')
    if (!reason) return
    await api.patch(`/vendor/orders/${id}/reject`, { reason })
    setSelected(null)
    reload()
  }

  async function markDone(id: string) {
    await api.patch(`/vendor/orders/${id}/done`)
    setSelected(null)
    reload()
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pesanan</h1>

      <div className="flex gap-2 border-b">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              {['Customer', 'Paket', 'Tanggal Event', 'Nominal', 'Status', 'Aksi'].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(o)}>
                <td className="px-4 py-3 font-medium">{o.users?.name}</td>
                <td className="px-4 py-3">{o.services?.name}</td>
                <td className="px-4 py-3">{o.event_date}</td>
                <td className="px-4 py-3">{formatRp(o.total_amount)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[o.status] || 'bg-gray-100'}`}>{o.status}</span>
                </td>
                <td className="px-4 py-3 text-primary text-xs">Detail →</td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Tidak ada pesanan</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Detail Pesanan</h2>
            <div className="space-y-2 text-sm mb-6">
              <Row label="Customer" value={selected.users?.name} />
              <Row label="No HP" value={selected.users?.phone || '-'} />
              <Row label="Paket" value={selected.services?.name} />
              <Row label="Tanggal Event" value={selected.event_date} />
              <Row label="Total" value={formatRp(selected.total_amount)} />
              {selected.notes && <div><span className="text-gray-500">Catatan: </span><span>{selected.notes}</span></div>}
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setSelected(null)} className="flex-1 border rounded-lg py-2 text-sm">Tutup</button>
              {selected.status === 'dp_paid' && (
                <>
                  <button onClick={() => confirm(selected.id)} className="flex-1 bg-green-500 text-white rounded-lg py-2 text-sm font-medium">✅ Terima</button>
                  <button onClick={() => reject(selected.id)} className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-medium">❌ Tolak</button>
                </>
              )}
              {selected.status === 'fully_paid' && (
                <button onClick={() => markDone(selected.id)} className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-medium">✔ Selesai</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
