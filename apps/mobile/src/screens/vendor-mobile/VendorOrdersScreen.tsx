import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, StatusBar, Alert, Modal, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../hooks/useTheme'
import { formatRp } from '../../utils/currency'
import api from '../../services/api'

const TABS = ['Semua', 'Menunggu', 'Aktif', 'Menunggu Lunas', 'Selesai']
const STATUS_MAP: Record<string, string[]> = {
  Semua: [],
  Menunggu: ['pending_dp'],
  Aktif: ['dp_paid', 'confirmed', 'fully_paid', 'in_progress'],
  'Menunggu Lunas': ['confirmed', 'dp_paid'],
  Selesai: ['done', 'cancelled'],
}
const STATUS_LABEL: Record<string, string> = {
  pending_dp: 'Menunggu DP', dp_paid: 'DP Dibayar', confirmed: 'Dikonfirmasi',
  pending_remaining: 'Menunggu Lunas', fully_paid: 'Lunas', in_progress: 'Berjalan',
  done: 'Selesai', cancelled: 'Dibatalkan',
}
const STATUS_COLOR: Record<string, string> = {
  pending_dp: '#F59E0B', dp_paid: '#3B82F6', confirmed: '#10B981',
  fully_paid: '#10B981', in_progress: '#3B5BDB', done: '#6B7280', cancelled: '#EF4444',
}

export default function VendorOrdersScreen() {
  const insets = useSafeAreaInsets()
  const { isDark, bg, card, cardBorder, text, subtext, statusBar, statusBarBg, headerBg, headerBorder, divider } = useTheme()
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
  async function remindPayment(id: string) {
    Alert.alert('Kirim Pengingat?', 'Customer akan menerima notifikasi untuk segera melunasi pembayaran.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Kirim',
        onPress: async () => {
          try {
            await api.post(`/vendor/orders/${id}/remind-payment`)
            Alert.alert('Terkirim', 'Pengingat berhasil dikirim ke customer')
          } catch {
            Alert.alert('Gagal', 'Tidak dapat mengirim pengingat')
          }
        },
      },
    ])
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={statusBar} backgroundColor={statusBarBg} />
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
        <Text style={[styles.title, { color: text }]}>Pesanan</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabBar, { backgroundColor: headerBg, borderBottomColor: headerBorder }]} contentContainerStyle={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} style={[styles.tabBtn, { backgroundColor: isDark ? '#2A2A4A' : '#F3F4F6' }, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, { color: tab === t ? '#fff' : subtext }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B5BDB" />}
        contentContainerStyle={{ padding: 12, gap: 10 }}
        renderItem={({ item: o }) => (
          <TouchableOpacity style={[styles.card, { backgroundColor: card, borderColor: cardBorder }]} onPress={() => setSelected(o)}>
            <View style={styles.cardTop}>
              <Text style={[styles.customerName, { color: text }]}>{o.users?.name}</Text>
              <View style={[styles.badge, { backgroundColor: (STATUS_COLOR[o.status] || '#6B7280') + '20' }]}>
                <Text style={[styles.badgeText, { color: STATUS_COLOR[o.status] || '#6B7280' }]}>{STATUS_LABEL[o.status] || o.status}</Text>
              </View>
            </View>
            <Text style={[styles.serviceName, { color: subtext }]}>{o.services?.name}</Text>
            <View style={[styles.cardBottom, { borderTopColor: divider }]}>
              <Text style={[styles.date, { color: subtext }]}>📅 {o.event_date}</Text>
              <Text style={styles.amount}>{formatRp(o.total_amount)}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={styles.empty}><Text style={[styles.emptyText, { color: subtext }]}>Tidak ada pesanan</Text></View>}
      />

      {/* Detail Modal */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: card }]}>
            <View style={[styles.sheetHandle, { backgroundColor: cardBorder }]} />
            <Text style={[styles.sheetTitle, { color: text }]}>Detail Pesanan</Text>
            {selected && (
              <>
                <ScrollView style={{ maxHeight: 360 }}>
                  <Row label="Customer" value={selected.users?.name} text={text} subtext={subtext} divider={divider} />
                  <Row label="No HP" value={selected.users?.phone || '-'} text={text} subtext={subtext} divider={divider} />
                  <Row label="Paket" value={selected.services?.name} text={text} subtext={subtext} divider={divider} />
                  <Row label="Tanggal Event" value={selected.event_date} text={text} subtext={subtext} divider={divider} />
                  <Row label="Metode Bayar" value={selected.payment_method || '-'} text={text} subtext={subtext} divider={divider} />
                  <Row label="Total" value={formatRp(selected.total_amount)} text={text} subtext={subtext} divider={divider} />
                  {selected.notes && <Row label="Catatan" value={selected.notes} text={text} subtext={subtext} divider={divider} />}
                  <Row label="Status" value={STATUS_LABEL[selected.status] || selected.status} text={text} subtext={subtext} divider={divider} />
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
                  {['confirmed', 'dp_paid'].includes(selected.status) && (
                    <TouchableOpacity style={[styles.btn, { backgroundColor: '#F59E0B' }]} onPress={() => remindPayment(selected.id)}>
                      <Text style={styles.btnText}>💰 Kirim Pengingat Lunas</Text>
                    </TouchableOpacity>
                  )}
                  {['fully_paid', 'confirmed'].includes(selected.status) && (
                    <TouchableOpacity style={[styles.btn, { backgroundColor: '#3B5BDB' }]} onPress={() => markDone(selected.id)}>
                      <Text style={styles.btnText}>✔ Selesai</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.btn, { backgroundColor: isDark ? '#2A2A4A' : '#F3F4F6' }]} onPress={() => setSelected(null)}>
                    <Text style={[styles.btnText, { color: text }]}>Tutup</Text>
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

function Row({ label, value, text, subtext, divider }: { label: string; value: string; text: string; subtext: string; divider: string }) {
  return (
    <View style={[styles.row, { borderBottomColor: divider }]}>
      <Text style={[styles.rowLabel, { color: subtext }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: text }]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 20 },
  tabBar: { borderBottomWidth: 1 },
  tabRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
  tabActive: { backgroundColor: '#3B5BDB' },
  tabText: { fontFamily: 'Poppins_500Medium', fontSize: 13 },
  card: { borderRadius: 14, padding: 14, borderWidth: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  customerName: { fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontFamily: 'Poppins_600SemiBold', fontSize: 11 },
  serviceName: { fontFamily: 'Poppins_400Regular', fontSize: 13, marginBottom: 8 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1 },
  date: { fontFamily: 'Poppins_400Regular', fontSize: 12 },
  amount: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#3B5BDB' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontFamily: 'Poppins_400Regular', fontSize: 15 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontFamily: 'Poppins_700Bold', fontSize: 17, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1 },
  rowLabel: { fontFamily: 'Poppins_400Regular', fontSize: 13 },
  rowValue: { fontFamily: 'Poppins_500Medium', fontSize: 13, flex: 1, textAlign: 'right' },
  actions: { gap: 8, marginTop: 16 },
  btn: { borderRadius: 12, padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
})
