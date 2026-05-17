import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, StatusBar } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuthStore } from '../../store/authStore'
import api from '../../services/api'

export default function EditProfileScreen() {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { user, setAuth } = useAuthStore()
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/customer/profile').then(({ data }) => {
      setName(data.name || '')
      setPhone(data.phone || '')
    }).catch(() => {})
  }, [])

  async function handleSave() {
    if (!name.trim()) return Alert.alert('Error', 'Nama tidak boleh kosong')
    setLoading(true)
    try {
      const { data } = await api.put('/customer/profile', { name, phone })
      Alert.alert('Berhasil', 'Profil berhasil diperbarui', [{ text: 'OK', onPress: () => navigation.goBack() }])
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
        <Text style={styles.title}>Edit Profil</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Nama Lengkap</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Nama lengkap"
          autoCapitalize="words"
        />

        <Text style={styles.label}>No. Telepon</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="08xxxxxxxxxx"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={user?.email}
          editable={false}
        />
        <Text style={styles.hint}>Email tidak dapat diubah</Text>

        <TouchableOpacity style={styles.btn} onPress={handleSave} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Menyimpan...' : 'Simpan Perubahan'}</Text>
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
  form: { padding: 16, gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 15, marginTop: 4 },
  inputDisabled: { backgroundColor: '#F3F4F6', color: '#9CA3AF' },
  hint: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  btn: { backgroundColor: '#3B5BDB', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
})
