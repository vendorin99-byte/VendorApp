import { useState, useEffect, useRef } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, StatusBar } from 'react-native'
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
  const inputRef = useRef<TextInput>(null)

  const [otp, setOtp] = useState('')
  const [timer, setTimer] = useState(60)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (timer <= 0) return
    const id = setInterval(() => setTimer((t) => t - 1), 1000)
    return () => clearInterval(id)
  }, [timer])

  async function handleVerify() {
    if (otp.length < 6) return setError('Masukkan 6 digit kode OTP')
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp })
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
    setOtp('')
    await api.post('/auth/resend-otp', { email })
  }

  const mm = String(Math.floor(timer / 60)).padStart(2, '0')
  const ss = String(timer % 60).padStart(2, '0')

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>

      <View style={styles.brand}>
        <Image source={require('../../../assets/Logo.png')} style={styles.logo} resizeMode="contain" />
      </View>

      <Text style={styles.title}>Kode Verifikasi</Text>
      <Text style={styles.subtitle}>Kode dikirim ke{'\n'}<Text style={styles.emailHighlight}>{email}</Text></Text>

      <Text style={styles.timer}>{mm} : {ss}</Text>

      <TouchableOpacity
        style={[styles.inputBox, focused && styles.inputFocused]}
        onPress={() => inputRef.current?.focus()}
        activeOpacity={1}
      >
        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={otp}
          onChangeText={(v) => { setOtp(v.replace(/\D/g, '').slice(0, 6)); setError('') }}
          keyboardType="number-pad"
          maxLength={6}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <View style={styles.dots}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={[styles.dot, i < otp.length && styles.dotFilled]} />
          ))}
        </View>
      </TouchableOpacity>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.btn} onPress={handleVerify} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Memverifikasi...' : 'Verifikasi'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResend} disabled={timer > 0} style={styles.resend}>
        <Text style={[styles.resendText, timer > 0 && { color: '#555580' }]}>
          {timer > 0 ? `Kirim ulang dalam ${mm}:${ss}` : 'Kirim ulang kode'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A', padding: 24, alignItems: 'center' },
  back: { alignSelf: 'flex-start', marginTop: 12, marginBottom: 8 },
  backIcon: { fontSize: 22, color: '#fff' },
  brand: { alignItems: 'center', marginBottom: 24, marginTop: 12 },
  logo: { width: 80, height: 80 },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: '#fff', marginBottom: 8 },
  subtitle: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#9CA3AF', marginBottom: 8, textAlign: 'center', lineHeight: 20 },
  emailHighlight: { fontFamily: 'Poppins_600SemiBold', color: '#3B5BDB' },
  timer: { fontFamily: 'Poppins_700Bold', fontSize: 32, color: '#3B5BDB', marginBottom: 28 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2A4A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
    width: '100%',
    backgroundColor: '#1A1A2E',
  },
  inputFocused: { borderColor: '#3B5BDB' },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  dots: { flexDirection: 'row', gap: 14, justifyContent: 'center' },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#2A2A4A' },
  dotFilled: { backgroundColor: '#3B5BDB' },
  error: { fontFamily: 'Poppins_400Regular', color: '#EF4444', fontSize: 13, marginTop: 10 },
  btn: { backgroundColor: '#3B5BDB', borderRadius: 12, padding: 16, alignItems: 'center', width: '100%', marginTop: 28 },
  btnText: { fontFamily: 'Poppins_700Bold', color: '#fff', fontSize: 16 },
  resend: { marginTop: 16, padding: 8 },
  resendText: { fontFamily: 'Poppins_500Medium', color: '#3B5BDB', fontSize: 14 },
})
