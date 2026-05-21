import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, Alert, Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import * as DocumentPicker from 'expo-document-picker'
import api from '../../services/api'

const CATEGORIES = [
  'Wedding Organizer', 'Event Organizer', 'Fotografer',
  'Katering', 'Dekorasi', 'Sewa Mobil', 'Musik', 'Venue', 'Lainnya',
]

type VendorType = 'perorangan' | 'perusahaan'

interface DocFile { name: string; uri: string; mimeType: string }

export default function RegisterScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<any>()

  const [vendorType, setVendorType] = useState<VendorType>('perorangan')
  const [form, setForm] = useState({
    business_name: '', name: '', email: '', phone: '',
    category: '', city: '', password: '',
  })
  const [showPw, setShowPw] = useState(false)
  const [ktp, setKtp] = useState<DocFile | null>(null)
  const [nib, setNib] = useState<DocFile | null>(null)
  const [loading, setLoading] = useState(false)
  const [catOpen, setCatOpen] = useState(false)

  function set(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function pickDoc(target: 'ktp' | 'nib') {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    })
    if (result.canceled || !result.assets?.[0]) return
    const asset = result.assets[0]
    const doc: DocFile = { name: asset.name, uri: asset.uri, mimeType: asset.mimeType || 'image/jpeg' }
    if (target === 'ktp') setKtp(doc)
    else setNib(doc)
  }

  async function handleRegister() {
    const { business_name, name, email, phone, category, city, password } = form
    if (!business_name || !name || !email || !phone || !category || !city || !password) {
      return Alert.alert('', 'Semua field wajib diisi')
    }
    if (password.length < 8) return Alert.alert('', 'Password minimal 8 karakter')
    if (!ktp) return Alert.alert('', 'Foto KTP wajib diupload')
    if (vendorType === 'perusahaan' && !nib) return Alert.alert('', 'Dokumen NIB/AKTA wajib untuk perusahaan')

    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      fd.append('vendor_type', vendorType)
      fd.append('ktp', { uri: ktp.uri, name: ktp.name, type: ktp.mimeType } as any)
      if (nib) fd.append('nib', { uri: nib.uri, name: nib.name, type: nib.mimeType } as any)

      await api.post('/auth/register-vendor', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      navigation.replace('Waiting')
    } catch (err: any) {
      Alert.alert('Pendaftaran Gagal', err.response?.data?.error || 'Coba lagi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1628" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daftar Vendor</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Type toggle */}
        <View style={styles.typeRow}>
          {(['perorangan', 'perusahaan'] as VendorType[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.typeBtn, vendorType === t && styles.typeBtnActive]}
              onPress={() => { setVendorType(t); setNib(null) }}
            >
              <Text style={[styles.typeBtnText, vendorType === t && styles.typeBtnTextActive]}>
                {t === 'perorangan' ? '👤 Perorangan' : '🏢 Perusahaan'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            {vendorType === 'perorangan'
              ? '✓ Freelancer, usaha rumahan — cukup KTP saja'
              : '✓ CV, PT, UD — wajib KTP + NIB/AKTA perusahaan'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Bisnis</Text>

          <Field label="Nama Bisnis / Brand">
            <TextInput style={styles.input} placeholder="contoh: Studio Foto Abadi" placeholderTextColor="#3A4A60"
              value={form.business_name} onChangeText={v => set('business_name', v)} />
          </Field>

          <Field label="Nama Lengkap (sesuai KTP)">
            <TextInput style={styles.input} placeholder="Nama sesuai KTP" placeholderTextColor="#3A4A60"
              value={form.name} onChangeText={v => set('name', v)} />
          </Field>

          <Field label="Email Aktif">
            <TextInput style={styles.input} placeholder="email@bisnis.com" placeholderTextColor="#3A4A60"
              value={form.email} onChangeText={v => set('email', v)}
              keyboardType="email-address" autoCapitalize="none" />
          </Field>

          <Field label="Nomor WhatsApp / HP">
            <TextInput style={styles.input} placeholder="08xxxxxxxxxx" placeholderTextColor="#3A4A60"
              value={form.phone} onChangeText={v => set('phone', v)} keyboardType="phone-pad" />
          </Field>

          <Field label="Jenis Layanan">
            <TouchableOpacity style={styles.input} onPress={() => setCatOpen(!catOpen)}>
              <Text style={{ color: form.category ? '#fff' : '#3A4A60', fontSize: 15 }}>
                {form.category || 'Pilih jenis layanan ▾'}
              </Text>
            </TouchableOpacity>
            {catOpen && (
              <View style={styles.catDropdown}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity key={c} style={styles.catItem} onPress={() => { set('category', c); setCatOpen(false) }}>
                    <Text style={[styles.catItemText, form.category === c && { color: '#3B5BDB', fontWeight: '700' }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Field>

          <Field label="Kota Operasional">
            <TextInput style={styles.input} placeholder="Jakarta, Surabaya, dll" placeholderTextColor="#3A4A60"
              value={form.city} onChangeText={v => set('city', v)} />
          </Field>

          <Field label="Password">
            <View style={styles.pwWrap}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Min. 8 karakter" placeholderTextColor="#3A4A60"
                value={form.password} onChangeText={v => set('password', v)} secureTextEntry={!showPw} />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                <Text style={{ fontSize: 18 }}>{showPw ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </Field>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dokumen Identitas</Text>

          <Field label="Foto KTP *">
            <TouchableOpacity style={styles.docBtn} onPress={() => pickDoc('ktp')}>
              <Text style={styles.docBtnText}>
                {ktp ? `✓ ${ktp.name}` : '📎 Upload Foto KTP (JPG/PDF)'}
              </Text>
            </TouchableOpacity>
          </Field>

          {vendorType === 'perusahaan' && (
            <Field label="NIB / AKTA Perusahaan *">
              <TouchableOpacity style={styles.docBtn} onPress={() => pickDoc('nib')}>
                <Text style={styles.docBtnText}>
                  {nib ? `✓ ${nib.name}` : '📎 Upload NIB atau AKTA'}
                </Text>
              </TouchableOpacity>
            </Field>
          )}

          <Text style={styles.privacyNote}>
            🔒 Dokumen digunakan hanya untuk verifikasi identitas dan disimpan secara aman sesuai UU PDP.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.submitBtnText}>{loading ? 'Mendaftar...' : 'Daftar Sekarang'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginLink} onPress={() => navigation.goBack()}>
          <Text style={styles.loginLinkText}>Sudah punya akun? <Text style={{ color: '#3B5BDB' }}>Masuk di sini</Text></Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B7DB3', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A1628' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1E3A5F' },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 28, color: '#fff', lineHeight: 32 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  scroll: { flex: 1 },
  typeRow: { flexDirection: 'row', margin: 16, gap: 10 },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#1E3A5F', alignItems: 'center', backgroundColor: '#0D1B2E' },
  typeBtnActive: { borderColor: '#3B5BDB', backgroundColor: '#1A2E50' },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: '#4A6080' },
  typeBtnTextActive: { color: '#fff' },
  notice: { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#0F2744', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#1E3A5F' },
  noticeText: { fontSize: 12, color: '#6B9BD2' },
  section: { margin: 16, backgroundColor: '#111827', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#1E3A5F', marginBottom: 0 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 16 },
  input: {
    backgroundColor: '#0D1B2E', borderWidth: 1, borderColor: '#1E3A5F',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    color: '#fff', fontSize: 15,
  },
  pwWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { padding: 4 },
  catDropdown: { backgroundColor: '#0D1B2E', borderWidth: 1, borderColor: '#1E3A5F', borderRadius: 12, marginTop: 4, overflow: 'hidden' },
  catItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#1A2E48' },
  catItemText: { fontSize: 14, color: '#C0D0E8' },
  docBtn: { backgroundColor: '#0D1B2E', borderWidth: 1.5, borderColor: '#1E3A5F', borderRadius: 12, borderStyle: 'dashed', paddingVertical: 14, paddingHorizontal: 16 },
  docBtnText: { fontSize: 14, color: '#6B9BD2' },
  privacyNote: { fontSize: 11, color: '#4A6080', marginTop: 10, lineHeight: 17 },
  submitBtn: {
    margin: 16, marginTop: 20, backgroundColor: '#3B5BDB',
    borderRadius: 16, paddingVertical: 16, alignItems: 'center',
    shadowColor: '#3B5BDB', shadowOpacity: 0.5, shadowRadius: 14, elevation: 6,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginLink: { alignItems: 'center', marginTop: 4 },
  loginLinkText: { fontSize: 14, color: '#4A6080' },
})
