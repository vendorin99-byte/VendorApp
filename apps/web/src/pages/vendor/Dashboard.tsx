import { useEffect, useState } from 'react'
import api from '../../services/api'

interface Stats { pending_orders: number; completed_orders: number; avg_rating: number; monthly_revenue: number }

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentOrders, setRecentOrders] = useState<any[]>([])

  useEffect(() => {
    api.get('/vendor/orders?page=1').then((r) => setRecentOrders(r.data.data?.slice(0, 5) || []))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Beranda</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pesanan Masuk', value: stats?.pending_orders ?? '-', icon: '📦', color: 'bg-blue-50 text-blue-700' },
          { label: 'Selesai', value: stats?.completed_orders ?? '-', icon: '✅', color: 'bg-green-50 text-green-700' },
          { label: 'Rating', value: stats?.avg_rating?.toFixed(1) ?? '-', icon: '⭐', color: 'bg-yellow-50 text-yellow-700' },
          { label: 'Pendapatan Bulan Ini', value: stats?.monthly_revenue ? `Rp ${(stats.monthly_revenue / 1000).toFixed(0)}rb` : '-', icon: '💰', color: 'bg-purple-50 text-purple-700' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold mb-4">Pesanan Terbaru</h2>
        {recentOrders.length === 0 ? (
          <p className="text-gray-500 text-sm">Belum ada pesanan</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">Customer</th><th className="pb-2">Paket</th><th className="pb-2">Tanggal</th><th className="pb-2">Status</th></tr></thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-b last:border-0">
                    <td className="py-2">{o.users?.name}</td>
                    <td className="py-2">{o.services?.name}</td>
                    <td className="py-2">{o.event_date}</td>
                    <td className="py-2"><span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
