import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, Alert } from 'react-native'
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <Image source={require('../../../assets/logo-only.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Buat Password Baru</Text>
      <Text style={styles.subtitle}>Kode reset dikirim ke{'\n'}<Text style={{ color: '#3B5BDB', fontWeight: '600' }}>{email}</Text></Text>

      <View style={styles.form}>
        <TextInput
          style={[styles.input, { textAlign: 'center', fontSize: 22, fontWeight: 'bold', letterSpacing: 8 }]}
          placeholder="000000"
          value={form.code}
          onChangeText={(v) => setForm({ ...form, code: v.replace(/\D/g, '').slice(0, 6) })}
          keyboardType="number-pad"
          maxLength={6}
        />
        <PasswordInput
          value={form.password}
          onChangeText={(v) => setForm({ ...form, password: v })}
          placeholder="Password Baru (min. 8 karakter)"
        />
        <PasswordInput
          value={form.confirm}
          onChangeText={(v) => setForm({ ...form, confirm: v })}
          placeholder="Konfirmasi Password"
        />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity style={styles.btn} onPress={handleReset} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Menyimpan...' : 'Simpan Password Baru'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Kirim ulang kode</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 80, height: 80, marginBottom: 24 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1F2937' },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8, marginBottom: 32 },
  form: { width: '100%', gap: 12 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 15 },
  error: { color: '#EF4444', fontSize: 13 },
  btn: { backgroundColor: '#3B5BDB', borderRadius: 12, padding: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  back: { alignItems: 'center', padding: 8 },
  backText: { color: '#3B5BDB', fontSize: 14 },
})
