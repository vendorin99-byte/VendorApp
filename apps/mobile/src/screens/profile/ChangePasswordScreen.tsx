import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, StatusBar } from 'react-native'
import PasswordInput from '../../components/PasswordInput'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../hooks/useTheme'
import api from '../../services/api'

export default function ChangePasswordScreen() {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { isDark, bg, text, subtext, statusBar, statusBarBg, headerBg, headerBorder } = useTheme()
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleChange() {
    if (!oldPwd || !newPwd || !confirmPwd) return Alert.alert('Error', 'Semua field wajib diisi')
    if (newPwd !== confirmPwd) return Alert.alert('Error', 'Konfirmasi password tidak cocok')
    if (newPwd.length < 8) return Alert.alert('Error', 'Password baru minimal 8 karakter')
    setLoading(true)
    try {
      await api.post('/customer/profile/change-password', { old_password: oldPwd, new_password: newPwd })
      Alert.alert('Berhasil', 'Password berhasil diubah', [{ text: 'OK', onPress: () => navigation.goBack() }])
    } catch (e: any) {
      Alert.alert('Gagal', e.response?.data?.error || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={statusBar} backgroundColor={statusBarBg} />
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: text }]}>Ganti Password</Text>
      </View>

      <View style={styles.form}>
        <Text style={[styles.label, { color: subtext }]}>Password Lama</Text>
        <PasswordInput value={oldPwd} onChangeText={setOldPwd} placeholder="Masukkan password lama" dark={isDark} />

        <Text style={[styles.label, { color: subtext }]}>Password Baru</Text>
        <PasswordInput value={newPwd} onChangeText={setNewPwd} placeholder="Minimal 8 karakter" dark={isDark} />

        <Text style={[styles.label, { color: subtext }]}>Konfirmasi Password Baru</Text>
        <PasswordInput value={confirmPwd} onChangeText={setConfirmPwd} placeholder="Ulangi password baru" dark={isDark} />

        <TouchableOpacity style={styles.btn} onPress={handleChange} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Menyimpan...' : 'Ganti Password'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1 },
  backText: { color: '#3B5BDB', fontFamily: 'Poppins_500Medium', fontSize: 14, marginBottom: 8 },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 20 },
  form: { padding: 16, gap: 4 },
  label: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, marginTop: 14 },
  btn: { backgroundColor: '#3B5BDB', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 28 },
  btnText: { fontFamily: 'Poppins_700Bold', color: '#fff', fontSize: 16 },
})
