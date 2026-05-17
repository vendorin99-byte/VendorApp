import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import VendorSidebar from './VendorSidebar'

export default function VendorLayout() {
  const { user } = useAuthStore()

  if (!user) return <Navigate to="/mitra/login" replace />
  if (user.role !== 'vendor') return <Navigate to="/mitra" replace />

  return (
    <div className="flex h-screen bg-gray-100">
      <VendorSidebar />
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
