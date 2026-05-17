import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, StatusBar } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RootStackParamList } from '../../navigation'
import { formatRp } from '../../utils/currency'
import { formatDate } from '../../utils/date'
import api from '../../services/api'

type Nav = NativeStackNavigationProp<RootStackParamList>

const TABS = ['Aktif', 'Selesai', 'Dibatalkan']

const STATUS_MAP: Record<string, string[]> = {
  Aktif: ['pending_dp', 'dp_paid', 'confirmed', 'in_progress', 'pending_remaining', 'fully_paid'],
  Selesai: ['done'],
  Dibatalkan: ['cancelled'],
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending_dp: { label: 'Menunggu DP', color: '#F59E0B' },
  dp_paid: { label: 'DP Dibayar', color: '#3B82F6' },
  confirmed: { label: 'Dikonfirmasi', color: '#10B981' },
  fully_paid: { label: 'Lunas', color: '#10B981' },
  done: { label: 'Selesai', color: '#6B7280' },
  cancelled: { label: 'Dibatalkan', color: '#EF4444' },
}

export default function OrderListScreen() {
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const [activeTab, setActiveTab] = useState('Aktif')
  const [orders, setOrders] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  async function fetchOrders() {
    const { data } = await api.get('/bookings/my')
    setOrders(data || [])
  }

  useEffect(() => { fetchOrders() }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchOrders()
    setRefreshing(false)
  }, [])

  const filtered = orders.filter((o) => STATUS_MAP[activeTab]?.includes(o.status))

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>Pesanan Saya</Text>
        <View style={styles.tabs}>
          {TABS.map((t) => (
            <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => setActiveTab(t)}>
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item: o }) => {
          const st = STATUS_LABEL[o.status] || { label: o.status, color: '#6B7280' }
          return (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('OrderDetail', { bookingId: o.id })}>
              <View style={styles.cardHeader}>
                <Text style={styles.vendorName}>{o.vendors?.business_name}</Text>
                <View style={[styles.badge, { backgroundColor: st.color + '20' }]}>
                  <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
                </View>
              </View>
              <Text style={styles.serviceName}>{o.services?.name}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.date}>📅 {o.event_date ? formatDate(o.event_date) : '-'}</Text>
                <Text style={styles.amount}>{formatRp(o.total_amount)}</Text>
              </View>
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>Tidak ada pesanan</Text></View>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#fff', paddingBottom: 0, borderBottomWidth: 1, borderColor: '#E5E7EB' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', padding: 16, paddingBottom: 12 },
  tabs: { flexDirection: 'row' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderColor: 'transparent' },
  tabActive: { borderColor: '#3B5BDB' },
  tabText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  tabTextActive: { color: '#3B5BDB', fontWeight: '700' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  vendorName: { fontSize: 15, fontWeight: 'bold', color: '#1F2937', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  serviceName: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 13, color: '#6B7280' },
  amount: { fontSize: 14, fontWeight: 'bold', color: '#3B5BDB' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: '#9CA3AF' },
})
