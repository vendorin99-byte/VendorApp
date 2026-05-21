import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, StatusBar, Alert, ScrollView, Modal } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { formatRp, formatRpFull } from '../../utils/currency'
import api from '../../services/api'

const TABS = ['Semua', 'Menunggu', 'Aktif', 'Selesai']
const STATUS_MAP: Record<string, string[]> = {
  Semua: [],
  Menunggu: ['pending_dp'],
  Aktif: ['dp_paid', 'confirmed', 'fully_paid', 'in_progress'],
  Selesai: ['done', 'cancelled'],
}
const STATUS_LABEL: Record<string, string> = {
  pending_dp: 'Menunggu DP', dp_paid: 'DP Dibayar', confirmed: 'Dikonfirmasi',
  fully_paid: 'Lunas', in_progress: 'Berjalan', done: 'Selesai', cancelled: 'Dibatalkan',
}
const STATUS_COLOR: Record<string, string> = {
  pending_dp: '#F59E0B', dp_paid: '#3B82F6', confirmed: '#10B981',
  fully_paid: '#10B981', in_progress: '#3B5BDB', done: '#6B7280', cancelled: '#EF4444',
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState('Semua')
  const [orders, setOrders] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [selected, setSelected] = useState<any>(null)

  async function fetchOrders() {
    try {
      const { data } = await api.get('/vendor/orders?page=1')
      setOrders(data.data || [])
    } catch {}
  }

  useEffect(() => { fetchOrders() }, [])
  const onRefresh = useCallback(async () => { setRefreshing(true); await fetchOrders(); setRefreshing(false) }, [])

  const filtered = tab === 'Semua' ? orders : orders.filter(o => STATUS_MAP[tab]?.includes(o.status))

  async function confirmOrder(id: string) {
    try {
      await api.patch(`/vendor/orders/${id}/confirm`)
      setSelected(null); fetchOrders()
      Alert.alert('✅', 'Pesanan dikonfirmasi!')
    } catch (e: any) { Alert.alert('Gagal', e.response?.data?.error || 'Error') }
  }

  async function rejectOrder(id: string) {
    Alert.alert('Tolak Pesanan', 'Yakin ingin menolak pesanan ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Tolak', style: 'destructive', onPress: async () => {
        try {
          await api.patch(`/vendor/orders/${id}/reject`, { reason: 'Ditolak oleh vendor' })
          setSelected(null); fetchOrders()
        } catch {}
      }},
    ])
  }

  async function markDone(id: string) {
    try {
      await api.patch(`/vendor/orders/${id}/done`)
      setSelected(null); fetchOrders()
      Alert.alert('✅', 'Pesanan ditandai selesai!')
    } catch (e: any) { Alert.alert('Gagal', e.response?.data?.error || 'Error') }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1628" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 Pesanan Saya</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabContent}>
        {TABS.map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B5BDB" />}
        contentContainerStyle={{ padding: 12, gap: 10, paddingBottom: 32 }}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>Tidak ada pesanan {tab !== 'Semua' ? tab.toLowerCase() : ''}</Text></View>}
        renderItem={({ item: o }) => (
          <TouchableOpacity style={styles.card} onPress={() => setSelected(o)}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.customerName}>{o.users?.name}</Text>
                <Text style={styles.serviceName}>{o.services?.name}</Text>
              </View>
              <View style={[styles.statusChip, { backgroundColor: (STATUS_COLOR[o.status] || '#6B7280') + '25' }]}>
                <Text style={[styles.statusChipText, { color: STATUS_COLOR[o.status] || '#6B7280' }]}>
                  {STATUS_LABEL[o.status] || o.status}
                </Text>
              </View>
            </View>
            <View style={styles.cardBottom}>
              <Text style={styles.eventDate}>📅 {o.event_date}</Text>
              <Text style={styles.amount}>{formatRp(o.total_amount)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Detail Modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        {selected && (
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Detail Pesanan</Text>
                <TouchableOpacity onPress={() => setSelected(null)} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.statusBanner, { backgroundColor: (STATUS_COLOR[selected.status] || '#6B7280') + '20' }]}>
                <Text style={[styles.statusBannerText, { color: STATUS_COLOR[selected.status] || '#6B7280' }]}>
                  {STATUS_LABEL[selected.status] || selected.status}
                </Text>
              </View>

              {[
                ['Pelanggan', selected.users?.name],
                ['Layanan', selected.services?.name],
                ['Tanggal Event', selected.event_date],
                ['Total', formatRpFull(selected.total_amount)],
                ['DP', formatRpFull(selected.dp_amount)],
                ['Catatan', selected.notes || '—'],
              ].map(([lbl, val]) => (
                <View key={lbl as string} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{lbl as string}</Text>
                  <Text style={styles.detailValue}>{val as string}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Action buttons */}
            <View style={styles.actionBar}>
              {selected.status === 'dp_paid' && (
                <>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => rejectOrder(selected.id)}>
                    <Text style={styles.rejectBtnText}>Tolak</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmBtn} onPress={() => confirmOrder(selected.id)}>
                    <Text style={styles.confirmBtnText}>✓ Konfirmasi</Text>
                  </TouchableOpacity>
                </>
              )}
              {['confirmed', 'fully_paid', 'in_progress'].includes(selected.status) && (
                <TouchableOpacity style={styles.doneBtn} onPress={() => markDone(selected.id)}>
                  <Text style={styles.confirmBtnText}>✅ Tandai Selesai</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </Modal>
    </View>
  )
}

const C = { bg: '#0A1628', card: '#111827', card2: '#0D1B2E', border: '#1E3A5F', primary: '#3B5BDB', text: '#fff', muted: '#6B7DB3' }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  tabBar: { borderBottomWidth: 1, borderBottomColor: C.border },
  tabContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  tabActive: { backgroundColor: C.primary, borderColor: C.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: C.muted },
  tabTextActive: { color: C.text },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, color: C.muted },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  customerName: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 2 },
  serviceName: { fontSize: 13, color: C.muted },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusChipText: { fontSize: 11, fontWeight: '700' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  eventDate: { fontSize: 12, color: C.muted },
  amount: { fontSize: 14, fontWeight: '700', color: C.primary },
  modal: { flex: 1, backgroundColor: C.card2 },
  modalHandle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: C.muted, fontSize: 14, fontWeight: '700' },
  statusBanner: { margin: 16, borderRadius: 12, padding: 12, alignItems: 'center' },
  statusBannerText: { fontSize: 15, fontWeight: '700' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  detailLabel: { fontSize: 13, color: C.muted, flex: 1 },
  detailValue: { fontSize: 14, fontWeight: '600', color: C.text, flex: 2, textAlign: 'right' },
  actionBar: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: C.border },
  rejectBtn: { flex: 1, borderWidth: 1, borderColor: '#EF4444', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  rejectBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
  confirmBtn: { flex: 2, backgroundColor: '#10B981', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  doneBtn: { flex: 1, backgroundColor: '#10B981', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  confirmBtnText: { color: C.text, fontSize: 15, fontWeight: '700' },
})
