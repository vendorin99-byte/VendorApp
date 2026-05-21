import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, StatusBar } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RootStackParamList } from '../../navigation'
import { useTheme } from '../../hooks/useTheme'
import { formatRp } from '../../utils/currency'
import { formatDate } from '../../utils/date'
import api from '../../services/api'

type Nav = NativeStackNavigationProp<RootStackParamList>

const TABS = ['Aktif', 'Selesai', 'Dibatalkan']

const STATUS_MAP: Record<string, string[]> = {
  Aktif: ['pending_dp', 'dp_paid', 'confirmed', 'in_progress', 'pending_remaining'],
  Selesai: ['fully_paid', 'done'],
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
  const { bg, card, cardBorder, text, subtext, statusBar, statusBarBg, headerBg, headerBorder, divider } = useTheme()
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
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={statusBar} backgroundColor={statusBarBg} />
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
        <Text style={[styles.title, { color: text }]}>Pesanan Saya</Text>
        <View style={styles.tabs}>
          {TABS.map((t) => (
            <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => setActiveTab(t)}>
              <Text style={[styles.tabText, { color: subtext }, activeTab === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B5BDB" />}
        renderItem={({ item: o }) => {
          const st = STATUS_LABEL[o.status] || { label: o.status, color: '#6B7280' }
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: card, borderColor: cardBorder }]}
              onPress={() => navigation.navigate('OrderDetail', { bookingId: o.id })}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.vendorName, { color: text }]}>{o.vendors?.business_name}</Text>
                <View style={[styles.badge, { backgroundColor: st.color + '20' }]}>
                  <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
                </View>
              </View>
              <Text style={[styles.serviceName, { color: subtext }]}>{o.services?.name}</Text>
              <View style={[styles.cardFooter, { borderTopColor: divider }]}>
                <Text style={[styles.date, { color: subtext }]}>📅 {o.event_date ? formatDate(o.event_date) : '-'}</Text>
                <Text style={styles.amount}>{formatRp(o.total_amount)}</Text>
              </View>
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: subtext }]}>Tidak ada pesanan</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 0, borderBottomWidth: 1 },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 20, padding: 16, paddingBottom: 12 },
  tabs: { flexDirection: 'row' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderColor: 'transparent' },
  tabActive: { borderColor: '#3B5BDB' },
  tabText: { fontFamily: 'Poppins_500Medium', fontSize: 14 },
  tabTextActive: { color: '#3B5BDB', fontFamily: 'Poppins_700Bold' },
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 14, padding: 14, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  vendorName: { fontFamily: 'Poppins_700Bold', fontSize: 15, flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontFamily: 'Poppins_600SemiBold', fontSize: 12 },
  serviceName: { fontFamily: 'Poppins_400Regular', fontSize: 13, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1 },
  date: { fontFamily: 'Poppins_400Regular', fontSize: 13 },
  amount: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#3B5BDB' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontFamily: 'Poppins_400Regular', fontSize: 15 },
})
