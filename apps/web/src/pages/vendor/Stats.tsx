import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../../services/api'
import { formatRp } from '../../utils/currency'

export default function Stats() {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('monthly')
  const [revenue, setRevenue] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    api.get(`/admin/reports/revenue?period=${period}`).then((r) => setRevenue(r.data || []))
    api.get('/admin/reports/summary').then((r) => setSummary(r.data))
  }, [period])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Statistik</h1>
        <div className="flex rounded-lg border overflow-hidden text-sm">
          {(['weekly', 'monthly'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 ${period === p ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              {p === 'weekly' ? 'Mingguan' : 'Bulanan'}
            </button>
          ))}
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Customer', value: summary.total_customers, icon: '👥' },
            { label: 'Vendor Aktif', value: summary.total_vendors, icon: '🏢' },
            { label: 'Pendapatan Fee', value: formatRp(summary.total_revenue_fee), icon: '💰' },
            { label: 'Transaksi', value: '-', icon: '📊' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border p-4">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold mb-4">Grafik Pendapatan</h2>
        {revenue.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
              <Tooltip formatter={(v: any) => formatRp(v)} />
              <Line type="monotone" dataKey="total_revenue" stroke="#3B5BDB" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Belum ada data</div>
        )}
      </div>
    </div>
  )
}
