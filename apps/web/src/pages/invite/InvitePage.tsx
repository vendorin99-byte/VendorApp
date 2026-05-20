import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

function formatRp(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

export default function InvitePage() {
  const { refCode } = useParams<{ refCode: string }>()
  const [searchParams] = useSearchParams()
  const vendorId = searchParams.get('vendor')

  const [vendor, setVendor] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!vendorId) return
    fetch(`${API_URL}/vendors/${vendorId}`)
      .then((r) => r.json())
      .then((d) => setVendor(d))
      .catch(() => {})
  }, [vendorId])

  function copyCode() {
    navigator.clipboard.writeText(refCode || '').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="px-6 py-4 flex items-center gap-2 border-b bg-white/80 backdrop-blur">
        <img src="/Logo.png" alt="VendorApp" className="w-8 h-8 object-contain" />
        <span className="text-primary font-bold text-xl">VendorApp</span>
      </header>

      <div className="max-w-md mx-auto px-4 py-10 space-y-6">

        {/* Invitation banner */}
        <div className="text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900">Kamu Diundang!</h1>
          <p className="text-gray-500 mt-2 text-sm">Seseorang mengundangmu untuk bergabung di VendorApp — platform jasa event terpercaya</p>
        </div>

        {/* Vendor card */}
        {vendor && (
          <div className="bg-white rounded-2xl border shadow-sm p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">Vendor yang direkomendasikan</p>
            <div className="flex items-start gap-4">
              {vendor.portfolios?.[0]?.image_url ? (
                <img src={vendor.portfolios[0].image_url} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-2xl font-bold">{vendor.business_name?.[0]}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-bold text-gray-900 text-base truncate">{vendor.business_name}</h2>
                  {vendor.verified && <span title="Terverifikasi">✅</span>}
                </div>
                <p className="text-sm text-gray-500">{vendor.category} • {vendor.city}</p>
                <p className="text-sm text-amber-500 font-medium mt-1">⭐ {vendor.avg_rating?.toFixed(1)} ({vendor.total_reviews} ulasan)</p>
              </div>
            </div>
            {vendor.services?.filter((s: any) => s.is_active).slice(0, 2).map((s: any) => (
              <div key={s.id} className="mt-3 flex justify-between items-center py-2 border-t text-sm">
                <span className="text-gray-700">{s.name}</span>
                <span className="text-primary font-semibold">{formatRp(s.price)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Referral code */}
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">Kode Referral</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-blue-50 border-2 border-dashed border-primary rounded-xl px-4 py-3 text-center">
              <span className="text-2xl font-bold tracking-widest text-primary">{refCode}</span>
            </div>
            <button
              onClick={copyCode}
              className="bg-primary text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors min-w-[80px]"
            >
              {copied ? '✓ Disalin!' : 'Salin'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Masukkan kode ini saat mendaftar di aplikasi VendorApp</p>
        </div>

        {/* Download section */}
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-4">Download Aplikasinya</p>
          <div className="space-y-3">
            <a
              href="#"
              className="flex items-center gap-3 border rounded-xl px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl">🍎</span>
              <div>
                <p className="text-xs text-gray-400">Download di</p>
                <p className="font-semibold text-sm">App Store (iOS)</p>
              </div>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 border rounded-xl px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl">🤖</span>
              <div>
                <p className="text-xs text-gray-400">Download di</p>
                <p className="font-semibold text-sm">Google Play (Android)</p>
              </div>
            </a>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {[
            { n: '1', t: 'Download VendorApp', d: 'Install dari App Store atau Google Play' },
            { n: '2', t: 'Daftar Akun Baru', d: `Masukkan kode referral ${refCode} saat daftar` },
            { n: '3', t: 'Temukan & Pesan Vendor', d: 'Browse ratusan vendor jasa acara terpercaya' },
          ].map((s) => (
            <div key={s.n} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{s.n}</div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{s.t}</p>
                <p className="text-gray-500 text-xs">{s.d}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">VendorApp — Platform jasa event terpercaya di Indonesia</p>
      </div>
    </div>
  )
}
