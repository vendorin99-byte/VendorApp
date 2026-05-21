import { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, Alert, Modal, TextInput, ScrollView, Switch } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { formatRpFull } from '../../utils/currency'
import api from '../../services/api'

export default function ServicesScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<any>()
  const [services, setServices] = useState<any[]>([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', description: '', price: '', dp_percent: '30', duration: '', is_active: true })
  const [saving, setSaving] = useState(false)

  async function fetchServices() {
    try {
      const { data } = await api.get('/vendor/services')
      setServices(data || [])
    } catch {}
  }

  useEffect(() => { fetchServices() }, [])

  function openNew() {
    setEditing(null)
    setForm({ name: '', description: '', price: '', dp_percent: '30', duration: '', is_active: true })
    setModal(true)
  }

  function openEdit(svc: any) {
    setEditing(svc)
    setForm({ name: svc.name, description: svc.description || '', price: String(svc.price), dp_percent: String(svc.dp_percent || 30), duration: svc.duration || '', is_active: svc.is_active })
    setModal(true)
  }

  async function save() {
    if (!form.name || !form.price) return Alert.alert('', 'Nama dan harga wajib diisi')
    setSaving(true)
    try {
      const body = { name: form.name, description: form.description, price: parseInt(form.price), dp_percent: parseInt(form.dp_percent), duration: form.duration, is_active: form.is_active }
      if (editing) await api.patch(`/vendor/services/${editing.id}`, body)
      else await api.post('/vendor/services', body)
      setModal(false); fetchServices()
    } catch (e: any) {
      Alert.alert('Gagal', e.response?.data?.error || 'Error')
    } finally { setSaving(false) }
  }

  async function deleteService(id: string) {
    Alert.alert('Hapus Paket', 'Yakin ingin menghapus paket layanan ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
        try { await api.delete(`/vendor/services/${id}`); fetchServices() } catch {}
      }},
    ])
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1628" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📦 Paket Layanan</Text>
        <TouchableOpacity onPress={openNew} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Tambah</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={services}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 12, gap: 10, paddingBottom: 32 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📦</Text>
            <Text style={styles.emptyTitle}>Belum ada paket layanan</Text>
            <Text style={styles.emptyText}>Tambahkan paket agar customer bisa memesan langsung</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={openNew}>
              <Text style={styles.emptyBtnText}>+ Buat Paket Pertama</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item: s }) => (
          <TouchableOpacity style={[styles.card, !s.is_active && { opacity: 0.5 }]} onPress={() => openEdit(s)}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.svcName}>{s.name}</Text>
                {s.description && <Text style={styles.svcDesc} numberOfLines={2}>{s.description}</Text>}
              </View>
              <TouchableOpacity onPress={() => deleteService(s.id)} style={styles.deleteBtn}>
                <Text style={{ color: '#EF4444', fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.cardBot}>
              <Text style={styles.price}>{formatRpFull(s.price)}</Text>
              <View style={styles.meta}>
                {s.duration && <Text style={styles.metaText}>⏱ {s.duration}</Text>}
                <Text style={styles.metaText}>DP {s.dp_percent}%</Text>
                {!s.is_active && <View style={styles.inactiveBadge}><Text style={styles.inactiveText}>Nonaktif</Text></View>}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{editing ? 'Edit Paket' : 'Paket Baru'}</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
            <View style={{ padding: 20, gap: 14 }}>
              {[
                { label: 'Nama Paket *', key: 'name', placeholder: 'contoh: Paket Wedding Premium' },
                { label: 'Deskripsi', key: 'description', placeholder: 'Apa saja yang termasuk dalam paket ini?' },
                { label: 'Harga (Rp) *', key: 'price', placeholder: '5000000', keyboard: 'number-pad' as any },
                { label: 'DP (%)', key: 'dp_percent', placeholder: '30', keyboard: 'number-pad' as any },
                { label: 'Durasi', key: 'duration', placeholder: 'contoh: 8 jam, 1 hari' },
              ].map(f => (
                <View key={f.key}>
                  <Text style={styles.inputLabel}>{f.label}</Text>
                  <TextInput style={styles.input} placeholder={f.placeholder} placeholderTextColor="#3A4A60"
                    value={(form as any)[f.key]} onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
                    keyboardType={f.keyboard || 'default'} multiline={f.key === 'description'} />
                </View>
              ))}

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Paket Aktif</Text>
                <Switch value={form.is_active} onValueChange={v => setForm(p => ({ ...p, is_active: v }))}
                  trackColor={{ true: '#3B5BDB', false: '#1E3A5F' }} thumbColor="#fff" />
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(false)}>
                  <Text style={styles.cancelText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={save} disabled={saving}>
                  <Text style={styles.saveBtnText}>{saving ? 'Menyimpan...' : 'Simpan'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

const C = { bg: '#0A1628', card: '#111827', card2: '#0D1B2E', border: '#1E3A5F', primary: '#3B5BDB', text: '#fff', muted: '#6B7DB3' }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 28, color: C.text, lineHeight: 32 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  addBtn: { backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: C.text, fontSize: 13, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 8 },
  emptyText: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emptyBtn: { backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: C.text, fontSize: 14, fontWeight: '700' },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  svcName: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 4 },
  svcDesc: { fontSize: 13, color: C.muted, lineHeight: 18 },
  deleteBtn: { padding: 4 },
  cardBot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  price: { fontSize: 16, fontWeight: '800', color: C.primary },
  meta: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  metaText: { fontSize: 11, color: C.muted },
  inactiveBadge: { backgroundColor: '#3A1A1A', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  inactiveText: { fontSize: 10, fontWeight: '700', color: '#EF4444' },
  modal: { flex: 1, backgroundColor: C.card2 },
  modalHandle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.text, paddingHorizontal: 20, paddingTop: 12, marginBottom: 4 },
  inputLabel: { fontSize: 11, fontWeight: '600', color: C.muted, marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: C.text, fontSize: 15 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.bg, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border },
  switchLabel: { fontSize: 15, fontWeight: '600', color: C.text },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  cancelText: { color: C.muted, fontSize: 15, fontWeight: '600' },
  saveBtn: { flex: 2, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: C.text, fontSize: 15, fontWeight: '700' },
})
