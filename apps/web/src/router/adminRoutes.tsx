import { Route } from 'react-router-dom'
import AdminLayout from '../components/admin/AdminLayout'
import AdminDashboard from '../pages/admin/Dashboard'
import Verification from '../pages/admin/Verification'
import AdminWithdrawals from '../pages/admin/Withdrawals'
import Users from '../pages/admin/Users'
import Transactions from '../pages/admin/Transactions'
import Disputes from '../pages/admin/Disputes'
import Reports from '../pages/admin/Reports'

const adminRoutes = (
  <Route path="/x-ctrl-panel" element={<AdminLayout />}>
    <Route index element={<AdminDashboard />} />
    <Route path="verification" element={<Verification />} />
    <Route path="withdrawals" element={<AdminWithdrawals />} />
    <Route path="users" element={<Users />} />
    <Route path="transactions" element={<Transactions />} />
    <Route path="disputes" element={<Disputes />} />
    <Route path="reports" element={<Reports />} />
  </Route>
)

export default adminRoutes
