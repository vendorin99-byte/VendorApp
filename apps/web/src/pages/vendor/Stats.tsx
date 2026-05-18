import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../../services/api'
import { formatRp } from '../../utils/currency'

const STATUS_LABELS: Record<string, string> = {
  pending_dp: 'Menunggu DP',
  dp_paid: 'DP Dibayar',
  confirmed: 'Dikonfirmasi',
  fully_paid: 'Lunas',
  in_progress: 'Berjalan',
  done: 'Selesai',
  cancelled: 'Dibatalkan',
}

export default function Stats() {
  const [orders, setOrders] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/vendor/orders?page=1').then((r) => setOrders(r.data?.data || [])),
      api.get('/vendor/profile').then((r) => setProfile(r.data)),
    ]).finally(() => setLoading(false))
  }, [])

  const done = orders.filter((o) => o.status === 'done')
  const active = orders.filter((o) => ['dp_paid', 'confirmed', 'fully_paid', 'in_progress'].includes(o.status))
  const pending = orders.filter((o) => o.status === 'pending_dp')
  const totalRevenue = done.reduce((sum, o) => sum + (o.total_amount || 0), 0)

  const statusChart = Object.entries(STATUS_LABELS).map(([key, label]) => ({
    label,
    count: orders.filter((o) => o.status === key).length,
  })).filter((s) => s.count > 0)

  if (loading) return <div className="text-gray-400 p-8">Memuat...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Statistik</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Pesanan', value: orders.length, icon: '📋' },
          { label: 'Pesanan Selesai', value: done.length, icon: '✅' },
          { label: 'Pesanan Aktif', value: active.length, icon: '🔄' },
          { label: 'Menunggu Konfirmasi', value: pending.length, icon: '⏳' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border p-4">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border p-5">
        <div className="text-sm text-gray-500 mb-1">Total Pendapatan (pesanan selesai)</div>
        <div className="text-3xl font-bold text-primary">{formatRp(totalRevenue)}</div>
      </div>

      {profile && (
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold mb-1">Info Bisnis</h2>
          <p className="text-sm text-gray-500">⭐ Rating: {profile.avg_rating?.toFixed(1) ?? '-'} dari {profile.total_reviews ?? 0} ulasan</p>
          <p className="text-sm text-gray-500 mt-1">📍 Jangkauan: {profile.service_radius_km ?? 25} km</p>
        </div>
      )}

      {statusChart.length > 0 && (
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold mb-4">Pesanan per Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3B5BDB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
