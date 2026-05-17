import { useState } from 'react'
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation'
import { useAuthStore } from '../../store/authStore'
import api from '../../services/api'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Login'>

export default function LoginScreen() {
  const navigation = useNavigation<Nav>()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/login', form)
      await setAuth(data.token, data.user)
      navigation.replace('Main')
    } catch (e: any) {
      setError(e.response?.data?.error || 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.subtitle}>Silahkan masuk dengan akun anda</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="📧  Email / No HP"
          value={form.email}
          onChangeText={(v) => setForm({ ...form, email: v })}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="🔒  Kata Sandi"
          value={form.password}
          onChangeText={(v) => setForm({ ...form, password: v })}
          secureTextEntry
        />
        {!!error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin} disabled={loading}>
          <Text style={styles.btnPrimaryText}>{loading ? 'Masuk...' : 'Masuk'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnOutline} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.btnOutlineText}>Daftar Sekarang</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  header: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 120, height: 120 },
  subtitle: { fontSize: 15, color: '#6B7280', marginTop: 8, textAlign: 'center' },
  form: { gap: 12, paddingBottom: 32 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 15 },
  error: { color: '#EF4444', fontSize: 13 },
  btnPrimary: { backgroundColor: '#3B5BDB', borderRadius: 12, padding: 15, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  btnOutline: { borderWidth: 1.5, borderColor: '#3B5BDB', borderRadius: 12, padding: 15, alignItems: 'center' },
  btnOutlineText: { color: '#3B5BDB', fontWeight: '600', fontSize: 16 },
})
