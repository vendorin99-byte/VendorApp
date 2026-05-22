import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, StatusBar, Modal, TextInput, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { formatRpFull } from '../../utils/currency'
import api from '../../services/api'

const TX_LABEL: Record<string, string> = {
  order_payment: 'Pembayaran Pesanan', withdrawal: 'Penarikan Dana',
  refund: 'Refund', commission: 'Komisi Platform', bonus: 'Bonus',
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<any>()
  const [wallet, setWallet] = useState<any>(null)
  const [ledger, setLedger] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [withdrawModal, setWithdrawModal] = useState(false)
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function fetchAll() {
    try {
      const [w, l] = await Promise.all([
        api.get('/vendor/wallet').then(r => r.data),
        api.get('/vendor/wallet/ledger').then(r => r.data || []),
      ])
      setWallet(w); setLedger(l)
    } catch {}
  }

  useEffect(() => { fetchAll() }, [])
  const onRefresh = useCallback(async () => { setRefreshing(true); await fetchAll(); setRefreshing(false) }, [])

  async function requestWithdraw() {
    const amt = parseInt(amount)
    if (!amt || amt < 50000) return Alert.alert('', 'Minimal penarikan Rp 50.000')
    if (amt > (wallet?.wallet_balance || 0)) return Alert.alert('', 'Saldo tidak cukup')
    setSubmitting(true)
    try {
      await api.post('/vendor/wallet/withdraw', { amount: amt })
      setWithdrawModal(false); setAmount('')
      Alert.alert('✅', 'Permintaan penarikan terkirim!')
      fetchAll()
    } catch (e: any) {
      Alert.alert('Gagal', e.response?.data?.error || 'Error')
    } finally { setSubmitting(false) }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1628" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💰 Dompet</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B5BDB" />} showsVerticalScrollIndicator={false}>

        {/* Balance card */}
        <View style={styles.balCard}>
          <Text style={styles.balLabel}>Saldo Tersedia</Text>
          <Text style={styles.balAmount}>{wallet ? formatRpFull(wallet.wallet_balance) : '—'}</Text>
          <Text style={styles.pendingLabel}>Dalam Proses: {wallet ? formatRpFull(wallet.wallet_pending) : '—'}</Text>
        </View>

        {/* Quick actions */}
        <View style={styles.quickRow}>
          {[
            { icon: '💸', label: 'Cairkan', onPress: () => setWithdrawModal(true) },
            { icon: '📊', label: 'Statistik', onPress: () => {} },
            { icon: '🏦', label: 'Rek. Bank', onPress: () => {} },
          ].map(a => (
            <TouchableOpacity key={a.label} style={styles.quickBtn} onPress={a.onPress}>
              <View style={styles.quickIcon}><Text style={{ fontSize: 22 }}>{a.icon}</Text></View>
              <Text style={styles.quickLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Ledger */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Riwayat Transaksi</Text>
          {ledger.length === 0 && <Text style={styles.empty}>Belum ada transaksi</Text>}
          {ledger.map((tx: any, i: number) => {
            const amt = tx.amount ?? 0
            const dateStr = tx.created_at
              ? (() => { try { return new Date(tx.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) } catch { return '—' } })()
              : '—'
            return (
              <View key={tx.id ?? i} style={styles.txRow}>
                <View style={[styles.txIcon, { backgroundColor: amt > 0 ? '#10B98120' : '#EF444420' }]}>
                  <Text style={{ fontSize: 16 }}>{amt > 0 ? '⬆️' : '⬇️'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txLabel}>{TX_LABEL[tx.type] || tx.type || '—'}</Text>
                  <Text style={styles.txDate}>{dateStr}</Text>
                </View>
                <Text style={[styles.txAmount, { color: amt > 0 ? '#10B981' : '#EF4444' }]}>
                  {amt > 0 ? '+' : ''}{formatRpFull(amt)}
                </Text>
              </View>
            )
          })}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Withdraw modal */}
      <Modal visible={withdrawModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setWithdrawModal(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>💸 Cairkan Dana</Text>
          <Text style={styles.modalSub}>Saldo: {wallet ? formatRpFull(wallet.wallet_balance) : '—'}</Text>
          <Text style={styles.inputLabel}>Jumlah Penarikan (min. Rp 50.000)</Text>
          <TextInput
            style={styles.input}
            placeholder="contoh: 500000"
            placeholderTextColor="#3A4A60"
            value={amount}
            onChangeText={setAmount}
            keyboardType="number-pad"
          />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setWithdrawModal(false)}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.withdrawBtn, submitting && { opacity: 0.7 }]} onPress={requestWithdraw} disabled={submitting}>
              <Text style={styles.withdrawBtnText}>{submitting ? 'Memproses...' : 'Cairkan'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const C = { bg: '#0A1628', card: '#111827', card2: '#0D1B2E', border: '#1E3A5F', primary: '#3B5BDB', text: '#fff', muted: '#6B7DB3' }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 28, color: C.text, lineHeight: 32 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  balCard: { margin: 16, backgroundColor: C.primary, borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: C.primary, shadowOpacity: 0.4, shadowRadius: 20, elevation: 8 },
  balLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  balAmount: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 6 },
  pendingLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  quickRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, paddingHorizontal: 16, marginBottom: 16 },
  quickBtn: { alignItems: 'center' },
  quickIcon: { width: 56, height: 56, backgroundColor: C.card, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border, marginBottom: 6 },
  quickLabel: { fontSize: 12, color: C.muted },
  section: { backgroundColor: C.card, marginHorizontal: 16, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.border },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 14 },
  empty: { fontSize: 13, color: C.muted, textAlign: 'center', paddingVertical: 20 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  txIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txLabel: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 2 },
  txDate: { fontSize: 12, color: C.muted },
  txAmount: { fontSize: 14, fontWeight: '700' },
  modal: { flex: 1, backgroundColor: C.card2, padding: 24 },
  modalHandle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 6 },
  modalSub: { fontSize: 14, color: C.muted, marginBottom: 24 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: C.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: C.text, fontSize: 18, fontWeight: '700', marginBottom: 24 },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  cancelBtnText: { color: C.muted, fontSize: 15, fontWeight: '600' },
  withdrawBtn: { flex: 2, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  withdrawBtnText: { color: C.text, fontSize: 15, fontWeight: '700' },
})
