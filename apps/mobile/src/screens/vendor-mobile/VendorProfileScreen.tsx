import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Alert, Linking, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation, CommonActions } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useAuthStore } from '../../store/authStore'
import { RootStackParamList } from '../../navigation'
import api from '../../services/api'

type Nav = NativeStackNavigationProp<RootStackParamList>

const WEB_BASE = 'https://web-henna-five-13.vercel.app'

function openWeb(path: string) {
  Linking.openURL(WEB_BASE + path)
}

const DURATIONS = [
  { label: '1 Hari', days: 1 },
  { label: '3 Hari', days: 3 },
  { label: '7 Hari', days: 7 },
  { label: '14 Hari', days: 14 },
  { label: '30 Hari', days: 30 },
]

export default function VendorProfileScreen() {
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const { user, logout } = useAuthStore()
  const [vendor, setVendor] = useState<any>(null)

  // Promo modal state
  const [showPromoModal, setShowPromoModal] = useState(false)
  const [activePromo, setActivePromo] = useState<any>(null)
  const [promoText, setPromoText] = useState('')
  const [promoDays, setPromoDays] = useState(7)
  const [promoSaving, setPromoSaving] = useState(false)

  useEffect(() => {
    api.get('/vendor/profile').then((r) => setVendor(r.data)).catch(() => {})
    api.get('/map-promos/mine').then((r) => setActivePromo(r.data)).catch(() => {})
  }, [])

  async function savePromo() {
    if (promoText.trim().length < 5) return Alert.alert('Error', 'Teks promo minimal 5 karakter')
    setPromoSaving(true)
    try {
      const { data } = await api.post('/map-promos', { text: promoText.trim(), duration_days: promoDays })
      setActivePromo(data)
      setShowPromoModal(false)
      setPromoText('')
      Alert.alert('✅ Promo Aktif!', `Balon promo Anda akan tampil di peta selama ${promoDays} hari.`)
    } catch (e: any) {
      Alert.alert('Gagal', e.response?.data?.error || 'Coba lagi')
    } finally {
      setPromoSaving(false)
    }
  }

  async function deletePromo() {
    Alert.alert('Hapus Promo', 'Yakin ingin menonaktifkan promo di maps?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive', onPress: async () => {
          await api.delete('/map-promos/mine').catch(() => {})
          setActivePromo(null)
        }
      }
    ])
  }

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

        {/* Maps Section */}
        <View style={styles.mapsSection}>
          <Text style={styles.mapsSectionTitle}>🗺️ Visibilitas di Maps</Text>

          {/* Lokasi */}
          <TouchableOpacity style={styles.mapsCard} onPress={() => navigation.navigate('LocationPicker')}>
            <View style={styles.mapsCardLeft}>
              <Text style={styles.mapsCardIcon}>📍</Text>
              <View>
                <Text style={styles.mapsCardLabel}>Lokasi Usaha</Text>
                <Text style={styles.mapsCardSub}>
                  {vendor?.lat ? `${Number(vendor.lat).toFixed(4)}, ${Number(vendor.lng).toFixed(4)}` : 'Belum diatur — tap untuk set'}
                </Text>
              </View>
            </View>
            <Text style={styles.mapsCardArrow}>›</Text>
          </TouchableOpacity>

          {/* Promo balloon */}
          {activePromo ? (
            <View style={styles.mapsCard}>
              <View style={styles.mapsCardLeft}>
                <Text style={styles.mapsCardIcon}>⚡</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mapsCardLabel}>Promo Aktif di Maps</Text>
                  <Text style={styles.mapsCardSub} numberOfLines={2}>{activePromo.text}</Text>
                  <Text style={[styles.mapsCardSub, { color: '#F59E0B' }]}>
                    Berakhir: {new Date(activePromo.expires_at).toLocaleDateString('id-ID')}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={deletePromo} style={styles.deletePromoBtn}>
                <Text style={styles.deletePromoBtnText}>Hapus</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={[styles.mapsCard, styles.mapsCardDashed]} onPress={() => setShowPromoModal(true)}>
              <Text style={styles.mapsCardIcon}>⚡</Text>
              <View>
                <Text style={styles.mapsCardLabel}>Pasang Promo di Maps</Text>
                <Text style={styles.mapsCardSub}>Tampilkan balon promo ke customer terdekat (gratis)</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Menu items */}
        <View style={styles.menu}>
          <MenuItem icon="📢" label="Kelola Iklan" highlight onPress={() => navigation.dispatch(CommonActions.navigate({ name: 'VendorAds' }))} />
          <MenuItem icon="👤" label="Pengaturan Akun" highlight onPress={() => openWeb('/mitra/dashboard/settings')} />
          <MenuItem icon="📊" label="Statistik" onPress={() => openWeb('/mitra/dashboard/stats')} />
          <MenuItem icon="🖼️" label="Portfolio & Layanan" onPress={() => openWeb('/mitra/dashboard/portfolio')} />
          <MenuItem icon="🔔" label="Notifikasi" onPress={() => navigation.dispatch(CommonActions.navigate({ name: 'Notifications' }))} />
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

      {/* Modal Promo */}
      <Modal visible={showPromoModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>⚡ Pasang Promo di Maps</Text>
            <Text style={styles.modalSub}>Balon promo Anda akan tampil ke customer di peta secara gratis</Text>

            <Text style={styles.modalLabel}>Teks Promo (maks 100 karakter)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Contoh: Diskon 20% paket prewedding bulan ini!"
              placeholderTextColor="#6B7280"
              value={promoText}
              onChangeText={t => setPromoText(t.slice(0, 100))}
              multiline
              numberOfLines={2}
            />
            <Text style={styles.charCount}>{promoText.length}/100</Text>

            <Text style={styles.modalLabel}>Durasi</Text>
            <View style={styles.durationRow}>
              {DURATIONS.map(d => (
                <TouchableOpacity key={d.days} style={[styles.durationChip, promoDays === d.days && styles.durationChipActive]} onPress={() => setPromoDays(d.days)}>
                  <Text style={[styles.durationText, promoDays === d.days && { color: '#fff' }]}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setShowPromoModal(false); setPromoText('') }}>
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSaveBtn, promoSaving && { opacity: 0.6 }]} onPress={savePromo} disabled={promoSaving}>
                <Text style={styles.modalSaveText}>{promoSaving ? 'Menyimpan...' : 'Aktifkan Promo'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  mapsSection: { marginHorizontal: 16, marginBottom: 20 },
  mapsSectionTitle: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#fff', marginBottom: 10 },
  mapsCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A2E', borderRadius: 12, padding: 14, marginBottom: 8 },
  mapsCardDashed: { borderWidth: 1, borderColor: '#2A2A4A', borderStyle: 'dashed' },
  mapsCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  mapsCardIcon: { fontSize: 22, width: 32 },
  mapsCardLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: '#fff' },
  mapsCardSub: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  mapsCardArrow: { fontFamily: 'Poppins_400Regular', fontSize: 20, color: '#6B7280' },
  deletePromoBtn: { backgroundColor: '#2A0A0A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  deletePromoBtnText: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: '#EF4444' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalSheet: { backgroundColor: '#1A1A2E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontFamily: 'Poppins_700Bold', fontSize: 17, color: '#fff', marginBottom: 4 },
  modalSub: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#9CA3AF', marginBottom: 16, lineHeight: 18 },
  modalLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: '#fff', marginBottom: 8 },
  modalInput: { backgroundColor: '#0D0D1A', borderRadius: 10, padding: 12, fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#fff', borderWidth: 1, borderColor: '#2A2A4A', marginBottom: 4, textAlignVertical: 'top', minHeight: 60 },
  charCount: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#6B7280', textAlign: 'right', marginBottom: 14 },
  durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  durationChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#2A2A4A', borderWidth: 1, borderColor: '#3A3A5A' },
  durationChipActive: { backgroundColor: '#3B5BDB', borderColor: '#3B5BDB' },
  durationText: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#9CA3AF' },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A4A' },
  modalCancelText: { fontFamily: 'Poppins_500Medium', color: '#9CA3AF', fontSize: 14 },
  modalSaveBtn: { flex: 2, backgroundColor: '#F59E0B', paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  modalSaveText: { fontFamily: 'Poppins_700Bold', color: '#000', fontSize: 14 },
})
