import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useAuthStore } from '../../store/authStore'
import api from '../../services/api'

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<any>()
  const { user, logout } = useAuthStore()
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    api.get('/vendor/profile').then(r => setProfile(r.data)).catch(() => {})
  }, [])

  function confirmLogout() {
    Alert.alert('Keluar', 'Yakin ingin keluar dari akun ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: logout },
    ])
  }

  const menus = [
    {
      section: 'Kelola Bisnis',
      items: [
        { icon: '🖼️', label: 'Portfolio', sub: 'Foto & karya terbaik Anda', screen: 'Portfolio' },
        { icon: '📦', label: 'Paket Layanan', sub: 'Atur harga dan paket', screen: 'Layanan' },
        { icon: '💰', label: 'Dompet', sub: 'Saldo & riwayat transaksi', screen: 'Dompet' },
      ],
    },
    {
      section: 'Akun',
      items: [
        { icon: '✏️', label: 'Edit Profil', sub: 'Nama, deskripsi, lokasi', screen: 'EditProfil' },
        { icon: '🔑', label: 'Ganti Password', sub: 'Keamanan akun Anda', screen: 'GantiPassword' },
        { icon: '🔔', label: 'Notifikasi', sub: 'Atur preferensi notifikasi', screen: 'Notifikasi' },
      ],
    },
    {
      section: 'Lainnya',
      items: [
        { icon: '❓', label: 'Bantuan', sub: 'FAQ dan hubungi support', screen: 'Bantuan' },
      ],
    },
  ]

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1628" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 36 }}>🏪</Text>
          </View>
          <Text style={styles.bizName}>{profile?.business_name || user?.name}</Text>
          <Text style={styles.category}>{profile?.category || '—'}</Text>
          {profile?.verified && (
            <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓ Akun Terverifikasi</Text></View>
          )}
          {!profile?.verified && (
            <View style={styles.pendingBadge}><Text style={styles.pendingText}>⏳ Menunggu Verifikasi</Text></View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{profile?.avg_rating?.toFixed(1) || '—'}</Text>
              <Text style={styles.statLbl}>Rating</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{profile?.total_reviews || 0}</Text>
              <Text style={styles.statLbl}>Ulasan</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{profile?.city || '—'}</Text>
              <Text style={styles.statLbl}>Kota</Text>
            </View>
          </View>
        </View>

        {/* Menu sections */}
        {menus.map(section => (
          <View key={section.section} style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>{section.section}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.menuItem, idx < section.items.length - 1 && styles.menuItemBorder]}
                  onPress={() => navigation.navigate(item.screen)}
                >
                  <View style={styles.menuIcon}><Text style={{ fontSize: 20 }}>{item.icon}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Text style={styles.menuSub}>{item.sub}</Text>
                  </View>
                  <Text style={styles.menuArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout}>
          <Text style={styles.logoutText}>🚪 Keluar dari Akun</Text>
        </TouchableOpacity>

        <Text style={styles.version}>VendorApp Mitra v1.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const C = { bg: '#0A1628', card: '#111827', card2: '#0D1B2E', border: '#1E3A5F', primary: '#3B5BDB', text: '#fff', muted: '#6B7DB3' }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  profileHeader: { alignItems: 'center', paddingTop: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#1A2E50', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.border, marginBottom: 12 },
  bizName: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 4, textAlign: 'center' },
  category: { fontSize: 13, color: C.muted, marginBottom: 10 },
  verifiedBadge: { backgroundColor: '#0A2A1A', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, marginBottom: 16 },
  verifiedText: { fontSize: 12, fontWeight: '700', color: '#10B981' },
  pendingBadge: { backgroundColor: '#2A1A0A', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, marginBottom: 16 },
  pendingText: { fontSize: 12, fontWeight: '700', color: '#F59E0B' },
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 24, gap: 16, borderWidth: 1, borderColor: C.border, marginHorizontal: 20 },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 2 },
  statLbl: { fontSize: 11, color: C.muted },
  statDiv: { width: 1, height: 32, backgroundColor: C.border },
  menuSection: { marginTop: 16, paddingHorizontal: 16 },
  menuSectionTitle: { fontSize: 12, fontWeight: '700', color: C.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
  menuCard: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  menuIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  menuLabel: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 2 },
  menuSub: { fontSize: 12, color: C.muted },
  menuArrow: { fontSize: 20, color: C.muted, lineHeight: 24 },
  logoutBtn: { margin: 16, marginTop: 24, borderWidth: 1, borderColor: '#3A1A1A', borderRadius: 16, paddingVertical: 14, alignItems: 'center', backgroundColor: '#1A0A0A' },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
  version: { textAlign: 'center', fontSize: 12, color: C.border, marginBottom: 8 },
})
