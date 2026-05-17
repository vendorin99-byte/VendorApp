import { Link } from 'react-router-dom'

const benefits = [
  { icon: '🎯', title: 'Jangkau Lebih Banyak', desc: 'Tampil di hadapan ribuan customer yang aktif mencari vendor acara' },
  { icon: '📊', title: 'Kelola dengan Mudah', desc: 'Dashboard lengkap untuk pesanan, portofolio, dan statistik bisnis Anda' },
  { icon: '💰', title: 'Bayar dengan Aman', desc: 'Sistem pembayaran escrow memastikan dana Anda terlindungi' },
]

const steps = [
  { num: '1', title: 'Daftar & Upload Dokumen', desc: 'Daftar gratis dan upload KTP untuk verifikasi' },
  { num: '2', title: 'Setup Profil Bisnis', desc: 'Tambahkan foto, paket layanan, dan lokasi usaha Anda' },
  { num: '3', title: 'Terima Pesanan', desc: 'Mulai terima pesanan dari customer di seluruh Indonesia' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="VendorApp" className="w-8 h-8 object-contain" />
          <span className="text-primary font-bold text-2xl">VendorApp</span>
        </div>
        <div className="flex gap-3">
          <Link to="/mitra/login" className="px-4 py-2 text-primary font-medium hover:underline">Masuk</Link>
          <Link to="/mitra/register" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">Daftar Gratis</Link>
        </div>
      </header>

      <section className="text-center py-20 px-6 bg-gradient-to-b from-blue-50 to-white">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Kembangkan Bisnis Anda<br />bersama VendorApp</h1>
        <p className="text-lg text-gray-600 mb-8">Platform terpercaya untuk vendor jasa acara di Indonesia</p>
        <Link to="/mitra/register" className="inline-block px-8 py-3 bg-primary text-white rounded-xl text-lg font-semibold hover:bg-primary-dark transition-colors">
          Daftar Sekarang Gratis
        </Link>
      </section>

      <section className="py-16 px-6">
        <h2 className="text-2xl font-bold text-center mb-10">Mengapa Pilih VendorApp?</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {benefits.map((b) => (
            <div key={b.title} className="text-center p-6 rounded-xl border hover:shadow-md transition-shadow">
              <div className="text-4xl mb-3">{b.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{b.title}</h3>
              <p className="text-gray-600 text-sm">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-6 bg-gray-50">
        <h2 className="text-2xl font-bold text-center mb-10">Cara Bergabung</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          {steps.map((s) => (
            <div key={s.num} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0">{s.num}</div>
              <div>
                <h3 className="font-semibold mb-1">{s.title}</h3>
                <p className="text-gray-600 text-sm">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-gray-500">
        © 2026 VendorApp. Semua hak dilindungi.
      </footer>
    </div>
  )
}
