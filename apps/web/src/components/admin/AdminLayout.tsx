import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import AdminSidebar from './AdminSidebar'

export default function AdminLayout() {
  const { user } = useAuthStore()

  if (!user) return <Navigate to="/mitra/login" replace />
  if (user.role !== 'admin') return <Navigate to="/mitra" replace />

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-6 bg-gray-100 text-gray-900">
        <Outlet />
      </main>
    </div>
  )
}
