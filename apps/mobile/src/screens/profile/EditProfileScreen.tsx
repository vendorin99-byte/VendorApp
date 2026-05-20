import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, StatusBar } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuthStore } from '../../store/authStore'
import { useTheme } from '../../hooks/useTheme'
import api from '../../services/api'

export default function EditProfileScreen() {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { user } = useAuthStore()
  const { bg, card, cardBorder, text, subtext, placeholder, statusBar, statusBarBg, headerBg, headerBorder } = useTheme()
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
      await api.put('/customer/profile', { name, phone })
      Alert.alert('Berhasil', 'Profil berhasil diperbarui', [{ text: 'OK', onPress: () => navigation.goBack() }])
    } catch (e: any) {
      Alert.alert('Gagal', e.response?.data?.error || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = { backgroundColor: card, borderColor: cardBorder, color: text }

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={statusBar} backgroundColor={statusBarBg} />
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: text }]}>Edit Profil</Text>
      </View>

      <View style={styles.form}>
        <Text style={[styles.label, { color: subtext }]}>Nama Lengkap</Text>
        <TextInput
          style={[styles.input, inputStyle]}
          value={name}
          onChangeText={setName}
          placeholder="Nama lengkap"
          placeholderTextColor={placeholder}
          autoCapitalize="words"
        />

        <Text style={[styles.label, { color: subtext }]}>No. Telepon</Text>
        <TextInput
          style={[styles.input, inputStyle]}
          value={phone}
          onChangeText={setPhone}
          placeholder="08xxxxxxxxxx"
          placeholderTextColor={placeholder}
          keyboardType="phone-pad"
        />

        <Text style={[styles.label, { color: subtext }]}>Email</Text>
        <TextInput
          style={[styles.input, { backgroundColor: cardBorder, borderColor: cardBorder, color: subtext }]}
          value={user?.email}
          editable={false}
        />
        <Text style={[styles.hint, { color: subtext }]}>Email tidak dapat diubah</Text>

        <TouchableOpacity style={styles.btn} onPress={handleSave} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Menyimpan...' : 'Simpan Perubahan'}</Text>
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
  form: { padding: 16, gap: 6 },
  label: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, fontFamily: 'Poppins_400Regular', marginTop: 4 },
  hint: { fontFamily: 'Poppins_400Regular', fontSize: 12, marginTop: 4 },
  btn: { backgroundColor: '#3B5BDB', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 24 },
  btnText: { fontFamily: 'Poppins_700Bold', color: '#fff', fontSize: 16 },
})
