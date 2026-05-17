import { Link } from 'react-router-dom'
import Logo from '../../components/Logo'

export default function WaitingVerify() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-10 text-center">
        <div className="flex justify-center mb-5">
          <Logo size="md" />
        </div>
        <div className="text-6xl mb-4">⏳</div>
        <h2 className="text-2xl font-bold mb-2">Dokumen Sedang Direview</h2>
        <p className="text-gray-600 mb-6">
          Tim kami sedang memverifikasi dokumen Anda. Estimasi waktu <strong>1x24 jam kerja</strong>.
          Kami akan mengirim email konfirmasi setelah proses selesai.
        </p>
        <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700 mb-6">
          Pastikan email Anda aktif untuk menerima notifikasi verifikasi.
        </div>
        <Link to="/mitra" className="text-primary font-medium hover:underline text-sm">
          Kembali ke halaman utama
        </Link>
      </div>
    </div>
  )
}
