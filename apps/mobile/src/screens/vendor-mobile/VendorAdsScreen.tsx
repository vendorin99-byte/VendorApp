import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert, StatusBar, Modal, TextInput, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useTheme } from '../../hooks/useTheme'
import { formatRp } from '../../utils/currency'
import api from '../../services/api'

const STATUS_COLOR: Record<string, string> = {
  pending: '#F59E0B',
  active: '#10B981',
  paused: '#6B7280',
  rejected: '#EF4444',
  ended: '#9CA3AF',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu Persetujuan',
  active: 'Aktif',
  paused: 'Dijeda',
  rejected: 'Ditolak',
  ended: 'Selesai',
}

export default function VendorAdsScreen() {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { isDark, bg, card, cardBorder, text, subtext, placeholder, divider, statusBar, statusBarBg, headerBg, headerBorder } = useTheme()
  const [ads, setAds] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [services, setServices] = useState<any[]>([])
  const [form, setForm] = useState({ title: '', description: '', budget: '', service_id: '', target_keywords: '' })
  const [creating, setCreating] = useState(false)

  async function fetchAds() {
    const r = await api.get('/vendor/ads').catch(() => null)
    if (r) setAds(r.data || [])
  }

  async function fetchServices() {
    const r = await api.get('/vendor/services').catch(() => null)
    if (r) setServices((r.data || []).filter((s: any) => s.is_active))
  }

  useEffect(() => { fetchAds(); fetchServices() }, [])
  const onRefresh = useCallback(async () => { setRefreshing(true); await fetchAds(); setRefreshing(false) }, [])

  async function toggleAd(id: string, currentStatus: string) {
    if (['rejected', 'ended'].includes(currentStatus)) return
    await api.patch(`/vendor/ads/${id}/toggle`).catch(() => {})
    fetchAds()
  }

  async function deleteAd(id: string, budget: number, spent: number) {
    const refund = budget - spent
    Alert.alert(
      'Hapus Iklan?',
      `Saldo ${formatRp(refund)} akan dikembalikan ke dompet Anda.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await api.delete(`/vendor/ads/${id}`).catch(() => {})
            fetchAds()
          },
        },
      ]
    )
  }

  async function createAd() {
    if (!form.title || !form.budget) return Alert.alert('Error', 'Judul dan budget wajib diisi')
    const budget = parseInt(form.budget.replace(/\D/g, ''))
    if (budget < 50000) return Alert.alert('Error', 'Budget minimal Rp 50.000')
    setCreating(true)
    try {
      await api.post('/vendor/ads', {
        title: form.title,
        description: form.description,
        budget,
        service_id: form.service_id || undefined,
        target_keywords: form.target_keywords ? form.target_keywords.split(',').map((k: string) => k.trim()) : [],
      })
      setShowCreate(false)
      setForm({ title: '', description: '', budget: '', service_id: '', target_keywords: '' })
      fetchAds()
      Alert.alert('Berhasil', 'Iklan berhasil dibuat dan menunggu persetujuan admin')
    } catch (e: any) {
      Alert.alert('Gagal', e.response?.data?.error || 'Terjadi kesalahan')
    } finally {
      setCreating(false)
    }
  }

  const inputStyle = [styles.input, { color: text, backgroundColor: isDark ? '#0D0D1A' : '#F9FAFB', borderColor: cardBorder }]

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={statusBar} backgroundColor={statusBarBg} />
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: text }]}>Kelola Iklan</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
          <Text style={styles.createBtnText}>+ Buat</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={ads}
        keyExtractor={(a) => a.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B5BDB" />}
        contentContainerStyle={{ padding: 12, gap: 10 }}
        renderItem={({ item: ad }) => (
          <View style={[styles.card, { backgroundColor: card, borderColor: cardBorder }]}>
            <View style={styles.cardTop}>
              <View style={[styles.badge, { backgroundColor: (STATUS_COLOR[ad.status] || '#6B7280') + '20' }]}>
                <Text style={[styles.badgeText, { color: STATUS_COLOR[ad.status] || '#6B7280' }]}>{STATUS_LABEL[ad.status] || ad.status}</Text>
              </View>
              <View style={styles.cardActions}>
                {['active', 'paused'].includes(ad.status) && (
                  <TouchableOpacity onPress={() => toggleAd(ad.id, ad.status)} style={styles.toggleBtn}>
                    <Text style={styles.toggleText}>{ad.status === 'active' ? '⏸ Jeda' : '▶ Aktifkan'}</Text>
                  </TouchableOpacity>
                )}
                {!['ended'].includes(ad.status) && (
                  <TouchableOpacity onPress={() => deleteAd(ad.id, ad.budget, ad.spent || 0)}>
                    <Text style={styles.deleteText}>🗑</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <Text style={[styles.adTitle, { color: text }]}>{ad.title}</Text>
            {ad.description && <Text style={[styles.adDesc, { color: subtext }]} numberOfLines={2}>{ad.description}</Text>}

            <View style={[styles.statsRow, { borderTopColor: divider }]}>
              <StatBox label="Budget" value={formatRp(ad.budget)} color="#3B5BDB" />
              <StatBox label="Terpakai" value={formatRp(ad.spent || 0)} color="#F59E0B" />
              <StatBox label="Klik" value={String(ad.clicks || 0)} color="#10B981" />
              <StatBox label="Impresi" value={String(ad.impressions || 0)} color={subtext} />
            </View>

            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${Math.min(100, ((ad.spent || 0) / ad.budget) * 100)}%` }]} />
            </View>
            <Text style={[styles.progressText, { color: subtext }]}>
              {Math.round(((ad.spent || 0) / ad.budget) * 100)}% budget terpakai · Sisa {formatRp(ad.budget - (ad.spent || 0))}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📢</Text>
            <Text style={[styles.emptyTitle, { color: text }]}>Belum ada iklan</Text>
            <Text style={[styles.emptySub, { color: subtext }]}>Buat iklan untuk tampil di feed dan hasil pencarian customer</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowCreate(true)}>
              <Text style={styles.emptyBtnText}>Buat Iklan Pertama</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Create Ad Modal */}
      <Modal visible={showCreate} animationType="slide" transparent onRequestClose={() => setShowCreate(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: card }]}>
            <Text style={[styles.modalTitle, { color: text }]}>📢 Buat Iklan Baru</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
              <Text style={[styles.fieldLabel, { color: subtext }]}>Judul Iklan *</Text>
              <TextInput style={inputStyle} placeholder="cth: Promo Wedding Package 2026" placeholderTextColor={placeholder}
                value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))} />

              <Text style={[styles.fieldLabel, { color: subtext }]}>Deskripsi</Text>
              <TextInput style={[inputStyle, styles.textarea]} placeholder="Ceritakan penawaran Anda..." placeholderTextColor={placeholder}
                value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} multiline numberOfLines={3} />

              <Text style={[styles.fieldLabel, { color: subtext }]}>Budget (Rp) *</Text>
              <TextInput style={inputStyle} placeholder="cth: 100000" placeholderTextColor={placeholder} keyboardType="numeric"
                value={form.budget} onChangeText={v => setForm(f => ({ ...f, budget: v }))} />
              <Text style={[styles.fieldHint, { color: subtext }]}>Minimum Rp 50.000 · Dibayar per klik (CPC)</Text>

              <Text style={[styles.fieldLabel, { color: subtext }]}>Paket Layanan (opsional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                <TouchableOpacity style={[styles.serviceChip, form.service_id === '' && styles.serviceChipActive]} onPress={() => setForm(f => ({ ...f, service_id: '' }))}>
                  <Text style={[styles.serviceChipText, form.service_id === '' && { color: '#fff' }]}>Tanpa Paket</Text>
                </TouchableOpacity>
                {services.map(s => (
                  <TouchableOpacity key={s.id} style={[styles.serviceChip, form.service_id === s.id && styles.serviceChipActive]}
                    onPress={() => setForm(f => ({ ...f, service_id: s.id }))}>
                    <Text style={[styles.serviceChipText, form.service_id === s.id && { color: '#fff' }]} numberOfLines={1}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.fieldLabel, { color: subtext }]}>Kata Kunci Target (pisah koma)</Text>
              <TextInput style={inputStyle} placeholder="cth: wedding, foto, dekorasi" placeholderTextColor={placeholder}
                value={form.target_keywords} onChangeText={v => setForm(f => ({ ...f, target_keywords: v }))} />
              <Text style={[styles.fieldHint, { color: subtext }]}>Iklan tampil saat customer mencari kata-kata ini</Text>
            </ScrollView>

            <TouchableOpacity style={[styles.submitBtn, creating && { opacity: 0.7 }]} onPress={createAd} disabled={creating}>
              <Text style={styles.submitBtnText}>{creating ? 'Memproses...' : 'Buat & Bayar Budget'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setShowCreate(false)}>
              <Text style={[styles.cancelModalText, { color: subtext }]}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 8 },
  backBtn: { padding: 4 },
  backText: { fontSize: 28, fontFamily: 'Poppins_400Regular', lineHeight: 32 },
  headerTitle: { flex: 1, fontFamily: 'Poppins_700Bold', fontSize: 18 },
  createBtn: { backgroundColor: '#3B5BDB', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  createBtnText: { fontFamily: 'Poppins_600SemiBold', color: '#fff', fontSize: 13 },
  card: { borderRadius: 14, padding: 14, borderWidth: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontFamily: 'Poppins_600SemiBold', fontSize: 11 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleBtn: {},
  toggleText: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: '#3B5BDB' },
  deleteText: { fontSize: 18 },
  adTitle: { fontFamily: 'Poppins_700Bold', fontSize: 15, marginBottom: 4 },
  adDesc: { fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 18, marginBottom: 10 },
  statsRow: { flexDirection: 'row', paddingTop: 10, borderTopWidth: 1, marginTop: 6, marginBottom: 10 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: 'Poppins_700Bold', fontSize: 13 },
  statLabel: { fontFamily: 'Poppins_400Regular', fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  progressBg: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: '#3B5BDB', borderRadius: 3 },
  progressText: { fontFamily: 'Poppins_400Regular', fontSize: 11, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontFamily: 'Poppins_700Bold', fontSize: 17, marginBottom: 8 },
  emptySub: { fontFamily: 'Poppins_400Regular', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emptyBtn: { backgroundColor: '#3B5BDB', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { fontFamily: 'Poppins_700Bold', color: '#fff', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  modalTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16, marginBottom: 16 },
  fieldLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, marginTop: 12, marginBottom: 6 },
  fieldHint: { fontFamily: 'Poppins_400Regular', fontSize: 11, marginTop: 4, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, fontFamily: 'Poppins_400Regular' },
  textarea: { height: 80, textAlignVertical: 'top' },
  serviceChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: 'transparent' },
  serviceChipActive: { backgroundColor: '#3B5BDB', borderColor: '#3B5BDB' },
  serviceChipText: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: '#6B7280', maxWidth: 120 },
  submitBtn: { backgroundColor: '#3B5BDB', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 16 },
  submitBtnText: { fontFamily: 'Poppins_700Bold', color: '#fff', fontSize: 15 },
  cancelModalBtn: { alignItems: 'center', padding: 12 },
  cancelModalText: { fontFamily: 'Poppins_400Regular', fontSize: 14 },
})
