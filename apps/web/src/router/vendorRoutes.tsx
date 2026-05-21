import { Route } from 'react-router-dom'
import VendorLayout from '../components/vendor/VendorLayout'
import Dashboard from '../pages/vendor/Dashboard'
import Orders from '../pages/vendor/Orders'
import Chat from '../pages/vendor/Chat'
import Wallet from '../pages/vendor/Wallet'
import Portfolio from '../pages/vendor/Portfolio'
import Services from '../pages/vendor/Services'
import Ads from '../pages/vendor/Ads'
import Stats from '../pages/vendor/Stats'
import Settings from '../pages/vendor/Settings'
import Maps from '../pages/vendor/Maps'

const vendorRoutes = (
  <Route path="/mitra/dashboard" element={<VendorLayout />}>
    <Route index element={<Dashboard />} />
    <Route path="orders" element={<Orders />} />
    <Route path="chat" element={<Chat />} />
    <Route path="wallet" element={<Wallet />} />
    <Route path="portfolio" element={<Portfolio />} />
    <Route path="services" element={<Services />} />
    <Route path="ads" element={<Ads />} />
    <Route path="stats" element={<Stats />} />
    <Route path="maps" element={<Maps />} />
    <Route path="settings" element={<Settings />} />
  </Route>
)

export default vendorRoutes
