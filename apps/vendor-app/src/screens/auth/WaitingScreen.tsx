import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Image } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuthStore } from '../../store/authStore'

export default function WaitingScreen() {
  const insets = useSafeAreaInsets()
  const { logout } = useAuthStore()

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1628" />
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Image source={require('../../../assets/Logo.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.title}>Pendaftaran Dikirim!</Text>
        <Text style={styles.sub}>Tim kami sedang memverifikasi dokumen Anda.</Text>

        <View style={styles.card}>
          {[
            { icon: '📋', step: '1', text: 'Dokumen diterima dan sedang direview' },
            { icon: '🔍', step: '2', text: 'Verifikasi identitas (1–3 hari kerja)' },
            { icon: '✅', step: '3', text: 'Akun aktif & siap digunakan' },
          ].map(item => (
            <View key={item.step} style={styles.stepRow}>
              <View style={styles.stepIcon}><Text style={styles.stepEmoji}>{item.icon}</Text></View>
              <Text style={styles.stepText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.note}>
          Anda akan mendapat notifikasi email setelah verifikasi selesai.
        </Text>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A1628', justifyContent: 'center' },
  content: { paddingHorizontal: 28, alignItems: 'center' },
  iconWrap: { width: 96, height: 96, borderRadius: 28, backgroundColor: '#1A2E50', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#2A4070', shadowColor: '#3B5BDB', shadowOpacity: 0.4, shadowRadius: 20, elevation: 8 },
  logo: { width: 66, height: 66 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: 14, color: '#6B7DB3', textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  card: { width: '100%', backgroundColor: '#111827', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#1E3A5F', gap: 16, marginBottom: 24 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#0D1B2E', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1E3A5F' },
  stepEmoji: { fontSize: 20 },
  stepText: { flex: 1, fontSize: 14, color: '#8BA3C7', lineHeight: 20 },
  note: { fontSize: 12, color: '#3A5070', textAlign: 'center', lineHeight: 18, marginBottom: 32 },
  logoutBtn: { borderWidth: 1, borderColor: '#1E3A5F', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 12 },
  logoutText: { color: '#6B7DB3', fontSize: 14, fontWeight: '600' },
})
