import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, KeyboardAvoidingView, Platform, ScrollView, Image, Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useAuthStore } from '../../store/authStore'
import api from '../../services/api'

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<any>()
  const { setAuth } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email.trim() || !password) return Alert.alert('', 'Email dan password wajib diisi')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email: email.trim().toLowerCase(), password })
      const { token, user } = res.data
      if (user.role !== 'vendor') {
        Alert.alert('Akses Ditolak', 'Aplikasi ini khusus untuk vendor/mitra.')
        return
      }
      await setAuth(token, user)
    } catch (err: any) {
      Alert.alert('Login Gagal', err.response?.data?.error || 'Periksa email dan password Anda')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1628" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo area */}
          <View style={styles.logoWrap}>
            <View style={styles.logoBg}>
              <Image source={require('../../../assets/Logo.png')} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={styles.appName}>VendorApp Mitra</Text>
            <Text style={styles.tagline}>Platform vendor profesional Indonesia</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Masuk ke Akun</Text>
            <Text style={styles.cardSub}>Kelola bisnis Anda dari mana saja</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="email@bisnis.com"
                placeholderTextColor="#4A5568"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.pwWrap}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Min. 8 karakter"
                  placeholderTextColor="#4A5568"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw(!showPw)}>
                  <Text style={{ fontSize: 18 }}>{showPw ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginBtnText}>{loading ? 'Memproses...' : 'Masuk'}</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>belum punya akun?</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerBtnText}>Daftar Sekarang</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>© 2025 VendorApp · Powered by Gelas Kaca</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A1628' },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoBg: {
    width: 88, height: 88, borderRadius: 24,
    backgroundColor: '#1A2E50',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1, borderColor: '#2A4070',
    shadowColor: '#3B5BDB', shadowOpacity: 0.4, shadowRadius: 20, elevation: 8,
  },
  logo: { width: 60, height: 60 },
  appName: { fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  tagline: { fontSize: 12, color: '#6B7DB3', marginTop: 4 },
  card: {
    backgroundColor: '#111827',
    borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: '#1E3A5F',
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#6B7DB3', marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#8BA3C7', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#0D1B2E',
    borderWidth: 1, borderColor: '#1E3A5F',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13,
    color: '#fff', fontSize: 15,
    marginBottom: 0,
  },
  pwWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { padding: 4 },
  loginBtn: {
    backgroundColor: '#3B5BDB',
    borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', marginTop: 8,
    shadowColor: '#3B5BDB', shadowOpacity: 0.5, shadowRadius: 12, elevation: 6,
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
  divider: { flex: 1, height: 1, backgroundColor: '#1E3A5F' },
  dividerText: { fontSize: 12, color: '#4A6080' },
  registerBtn: {
    borderWidth: 1.5, borderColor: '#3B5BDB',
    borderRadius: 14, paddingVertical: 14,
    alignItems: 'center',
  },
  registerBtnText: { color: '#3B5BDB', fontSize: 15, fontWeight: '600' },
  footer: { textAlign: 'center', fontSize: 11, color: '#2A3A50', marginTop: 32 },
})
