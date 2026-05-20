import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, StatusBar } from 'react-native'
import PasswordInput from '../../components/PasswordInput'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation'
import api from '../../services/api'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Register'>

export default function RegisterScreen() {
  const navigation = useNavigation<Nav>()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', ref_code: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    setLoading(true)
    setError('')
    try {
      const refParam = form.ref_code.trim() ? `?ref=${form.ref_code.trim()}` : ''
      await api.post(`/auth/register${refParam}`, { name: form.name, email: form.email, phone: form.phone, password: form.password })
      navigation.navigate('OTP', { email: form.email })
    } catch (e: any) {
      setError(e.response?.data?.error || 'Pendaftaran gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Selamat Datang!{'\n'}Buat Akun Anda</Text>

        <View style={styles.form}>
          <View>
            <Text style={styles.label}>Nama Lengkap</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan nama lengkap Anda"
              placeholderTextColor="#555580"
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
              autoCapitalize="words"
            />
          </View>
          <View>
            <Text style={styles.label}>Alamat Email</Text>
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
            <Text style={styles.label}>No. HP</Text>
            <TextInput
              style={styles.input}
              placeholder="08xxxxxxxxxx"
              placeholderTextColor="#555580"
              value={form.phone}
              onChangeText={(v) => setForm({ ...form, phone: v })}
              keyboardType="phone-pad"
            />
          </View>
          <View>
            <Text style={styles.label}>Kata Sandi</Text>
            <PasswordInput
              value={form.password}
              onChangeText={(v) => setForm({ ...form, password: v })}
              placeholder="Masukkan kata sandi Anda"
              dark
            />
          </View>
          <View>
            <Text style={styles.label}>Kode Referral (opsional)</Text>
            <TextInput
              style={[styles.input, { borderStyle: 'dashed' }]}
              placeholder="Masukkan kode referral"
              placeholderTextColor="#555580"
              value={form.ref_code}
              onChangeText={(v) => setForm({ ...form, ref_code: v.toUpperCase() })}
              autoCapitalize="characters"
            />
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'Mendaftar...' : 'Buat Akun'}</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>atau</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.socialBtn}>
            <Text style={[styles.socialIcon, { color: '#EA4335' }]}>G</Text>
            <Text style={styles.socialText}>Daftar dengan Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn}>
            <Text style={[styles.socialIcon, { color: '#1877F2' }]}>f</Text>
            <Text style={styles.socialText}>Daftar dengan Facebook</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.loginRow}>
          <Text style={styles.loginHint}>Sudah punya akun? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.loginLink}>Masuk di sini</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0D0D1A', padding: 24, paddingTop: 56 },
  back: { marginBottom: 24 },
  backIcon: { color: '#fff', fontSize: 22 },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 26, color: '#fff', lineHeight: 38, marginBottom: 32 },
  form: { gap: 16 },
  label: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#9CA3AF', marginBottom: 6 },
  input: { fontFamily: 'Poppins_400Regular', borderWidth: 1, borderColor: '#2A2A4A', borderRadius: 12, padding: 14, fontSize: 15, color: '#fff', backgroundColor: '#1A1A2E' },
  error: { fontFamily: 'Poppins_400Regular', color: '#EF4444', fontSize: 13 },
  btn: { backgroundColor: '#3B5BDB', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 },
  btnText: { fontFamily: 'Poppins_700Bold', color: '#fff', fontSize: 16 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#2A2A4A' },
  dividerText: { fontFamily: 'Poppins_400Regular', color: '#555580', fontSize: 13 },
  socialBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2A2A4A', borderRadius: 12, padding: 14, gap: 10 },
  socialIcon: { fontSize: 18, fontWeight: 'bold' },
  socialText: { fontFamily: 'Poppins_500Medium', color: '#fff', fontSize: 14 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, paddingBottom: 16 },
  loginHint: { fontFamily: 'Poppins_400Regular', color: '#9CA3AF', fontSize: 14 },
  loginLink: { fontFamily: 'Poppins_600SemiBold', color: '#3B5BDB', fontSize: 14 },
})
