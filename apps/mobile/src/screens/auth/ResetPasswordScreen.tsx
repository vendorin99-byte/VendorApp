import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, Alert, StatusBar } from 'react-native'
import PasswordInput from '../../components/PasswordInput'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation'
import api from '../../services/api'

type Nav = NativeStackNavigationProp<RootStackParamList>
type Route = RouteProp<RootStackParamList, 'ResetPassword'>

export default function ResetPasswordScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { email } = route.params

  const [form, setForm] = useState({ code: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleReset() {
    if (form.code.length < 6) return setError('Masukkan 6 digit kode dari email')
    if (form.password.length < 8) return setError('Password minimal 8 karakter')
    if (form.password !== form.confirm) return setError('Konfirmasi password tidak cocok')
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/reset-password', { email, code: form.code, password: form.password })
      Alert.alert('Berhasil!', 'Password berhasil diubah. Silakan login.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ])
    } catch (e: any) {
      setError(e.response?.data?.error || 'Gagal reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.brand}>
          <Image source={require('../../../assets/Logo.png')} style={styles.logo} resizeMode="contain" />
        </View>

        <Text style={styles.title}>Buat Password Baru</Text>
        <Text style={styles.subtitle}>
          Reset password untuk{'\n'}<Text style={styles.emailHighlight}>{email}</Text>
        </Text>

        <View style={styles.form}>
          <View>
            <Text style={styles.label}>Kode Verifikasi</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="000000"
              placeholderTextColor="#555580"
              value={form.code}
              onChangeText={(v) => setForm({ ...form, code: v.replace(/\D/g, '').slice(0, 6) })}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
          <View>
            <Text style={styles.label}>Password Baru</Text>
            <PasswordInput
              value={form.password}
              onChangeText={(v) => setForm({ ...form, password: v })}
              placeholder="Minimal 8 karakter"
              dark
            />
          </View>
          <View>
            <Text style={styles.label}>Konfirmasi Password</Text>
            <PasswordInput
              value={form.confirm}
              onChangeText={(v) => setForm({ ...form, confirm: v })}
              placeholder="Ulangi password baru"
              dark
            />
          </View>
          {!!error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity style={styles.btn} onPress={handleReset} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'Menyimpan...' : 'Simpan Password Baru'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow}>
            <Text style={styles.backText}>← Kirim ulang kode</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A', padding: 24, paddingTop: 56 },
  back: { marginBottom: 8 },
  backIcon: { fontSize: 22, color: '#fff' },
  brand: { alignItems: 'center', marginVertical: 24 },
  logo: { width: 80, height: 80 },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 26, color: '#fff', marginBottom: 8 },
  subtitle: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#9CA3AF', marginBottom: 28, lineHeight: 20 },
  emailHighlight: { fontFamily: 'Poppins_600SemiBold', color: '#3B5BDB' },
  form: { gap: 16 },
  label: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#9CA3AF', marginBottom: 6 },
  codeInput: { fontFamily: 'Poppins_700Bold', borderWidth: 1, borderColor: '#2A2A4A', borderRadius: 12, padding: 14, fontSize: 24, color: '#3B5BDB', textAlign: 'center', letterSpacing: 10, backgroundColor: '#1A1A2E' },
  error: { fontFamily: 'Poppins_400Regular', color: '#EF4444', fontSize: 13 },
  btn: { backgroundColor: '#3B5BDB', borderRadius: 12, padding: 16, alignItems: 'center' },
  btnText: { fontFamily: 'Poppins_700Bold', color: '#fff', fontSize: 16 },
  backRow: { alignItems: 'center', padding: 8 },
  backText: { fontFamily: 'Poppins_500Medium', color: '#9CA3AF', fontSize: 14 },
})
