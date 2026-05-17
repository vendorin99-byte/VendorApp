import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, StatusBar, Alert, Modal, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { formatRp } from '../../utils/currency'
import api from '../../services/api'

const TABS = ['Semua', 'Menunggu', 'Aktif', 'Selesai']
const STATUS_MAP: Record<string, string[]> = {
  Semua: [],
  Menunggu: ['pending_dp'],
  Aktif: ['dp_paid', 'confirmed', 'fully_paid', 'in_progress'],
  Selesai: ['done', 'cancelled'],
}
const STATUS_LABEL: Record<string, string> = {
  pending_dp: 'Menunggu DP',
  dp_paid: 'DP Dibayar',
  confirmed: 'Dikonfirmasi',
  pending_remaining: 'Menunggu Lunas',
  fully_paid: 'Lunas',
  in_progress: 'Berjalan',
  done: 'Selesai',
  cancelled: 'Dibatalkan',
}
const STATUS_COLOR: Record<string, string> = {
  pending_dp: '#F59E0B',
  dp_paid: '#3B82F6',
  confirmed: '#10B981',
  fully_paid: '#10B981',
  in_progress: '#3B5BDB',
  done: '#6B7280',
  cancelled: '#EF4444',
}

export default function VendorOrdersScreen() {
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState('Semua')
  const [orders, setOrders] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [selected, setSelected] = useState<any>(null)

  async function fetchOrders() {
    const { data } = await api.get('/vendor/orders?page=1')
    setOrders(data.data || [])
  }

  useEffect(() => { fetchOrders() }, [])
  const onRefresh = useCallback(async () => { setRefreshing(true); await fetchOrders(); setRefreshing(false) }, [])

  const filtered = tab === 'Semua' ? orders : orders.filter((o) => STATUS_MAP[tab]?.includes(o.status))

  async function confirm(id: string) {
    await api.patch(`/vendor/orders/${id}/confirm`)
    setSelected(null); fetchOrders()
  }
  async function reject(id: string) {
    Alert.prompt('Tolak Pesanan', 'Alasan penolakan:', async (reason) => {
      if (!reason) return
      await api.patch(`/vendor/orders/${id}/reject`, { reason })
      setSelected(null); fetchOrders()
    })
  }
  async function markDone(id: string) {
    Alert.alert('Selesaikan Pesanan?', 'Pesanan akan ditandai selesai.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Selesai', onPress: async () => { await api.patch(`/vendor/orders/${id}/done`); setSelected(null); fetchOrders() } },
    ])
  }
  async function confirmCash(id: string) {
    Alert.alert('Konfirmasi Cash', 'Pastikan uang sudah diterima secara tunai.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Konfirmasi', onPress: async () => { await api.patch(`/vendor/orders/${id}/confirm-cash`); setSelected(null); fetchOrders() } },
    ])
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>Pesanan</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 12, gap: 10 }}
        renderItem={({ item: o }) => (
          <TouchableOpacity style={styles.card} onPress={() => setSelected(o)}>
            <View style={styles.cardTop}>
              <Text style={styles.customerName}>{o.users?.name}</Text>
              <View style={[styles.badge, { backgroundColor: (STATUS_COLOR[o.status] || '#6B7280') + '20' }]}>
                <Text style={[styles.badgeText, { color: STATUS_COLOR[o.status] || '#6B7280' }]}>{STATUS_LABEL[o.status] || o.status}</Text>
              </View>
            </View>
            <Text style={styles.serviceName}>{o.services?.name}</Text>
            <View style={styles.cardBottom}>
              <Text style={styles.date}>📅 {o.event_date}</Text>
              <Text style={styles.amount}>{formatRp(o.total_amount)}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>Tidak ada pesanan</Text></View>}
      />

      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Detail Pesanan</Text>
            {selected && (
              <>
                <ScrollView style={{ maxHeight: 360 }}>
                  <Row label="Customer" value={selected.users?.name} />
                  <Row label="No HP" value={selected.users?.phone || '-'} />
                  <Row label="Paket" value={selected.services?.name} />
                  <Row label="Tanggal Event" value={selected.event_date} />
                  <Row label="Metode Bayar" value={selected.payment_method || '-'} />
                  <Row label="Total" value={formatRp(selected.total_amount)} />
                  {selected.notes && <Row label="Catatan" value={selected.notes} />}
                  <Row label="Status" value={STATUS_LABEL[selected.status] || selected.status} />
                </ScrollView>

                <View style={styles.actions}>
                  {selected.status === 'dp_paid' && (
                    <>
                      <TouchableOpacity style={[styles.btn, { backgroundColor: '#10B981' }]} onPress={() => confirm(selected.id)}>
                        <Text style={styles.btnText}>✅ Terima</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.btn, { backgroundColor: '#EF4444' }]} onPress={() => reject(selected.id)}>
                        <Text style={styles.btnText}>❌ Tolak</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {selected.status === 'pending_dp' && selected.payment_method === 'cash' && (
                    <TouchableOpacity style={[styles.btn, { backgroundColor: '#10B981' }]} onPress={() => confirmCash(selected.id)}>
                      <Text style={styles.btnText}>💵 Konfirmasi Cash</Text>
                    </TouchableOpacity>
                  )}
                  {['fully_paid', 'confirmed'].includes(selected.status) && (
                    <TouchableOpacity style={[styles.btn, { backgroundColor: '#3B5BDB' }]} onPress={() => markDone(selected.id)}>
                      <Text style={styles.btnText}>✔ Selesai</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.btn, { backgroundColor: '#F3F4F6' }]} onPress={() => setSelected(null)}>
                    <Text style={[styles.btnText, { color: '#374151' }]}>Tutup</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#E5E7EB' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  tabBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#E5E7EB' },
  tabRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F3F4F6' },
  tabActive: { backgroundColor: '#3B5BDB' },
  tabText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  customerName: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  serviceName: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  date: { fontSize: 12, color: '#9CA3AF' },
  amount: { fontSize: 14, fontWeight: '600', color: '#3B5BDB' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#9CA3AF', fontSize: 15 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 17, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  rowLabel: { fontSize: 13, color: '#6B7280' },
  rowValue: { fontSize: 13, color: '#1F2937', fontWeight: '500', flex: 1, textAlign: 'right' },
  actions: { gap: 8, marginTop: 16 },
  btn: { borderRadius: 12, padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
})
