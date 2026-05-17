import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const navItems = [
  { to: '/mitra/dashboard', label: 'Beranda', icon: '🏠', end: true },
  { to: '/mitra/dashboard/orders', label: 'Pesanan', icon: '📋' },
  { to: '/mitra/dashboard/chat', label: 'Pesan', icon: '💬' },
  { to: '/mitra/dashboard/wallet', label: 'Dompet', icon: '💰' },
  { to: '/mitra/dashboard/portfolio', label: 'Portofolio', icon: '🖼️' },
  { to: '/mitra/dashboard/services', label: 'Paket Layanan', icon: '📦' },
  { to: '/mitra/dashboard/ads', label: 'Iklan & Langganan', icon: '📢' },
  { to: '/mitra/dashboard/stats', label: 'Statistik', icon: '📊' },
  { to: '/mitra/dashboard/settings', label: 'Pengaturan', icon: '⚙️' },
]

export default function VendorSidebar() {
  const { user, logout } = useAuthStore()

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b flex items-center gap-3">
        <img src="/logo.png" alt="VendorApp" className="w-9 h-9 object-contain" />
        <div>
          <div className="text-primary font-bold text-lg leading-tight">VendorApp</div>
          <div className="text-xs text-gray-500 truncate">{user?.name}</div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-primary text-white font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <span>🚪</span>
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  )
}
