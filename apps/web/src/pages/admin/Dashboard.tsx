import { useEffect, useState } from 'react'
import api from '../../services/api'
import { formatRp } from '../../utils/currency'

export default function AdminDashboard() {
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    api.get('/admin/reports/summary').then((r) => setSummary(r.data)).catch(() => {})
  }, [])

  const stats = [
    { label: 'Total Customer', value: summary?.total_customers ?? '-', icon: '👥', color: 'bg-blue-50 text-blue-700' },
    { label: 'Vendor Terverifikasi', value: summary?.total_vendors ?? '-', icon: '✅', color: 'bg-green-50 text-green-700' },
    { label: 'Revenue Fee', value: summary ? formatRp(summary.total_revenue_fee) : '-', icon: '💰', color: 'bg-purple-50 text-purple-700' },
    { label: 'Pending Verifikasi', value: '-', icon: '⏳', color: 'bg-yellow-50 text-yellow-700' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Admin</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl p-5 ${s.color}`}>
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm opacity-80 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold mb-3">Aksi Cepat</h2>
          <div className="space-y-2">
            {[
              { label: 'Vendor menunggu verifikasi', href: '/x-ctrl-panel/verification', badge: '🔴' },
              { label: 'Pencairan menunggu approval', href: '/x-ctrl-panel/withdrawals', badge: '🟡' },
              { label: 'Dispute aktif', href: '/x-ctrl-panel/disputes', badge: '⚠️' },
            ].map((a) => (
              <a key={a.label} href={a.href} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                <span className="text-sm">{a.badge} {a.label}</span>
                <span className="text-gray-400 group-hover:text-primary transition-colors">→</span>
              </a>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold mb-3">Info Sistem</h2>
          <div className="text-sm text-gray-600 space-y-2">
            <div className="flex justify-between"><span>Fee Transaksi</span><span className="font-medium">1–2%</span></div>
            <div className="flex justify-between"><span>Min. Pencairan</span><span className="font-medium">Rp 50.000</span></div>
            <div className="flex justify-between"><span>Biaya Admin Transfer</span><span className="font-medium">Rp 5.000</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
