import { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, StatusBar, RefreshControl, TouchableOpacity, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import DarkLightToggle from '../../components/DarkLightToggle'
import { useThemeStore } from '../../store/themeStore'
import { formatRp } from '../../utils/currency'
import { formatDate } from '../../utils/date'
import api from '../../services/api'

export default function VendorWalletScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useThemeStore()
  const [wallet, setWallet] = useState<any>(null)
  const [ledger, setLedger] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  async function fetchData() {
    const [w, l] = await Promise.all([
      api.get('/vendor/wallet'),
      api.get('/vendor/wallet/ledger'),
    ])
    setWallet(w.data)
    setLedger(l.data.data || [])
  }

  useEffect(() => { fetchData() }, [])

  async function onRefresh() {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const QUICK_ACTIONS = [
    { icon: '↙️', label: 'Deposit' },
    { icon: '↗️', label: 'Transfer' },
    { icon: '↓', label: 'Cairkan' },
    { icon: '⋯', label: 'Lainnya' },
  ]

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#3B5BDB" />

      {/* Blue header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Saldo</Text>
          <DarkLightToggle />
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo Tersedia</Text>
          <Text style={styles.balanceAmount}>{wallet ? formatRp(wallet.wallet_balance) : '-'}</Text>
          <Text style={styles.pendingText}>Dalam Proses: {wallet ? formatRp(wallet.wallet_pending) : '-'}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B5BDB" />}
      >
        {/* Quick actions */}
        <View style={styles.actionsCard}>
          {QUICK_ACTIONS.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={styles.actionItem}
              onPress={() => Alert.alert(a.label, 'Fitur ini akan segera hadir')}
            >
              <View style={styles.actionIcon}>
                <Text style={styles.actionIconText}>{a.icon}</Text>
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Ledger */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.cardTitle, isDark && styles.textWhite]}>Riwayat Transaksi</Text>
          {ledger.length === 0 && <Text style={styles.empty}>Belum ada transaksi</Text>}
          {ledger.map((l) => (
            <View key={l.id} style={styles.ledgerRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.ledgerDesc, isDark && styles.textWhite]} numberOfLines={1}>{l.description}</Text>
                <Text style={styles.ledgerDate}>{formatDate(l.created_at)}</Text>
              </View>
              <Text style={[styles.ledgerAmount, { color: l.type?.startsWith('credit') ? '#10B981' : '#EF4444' }]}>
                {l.type?.startsWith('credit') ? '+' : '-'}{formatRp(l.amount)}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.note}>💡 Untuk cairkan dana, gunakan dashboard vendor di web</Text>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#3B5BDB', paddingHorizontal: 16, paddingBottom: 24 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: '#fff' },
  balanceCard: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 16 },
  balanceLabel: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  balanceAmount: { fontFamily: 'Poppins_700Bold', fontSize: 28, color: '#fff' },
  pendingText: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 8 },
  scroll: { flex: 1 },
  actionsCard: { flexDirection: 'row', backgroundColor: '#fff', margin: 12, borderRadius: 16, padding: 16, justifyContent: 'space-around', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  actionItem: { alignItems: 'center', gap: 6 },
  actionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1F2937', alignItems: 'center', justifyContent: 'center' },
  actionIconText: { fontSize: 18, color: '#fff' },
  actionLabel: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: '#1F2937' },
  card: { backgroundColor: '#fff', borderRadius: 14, margin: 12, marginTop: 0, padding: 16 },
  cardDark: { backgroundColor: '#1A1A2E' },
  cardTitle: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: '#1F2937', marginBottom: 12 },
  textWhite: { color: '#fff' },
  ledgerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#F3F4F6', gap: 8 },
  ledgerDesc: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#374151' },
  ledgerDate: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  ledgerAmount: { fontFamily: 'Poppins_700Bold', fontSize: 13 },
  empty: { fontFamily: 'Poppins_400Regular', color: '#9CA3AF', textAlign: 'center', paddingVertical: 20, fontSize: 14 },
  note: { fontFamily: 'Poppins_400Regular', textAlign: 'center', fontSize: 12, color: '#9CA3AF', margin: 16 },
})
