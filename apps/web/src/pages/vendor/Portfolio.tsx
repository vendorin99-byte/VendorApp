import { useState, useEffect, useRef } from 'react'
import api from '../../services/api'

export default function Portfolio() {
  const [photos, setPhotos] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function reload() {
    const r = await api.get('/vendor/portfolio')
    setPhotos(r.data || [])
  }

  useEffect(() => { reload() }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const upload = await api.post('/vendor/portfolio/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      await api.post('/vendor/portfolio', { image_url: upload.data.url })
      reload()
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Hapus foto ini?')) return
    await api.delete(`/vendor/portfolio/${id}`)
    reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Portofolio</h1>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60 transition-colors"
        >
          {uploading ? 'Mengupload...' : '+ Upload Foto'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>

      <p className="text-sm text-gray-500">
        {photos.length} foto • Paket Trial/Starter: maks 20 foto. Upgrade ke Pro untuk foto tak terbatas.
      </p>

      {photos.length === 0 ? (
        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-16 text-center text-gray-400 cursor-pointer hover:border-primary transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <div className="text-4xl mb-3">🖼️</div>
          <p className="text-sm">Klik atau drag & drop untuk upload foto portofolio</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((p) => (
            <div key={p.id} className="group relative rounded-xl overflow-hidden aspect-square bg-gray-100">
              <img src={p.image_url} alt={p.caption || ''} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => handleDelete(p.id)}
                  className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
                >
                  🗑 Hapus
                </button>
              </div>
              {p.caption && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 p-2">
                  <p className="text-white text-xs truncate">{p.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
