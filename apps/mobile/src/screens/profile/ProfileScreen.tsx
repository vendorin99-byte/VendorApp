import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import { useAuthStore } from '../../store/authStore'

const MENU_ITEMS = [
  { icon: '📋', label: 'Riwayat Pesanan' },
  { icon: '⭐', label: 'Ulasan Saya' },
  { icon: '🔔', label: 'Notifikasi' },
  { icon: '📄', label: 'Syarat & Ketentuan' },
  { icon: '🔒', label: 'Kebijakan Privasi' },
]

export default function ProfileScreen() {
  const { user, logout } = useAuthStore()

  function handleLogout() {
    Alert.alert('Keluar', 'Apakah Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: logout },
    ])
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0] || '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <TouchableOpacity style={styles.editBtn}>
          <Text style={styles.editBtnText}>Edit Profil</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menu}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity key={item.label} style={styles.menuItem}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪  Keluar</Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#fff', alignItems: 'center', paddingTop: 60, paddingBottom: 24, borderBottomWidth: 1, borderColor: '#E5E7EB' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#3B5BDB', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, color: '#fff', fontWeight: 'bold' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  email: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  editBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, borderWidth: 1.5, borderColor: '#3B5BDB', borderRadius: 20 },
  editBtnText: { color: '#3B5BDB', fontWeight: '600', fontSize: 14 },
  menu: { backgroundColor: '#fff', marginTop: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  menuIcon: { fontSize: 18, width: 32 },
  menuLabel: { flex: 1, fontSize: 15, color: '#1F2937' },
  menuArrow: { fontSize: 20, color: '#9CA3AF' },
  logoutBtn: { margin: 16, padding: 14, borderRadius: 12, backgroundColor: '#FEF2F2', alignItems: 'center' },
  logoutText: { color: '#EF4444', fontWeight: '600', fontSize: 15 },
})
