import { useState, useEffect, useRef } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation'
import { useAuthStore } from '../../store/authStore'
import api from '../../services/api'

type Nav = NativeStackNavigationProp<RootStackParamList, 'OTP'>
type Route = RouteProp<RootStackParamList, 'OTP'>

export default function OTPScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { setAuth } = useAuthStore()
  const { email } = route.params

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [timer, setTimer] = useState(60)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputs = useRef<(TextInput | null)[]>([])

  useEffect(() => {
    if (timer <= 0) return
    const id = setInterval(() => setTimer((t) => t - 1), 1000)
    return () => clearInterval(id)
  }, [timer])

  function handleChange(val: string, index: number) {
    const next = [...otp]
    next[index] = val.replace(/\D/g, '')
    setOtp(next)
    if (val && index < 5) inputs.current[index + 1]?.focus()
    if (!val && index > 0) inputs.current[index - 1]?.focus()
  }

  async function handleVerify() {
    const code = otp.join('')
    if (code.length < 6) return setError('Masukkan 6 digit kode OTP')
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp: code })
      await setAuth(data.token, data.user)
      navigation.replace('Main')
    } catch (e: any) {
      setError(e.response?.data?.error || 'Kode OTP salah')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setTimer(60)
    await api.post('/auth/resend-otp', { email })
  }

  const mm = String(Math.floor(timer / 60)).padStart(2, '0')
  const ss = String(timer % 60).padStart(2, '0')

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>VendorApp</Text>
      <Text style={styles.title}>Kode Verifikasi Terkirim</Text>
      <Text style={styles.subtitle}>{`${mm}:${ss}`}</Text>

      <View style={styles.otpRow}>
        {otp.map((digit, i) => (
          <TextInput
            key={i}
            ref={(r) => { inputs.current[i] = r }}
            style={[styles.otpInput, digit && styles.otpFilled]}
            value={digit}
            onChangeText={(v) => handleChange(v, i)}
            keyboardType="number-pad"
            maxLength={1}
            textAlign="center"
          />
        ))}
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.btn} onPress={handleVerify} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Memverifikasi...' : 'Verifikasi'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResend} disabled={timer > 0} style={styles.resend}>
        <Text style={[styles.resendText, timer > 0 && { color: '#9CA3AF' }]}>
          {timer > 0 ? `Kirim ulang dalam ${mm}:${ss}` : 'Kirim ulang kode'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 28, fontWeight: 'bold', color: '#3B5BDB', marginBottom: 32 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  subtitle: { fontSize: 32, fontWeight: 'bold', color: '#3B5BDB', marginBottom: 32 },
  otpRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  otpInput: { width: 46, height: 56, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, fontSize: 22, fontWeight: 'bold', color: '#1F2937' },
  otpFilled: { borderColor: '#3B5BDB', backgroundColor: '#EEF2FF' },
  error: { color: '#EF4444', fontSize: 13, marginBottom: 12 },
  btn: { backgroundColor: '#3B5BDB', borderRadius: 12, padding: 15, alignItems: 'center', width: '100%' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  resend: { marginTop: 16, padding: 8 },
  resendText: { color: '#3B5BDB', fontSize: 14 },
})
