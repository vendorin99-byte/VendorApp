import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, StatusBar } from 'react-native'
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation'
import { useTheme } from '../../hooks/useTheme'
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
  const { bg, card, cardBorder, text, subtext, divider, statusBar, statusBarBg } = useTheme()
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

  if (!booking) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <StatusBar barStyle={statusBar} backgroundColor={statusBarBg} />
        <ActivityIndicator size="large" color="#3B5BDB" />
      </View>
    )
  }

  const st = STATUS_INFO[booking.status] || { label: booking.status, color: '#374151', bg: '#F3F4F6' }
  const remaining = booking.total_amount - booking.dp_amount
  const canPayRemaining = ['confirmed', 'dp_paid'].includes(booking.status) && remaining > 0
  const canSimulateDp = booking.status === 'pending_dp' && booking.payment_method !== 'cash' && booking.payment_method !== 'tempo'
  const canReview = booking.status === 'done' && !(booking.reviews?.length)
  const isPaid = ['fully_paid', 'done', 'in_progress'].includes(booking.status)

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={statusBar} backgroundColor={statusBarBg} />

      <View style={[styles.statusBanner, { backgroundColor: st.bg }]}>
        <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: card, borderColor: cardBorder }]}>
        <Text style={[styles.cardTitle, { color: text }]}>Detail Pesanan</Text>
        <Row label="Vendor" value={booking.vendors?.business_name} text={text} subtext={subtext} divider={divider} />
        <Row label="Paket" value={booking.services?.name} text={text} subtext={subtext} divider={divider} />
        <Row label="Tanggal Event" value={booking.event_date ? formatDate(booking.event_date) : '-'} text={text} subtext={subtext} divider={divider} />
        <Row label="Metode Bayar" value={METHOD_LABEL[booking.payment_method] || booking.payment_method} text={text} subtext={subtext} divider={divider} />
        {booking.notes && <Row label="Catatan" value={booking.notes} text={text} subtext={subtext} divider={divider} />}
      </View>

      <View style={[styles.card, { backgroundColor: card, borderColor: cardBorder }]}>
        <Text style={[styles.cardTitle, { color: text }]}>Rincian Pembayaran</Text>
        <Row label="Total Harga" value={formatRp(booking.total_amount)} text={text} subtext={subtext} divider={divider} />
        {booking.payment_method === 'dp' && (
          <>
            <Row label={`DP ${booking.services?.dp_percent || 30}%`} value={formatRp(booking.dp_amount)} text={text} subtext={subtext} divider={divider}
              valueColor={isPaid || booking.status === 'dp_paid' ? '#10B981' : '#F59E0B'} />
            <Row label="Sisa Pelunasan" value={formatRp(remaining)} text={text} subtext={subtext} divider={divider}
              valueColor={isPaid ? '#10B981' : '#F59E0B'} />
          </>
        )}
        <Row label="Platform Fee (2%)" value={formatRp(booking.platform_fee || 0)} text={text} subtext={subtext} divider={divider} />
        <Row label="Vendor Menerima" value={formatRp(booking.vendor_received || 0)} text={text} subtext={subtext} divider={divider} />
      </View>

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

function Row({ label, value, valueColor, text, subtext, divider }: { label: string; value: string; valueColor?: string; text: string; subtext: string; divider: string }) {
  return (
    <View style={[styles.row, { borderBottomColor: divider }]}>
      <Text style={[styles.rowLabel, { color: subtext }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: valueColor || text }]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statusBanner: { padding: 14, alignItems: 'center', marginBottom: 2 },
  statusText: { fontFamily: 'Poppins_700Bold', fontSize: 14 },
  card: { borderRadius: 14, padding: 16, margin: 12, marginBottom: 0, borderWidth: 1 },
  cardTitle: { fontFamily: 'Poppins_700Bold', fontSize: 15, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1 },
  rowLabel: { fontFamily: 'Poppins_400Regular', fontSize: 13, flex: 1 },
  rowValue: { fontFamily: 'Poppins_500Medium', fontSize: 13, flex: 1, textAlign: 'right' },
  actions: { gap: 10, margin: 12, marginBottom: 32 },
  chatBtn: { borderWidth: 1.5, borderColor: '#3B5BDB', borderRadius: 12, padding: 14, alignItems: 'center' },
  chatBtnText: { color: '#3B5BDB', fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  payBtn: { backgroundColor: '#3B5BDB', borderRadius: 12, padding: 14, alignItems: 'center' },
  payBtnText: { color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 15 },
  reviewBtn: { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 14, alignItems: 'center' },
  reviewBtnText: { color: '#92400E', fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
})
