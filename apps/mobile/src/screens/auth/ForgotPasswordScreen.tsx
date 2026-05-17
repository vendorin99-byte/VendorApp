import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation'
import api from '../../services/api'

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSend() {
    if (!email.trim()) return setError('Masukkan email Anda')
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/forgot-password', { email: email.trim() })
      navigation.navigate('ResetPassword', { email: email.trim() })
    } catch (e: any) {
      setError(e.response?.data?.error || 'Gagal mengirim kode')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <Image source={require('../../../assets/logo-only.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Lupa Password</Text>
      <Text style={styles.subtitle}>Masukkan email Anda, kami akan kirim{'\n'}kode reset password ke inbox Anda</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="📧  Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity style={styles.btn} onPress={handleSend} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Mengirim...' : 'Kirim Kode Reset'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Kembali ke Login</Text>
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
