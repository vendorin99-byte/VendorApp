import { useState, useEffect } from 'react'
import api from '../../services/api'

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [role, setRole] = useState('customer')
  const [search, setSearch] = useState('')

  async function reload() {
    const r = await api.get(`/admin/users?role=${role}&search=${search}`)
    setUsers(r.data.data || [])
  }

  useEffect(() => { reload() }, [role, search])

  async function suspend(id: string) {
    if (!window.confirm('Suspend user ini?')) return
    await api.patch(`/admin/users/${id}/suspend`)
    reload()
  }

  async function activate(id: string) {
    await api.patch(`/admin/users/${id}/activate`)
    reload()
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Manajemen User</h1>

      <div className="flex gap-3 flex-wrap">
        <div className="flex rounded-lg border overflow-hidden text-sm">
          {['customer', 'vendor'].map((r) => (
            <button key={r} onClick={() => setRole(r)} className={`px-4 py-2 capitalize ${role === r ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}>{r}</button>
          ))}
        </div>
        <input
          className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-48"
          placeholder="Cari nama atau email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>{['Nama', 'Email', 'Telepon', 'Status', 'Daftar', 'Aksi'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3 text-gray-500">{u.phone || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {u.is_active ? 'Aktif' : 'Tersuspend'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">{new Date(u.created_at).toLocaleDateString('id-ID')}</td>
                <td className="px-4 py-3">
                  {u.is_active
                    ? <button onClick={() => suspend(u.id)} className="text-red-500 text-xs hover:underline">Suspend</button>
                    : <button onClick={() => activate(u.id)} className="text-green-600 text-xs hover:underline">Aktifkan</button>
                  }
                </td>
              </tr>
            ))}
            {!users.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Tidak ada user</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
