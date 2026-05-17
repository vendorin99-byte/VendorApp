import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native'
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation'
import { formatRp } from '../../utils/currency'
import api from '../../services/api'

type Route = RouteProp<RootStackParamList, 'Booking'>
type Nav = NativeStackNavigationProp<RootStackParamList>

export default function BookingScreen() {
  const route = useRoute<Route>()
  const navigation = useNavigation<Nav>()
  const { vendorId, serviceId } = route.params

  const [services, setServices] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<string>('dp')
  const [loading, setLoading] = useState(false)

  const PAYMENT_METHODS = [
    { key: 'dp', label: 'DP dulu', desc: `DP ${selected?.dp_percent || 30}%`, icon: '🔖' },
    { key: 'lunas', label: 'Bayar Lunas', desc: 'Bayar penuh sekarang', icon: '✅' },
    { key: 'qris', label: 'QRIS', desc: 'Scan & bayar', icon: '📱' },
    { key: 'transfer', label: 'Transfer Bank', desc: 'Transfer ke rekening vendor', icon: '🏦' },
    { key: 'cash', label: 'Tunai', desc: 'Bayar cash saat event', icon: '💵' },
    { key: 'tempo', label: 'Tempo 7 Hari', desc: 'Bayar setelah event', icon: '📅' },
  ]

  useEffect(() => {
    api.get('/vendor/services').then((r) => {
      const svc = r.data || []
      setServices(svc.filter((s: any) => s.is_active))
      if (serviceId) setSelected(svc.find((s: any) => s.id === serviceId))
    }).catch(() => {})
  }, [])

  async function handleBook() {
    if (!selected || !date) return Alert.alert('Error', 'Pilih paket dan tanggal event')
    setLoading(true)
    try {
      const { data } = await api.post('/bookings', {
        vendor_id: vendorId,
        service_id: selected.id,
        event_date: date,
        event_time: time || undefined,
        notes: notes || undefined,
        payment_method: paymentMethod,
      })
      navigation.replace('Payment', {
        bookingId: data.booking.id,
        amount: data.payment_info.amount,
        method: paymentMethod,
        vendorBank: data.payment_info.vendor_bank,
      })
    } catch (e: any) {
      Alert.alert('Gagal', e.response?.data?.error || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const dpAmount = selected ? Math.floor(selected.price * (selected.dp_percent / 100)) : 0
  const payNow = !selected ? 0
    : (paymentMethod === 'dp') ? dpAmount
    : (paymentMethod === 'tempo') ? 0
    : selected.price

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Pilih Paket Layanan</Text>
      {services.map((s) => (
        <TouchableOpacity
          key={s.id}
          style={[styles.serviceCard, selected?.id === s.id && styles.serviceCardSelected]}
          onPress={() => setSelected(s)}
        >
          <View style={styles.serviceRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceName}>{s.name}</Text>
              {s.description && <Text style={styles.serviceDesc} numberOfLines={2}>{s.description}</Text>}
            </View>
            <Text style={styles.servicePrice}>{formatRp(s.price)}</Text>
          </View>
          {s.duration && <Text style={styles.serviceDuration}>⏱ {s.duration}</Text>}
        </TouchableOpacity>
      ))}

      <Text style={styles.sectionTitle}>Tanggal Event</Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        value={date}
        onChangeText={setDate}
      />

      <Text style={styles.sectionTitle}>Jam Event (opsional)</Text>
      <TextInput
        style={styles.input}
        placeholder="HH:MM"
        value={time}
        onChangeText={setTime}
      />

      <Text style={styles.sectionTitle}>Catatan / Request Khusus</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Tulis catatan untuk vendor..."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.sectionTitle}>Metode Pembayaran</Text>
      <View style={styles.methodGrid}>
        {PAYMENT_METHODS.map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[styles.methodCard, paymentMethod === m.key && styles.methodCardActive]}
            onPress={() => setPaymentMethod(m.key)}
          >
            <Text style={styles.methodIcon}>{m.icon}</Text>
            <Text style={[styles.methodLabel, paymentMethod === m.key && styles.methodLabelActive]}>{m.label}</Text>
            <Text style={styles.methodDesc}>{m.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {selected && (
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Ringkasan Pesanan</Text>
          <View style={styles.summaryRow}><Text>Paket</Text><Text style={{ fontWeight: '600' }}>{selected.name}</Text></View>
          <View style={styles.summaryRow}><Text>Harga Total</Text><Text>{formatRp(selected.price)}</Text></View>
          <View style={styles.summaryRow}><Text>DP ({selected.dp_percent}%)</Text><Text style={styles.dpAmount}>{formatRp(dpAmount)}</Text></View>
          <View style={styles.summaryRow}><Text style={{ color: '#6B7280', fontSize: 12 }}>Sisa dibayar setelah konfirmasi vendor</Text><Text style={{ color: '#6B7280', fontSize: 12 }}>{formatRp(selected.price - dpAmount)}</Text></View>
        </View>
      )}

      <TouchableOpacity style={[styles.btn, (!selected || !date) && styles.btnDisabled]} onPress={handleBook} disabled={loading || !selected || !date}>
        <Text style={styles.btnText}>
          {loading ? 'Memproses...' :
            paymentMethod === 'tempo' ? 'Pesan Sekarang (Bayar Nanti)' :
            paymentMethod === 'cash' ? 'Pesan Sekarang (Bayar Tunai)' :
            `Lanjut Bayar ${payNow ? formatRp(payNow) : ''}`}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginTop: 20, marginBottom: 10 },
  serviceCard: { padding: 14, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, marginBottom: 10 },
  serviceCardSelected: { borderColor: '#3B5BDB', backgroundColor: '#EEF2FF' },
  serviceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  serviceName: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  serviceDesc: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  servicePrice: { fontSize: 15, color: '#3B5BDB', fontWeight: 'bold' },
  serviceDuration: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, fontSize: 15 },
  textarea: { height: 100, textAlignVertical: 'top' },
  summary: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, marginTop: 20, gap: 8 },
  summaryTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dpAmount: { color: '#3B5BDB', fontWeight: 'bold' },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  methodCard: { width: '30%', flexGrow: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 10, alignItems: 'center', backgroundColor: '#fff' },
  methodCardActive: { borderColor: '#3B5BDB', backgroundColor: '#EEF2FF' },
  methodIcon: { fontSize: 20, marginBottom: 4 },
  methodLabel: { fontSize: 12, fontWeight: '600', color: '#374151', textAlign: 'center' },
  methodLabelActive: { color: '#3B5BDB' },
  methodDesc: { fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: 2 },
  btn: { backgroundColor: '#3B5BDB', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  btnDisabled: { backgroundColor: '#93C5FD' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
})
