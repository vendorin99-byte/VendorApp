import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, StatusBar } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
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

export default function DashboardScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<any>()
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
      setProfile(p); setOrders(o); setWallet(w)
    } catch {}
  }

  useEffect(() => { fetchAll() }, [])
  const onRefresh = useCallback(async () => { setRefreshing(true); await fetchAll(); setRefreshing(false) }, [])

  const now = new Date()
  const needAction = orders.filter(o => o.status === 'dp_paid')
  const pending = orders.filter(o => o.status === 'pending_dp')
  const active = orders.filter(o => ['confirmed', 'fully_paid', 'in_progress'].includes(o.status))
  const thisMonth = orders.filter(o => o.status === 'done' && new Date(o.event_date).getMonth() === now.getMonth())
  const monthRevenue = thisMonth.reduce((s, o) => s + (o.total_amount || 0), 0)
  const upcoming = orders
    .filter(o => !['done', 'cancelled'].includes(o.status) && new Date(o.event_date) >= now)
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    .slice(0, 5)

  const hour = now.getHours()
  const greeting = hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam'

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1628" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <View style={styles.nameRow}>
              <Text style={styles.bizName} numberOfLines={1}>
                {profile?.business_name || user?.name || 'Vendor'}
              </Text>
              {profile?.verified && (
                <View style={styles.badge}><Text style={styles.badgeText}>✓ Verified</Text></View>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('Profil')}>
            <Text style={{ fontSize: 22 }}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* Balance */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceItem}>
            <Text style={styles.balLabel}>Saldo Aktif</Text>
            <Text style={styles.balValue}>{wallet ? formatRp(wallet.wallet_balance) : '—'}</Text>
          </View>
          <View style={styles.balDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balLabel}>Dalam Proses</Text>
            <Text style={styles.balValue}>{wallet ? formatRp(wallet.wallet_pending) : '—'}</Text>
          </View>
          <TouchableOpacity style={styles.walletBtn} onPress={() => navigation.navigate('Dompet')}>
            <Text style={styles.walletBtnText}>Dompet →</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B5BDB" />}>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <StatCard icon="⏳" label="Menunggu DP" value={pending.length} color="#F59E0B" />
          <StatCard icon="🔔" label="Perlu Aksi" value={needAction.length} color="#EF4444" alert={needAction.length > 0} />
          <StatCard icon="🔄" label="Aktif" value={active.length} color="#3B5BDB" />
          <StatCard icon="💰" label="Bulan Ini" value={formatRp(monthRevenue)} color="#10B981" small />
        </View>

        {/* Need action */}
        {needAction.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="🔴 Perlu Konfirmasi" onSeeAll={() => navigation.navigate('Pesanan')} />
            {needAction.slice(0, 3).map(o => (
              <TouchableOpacity key={o.id} style={styles.actionCard}
                onPress={() => navigation.navigate('OrderDetail', { order: o })}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionName}>{o.users?.name}</Text>
                  <Text style={styles.actionSub}>{o.services?.name} · {o.event_date}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.actionAmt}>{formatRp(o.total_amount)}</Text>
                  <Text style={styles.actionStatus}>DP Dibayar ›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Upcoming */}
        <View style={styles.section}>
          <SectionHeader title="📅 Jadwal Mendatang" onSeeAll={() => navigation.navigate('Pesanan')} />
          {upcoming.length === 0
            ? <Text style={styles.empty}>Belum ada jadwal mendatang</Text>
            : upcoming.map(o => {
              const d = new Date(o.event_date)
              const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000)
              return (
                <TouchableOpacity key={o.id} style={styles.upRow}
                  onPress={() => navigation.navigate('OrderDetail', { order: o })}>
                  <View style={styles.dateBox}>
                    <Text style={styles.dateDay}>{d.getDate()}</Text>
                    <Text style={styles.dateMon}>{d.toLocaleDateString('id-ID', { month: 'short' })}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.upName}>{o.users?.name}</Text>
                    <Text style={styles.upSvc}>{o.services?.name}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLOR[o.status] || '#6B7280') + '25' }]}>
                      <Text style={[styles.statusText, { color: STATUS_COLOR[o.status] || '#6B7280' }]}>
                        {STATUS_LABEL[o.status] || o.status}
                      </Text>
                    </View>
                    <Text style={styles.diffText}>{diff === 0 ? 'Hari ini' : diff === 1 ? 'Besok' : `${diff}h lagi`}</Text>
                  </View>
                </TouchableOpacity>
              )
            })
          }
        </View>

        {/* Quick menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menu Cepat</Text>
          <View style={styles.quickGrid}>
            {[
              { icon: '🖼️', label: 'Portfolio', screen: 'Portfolio' },
              { icon: '📦', label: 'Layanan', screen: 'Layanan' },
              { icon: '🗺️', label: 'Peta', screen: 'Peta' },
              { icon: '💬', label: 'Chat', screen: 'Chat' },
              { icon: '⚙️', label: 'Pengaturan', screen: 'Pengaturan' },
            ].map(m => (
              <TouchableOpacity key={m.label} style={styles.quickItem}
                onPress={() => navigation.navigate(m.screen)}>
                <View style={styles.quickIcon}><Text style={{ fontSize: 22 }}>{m.icon}</Text></View>
                <Text style={styles.quickLabel}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  )
}

function StatCard({ icon, label, value, color, alert, small }: any) {
  return (
    <View style={[styles.statCard, alert && { borderColor: color, borderWidth: 1.5 }]}>
      <Text style={{ fontSize: 22, marginBottom: 6 }}>{icon}</Text>
      <Text style={[styles.statValue, { color, fontSize: small ? 13 : 22 }]} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {alert && <View style={[styles.alertDot, { backgroundColor: color }]} />}
    </View>
  )
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll: () => void }) {
  return (
    <View style={styles.secHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity onPress={onSeeAll}><Text style={styles.seeAll}>Lihat Semua</Text></TouchableOpacity>
    </View>
  )
}

const C = { bg: '#0A1628', card: '#111827', card2: '#0D1B2E', border: '#1E3A5F', primary: '#3B5BDB', text: '#fff', muted: '#6B7DB3', dim: '#3A4A60' }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.bg, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  greeting: { fontSize: 12, color: C.muted },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  bizName: { fontSize: 18, fontWeight: '700', color: C.text, maxWidth: 220 },
  badge: { backgroundColor: '#0A2A1A', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#10B981' },
  avatarBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  balanceCard: { backgroundColor: C.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center' },
  balanceItem: { flex: 1 },
  balLabel: { fontSize: 11, color: C.muted, marginBottom: 3 },
  balValue: { fontSize: 15, fontWeight: '700', color: C.text },
  balDivider: { width: 1, backgroundColor: C.border, marginHorizontal: 12, height: 32 },
  walletBtn: { backgroundColor: C.primary + '25', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: C.primary + '50' },
  walletBtnText: { fontSize: 12, fontWeight: '600', color: C.primary },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  statCard: { flex: 1, minWidth: '44%', backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border },
  statValue: { fontWeight: '700', color: C.text },
  statLabel: { fontSize: 11, color: C.muted, marginTop: 2 },
  alertDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4 },
  section: { backgroundColor: C.card, marginHorizontal: 12, marginBottom: 12, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.border },
  secHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  seeAll: { fontSize: 12, fontWeight: '600', color: C.primary },
  empty: { fontSize: 13, color: C.dim, textAlign: 'center', paddingVertical: 12 },
  actionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.card2, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#EF444430' },
  actionName: { fontSize: 14, fontWeight: '600', color: C.text },
  actionSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  actionAmt: { fontSize: 13, fontWeight: '700', color: C.primary },
  actionStatus: { fontSize: 11, fontWeight: '500', color: '#F59E0B', marginTop: 2 },
  upRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  dateBox: { width: 44, height: 44, backgroundColor: C.primary + '20', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.primary + '40' },
  dateDay: { fontSize: 16, fontWeight: '700', color: C.primary, lineHeight: 20 },
  dateMon: { fontSize: 10, color: C.primary },
  upName: { fontSize: 13, fontWeight: '600', color: C.text },
  upSvc: { fontSize: 12, color: C.muted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '700' },
  diffText: { fontSize: 11, color: C.dim, marginTop: 4 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  quickItem: { alignItems: 'center', minWidth: '17%', flexGrow: 1 },
  quickIcon: { width: 52, height: 52, backgroundColor: C.card2, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border, marginBottom: 6 },
  quickLabel: { fontSize: 11, color: C.muted, textAlign: 'center' },
})
