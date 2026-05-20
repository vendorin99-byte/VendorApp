import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, StatusBar } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuthStore } from '../../store/authStore'
import { useTheme } from '../../hooks/useTheme'
import { RootStackParamList } from '../../navigation'

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>()
  const { user, logout } = useAuthStore()
  const insets = useSafeAreaInsets()
  const { isDark, bg, card, cardBorder, text, subtext, divider, statusBar, statusBarBg, headerBg, headerBorder } = useTheme()

  function handleLogout() {
    Alert.alert('Keluar', 'Apakah Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: logout },
    ])
  }

  const MENU_ITEMS = [
    { icon: '✏️', label: 'Edit Profil', onPress: () => navigation.navigate('EditProfile') },
    { icon: '🔒', label: 'Ganti Password', onPress: () => navigation.navigate('ChangePassword') },
    { icon: '🤝', label: 'Program Affiliate', onPress: () => navigation.navigate('Affiliate') },
    { icon: '📋', label: 'Riwayat Pesanan', onPress: () => navigation.navigate('Pesanan' as any) },
    { icon: '⭐', label: 'Ulasan Saya', onPress: () => navigation.navigate('Pesanan' as any) },
    { icon: '📄', label: 'Syarat & Ketentuan', onPress: () => {} },
  ]

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={statusBar} backgroundColor={statusBarBg} />
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={[styles.name, { color: text }]}>{user?.name}</Text>
        <Text style={[styles.email, { color: subtext }]}>{user?.email}</Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
          <Text style={styles.editBtnText}>Edit Profil</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.menu, { backgroundColor: card, marginTop: 12 }]}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity key={item.label} style={[styles.menuItem, { borderBottomColor: divider }]} onPress={item.onPress}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={[styles.menuLabel, { color: text }]}>{item.label}</Text>
            <Text style={[styles.menuArrow, { color: subtext }]}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: isDark ? '#2A1A1A' : '#FEF2F2' }]} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪  Keluar</Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingBottom: 20, borderBottomWidth: 1 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#3B5BDB', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, color: '#fff', fontFamily: 'Poppins_700Bold' },
  name: { fontFamily: 'Poppins_700Bold', fontSize: 20 },
  email: { fontFamily: 'Poppins_400Regular', fontSize: 14, marginTop: 4 },
  editBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, borderWidth: 1.5, borderColor: '#3B5BDB', borderRadius: 20 },
  editBtnText: { color: '#3B5BDB', fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  menu: {},
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1 },
  menuIcon: { fontSize: 18, width: 32 },
  menuLabel: { flex: 1, fontFamily: 'Poppins_500Medium', fontSize: 15 },
  menuArrow: { fontFamily: 'Poppins_400Regular', fontSize: 20 },
  logoutBtn: { margin: 16, padding: 14, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: '#EF4444', fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
})
