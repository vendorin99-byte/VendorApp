import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import api from '../../services/api'

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<any>()
  const [form, setForm] = useState({ business_name: '', description: '', city: '', address: '', whatsapp: '', radius_km: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/vendor/profile').then(r => {
      const p = r.data
      setForm({
        business_name: p.business_name || '',
        description: p.description || '',
        city: p.city || '',
        address: p.address || '',
        whatsapp: p.whatsapp || '',
        radius_km: String(p.radius_km || ''),
      })
    }).catch(() => {})
  }, [])

  async function save() {
    if (!form.business_name) return Alert.alert('', 'Nama bisnis wajib diisi')
    setSaving(true)
    try {
      await api.patch('/vendor/profile', {
        business_name: form.business_name,
        description: form.description,
        city: form.city,
        address: form.address,
        whatsapp: form.whatsapp,
        radius_km: form.radius_km ? parseInt(form.radius_km) : undefined,
      })
      Alert.alert('✅', 'Profil berhasil diperbarui!')
      navigation.goBack()
    } catch (e: any) {
      Alert.alert('Gagal', e.response?.data?.error || 'Error')
    } finally { setSaving(false) }
  }

  const fields = [
    { label: 'Nama Bisnis *', key: 'business_name', placeholder: 'Nama bisnis Anda' },
    { label: 'Deskripsi', key: 'description', placeholder: 'Ceritakan tentang bisnis Anda...', multiline: true },
    { label: 'Kota', key: 'city', placeholder: 'Jakarta, Surabaya, dll' },
    { label: 'Alamat Lengkap', key: 'address', placeholder: 'Jl. Contoh No. 1, Jakarta' },
    { label: 'Nomor WhatsApp', key: 'whatsapp', placeholder: '628xxxxxxxxxx', keyboard: 'phone-pad' as any },
    { label: 'Radius Layanan (km)', key: 'radius_km', placeholder: '10', keyboard: 'number-pad' as any },
  ]

  return (
    <KeyboardAvoidingView style={[styles.root, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1628" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>✏️ Edit Profil</Text>
        <TouchableOpacity onPress={save} disabled={saving} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>{saving ? '...' : 'Simpan'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {fields.map(f => (
          <View key={f.key} style={styles.fieldWrap}>
            <Text style={styles.label}>{f.label}</Text>
            <TextInput
              style={[styles.input, f.multiline && { height: 90, textAlignVertical: 'top' }]}
              placeholder={f.placeholder}
              placeholderTextColor="#3A4A60"
              value={(form as any)[f.key]}
              onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
              keyboardType={f.keyboard || 'default'}
              multiline={f.multiline}
            />
          </View>
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const C = { bg: '#0A1628', card: '#111827', border: '#1E3A5F', primary: '#3B5BDB', text: '#fff', muted: '#6B7DB3' }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 28, color: C.text, lineHeight: 32 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  saveBtn: { backgroundColor: C.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  saveBtnText: { color: C.text, fontSize: 14, fontWeight: '700' },
  scroll: { padding: 16 },
  fieldWrap: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '600', color: C.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, color: C.text, fontSize: 15 },
})
