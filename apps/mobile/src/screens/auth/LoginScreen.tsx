import { useState } from 'react'
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, StatusBar } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation'
import { useAuthStore } from '../../store/authStore'
import PasswordInput from '../../components/PasswordInput'
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

        <View style={styles.brand}>
          <Image source={require('../../../assets/Logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.poweredBy}>Powered By Gelas Kaca</Text>
        </View>

        <Text style={styles.title}>Selamat Datang{'\n'}Kembali!</Text>
        <Text style={styles.subtitle}>Masuk untuk melanjutkan</Text>

        <View style={styles.form}>
          <View>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="contoh@email.com"
              placeholderTextColor="#555580"
              value={form.email}
              onChangeText={(v) => setForm({ ...form, email: v })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View>
            <Text style={styles.label}>Kata Sandi</Text>
            <PasswordInput
              value={form.password}
              onChangeText={(v) => setForm({ ...form, password: v })}
              placeholder="Masukkan kata sandi"
              dark
            />
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotRow}>
            <Text style={styles.forgotText}>Lupa password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'Masuk...' : 'Masuk'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.registerRow}>
          <Text style={styles.registerHint}>Belum punya akun? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Daftar Sekarang</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0D0D1A', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 32 },
  brand: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 140, height: 140 },
  poweredBy: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#555580', marginTop: 8 },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 28, color: '#fff', lineHeight: 38, marginBottom: 6 },
  subtitle: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#9CA3AF', marginBottom: 28 },
  form: { gap: 16 },
  label: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#9CA3AF', marginBottom: 6 },
  input: { fontFamily: 'Poppins_400Regular', borderWidth: 1, borderColor: '#2A2A4A', borderRadius: 12, padding: 14, fontSize: 15, color: '#fff', backgroundColor: '#1A1A2E' },
  error: { fontFamily: 'Poppins_400Regular', color: '#EF4444', fontSize: 13 },
  forgotRow: { alignItems: 'flex-end' },
  forgotText: { fontFamily: 'Poppins_400Regular', color: '#9CA3AF', fontSize: 13 },
  btn: { backgroundColor: '#3B5BDB', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 },
  btnText: { fontFamily: 'Poppins_700Bold', color: '#fff', fontSize: 16 },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  registerHint: { fontFamily: 'Poppins_400Regular', color: '#9CA3AF', fontSize: 14 },
  registerLink: { fontFamily: 'Poppins_600SemiBold', color: '#3B5BDB', fontSize: 14 },
})
