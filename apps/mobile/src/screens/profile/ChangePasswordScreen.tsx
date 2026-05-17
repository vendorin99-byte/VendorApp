import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, StatusBar } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import api from '../../services/api'

export default function ChangePasswordScreen() {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
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
    <ScrollView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ganti Password</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Password Lama</Text>
        <TextInput style={styles.input} value={oldPwd} onChangeText={setOldPwd} secureTextEntry placeholder="Masukkan password lama" />

        <Text style={styles.label}>Password Baru</Text>
        <TextInput style={styles.input} value={newPwd} onChangeText={setNewPwd} secureTextEntry placeholder="Minimal 8 karakter" />

        <Text style={styles.label}>Konfirmasi Password Baru</Text>
        <TextInput style={styles.input} value={confirmPwd} onChangeText={setConfirmPwd} secureTextEntry placeholder="Ulangi password baru" />

        <TouchableOpacity style={styles.btn} onPress={handleChange} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Menyimpan...' : 'Ganti Password'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderColor: '#E5E7EB' },
  backBtn: { marginBottom: 8 },
  backText: { color: '#3B5BDB', fontSize: 14 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  form: { padding: 16, gap: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 14 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 15, marginTop: 4 },
  btn: { backgroundColor: '#3B5BDB', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 28 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
})
