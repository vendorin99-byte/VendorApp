import { useState } from 'react'
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation'
import api from '../../services/api'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Register'>

export default function RegisterScreen() {
  const navigation = useNavigation<Nav>()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/register', form)
      navigation.navigate('OTP', { email: form.email })
    } catch (e: any) {
      setError(e.response?.data?.error || 'Pendaftaran gagal')
    } finally {
      setLoading(false)
    }
  }

  const fields: { label: string; key: keyof typeof form; placeholder: string; type?: 'email-address' | 'phone-pad'; secure?: boolean }[] = [
    { label: 'Nama Lengkap', key: 'name', placeholder: 'Masukkan nama lengkap Anda' },
    { label: 'Alamat Email', key: 'email', placeholder: 'contoh@email.com', type: 'email-address' },
    { label: 'No. Telepon', key: 'phone', placeholder: '08xxxxxxxxxx', type: 'phone-pad' },
    { label: 'Kata Sandi', key: 'password', placeholder: 'Masukkan kata sandi Anda', secure: true },
  ]

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={require('../../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Pendaftaran</Text>
        <Text style={styles.subtitle}>Silahkan isi data berikut{'\n'}untuk melanjutkan</Text>

        <View style={styles.form}>
          {fields.map((f) => (
            <View key={f.key}>
              <TextInput
                style={styles.input}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChangeText={(v) => setForm({ ...form, [f.key]: v })}
                keyboardType={f.type}
                secureTextEntry={f.secure}
                autoCapitalize={f.type === 'email-address' ? 'none' : 'words'}
              />
            </View>
          ))}

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'Mendaftar...' : 'Daftar Sekarang'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Kembali ke Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', padding: 24, alignItems: 'center' },
  logo: { width: 100, height: 100, marginTop: 40 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', marginTop: 24 },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginTop: 8, marginBottom: 24 },
  form: { width: '100%', gap: 12 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 15 },
  error: { color: '#EF4444', fontSize: 13 },
  btn: { backgroundColor: '#3B5BDB', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  back: { marginTop: 20, padding: 8 },
  backText: { color: '#3B5BDB', fontSize: 14 },
})
