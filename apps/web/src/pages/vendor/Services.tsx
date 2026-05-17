import { useState, useEffect } from 'react'
import api from '../../services/api'
import { formatRp } from '../../utils/currency'

interface Service { id: string; name: string; description: string; price: number; dp_percent: number; duration: string; is_active: boolean }

const empty = { name: '', description: '', price: 0, dp_percent: 30, duration: '', is_active: true }

export default function Services() {
  const [services, setServices] = useState<Service[]>([])
  const [form, setForm] = useState<Omit<Service, 'id'>>(empty)
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  async function reload() {
    const r = await api.get('/vendor/services')
    setServices(r.data || [])
  }

  useEffect(() => { reload() }, [])

  function openCreate() { setForm(empty); setEditId(null); setShowForm(true) }
  function openEdit(s: Service) { setForm({ name: s.name, description: s.description, price: s.price, dp_percent: s.dp_percent, duration: s.duration, is_active: s.is_active }); setEditId(s.id); setShowForm(true) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (editId) await api.put(`/vendor/services/${editId}`, form)
    else await api.post('/vendor/services', form)
    setShowForm(false)
    reload()
  }

  async function toggleActive(s: Service) {
    await api.put(`/vendor/services/${s.id}`, { is_active: !s.is_active })
    reload()
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Hapus paket ini?')) return
    await api.delete(`/vendor/services/${id}`)
    reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Paket Layanan</h1>
        <button onClick={openCreate} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
          + Tambah Paket
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((s) => (
          <div key={s.id} className={`bg-white rounded-xl border p-4 flex flex-col gap-3 ${!s.is_active ? 'opacity-60' : ''}`}>
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900">{s.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {s.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              {s.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{s.description}</p>}
            </div>
            <div className="text-xl font-bold text-primary">{formatRp(s.price)}</div>
            <div className="text-xs text-gray-400 flex gap-3">
              <span>DP {s.dp_percent}%</span>
              {s.duration && <span>⏱ {s.duration}</span>}
            </div>
            <div className="flex gap-2 pt-1 border-t">
              <button onClick={() => openEdit(s)} className="flex-1 border rounded-lg py-1.5 text-sm text-gray-700 hover:bg-gray-50">Edit</button>
              <button onClick={() => toggleActive(s)} className="flex-1 border rounded-lg py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                {s.is_active ? 'Nonaktifkan' : 'Aktifkan'}
              </button>
              <button onClick={() => handleDelete(s.id)} className="px-3 border border-red-200 text-red-500 rounded-lg py-1.5 text-sm hover:bg-red-50">🗑</button>
            </div>
          </div>
        ))}

        {!services.length && (
          <div className="col-span-3 text-center text-gray-400 py-12 text-sm">
            Belum ada paket layanan. Tambahkan paket pertama Anda.
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4">
            <h2 className="text-xl font-bold">{editId ? 'Edit Paket' : 'Tambah Paket Baru'}</h2>

            <Field label="Nama Paket">
              <input required className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Paket Wedding Basic" />
            </Field>
            <Field label="Deskripsi">
              <textarea rows={3} className={input} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi layanan..." />
            </Field>
            <Field label="Harga (Rp)">
              <input type="number" required min={0} className={input} value={form.price || ''} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) })} />
            </Field>
            <Field label={`DP Minimal: ${form.dp_percent}%`}>
              <input type="range" min={20} max={50} className="w-full" value={form.dp_percent} onChange={(e) => setForm({ ...form, dp_percent: parseInt(e.target.value) })} />
            </Field>
            <Field label="Durasi Layanan">
              <input className={input} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="cth: 8 jam / 1 hari" />
            </Field>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 border rounded-lg py-2 text-sm">Batal</button>
              <button type="submit" className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-medium">Simpan</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

const input = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary'
