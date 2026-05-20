import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, StatusBar, Linking, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CommonActions, useNavigation } from '@react-navigation/native'
import { useAuthStore } from '../../store/authStore'
import { formatRp } from '../../utils/currency'
import api from '../../services/api'

const STATUS_LABEL: Record<string, string> = {
  pending_dp: 'Menunggu DP', dp_paid: 'DP Dibayar', confirmed: 'Dikonfirmasi',
  fully_paid: 'Lunas', in_progress: 'Berjalan', done: 'Selesai', cancelled: 'Dibatalkan',
}
const STATUS_COLOR: Record<string, string> = {
  pending_dp: '#F59E0B', dp_paid: '#3B82F6', confirmed: '#10B981',
  fully_paid: '#10B981', in_progress: '#3B5BDB', done: '#6B7280', cancelled: '#EF4444',
}

const WEB_DASHBOARD = 'https://web-henna-five-13.vercel.app/mitra/dashboard'

export default function VendorDashboardScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const { user } = useAuthStore()
  const [profile, setProfile] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [wallet, setWallet] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)

  async function fetchAll() {
    try {
      const [p, o, w] = await Promise.all([
        api.get('/vendor/profile').then(r => r.data),
        api.get('/vendor/orders?page=1').then(r => r.data.data || []),
        api.get('/vendor/wallet').then(r => r.data),
      ])
      setProfile(p)
      setOrders(o)
      setWallet(w)
    } catch {}
  }

  useEffect(() => { fetchAll() }, [])
  const onRefresh = useCallback(async () => { setRefreshing(true); await fetchAll(); setRefreshing(false) }, [])

  // Stats
  const needAction = orders.filter(o => o.status === 'dp_paid')
  const pending = orders.filter(o => o.status === 'pending_dp')
  const active = orders.filter(o => ['confirmed', 'fully_paid', 'in_progress'].includes(o.status))
  const now = new Date()
  const thisMonth = orders.filter(o => o.status === 'done' && new Date(o.event_date).getMonth() === now.getMonth())
  const monthRevenue = thisMonth.reduce((s, o) => s + (o.total_amount || 0), 0)

  // Upcoming events (next 7 days)
  const upcoming = orders
    .filter(o => !['done', 'cancelled'].includes(o.status) && new Date(o.event_date) >= now)
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    .slice(0, 5)

  const hour = new Date().getHours()
  const greeting = hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam'
  const businessName = profile?.business_name || user?.name || 'Vendor'

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <View style={styles.nameRow}>
              <Text style={styles.businessName} numberOfLines={1}>{businessName}</Text>
              {profile?.verified && <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓ Terverifikasi</Text></View>}
            </View>
          </View>
          <TouchableOpacity style={styles.webBtn} onPress={() => Linking.openURL(WEB_DASHBOARD)}>
            <Text style={styles.webBtnText}>🌐 Web</Text>
          </TouchableOpacity>
        </View>

        {/* Saldo */}
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Saldo Aktif</Text>
            <Text style={styles.balanceValue}>{wallet ? formatRp(wallet.wallet_balance) : '-'}</Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Dalam Proses</Text>
            <Text style={styles.balanceValue}>{wallet ? formatRp(wallet.wallet_pending) : '-'}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B5BDB" />}
      >
        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatCard icon="⏳" label="Menunggu DP" value={pending.length} color="#F59E0B" />
          <StatCard icon="🔔" label="Perlu Konfirmasi" value={needAction.length} color="#EF4444" highlight={needAction.length > 0} />
          <StatCard icon="🔄" label="Pesanan Aktif" value={active.length} color="#3B5BDB" />
          <StatCard icon="💰" label="Revenue Bulan Ini" value={formatRp(monthRevenue)} small color="#10B981" />
        </View>

        {/* Perlu Tindakan */}
        {needAction.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔴 Perlu Konfirmasi</Text>
              <TouchableOpacity onPress={() => navigation.dispatch(CommonActions.navigate({ name: 'Pesanan' }))}>
                <Text style={styles.seeAll}>Lihat Semua</Text>
              </TouchableOpacity>
            </View>
            {needAction.slice(0, 3).map(o => (
              <TouchableOpacity key={o.id} style={styles.actionCard} onPress={() => navigation.dispatch(CommonActions.navigate({ name: 'Pesanan' }))}>
                <View style={styles.actionCardLeft}>
                  <Text style={styles.actionCustomer}>{o.users?.name}</Text>
                  <Text style={styles.actionService}>{o.services?.name} • {o.event_date}</Text>
                </View>
                <View>
                  <Text style={styles.actionAmount}>{formatRp(o.total_amount)}</Text>
                  <Text style={styles.actionStatus}>DP Dibayar ›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Jadwal Mendatang */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📅 Jadwal Mendatang</Text>
            <TouchableOpacity onPress={() => navigation.dispatch(CommonActions.navigate({ name: 'Pesanan' }))}>
              <Text style={styles.seeAll}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          {upcoming.length === 0 && (
            <Text style={styles.emptyText}>Belum ada jadwal mendatang</Text>
          )}
          {upcoming.map(o => {
            const d = new Date(o.event_date)
            const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000)
            return (
              <View key={o.id} style={styles.upcomingCard}>
                <View style={styles.dateBox}>
                  <Text style={styles.dateDay}>{d.getDate()}</Text>
                  <Text style={styles.dateMon}>{d.toLocaleDateString('id-ID', { month: 'short' })}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.upcomingCustomer}>{o.users?.name}</Text>
                  <Text style={styles.upcomingService}>{o.services?.name}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={[styles.miniStatus, { backgroundColor: (STATUS_COLOR[o.status] || '#6B7280') + '25' }]}>
                    <Text style={[styles.miniStatusText, { color: STATUS_COLOR[o.status] || '#6B7280' }]}>
                      {STATUS_LABEL[o.status] || o.status}
                    </Text>
                  </View>
                  <Text style={styles.diffText}>{diff === 0 ? 'Hari ini' : diff === 1 ? 'Besok' : `${diff} hari lagi`}</Text>
                </View>
              </View>
            )
          })}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kelola Bisnis</Text>
          <View style={styles.quickActions}>
            {[
              { icon: '🖼️', label: 'Portfolio', path: '/mitra/dashboard/portfolio' },
              { icon: '💼', label: 'Layanan', path: '/mitra/dashboard/services' },
              { icon: '📢', label: 'Iklan', path: '/mitra/dashboard/ads' },
              { icon: '📊', label: 'Statistik', path: '/mitra/dashboard/stats' },
              { icon: '⚙️', label: 'Pengaturan', path: '/mitra/dashboard/settings' },
            ].map(item => (
              <TouchableOpacity key={item.label} style={styles.quickAction} onPress={() => Linking.openURL('https://web-henna-five-13.vercel.app' + item.path)}>
                <View style={styles.quickIcon}><Text style={{ fontSize: 20 }}>{item.icon}</Text></View>
                <Text style={styles.quickLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.footerNote}>Tarik ke bawah untuk perbarui data</Text>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  )
}

function StatCard({ icon, label, value, color, highlight, small }: { icon: string; label: string; value: any; color: string; highlight?: boolean; small?: boolean }) {
  return (
    <View style={[styles.statCard, highlight && { borderColor: color, borderWidth: 1.5 }]}>
      <Text style={{ fontSize: 20, marginBottom: 6 }}>{icon}</Text>
      <Text style={[styles.statValue, { color, fontSize: small ? 13 : 22 }]} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {highlight && <View style={[styles.dot, { backgroundColor: color }]} />}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D0D1A' },
  header: { backgroundColor: '#0D0D1A', paddingHorizontal: 16, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#2A2A4A' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  greeting: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#9CA3AF' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  businessName: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#fff', maxWidth: 200 },
  verifiedBadge: { backgroundColor: '#102A1A', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  verifiedText: { fontFamily: 'Poppins_500Medium', fontSize: 11, color: '#10B981' },
  webBtn: { backgroundColor: '#1A1A2E', borderWidth: 1, borderColor: '#2A2A4A', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  webBtnText: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: '#9CA3AF' },
  balanceRow: { flexDirection: 'row', backgroundColor: '#1A1A2E', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#2A2A4A' },
  balanceItem: { flex: 1 },
  balanceDivider: { width: 1, backgroundColor: '#2A2A4A', marginHorizontal: 14 },
  balanceLabel: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#9CA3AF', marginBottom: 4 },
  balanceValue: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#fff' },
  scroll: { flex: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  statCard: { flex: 1, minWidth: '44%', backgroundColor: '#1A1A2E', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#2A2A4A' },
  statValue: { fontFamily: 'Poppins_700Bold', color: '#fff' },
  statLabel: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  dot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4 },
  section: { backgroundColor: '#1A1A2E', marginHorizontal: 12, marginBottom: 12, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2A2A4A' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#fff' },
  seeAll: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: '#3B5BDB' },
  emptyText: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#555580', textAlign: 'center', paddingVertical: 12 },
  actionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0D0D1A', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#EF444430' },
  actionCardLeft: { flex: 1, marginRight: 8 },
  actionCustomer: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#fff' },
  actionService: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  actionAmount: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: '#3B5BDB', textAlign: 'right' },
  actionStatus: { fontFamily: 'Poppins_500Medium', fontSize: 11, color: '#F59E0B', textAlign: 'right', marginTop: 2 },
  upcomingCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2A2A4A' },
  dateBox: { width: 44, height: 44, backgroundColor: '#3B5BDB20', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#3B5BDB40' },
  dateDay: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#3B5BDB', lineHeight: 20 },
  dateMon: { fontFamily: 'Poppins_400Regular', fontSize: 10, color: '#3B5BDB' },
  upcomingCustomer: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: '#fff' },
  upcomingService: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  miniStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  miniStatusText: { fontFamily: 'Poppins_600SemiBold', fontSize: 10 },
  diffText: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#6B7280', marginTop: 4, textAlign: 'right' },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  quickAction: { alignItems: 'center', width: '17%', flexGrow: 1 },
  quickIcon: { width: 48, height: 48, backgroundColor: '#0D0D1A', borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2A2A4A', marginBottom: 6 },
  quickLabel: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#9CA3AF', textAlign: 'center' },
  footerNote: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#2A2A4A', textAlign: 'center', marginTop: 4 },
})
