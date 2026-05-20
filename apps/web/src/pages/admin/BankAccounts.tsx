import { useState, useEffect } from 'react'
import api from '../../services/api'

const TABS = ['pending', 'verified']

export default function AdminBankAccounts() {
  const [tab, setTab] = useState('pending')
  const [accounts, setAccounts] = useState<any[]>([])
  const [acting, setActing] = useState<string | null>(null)

  async function reload() {
    try {
      const r = await api.get(`/admin/bank-accounts?status=${tab}`)
      setAccounts(r.data.data || [])
    } catch {}
  }

  useEffect(() => { reload() }, [tab])

  async function verify(id: string) {
    setActing(id)
    try {
      await api.patch(`/admin/bank-accounts/${id}/verify`)
      reload()
    } finally { setActing(null) }
  }

  async function reject(id: string) {
    if (!window.confirm('Tolak dan hapus rekening ini?')) return
    setActing(id)
    try {
      await api.patch(`/admin/bank-accounts/${id}/reject`)
      reload()
    } finally { setActing(null) }
  }

  async function remove(id: string) {
    if (!window.confirm('Hapus rekening ini dari sistem?')) return
    setActing(id)
    try {
      await api.delete(`/admin/bank-accounts/${id}`)
      reload()
    } finally { setActing(null) }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Rekening Bank Vendor</h1>

      <div className="flex gap-2 border-b">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}>
            {t === 'pending' ? 'Menunggu Verifikasi' : 'Sudah Terverifikasi'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              {['Vendor', 'Bank', 'No. Rekening', 'Nama Pemilik', 'Default', 'Aksi'].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{a.vendor?.business_name || '-'}</div>
                  <div className="text-xs text-gray-400">{a.vendor?.user?.email || '-'}</div>
                </td>
                <td className="px-4 py-3 font-mono font-medium">{a.bank_code}</td>
                <td className="px-4 py-3 font-mono">{a.account_number_masked}</td>
                <td className="px-4 py-3">{a.account_name}</td>
                <td className="px-4 py-3">
                  {a.is_default
                    ? <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Default</span>
                    : <span className="text-xs text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {tab === 'pending' && (
                      <>
                        <button
                          onClick={() => verify(a.id)}
                          disabled={acting === a.id}
                          className="text-xs text-green-600 font-medium hover:underline disabled:opacity-50"
                        >
                          {acting === a.id ? '...' : '✓ Verifikasi'}
                        </button>
                        <button
                          onClick={() => reject(a.id)}
                          disabled={acting === a.id}
                          className="text-xs text-red-500 hover:underline disabled:opacity-50"
                        >Tolak</button>
                      </>
                    )}
                    {tab === 'verified' && (
                      <button
                        onClick={() => remove(a.id)}
                        disabled={acting === a.id}
                        className="text-xs text-red-400 hover:underline disabled:opacity-50"
                      >Hapus</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!accounts.length && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  {tab === 'pending' ? 'Tidak ada rekening yang menunggu verifikasi' : 'Tidak ada rekening terverifikasi'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
