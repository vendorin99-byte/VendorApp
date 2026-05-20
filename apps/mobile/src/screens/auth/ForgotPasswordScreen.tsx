import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, StatusBar } from 'react-native'
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.brand}>
          <Image source={require('../../../assets/Logo.png')} style={styles.logo} resizeMode="contain" />
        </View>

        <Text style={styles.title}>Lupa Password?</Text>
        <Text style={styles.subtitle}>Masukkan email Anda, kami akan kirim{'\n'}kode reset password ke inbox Anda</Text>

        <View style={styles.form}>
          <View>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="contoh@email.com"
              placeholderTextColor="#555580"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {!!error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity style={styles.btn} onPress={handleSend} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'Mengirim...' : 'Kirim Kode Reset'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow}>
            <Text style={styles.backText}>← Kembali ke Login</Text>
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
  subtitle: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#9CA3AF', marginBottom: 32, lineHeight: 20 },
  form: { gap: 16 },
  label: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#9CA3AF', marginBottom: 6 },
  input: { fontFamily: 'Poppins_400Regular', borderWidth: 1, borderColor: '#2A2A4A', borderRadius: 12, padding: 14, fontSize: 15, color: '#fff', backgroundColor: '#1A1A2E' },
  error: { fontFamily: 'Poppins_400Regular', color: '#EF4444', fontSize: 13 },
  btn: { backgroundColor: '#3B5BDB', borderRadius: 12, padding: 16, alignItems: 'center' },
  btnText: { fontFamily: 'Poppins_700Bold', color: '#fff', fontSize: 16 },
  backRow: { alignItems: 'center', padding: 8 },
  backText: { fontFamily: 'Poppins_500Medium', color: '#9CA3AF', fontSize: 14 },
})
