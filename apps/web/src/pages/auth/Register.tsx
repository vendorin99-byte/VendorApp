import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'

const CATEGORIES = ['Wedding Organizer', 'Fotografer', 'Event Organizer', 'Katering', 'Dekorasi', 'Sewa Mobil', 'Musik', 'Videotron', 'Lighting', 'Venue']

const FAQ = [
  {
    q: 'Dokumen apa yang diperlukan?',
    a: 'KTP pemilik/penanggung jawab wajib untuk semua jenis. NIB atau AKTA Perusahaan diperlukan khusus untuk badan usaha (Perusahaan).',
  },
  {
    q: 'Apakah data saya aman?',
    a: 'Semua dokumen disimpan secara terenkripsi dan hanya dapat diakses oleh tim verifikasi internal. Data tidak dibagikan ke pihak ketiga tanpa persetujuan Anda.',
  },
  {
    q: 'Berapa lama proses verifikasi?',
    a: 'Proses verifikasi berlangsung 1–3 hari kerja. Anda akan mendapat notifikasi email setelah verifikasi selesai.',
  },
  {
    q: 'Apa tujuan pengumpulan data ini?',
    a: 'Data dikumpulkan sesuai UU PDP (Perlindungan Data Pribadi) untuk memverifikasi identitas vendor, mencegah penipuan, dan memenuhi kewajiban pelaporan pajak.',
  },
]

function FileUpload({ id, label, required, value, onChange }: { id: string; label: string; required?: boolean; value: File | null; onChange: (f: File | null) => void }) {
  return (
    <div className="border border-dashed border-white/20 rounded-xl px-4 py-4 text-center">
      <input type="file" accept="image/*,.pdf" required={required} onChange={(e) => onChange(e.target.files?.[0] || null)} className="hidden" id={id} />
      <label htmlFor={id} className="cursor-pointer">
        <p className="text-white/40 text-sm">{value ? <span className="text-green-400">{value.name}</span> : `📎 ${label}`}</p>
        <p className="text-white/25 text-xs mt-1">JPG, PNG, PDF — Maks 5MB</p>
      </label>
    </div>
  )
}

type VendorType = 'perusahaan' | 'perorangan'

export default function Register() {
  const navigate = useNavigate()
  const [vendorType, setVendorType] = useState<VendorType>('perusahaan')
  const [form, setForm] = useState({
    business_name: '', name: '', email: '', phone: '',
    category: '', city: '', password: '', npwp: '',
  })
  const [ktp, setKtp] = useState<File | null>(null)
  const [nib, setNib] = useState<File | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ktp) return setError('Foto KTP wajib diupload')
    if (vendorType === 'perusahaan' && !nib) return setError('Dokumen NIB / AKTA Perusahaan wajib diupload')
    if (!agreed) return setError('Anda harus menyetujui kebijakan pengumpulan data')
    setLoading(true)
    setError('')
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      fd.append('vendor_type', vendorType)
      fd.append('ktp', ktp)
      if (nib) fd.append('nib', nib)
      await api.post('/auth/register-vendor', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      navigate('/mitra/waiting')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Pendaftaran gagal')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:bg-white/15 transition-colors [color-scheme:dark]'
  const labelClass = 'block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wider'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 via-primary to-blue-500 px-4 py-8">
      <div className="w-full max-w-4xl bg-dark-card rounded-3xl shadow-2xl overflow-hidden flex min-h-[560px]">

        {/* Left panel — desktop only */}
        <div className="hidden md:flex flex-col items-center justify-center w-2/5 bg-gradient-to-b from-primary to-blue-800 p-10 gap-6">
          <img src="/Logo.png" alt="VendorApp" className="w-24 h-24 object-contain" />
          <div className="text-center">
            <p className="text-white/60 text-sm font-medium tracking-widest uppercase mb-1">Daftar Sebagai</p>
            <h1 className="text-white font-bold text-2xl tracking-widest">VENDOR</h1>
          </div>
          <div className="space-y-3 w-full mt-4">
            {['Jangkau lebih banyak pelanggan', 'Kelola pesanan dengan mudah', 'Terima pembayaran aman'].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <span className="text-green-400 text-sm">✓</span>
                <span className="text-white/70 text-xs">{t}</span>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="w-full mt-2 space-y-2">
            <p className="text-white/40 text-xs uppercase tracking-wider font-medium">FAQ Pendaftaran</p>
            {FAQ.map((f, i) => (
              <div key={i} className="border border-white/10 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-3 py-2 text-xs text-white/70 flex justify-between items-center hover:bg-white/5"
                >
                  <span>{f.q}</span>
                  <span className="text-white/40">{openFaq === i ? '▲' : '▼'}</span>
                </button>
                {openFaq === i && (
                  <div className="px-3 pb-3 text-xs text-white/50 leading-relaxed">{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 flex flex-col justify-center p-6 sm:p-8 md:p-10 overflow-y-auto">
          {/* Mobile logo */}
          <div className="flex md:hidden justify-center mb-4">
            <img src="/Logo.png" alt="VendorApp" className="w-14 h-14 object-contain" />
          </div>

          {/* Vendor type tabs */}
          <div className="flex rounded-xl overflow-hidden border border-white/15 mb-5 bg-white/5">
            <button
              type="button"
              onClick={() => { setVendorType('perusahaan'); setNib(null) }}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${vendorType === 'perusahaan' ? 'bg-primary text-white' : 'text-white/50 hover:text-white/80'}`}
            >
              🏢 Perusahaan
            </button>
            <button
              type="button"
              onClick={() => { setVendorType('perorangan'); setNib(null) }}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${vendorType === 'perorangan' ? 'bg-primary text-white' : 'text-white/50 hover:text-white/80'}`}
            >
              👤 Perorangan
            </button>
          </div>

          <h2 className="text-white font-bold text-xl sm:text-2xl mb-1">Kembangkan Bisnis Anda</h2>
          <p className="text-white/50 text-sm mb-5">
            {vendorType === 'perusahaan'
              ? 'Daftar sebagai badan usaha — KTP dan NIB/AKTA wajib'
              : 'Daftar sebagai perorangan — cukup KTP saja'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nama Bisnis</label>
                <input type="text" required value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} className={inputClass} placeholder="Nama bisnis Anda" />
              </div>
              <div>
                <label className={labelClass}>Nama Lengkap (KTP)</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Sesuai KTP" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Alamat Email</label>
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="contoh@email.com" />
              </div>
              <div>
                <label className={labelClass}>Nomor Telepon</label>
                <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="08123456789" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Jenis Layanan</label>
                <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass + ' appearance-none'}>
                  <option value="" className="bg-dark-card">Pilih jenis layanan</option>
                  {CATEGORIES.map((c) => <option key={c} value={c} className="bg-dark-card">{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Kota Operasional</label>
                <input type="text" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} placeholder="Jakarta" />
              </div>
            </div>

            <div>
              <label className={labelClass}>Kata Sandi</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} required
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={inputClass + ' pr-12'} placeholder="Min. 8 karakter"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 text-sm">
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Documents section */}
            <div className="border border-white/20 rounded-2xl p-4 space-y-4 bg-white/5">
              <p className="text-white/60 text-xs uppercase tracking-wider font-medium">Dokumen Identitas</p>

              <div>
                <label className={labelClass}>Foto KTP <span className="text-red-400 normal-case">* wajib</span></label>
                <FileUpload id="ktp-file" label="Klik untuk upload foto KTP" required value={ktp} onChange={setKtp} />
              </div>

              {vendorType === 'perusahaan' && (
                <>
                  <div>
                    <label className={labelClass}>NIB / AKTA Perusahaan <span className="text-red-400 normal-case">* wajib</span></label>
                    <FileUpload id="nib-file" label="Klik untuk upload NIB atau AKTA" value={nib} onChange={setNib} />
                  </div>

                  <div>
                    <label className={labelClass}>NPWP <span className="text-white/30 normal-case">(opsional)</span></label>
                    <input
                      type="text"
                      value={form.npwp}
                      onChange={(e) => setForm({ ...form, npwp: e.target.value })}
                      className={inputClass}
                      placeholder="XX.XXX.XXX.X-XXX.XXX"
                    />
                  </div>
                </>
              )}

              {vendorType === 'perorangan' && (
                <p className="text-white/40 text-xs">Untuk perorangan, hanya Foto KTP yang diperlukan.</p>
              )}
            </div>

            {/* Consent checkbox */}
            <label className={`flex items-start gap-3 cursor-pointer group rounded-xl p-3 border transition-colors ${agreed ? 'border-primary/50 bg-primary/10' : 'border-red-400/40 bg-red-500/5'}`}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0"
              />
              <span className="text-white/50 text-xs leading-relaxed group-hover:text-white/70 transition-colors">
                <span className="text-red-400 font-bold">* </span>
                Saya menyetujui pengumpulan dan pemrosesan data pribadi serta dokumen identitas saya oleh VendorApp sesuai{' '}
                <span className="text-primary underline">Kebijakan Privasi</span> dan{' '}
                <span className="text-primary underline">UU Perlindungan Data Pribadi (UU PDP)</span>.
                Data akan digunakan untuk verifikasi identitas vendor dan tidak dibagikan ke pihak ketiga.
              </span>
            </label>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit" disabled={loading || !agreed}
              className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-60 transition-colors"
            >
              {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
            </button>
          </form>

          <p className="text-center text-white/40 text-sm mt-4">
            Sudah punya akun?{' '}
            <Link to="/mitra/login" className="text-primary hover:text-blue-300 font-medium transition-colors">Masuk di sini</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
