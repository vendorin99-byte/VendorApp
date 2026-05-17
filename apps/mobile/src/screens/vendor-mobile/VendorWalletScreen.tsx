import { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, StatusBar, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { formatRp } from '../../utils/currency'
import { formatDate } from '../../utils/date'
import api from '../../services/api'

export default function VendorWalletScreen() {
  const insets = useSafeAreaInsets()
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3B5BDB" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Dompet</Text>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo Tersedia</Text>
          <Text style={styles.balanceAmount}>{wallet ? formatRp(wallet.wallet_balance) : '-'}</Text>
          <Text style={styles.pendingText}>Dalam Proses (Escrow): {wallet ? formatRp(wallet.wallet_pending) : '-'}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B5BDB" />}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Riwayat Transaksi</Text>
          {ledger.length === 0 && <Text style={styles.empty}>Belum ada transaksi</Text>}
          {ledger.map((l) => (
            <View key={l.id} style={styles.ledgerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ledgerDesc} numberOfLines={1}>{l.description}</Text>
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
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#3B5BDB', paddingHorizontal: 16, paddingBottom: 24 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  balanceCard: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 16 },
  balanceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  balanceAmount: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  pendingText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 8 },
  scroll: { flex: 1 },
  card: { backgroundColor: '#fff', borderRadius: 14, margin: 12, padding: 16 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  ledgerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#F3F4F6', gap: 8 },
  ledgerDesc: { fontSize: 13, color: '#374151', fontWeight: '500' },
  ledgerDate: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  ledgerAmount: { fontSize: 13, fontWeight: '700' },
  empty: { color: '#9CA3AF', textAlign: 'center', paddingVertical: 20 },
  note: { textAlign: 'center', fontSize: 12, color: '#9CA3AF', margin: 16 },
})
