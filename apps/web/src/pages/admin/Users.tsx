import { useState, useEffect } from 'react'
import api from '../../services/api'

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [role, setRole] = useState('customer')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [modal, setModal] = useState<'reset' | 'location' | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [saving, setSaving] = useState(false)

  async function reload() {
    try {
      const r = await api.get(`/admin/users?role=${role}&search=${search}`)
      setUsers(r.data.data || [])
    } catch {}
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

  async function handleResetPassword() {
    if (!newPassword || newPassword.length < 8) return alert('Password minimal 8 karakter')
    setSaving(true)
    try {
      await api.patch(`/admin/users/${selected.id}/reset-password`, { password: newPassword })
      alert('Password berhasil direset')
      setModal(null)
      setNewPassword('')
    } catch { alert('Gagal reset password') }
    finally { setSaving(false) }
  }

  async function handleUpdateLocation() {
    if (!lat || !lng) return alert('Lat dan Lng wajib diisi')
    setSaving(true)
    try {
      await api.patch(`/admin/users/${selected.id}/location`, { lat: parseFloat(lat), lng: parseFloat(lng) })
      alert('Lokasi berhasil diupdate')
      setModal(null)
    } catch { alert('Gagal update lokasi') }
    finally { setSaving(false) }
  }

  function openModal(user: any, type: 'reset' | 'location') {
    setSelected(user)
    setModal(type)
    setNewPassword('')
    setLat(user.vendors?.lat || '')
    setLng(user.vendors?.lng || '')
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Manajemen User</h1>

      <div className="flex gap-3 flex-wrap">
        <div className="flex rounded-lg border overflow-hidden text-sm">
          {['customer', 'vendor'].map((r) => (
            <button key={r} onClick={() => setRole(r)}
              className={`px-4 py-2 capitalize ${role === r ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              {r === 'customer' ? 'Customer' : 'Vendor'}
            </button>
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
            <tr>
              {['Nama', 'Email', 'Telepon', 'Status', 'Daftar', 'Aksi'].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3 text-gray-500">{u.phone || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {u.is_active ? 'Aktif' : 'Tersuspend'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">{new Date(u.created_at).toLocaleDateString('id-ID')}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 flex-wrap">
                    {u.is_active
                      ? <button onClick={() => suspend(u.id)} className="text-red-500 text-xs hover:underline">Suspend</button>
                      : <button onClick={() => activate(u.id)} className="text-green-600 text-xs hover:underline">Aktifkan</button>
                    }
                    <button onClick={() => openModal(u, 'reset')} className="text-blue-500 text-xs hover:underline">Reset PW</button>
                    {role === 'vendor' && (
                      <button onClick={() => openModal(u, 'location')} className="text-purple-500 text-xs hover:underline">Lokasi</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!users.length && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Tidak ada user</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Reset Password */}
      {modal === 'reset' && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4">
            <h2 className="font-bold text-lg">Reset Password</h2>
            <p className="text-sm text-gray-500">{selected.name} — {selected.email}</p>
            <input
              type="password"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Password baru (min. 8 karakter)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleResetPassword} disabled={saving} className="px-4 py-2 text-sm bg-primary text-white rounded-lg disabled:opacity-60">
                {saving ? 'Menyimpan...' : 'Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Update Lokasi */}
      {modal === 'location' && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4">
            <h2 className="font-bold text-lg">Update Lokasi Vendor</h2>
            <p className="text-sm text-gray-500">{selected.name}</p>
            <div className="space-y-2">
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Latitude (contoh: -6.2088)"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Longitude (contoh: 106.8456)"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleUpdateLocation} disabled={saving} className="px-4 py-2 text-sm bg-primary text-white rounded-lg disabled:opacity-60">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
