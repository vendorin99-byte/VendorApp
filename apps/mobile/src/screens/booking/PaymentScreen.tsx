import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator, StatusBar } from 'react-native'
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RootStackParamList } from '../../navigation'
import { formatRp } from '../../utils/currency'
import api from '../../services/api'

type Route = RouteProp<RootStackParamList, 'Payment'>
type Nav = NativeStackNavigationProp<RootStackParamList>

const METHOD_LABEL: Record<string, string> = {
  dp: 'Bayar DP',
  lunas: 'Bayar Lunas',
  cash: 'Tunai (Cash)',
  qris: 'QRIS',
  transfer: 'Transfer Bank',
  tempo: 'Bayar Tempo',
}

const FAKE_QR = `
█▀▀▀▀▀█ ▄▄██▄ █▀▀▀▀▀█
█ ███ █ ▀▀▀█▄ █ ███ █
█ ▀▀▀ █ █▄▀▀▄ █ ▀▀▀ █
▀▀▀▀▀▀▀ ▀ ▀ █ ▀▀▀▀▀▀▀
▄█▀▀▄ ▀▄▄▀▀▀▄▀▄▀▀▄▄▀▀
▀▄ ▀▄█▀▀▄▄▀▄▀▄▄▄▀█▄▀▄
▀▀▀▀▀▀▀ █▀▄▀▄▀██▄▄▀▄▀
█▀▀▀▀▀█ ▀▄▀▀▀▄▄█ ▀▄▀▀
█ ███ █ ▄▀██▀█▀▄▀▀▄█▄
█ ▀▀▀ █ █▄▀▀▀▄▀██▄▀▄▀
▀▀▀▀▀▀▀ ▀▀▀  ▀▀▀▀▀▀ ▀
`

export default function PaymentScreen() {
  const route = useRoute<Route>()
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const { bookingId, amount, method, vendorBank } = route.params
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

  if (paid) {
    return (
      <View style={[styles.successContainer, { paddingTop: insets.top + 20 }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>Pembayaran Berhasil!</Text>
        <Text style={styles.successSub}>
          {method === 'tempo' ? 'Pesanan dikonfirmasi. Bayar dalam 7 hari.' : `${formatRp(amount)} telah dikirim ke vendor`}
        </Text>
        <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.replace('OrderDetail', { bookingId })}>
          <Text style={styles.doneBtnText}>Lihat Pesanan</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <StatusBar barStyle="light-content" backgroundColor="#3B5BDB" />
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
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔲  Bayar dengan QRIS</Text>
            <Text style={styles.qrBox}>{FAKE_QR}</Text>
            <Text style={styles.qrNote}>Scan QR di atas menggunakan aplikasi GoPay, OVO, Dana, atau m-banking</Text>
            <TouchableOpacity
              style={[styles.payBtn, loading && styles.payBtnDisabled]}
              onPress={() => handleSimulatePay(method === 'dp' ? 'dp' : 'full')}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>✓  Simulasikan Pembayaran QRIS</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Transfer Bank */}
        {(method === 'transfer' || method === 'dp' || method === 'lunas') && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🏦  Transfer Bank</Text>
            {vendorBank ? (
              <View style={styles.bankInfo}>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Bank</Text>
                  <Text style={styles.bankValue}>{vendorBank.bank_code}</Text>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>No. Rekening</Text>
                  <Text style={styles.bankValue}>{vendorBank.account_number}</Text>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Atas Nama</Text>
                  <Text style={styles.bankValue}>{vendorBank.account_name}</Text>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Jumlah</Text>
                  <Text style={[styles.bankValue, { color: '#3B5BDB', fontWeight: 'bold' }]}>{formatRp(amount)}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.noBankText}>Vendor belum menambahkan rekening bank</Text>
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
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💵  Pembayaran Tunai</Text>
            <Text style={styles.cashDesc}>
              Bayar langsung kepada vendor saat hari acara. Vendor akan mengonfirmasi penerimaan pembayaran setelah event.
            </Text>
            <View style={styles.cashAmount}>
              <Text style={styles.cashAmountLabel}>Total yang dibayarkan:</Text>
              <Text style={styles.cashAmountValue}>{formatRp(amount)}</Text>
            </View>
            <TouchableOpacity
              style={[styles.payBtn, loading && styles.payBtnDisabled]}
              onPress={() => handleSimulatePay('full')}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>✓  Konfirmasi Pesanan Cash</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Tempo */}
        {method === 'tempo' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📅  Bayar Tempo (7 Hari)</Text>
            <Text style={styles.cashDesc}>
              Pesanan dikonfirmasi sekarang, pembayaran dilakukan paling lambat 7 hari setelah event selesai.
            </Text>
            <View style={styles.cashAmount}>
              <Text style={styles.cashAmountLabel}>Total yang harus dibayar:</Text>
              <Text style={styles.cashAmountValue}>{formatRp(amount)}</Text>
            </View>
            <TouchableOpacity
              style={[styles.payBtn, loading && styles.payBtnDisabled]}
              onPress={() => handleSimulatePay('full')}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>✓  Setujui Pesanan Tempo</Text>}
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Batalkan</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#3B5BDB', padding: 20, paddingBottom: 28, alignItems: 'center' },
  headerLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  headerAmount: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 6, textAlign: 'center' },
  body: { padding: 16, gap: 16, marginTop: -12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 14 },
  qrBox: { fontFamily: 'monospace', fontSize: 11, lineHeight: 14, color: '#1F2937', textAlign: 'center', marginBottom: 10 },
  qrNote: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
  bankInfo: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 14, marginBottom: 16, gap: 8 },
  bankRow: { flexDirection: 'row', justifyContent: 'space-between' },
  bankLabel: { fontSize: 13, color: '#6B7280' },
  bankValue: { fontSize: 13, color: '#1F2937', fontWeight: '500' },
  noBankText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginBottom: 16 },
  cashDesc: { fontSize: 14, color: '#6B7280', lineHeight: 21, marginBottom: 16 },
  cashAmount: { backgroundColor: '#EEF2FF', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 16 },
  cashAmountLabel: { fontSize: 12, color: '#6B7280' },
  cashAmountValue: { fontSize: 22, fontWeight: 'bold', color: '#3B5BDB', marginTop: 4 },
  payBtn: { backgroundColor: '#3B5BDB', borderRadius: 12, padding: 15, alignItems: 'center' },
  payBtnDisabled: { opacity: 0.7 },
  payBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  cancelBtn: { alignItems: 'center', padding: 14 },
  cancelText: { color: '#9CA3AF', fontSize: 14 },
  successContainer: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIcon: { fontSize: 72, marginBottom: 20 },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 10 },
  successSub: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  doneBtn: { backgroundColor: '#3B5BDB', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14, marginTop: 28 },
  doneBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
})
