import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Alert, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuthStore } from '../../store/authStore'
import api from '../../services/api'

const WEB_BASE = 'https://web-henna-five-13.vercel.app'

function openWeb(path: string) {
  Linking.openURL(WEB_BASE + path)
}

export default function VendorProfileScreen() {
  const insets = useSafeAreaInsets()
  const { user, logout } = useAuthStore()
  const [vendor, setVendor] = useState<any>(null)

  useEffect(() => {
    api.get('/vendor/profile').then((r) => setVendor(r.data)).catch(() => {})
  }, [])

  function handleLogout() {
    Alert.alert('Keluar', 'Yakin ingin keluar dari akun?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: logout },
    ])
  }

  const activeServices = vendor?.services?.filter((s: any) => s.is_active) || []

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil Saya</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar + info */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
          <Text style={styles.name}>{vendor?.business_name || user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {vendor?.verified && <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✅ Terverifikasi</Text></View>}
        </View>

        {/* Menu items */}
        <View style={styles.menu}>
          <MenuItem icon="📢" label="Tambah Iklan" highlight onPress={() => openWeb('/mitra/dashboard/ads')} />
          <MenuItem icon="👤" label="Pengaturan Akun" highlight onPress={() => openWeb('/mitra/dashboard/settings')} />
          <MenuItem icon="📊" label="Statistik" onPress={() => openWeb('/mitra/dashboard/stats')} />
          <MenuItem icon="🖼️" label="Portfolio & Layanan" onPress={() => openWeb('/mitra/dashboard/portfolio')} />
          <MenuItem icon="🔔" label="Notifikasi" badge={2} onPress={() => {}} />
          <MenuItem icon="❓" label="Pusat Bantuan" onPress={() => Alert.alert('Pusat Bantuan', 'Hubungi kami via WhatsApp atau email support.')} />
        </View>

        {/* Products grid */}
        {activeServices.length > 0 && (
          <View style={styles.productsSection}>
            <View style={styles.productHeader}>
              <Text style={styles.productTitle}>Produk / Jasa</Text>
              <Text style={styles.productSeeAll}>See all</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productRow}>
              <TouchableOpacity style={[styles.productItem, styles.productAdd]}>
                <Text style={styles.productAddIcon}>+</Text>
                <Text style={styles.productLabel}>Add</Text>
              </TouchableOpacity>
              {activeServices.slice(0, 6).map((s: any) => (
                <View key={s.id} style={styles.productItem}>
                  <View style={styles.productBox} />
                  <Text style={styles.productLabel} numberOfLines={1}>{s.name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBox label="Rating" value={vendor?.avg_rating?.toFixed(1) || '-'} />
          <StatBox label="Ulasan" value={String(vendor?.total_reviews || 0)} />
          <StatBox label="Layanan" value={String(activeServices.length)} />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => openWeb('/mitra/dashboard')}>
          <Text style={styles.webNote}>🌐 Dashboard lengkap tersedia di web{'\n'}Tap untuk buka dashboard vendor</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

function MenuItem({ icon, label, onPress, highlight, badge }: { icon: string; label: string; onPress: () => void; highlight?: boolean; badge?: number }) {
  return (
    <TouchableOpacity style={[styles.menuItem, highlight && styles.menuItemHighlight]} onPress={onPress}>
      <View style={[styles.menuIcon, highlight && styles.menuIconHighlight]}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <View style={{ flex: 1 }} />
      {badge ? <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View> : null}
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D0D1A' },
  header: { paddingHorizontal: 16, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 1, borderColor: '#2A2A4A' },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#fff' },
  scroll: { paddingBottom: 40 },
  profileSection: { alignItems: 'center', paddingVertical: 28 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2A2A4A', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarIcon: { fontSize: 36 },
  name: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#fff' },
  email: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  verifiedBadge: { marginTop: 8, backgroundColor: '#1A2A1A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  verifiedText: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: '#10B981' },
  menu: { marginHorizontal: 16, gap: 8, marginBottom: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1A1A2E', borderRadius: 12, padding: 14 },
  menuItemHighlight: { borderWidth: 1, borderColor: '#3B5BDB' },
  menuIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#2A2A4A', alignItems: 'center', justifyContent: 'center' },
  menuIconHighlight: { backgroundColor: '#1A2A4A' },
  menuLabel: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#fff' },
  menuArrow: { fontFamily: 'Poppins_400Regular', fontSize: 20, color: '#6B7280' },
  badge: { backgroundColor: '#EF4444', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, marginRight: 4 },
  badgeText: { fontFamily: 'Poppins_700Bold', fontSize: 11, color: '#fff' },
  productsSection: { marginHorizontal: 16, marginBottom: 16 },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  productTitle: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#fff' },
  productSeeAll: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#3B5BDB' },
  productRow: { gap: 10 },
  productItem: { alignItems: 'center', width: 70 },
  productAdd: {},
  productBox: { width: 60, height: 60, borderRadius: 14, backgroundColor: '#3B5BDB' },
  productAddIcon: { fontFamily: 'Poppins_700Bold', fontSize: 28, color: '#fff', lineHeight: 60, textAlign: 'center', width: 60, height: 60, backgroundColor: '#3B5BDB', borderRadius: 14 },
  productLabel: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#9CA3AF', marginTop: 6, textAlign: 'center' },
  statsRow: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: '#1A1A2E', borderRadius: 14, padding: 16, marginBottom: 16 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: '#3B5BDB' },
  statLabel: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8, padding: 4 },
  logoutIcon: { fontSize: 18 },
  logoutText: { fontFamily: 'Poppins_600SemiBold', color: '#EF4444', fontSize: 15 },
  webNote: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#6B7280', textAlign: 'center', lineHeight: 18, marginHorizontal: 16 },
})
