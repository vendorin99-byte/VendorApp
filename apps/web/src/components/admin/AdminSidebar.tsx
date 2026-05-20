import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const navItems = [
  { to: '/x-ctrl-panel', label: 'Dashboard', icon: '📊', end: true },
  { to: '/x-ctrl-panel/verification', label: 'Verifikasi Vendor', icon: '✅' },
  { to: '/x-ctrl-panel/withdrawals', label: 'Pencairan', icon: '💸' },
  { to: '/x-ctrl-panel/bank-accounts', label: 'Rekening Bank', icon: '🏦' },
  { to: '/x-ctrl-panel/users', label: 'Manajemen User', icon: '👥' },
  { to: '/x-ctrl-panel/transactions', label: 'Transaksi', icon: '💳' },
  { to: '/x-ctrl-panel/disputes', label: 'Dispute', icon: '⚠️' },
  { to: '/x-ctrl-panel/reports', label: 'Laporan', icon: '📈' },
]

export default function AdminSidebar() {
  const { logout } = useAuthStore()

  return (
    <aside className="w-60 bg-gray-900 flex flex-col">
      <div className="p-4 border-b border-gray-700 flex items-center gap-3">
        <img src="/Logo.png" alt="VendorApp" className="w-9 h-9 object-contain rounded-lg" />
        <div>
          <div className="text-white font-bold text-lg leading-tight">VendorApp</div>
          <div className="text-xs text-gray-400">Admin Panel</div>
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
                  : 'text-gray-300 hover:bg-gray-800'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-700">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-gray-800 transition-colors"
        >
          <span>🚪</span>
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  )
}
