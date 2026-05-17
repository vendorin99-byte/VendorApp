import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation'
import { formatRp } from '../../utils/currency'
import { formatDate } from '../../utils/date'
import api from '../../services/api'

type Route = RouteProp<RootStackParamList, 'OrderDetail'>
type Nav = NativeStackNavigationProp<RootStackParamList>

const STATUS_INFO: Record<string, { label: string; color: string; bg: string }> = {
  pending_dp: { label: 'Menunggu Pembayaran DP', color: '#92400E', bg: '#FEF3C7' },
  dp_paid: { label: 'DP Dibayar — Menunggu Konfirmasi', color: '#1D4ED8', bg: '#DBEAFE' },
  confirmed: { label: 'Dikonfirmasi Vendor', color: '#065F46', bg: '#D1FAE5' },
  pending_remaining: { label: 'Menunggu Pelunasan', color: '#92400E', bg: '#FEF3C7' },
  fully_paid: { label: 'Lunas — Dalam Pengerjaan', color: '#065F46', bg: '#D1FAE5' },
  in_progress: { label: 'Sedang Berjalan', color: '#1E40AF', bg: '#DBEAFE' },
  done: { label: 'Selesai', color: '#374151', bg: '#F3F4F6' },
  cancelled: { label: 'Dibatalkan', color: '#991B1B', bg: '#FEE2E2' },
}

const METHOD_LABEL: Record<string, string> = {
  dp: 'DP + Pelunasan', lunas: 'Bayar Lunas', cash: 'Tunai',
  qris: 'QRIS', transfer: 'Transfer Bank', tempo: 'Tempo 7 Hari',
}

export default function OrderDetailScreen() {
  const route = useRoute<Route>()
  const navigation = useNavigation<Nav>()
  const { bookingId } = route.params
  const [booking, setBooking] = useState<any>(null)

  async function reload() {
    const r = await api.get(`/bookings/${bookingId}`).catch(() => null)
    if (r) setBooking(r.data)
  }

  useEffect(() => { reload() }, [bookingId])

  async function handlePayRemaining() {
    try {
      const { data } = await api.post(`/bookings/${bookingId}/pay-remaining`)
      navigation.navigate('Payment', {
        bookingId,
        amount: data.amount,
        method: data.payment_method || 'transfer',
        vendorBank: booking?.vendors?.vendor_bank_accounts?.[0] || null,
      })
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Gagal membuat pembayaran')
    }
  }

  async function handleSimulatePay() {
    try {
      await api.post(`/bookings/${bookingId}/simulate-pay`, { type: 'dp' })
      reload()
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Gagal')
    }
  }

  if (!booking) return <View style={styles.center}><ActivityIndicator size="large" color="#3B5BDB" /></View>

  const st = STATUS_INFO[booking.status] || { label: booking.status, color: '#374151', bg: '#F3F4F6' }
  const remaining = booking.total_amount - booking.dp_amount
  const canPayRemaining = ['confirmed', 'dp_paid'].includes(booking.status) && remaining > 0
  const canSimulateDp = booking.status === 'pending_dp' && booking.payment_method !== 'cash' && booking.payment_method !== 'tempo'
  const canReview = booking.status === 'done' && !(booking.reviews?.length)
  const isPaid = ['fully_paid', 'done', 'in_progress'].includes(booking.status)

  return (
    <ScrollView style={styles.container}>

      {/* Status */}
      <View style={[styles.statusBanner, { backgroundColor: st.bg }]}>
        <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
      </View>

      {/* Info Booking */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Detail Pesanan</Text>
        <Row label="Vendor" value={booking.vendors?.business_name} />
        <Row label="Paket" value={booking.services?.name} />
        <Row label="Tanggal Event" value={booking.event_date ? formatDate(booking.event_date) : '-'} />
        <Row label="Metode Bayar" value={METHOD_LABEL[booking.payment_method] || booking.payment_method} />
        {booking.notes && <Row label="Catatan" value={booking.notes} />}
      </View>

      {/* Rincian Pembayaran */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Rincian Pembayaran</Text>
        <Row label="Total Harga" value={formatRp(booking.total_amount)} />
        {booking.payment_method === 'dp' && (
          <>
            <Row label={`DP ${booking.services?.dp_percent || 30}%`}
              value={formatRp(booking.dp_amount)}
              valueColor={isPaid || booking.status === 'dp_paid' ? '#10B981' : '#F59E0B'} />
            <Row label="Sisa Pelunasan"
              value={formatRp(remaining)}
              valueColor={isPaid ? '#10B981' : '#F59E0B'} />
          </>
        )}
        <Row label="Platform Fee (2%)" value={formatRp(booking.platform_fee || 0)} />
        <Row label="Vendor Menerima" value={formatRp(booking.vendor_received || 0)} />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.chatBtn} onPress={async () => {
          const r = await api.post('/chat/rooms', { vendor_id: booking.vendor_id })
          navigation.navigate('ChatRoom', { roomId: r.data.id, vendorName: booking.vendors?.business_name })
        }}>
          <Text style={styles.chatBtnText}>💬 Chat dengan Vendor</Text>
        </TouchableOpacity>

        {canSimulateDp && (
          <TouchableOpacity style={styles.payBtn} onPress={handleSimulatePay}>
            <Text style={styles.payBtnText}>✓ Simulasikan Bayar DP {formatRp(booking.dp_amount)}</Text>
          </TouchableOpacity>
        )}

        {canPayRemaining && (
          <TouchableOpacity style={styles.payBtn} onPress={handlePayRemaining}>
            <Text style={styles.payBtnText}>Bayar Sisa {formatRp(remaining)}</Text>
          </TouchableOpacity>
        )}

        {canReview && (
          <TouchableOpacity style={styles.reviewBtn} onPress={() => navigation.navigate('RateOrder', { bookingId, vendorName: booking.vendors?.business_name })}>
            <Text style={styles.reviewBtnText}>⭐ Tulis Ulasan</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  )
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statusBanner: { padding: 14, alignItems: 'center', marginBottom: 2 },
  statusText: { fontWeight: '700', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, margin: 12, marginBottom: 0 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  rowLabel: { fontSize: 13, color: '#6B7280', flex: 1 },
  rowValue: { fontSize: 13, color: '#1F2937', fontWeight: '500', flex: 1, textAlign: 'right' },
  actions: { gap: 10, margin: 12, marginBottom: 32 },
  chatBtn: { borderWidth: 1.5, borderColor: '#3B5BDB', borderRadius: 12, padding: 14, alignItems: 'center' },
  chatBtnText: { color: '#3B5BDB', fontWeight: '600', fontSize: 15 },
  payBtn: { backgroundColor: '#3B5BDB', borderRadius: 12, padding: 14, alignItems: 'center' },
  payBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  reviewBtn: { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 14, alignItems: 'center' },
  reviewBtnText: { color: '#92400E', fontWeight: '600', fontSize: 15 },
})
