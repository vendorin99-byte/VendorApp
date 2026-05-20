import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator, StatusBar, Clipboard } from 'react-native'
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RootStackParamList } from '../../navigation'
import { useTheme } from '../../hooks/useTheme'
import { formatRp } from '../../utils/currency'
import api from '../../services/api'

type Route = RouteProp<RootStackParamList, 'Payment'>
type Nav = NativeStackNavigationProp<RootStackParamList>

const METHOD_LABEL: Record<string, string> = {
  dp: 'Bayar DP', lunas: 'Bayar Lunas', cash: 'Tunai (Cash)',
  qris: 'QRIS', transfer: 'Transfer Bank', tempo: 'Bayar Tempo',
}

export default function PaymentScreen() {
  const route = useRoute<Route>()
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const { bookingId, amount, method, vendorBank } = route.params
  const { isDark, bg, card, cardBorder, text, subtext, statusBar } = useTheme()
  const [loading, setLoading] = useState(false)
  const [paid, setPaid] = useState(false)

  async function handleSimulatePay(type: 'dp' | 'full' | 'remaining' = 'dp') {
    setLoading(true)
    try {
      await api.post(`/bookings/${bookingId}/simulate-pay`, { type })
      setPaid(true)
    } catch (e: any) {
      Alert.alert('Gagal', e.response?.data?.error || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  function copyToClipboard(txt: string) {
    Clipboard.setString(txt)
    Alert.alert('Disalin', 'Teks berhasil disalin ke clipboard')
  }

  if (paid) {
    return (
      <View style={[styles.successRoot, { paddingTop: insets.top + 20, backgroundColor: bg }]}>
        <StatusBar barStyle={statusBar} backgroundColor={bg} />
        <Text style={styles.successIcon}>✅</Text>
        <Text style={[styles.successTitle, { color: text }]}>Pembayaran Berhasil!</Text>
        <Text style={[styles.successSub, { color: subtext }]}>
          {method === 'tempo' ? 'Pesanan dikonfirmasi. Bayar dalam 7 hari.' : `${formatRp(amount)} telah dikirim ke vendor`}
        </Text>
        <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.replace('OrderDetail', { bookingId })}>
          <Text style={styles.doneBtnText}>Lihat Pesanan</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView style={[styles.root, { backgroundColor: bg }]} contentContainerStyle={{ paddingBottom: 40 }}>
      <StatusBar barStyle={statusBar} backgroundColor={bg} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerLabel}>{METHOD_LABEL[method] || 'Pembayaran'}</Text>
        <Text style={styles.headerAmount}>{formatRp(amount)}</Text>
        {method === 'dp' && <Text style={styles.headerSub}>Bayar DP sekarang, sisa dibayar setelah konfirmasi vendor</Text>}
        {method === 'lunas' && <Text style={styles.headerSub}>Pembayaran lunas sekaligus</Text>}
        {method === 'tempo' && <Text style={styles.headerSub}>Bayar setelah event selesai (maks. 7 hari)</Text>}
      </View>

      <View style={styles.body}>
        {/* QRIS */}
        {(method === 'qris' || method === 'lunas' || method === 'dp') && (
          <View style={[styles.payCard, { backgroundColor: card, borderColor: cardBorder }]}>
            <Text style={[styles.cardTitle, { color: text }]}>📲  Bayar dengan QRIS</Text>
            <View style={styles.qrContainer}>
              <View style={styles.qrBox}>
                <Text style={styles.qrText}>QR</Text>
                <Text style={styles.qrSub}>QRIS</Text>
                <View style={styles.qrGrid}>
                  {Array.from({ length: 6 }).map((_, r) => (
                    <View key={r} style={styles.qrRow}>
                      {Array.from({ length: 6 }).map((_, c) => (
                        <View key={c} style={[styles.qrCell, (r + c) % 3 === 0 && styles.qrCellFilled]} />
                      ))}
                    </View>
                  ))}
                </View>
              </View>
            </View>
            <Text style={[styles.qrNote, { color: subtext }]}>Scan QR di atas menggunakan GoPay, OVO, Dana, atau m-banking</Text>
            <TouchableOpacity
              style={[styles.payBtn, loading && styles.payBtnDisabled]}
              onPress={() => handleSimulatePay(method === 'dp' ? 'dp' : 'full')}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>✓  Simulasikan Pembayaran QRIS</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Transfer */}
        {(method === 'transfer' || method === 'dp' || method === 'lunas') && (
          <View style={[styles.payCard, { backgroundColor: card, borderColor: cardBorder }]}>
            <Text style={[styles.cardTitle, { color: text }]}>🏦  Transfer Bank</Text>
            {vendorBank ? (
              <View style={[styles.bankInfo, { backgroundColor: isDark ? '#0D0D1A' : '#F9FAFB' }]}>
                <BankRow label="Bank" value={vendorBank.bank_code} text={text} subtext={subtext} />
                <BankRow label="No. Rekening" value={vendorBank.account_number} text={text} subtext={subtext} onCopy={() => copyToClipboard(vendorBank.account_number)} />
                <BankRow label="Atas Nama" value={vendorBank.account_name} text={text} subtext={subtext} />
                <BankRow label="Jumlah" value={formatRp(amount)} text={text} subtext={subtext} highlight />
              </View>
            ) : (
              <Text style={[styles.noBankText, { color: subtext }]}>Vendor belum menambahkan rekening bank</Text>
            )}
            <TouchableOpacity
              style={[styles.payBtn, loading && styles.payBtnDisabled]}
              onPress={() => handleSimulatePay(method === 'dp' ? 'dp' : 'full')}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>✓  Saya Sudah Transfer</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Cash */}
        {method === 'cash' && (
          <View style={[styles.payCard, { backgroundColor: card, borderColor: cardBorder }]}>
            <Text style={[styles.cardTitle, { color: text }]}>💵  Pembayaran Tunai</Text>
            <Text style={[styles.cashDesc, { color: subtext }]}>
              Bayar langsung kepada vendor saat hari acara. Vendor akan mengonfirmasi penerimaan pembayaran setelah event.
            </Text>
            <View style={[styles.amountBox, { backgroundColor: isDark ? '#0D0D1A' : '#F9FAFB' }]}>
              <Text style={[styles.amountLabel, { color: subtext }]}>Total yang dibayarkan:</Text>
              <Text style={styles.amountValue}>{formatRp(amount)}</Text>
            </View>
            <TouchableOpacity style={[styles.payBtn, loading && styles.payBtnDisabled]} onPress={() => handleSimulatePay('full')} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>✓  Konfirmasi Pesanan Cash</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Tempo */}
        {method === 'tempo' && (
          <View style={[styles.payCard, { backgroundColor: card, borderColor: cardBorder }]}>
            <Text style={[styles.cardTitle, { color: text }]}>📅  Bayar Tempo (7 Hari)</Text>
            <Text style={[styles.cashDesc, { color: subtext }]}>
              Pesanan dikonfirmasi sekarang, pembayaran dilakukan paling lambat 7 hari setelah event selesai.
            </Text>
            <View style={[styles.amountBox, { backgroundColor: isDark ? '#0D0D1A' : '#F9FAFB' }]}>
              <Text style={[styles.amountLabel, { color: subtext }]}>Total yang harus dibayar:</Text>
              <Text style={styles.amountValue}>{formatRp(amount)}</Text>
            </View>
            <TouchableOpacity style={[styles.payBtn, loading && styles.payBtnDisabled]} onPress={() => handleSimulatePay('full')} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>✓  Setujui Pesanan Tempo</Text>}
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={[styles.cancelText, { color: subtext }]}>Batalkan</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

function BankRow({ label, value, onCopy, highlight, text, subtext }: { label: string; value: string; onCopy?: () => void; highlight?: boolean; text: string; subtext: string }) {
  return (
    <View style={styles.bankRow}>
      <Text style={[styles.bankLabel, { color: subtext }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={[styles.bankValue, { color: highlight ? '#3B5BDB' : text }, highlight && { fontFamily: 'Poppins_700Bold' }]}>{value}</Text>
        {onCopy && (
          <TouchableOpacity onPress={onCopy}>
            <Text style={{ fontSize: 14 }}>📋</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { backgroundColor: '#3B5BDB', padding: 20, paddingBottom: 28, alignItems: 'center' },
  headerLabel: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  headerAmount: { fontFamily: 'Poppins_700Bold', fontSize: 32, color: '#fff' },
  headerSub: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 6, textAlign: 'center' },
  body: { padding: 16, gap: 16, marginTop: -12 },
  payCard: { borderRadius: 16, padding: 18, borderWidth: 1 },
  cardTitle: { fontFamily: 'Poppins_700Bold', fontSize: 15, marginBottom: 16 },
  qrContainer: { alignItems: 'center', marginBottom: 14 },
  qrBox: { backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center', width: 160 },
  qrText: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: '#3B5BDB' },
  qrSub: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: '#3B5BDB', marginBottom: 12 },
  qrGrid: { gap: 4 },
  qrRow: { flexDirection: 'row', gap: 4 },
  qrCell: { width: 14, height: 14, borderRadius: 2, backgroundColor: '#E5E7EB' },
  qrCellFilled: { backgroundColor: '#1F2937' },
  qrNote: { fontFamily: 'Poppins_400Regular', fontSize: 12, textAlign: 'center', marginBottom: 16 },
  bankInfo: { borderRadius: 10, padding: 14, marginBottom: 16, gap: 10 },
  bankRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bankLabel: { fontFamily: 'Poppins_400Regular', fontSize: 13 },
  bankValue: { fontFamily: 'Poppins_500Medium', fontSize: 13 },
  noBankText: { fontFamily: 'Poppins_400Regular', fontSize: 13, textAlign: 'center', marginBottom: 16 },
  cashDesc: { fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 21, marginBottom: 16 },
  amountBox: { borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 16 },
  amountLabel: { fontFamily: 'Poppins_400Regular', fontSize: 12 },
  amountValue: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: '#3B5BDB', marginTop: 4 },
  payBtn: { backgroundColor: '#3B5BDB', borderRadius: 12, padding: 15, alignItems: 'center' },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText: { fontFamily: 'Poppins_700Bold', color: '#fff', fontSize: 15 },
  cancelBtn: { alignItems: 'center', padding: 14 },
  cancelText: { fontFamily: 'Poppins_400Regular', fontSize: 14 },
  successRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIcon: { fontSize: 72, marginBottom: 20 },
  successTitle: { fontFamily: 'Poppins_700Bold', fontSize: 24, marginBottom: 10 },
  successSub: { fontFamily: 'Poppins_400Regular', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  doneBtn: { backgroundColor: '#3B5BDB', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14, marginTop: 28 },
  doneBtnText: { fontFamily: 'Poppins_700Bold', color: '#fff', fontSize: 16 },
})
