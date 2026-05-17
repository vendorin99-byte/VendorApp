import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Alert, Image } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuthStore } from '../../store/authStore'
import api from '../../services/api'

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>Profil Vendor</Text>
      </View>

      <ScrollView>
        {/* Vendor info */}
        <View style={styles.card}>
          <View style={styles.vendorRow}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>{vendor?.business_name?.[0] || user?.name?.[0] || 'V'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vendorName}>{vendor?.business_name || user?.name}</Text>
              <Text style={styles.vendorMeta}>{vendor?.category} • {vendor?.city}</Text>
              <View style={[styles.badge, vendor?.verified ? styles.badgeGreen : styles.badgeYellow]}>
                <Text style={styles.badgeText}>{vendor?.verified ? '✅ Terverifikasi' : '⏳ Menunggu Verifikasi'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.statsRow}>
            <StatBox label="Rating" value={vendor?.avg_rating?.toFixed(1) || '-'} />
            <StatBox label="Ulasan" value={String(vendor?.total_reviews || 0)} />
            <StatBox label="Layanan" value={String(vendor?.services?.filter((s: any) => s.is_active).length || 0)} />
          </View>
        </View>

        {/* Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Informasi Akun</Text>
          <InfoRow label="Email" value={user?.email || '-'} />
          <InfoRow label="Nama" value={user?.name || '-'} />
          {vendor?.whatsapp && <InfoRow label="WhatsApp" value={vendor.whatsapp} />}
          {vendor?.address && <InfoRow label="Alamat" value={vendor.address} />}
          {vendor?.service_radius_km && <InfoRow label="Jangkauan" value={`${vendor.service_radius_km} km`} />}
        </View>

        {/* Note */}
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>⚙️ Kelola Bisnis via Web</Text>
          <Text style={styles.noteText}>Untuk edit paket layanan, portofolio, rekening bank, dan pengaturan lainnya — gunakan dashboard vendor di web browser.</Text>
          <Text style={styles.noteUrl}>web-henna-five-13.vercel.app/mitra</Text>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Keluar dari Akun</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#E5E7EB' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  card: { backgroundColor: '#fff', borderRadius: 14, margin: 12, marginBottom: 0, padding: 16 },
  vendorRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 16 },
  avatarBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#3B5BDB', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  vendorName: { fontSize: 17, fontWeight: 'bold', color: '#1F2937' },
  vendorMeta: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  badge: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 },
  badgeGreen: { backgroundColor: '#D1FAE5' },
  badgeYellow: { backgroundColor: '#FEF3C7' },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#374151' },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#F3F4F6', paddingTop: 12, gap: 8 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#3B5BDB' },
  statLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  infoLabel: { fontSize: 13, color: '#6B7280' },
  infoValue: { fontSize: 13, color: '#1F2937', fontWeight: '500', flex: 1, textAlign: 'right' },
  noteCard: { backgroundColor: '#EEF2FF', borderRadius: 14, margin: 12, marginBottom: 0, padding: 16 },
  noteTitle: { fontSize: 14, fontWeight: '600', color: '#3730A3', marginBottom: 6 },
  noteText: { fontSize: 13, color: '#4338CA', lineHeight: 20 },
  noteUrl: { fontSize: 12, color: '#3B5BDB', marginTop: 6, fontWeight: '500' },
  logoutBtn: { margin: 12, marginTop: 16, backgroundColor: '#FEE2E2', borderRadius: 12, padding: 15, alignItems: 'center' },
  logoutText: { color: '#991B1B', fontWeight: '600', fontSize: 15 },
})
