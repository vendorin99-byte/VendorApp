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

export default function OrderDetailScreen() {
  const route = useRoute<Route>()
  const navigation = useNavigation<Nav>()
  const { bookingId } = route.params
  const [booking, setBooking] = useState<any>(null)

  useEffect(() => {
    api.get(`/bookings/${bookingId}`).then((r) => setBooking(r.data)).catch(() => {})
  }, [bookingId])

  async function handlePayRemaining() {
    try {
      const { data } = await api.post(`/bookings/${bookingId}/pay-remaining`)
      navigation.navigate('Payment', { bookingId, amount: data.amount, paymentUrl: data.payment_url })
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Gagal membuat pembayaran')
    }
  }

  if (!booking) return <View style={styles.center}><ActivityIndicator size="large" color="#3B5BDB" /></View>

  const remaining = booking.total_amount - booking.dp_amount
  const canPayRemaining = booking.status === 'confirmed'
  const canReview = booking.status === 'done' && !booking.reviews?.length

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Vendor</Text>
        <Text style={styles.value}>{booking.vendors?.business_name}</Text>
        <Text style={styles.label}>Paket</Text>
        <Text style={styles.value}>{booking.services?.name}</Text>
        <Text style={styles.label}>Tanggal Event</Text>
        <Text style={styles.value}>{booking.event_date ? formatDate(booking.event_date) : '-'}</Text>
        {booking.notes && <>
          <Text style={styles.label}>Catatan</Text>
          <Text style={styles.value}>{booking.notes}</Text>
        </>}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Rincian Pembayaran</Text>
        <View style={styles.row}><Text style={styles.label}>Total</Text><Text style={styles.value}>{formatRp(booking.total_amount)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>DP Dibayar</Text><Text style={[styles.value, { color: '#10B981' }]}>{formatRp(booking.dp_amount)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Sisa</Text><Text style={[styles.value, { color: '#F59E0B' }]}>{formatRp(remaining)}</Text></View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.chatBtn} onPress={async () => {
          const r = await api.post('/chat/rooms', { vendor_id: booking.vendor_id, booking_id: bookingId })
          navigation.navigate('ChatRoom', { roomId: r.data.id, vendorName: booking.vendors?.business_name })
        }}>
          <Text style={styles.chatBtnText}>💬 Chat</Text>
        </TouchableOpacity>

        {canPayRemaining && (
          <TouchableOpacity style={styles.payBtn} onPress={handlePayRemaining}>
            <Text style={styles.payBtnText}>Bayar Sisa {formatRp(remaining)}</Text>
          </TouchableOpacity>
        )}

        {canReview && (
          <TouchableOpacity style={styles.reviewBtn}>
            <Text style={styles.reviewBtnText}>⭐ Tulis Ulasan</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 13, color: '#6B7280', marginBottom: 2 },
  value: { fontSize: 15, color: '#1F2937', fontWeight: '500', marginBottom: 10 },
  actions: { gap: 10, marginBottom: 32 },
  chatBtn: { borderWidth: 1.5, borderColor: '#3B5BDB', borderRadius: 12, padding: 14, alignItems: 'center' },
  chatBtnText: { color: '#3B5BDB', fontWeight: '600', fontSize: 15 },
  payBtn: { backgroundColor: '#3B5BDB', borderRadius: 12, padding: 14, alignItems: 'center' },
  payBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  reviewBtn: { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 14, alignItems: 'center' },
  reviewBtnText: { color: '#92400E', fontWeight: '600', fontSize: 15 },
})
