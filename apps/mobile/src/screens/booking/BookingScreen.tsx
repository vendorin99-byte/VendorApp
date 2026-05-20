import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, StatusBar } from 'react-native'
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RootStackParamList } from '../../navigation'
import { useTheme } from '../../hooks/useTheme'
import { formatRp } from '../../utils/currency'
import api from '../../services/api'

type Route = RouteProp<RootStackParamList, 'Booking'>
type Nav = NativeStackNavigationProp<RootStackParamList>

export default function BookingScreen() {
  const route = useRoute<Route>()
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const { vendorId, serviceId } = route.params
  const { isDark, bg, card, cardBorder, text, subtext, placeholder, statusBar } = useTheme()

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
    { key: 'transfer', label: 'Transfer Bank', desc: 'Transfer rekening', icon: '🏦' },
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
  const payNow = !selected ? 0 : paymentMethod === 'dp' ? dpAmount : paymentMethod === 'tempo' ? 0 : selected.price

  const inputStyle = [styles.input, { color: text, backgroundColor: card, borderColor: cardBorder }]

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <StatusBar barStyle={statusBar} backgroundColor={bg} />
      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        <Text style={[styles.sectionTitle, { color: subtext }]}>Pilih Paket Layanan</Text>
        {services.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.card, { backgroundColor: card, borderColor: selected?.id === s.id ? '#3B5BDB' : cardBorder }]}
            onPress={() => setSelected(s)}
          >
            <View style={styles.serviceRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.serviceName, { color: text }]}>{s.name}</Text>
                {s.description && <Text style={[styles.serviceDesc, { color: subtext }]} numberOfLines={2}>{s.description}</Text>}
              </View>
              <Text style={styles.servicePrice}>{formatRp(s.price)}</Text>
            </View>
            {s.duration && <Text style={[styles.serviceDuration, { color: subtext }]}>⏱ {s.duration}</Text>}
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionTitle, { color: subtext }]}>Tanggal Event</Text>
        <TextInput style={inputStyle} placeholder="YYYY-MM-DD" placeholderTextColor={placeholder} value={date} onChangeText={setDate} />

        <Text style={[styles.sectionTitle, { color: subtext }]}>Jam Event (opsional)</Text>
        <TextInput style={inputStyle} placeholder="HH:MM" placeholderTextColor={placeholder} value={time} onChangeText={setTime} />

        <Text style={[styles.sectionTitle, { color: subtext }]}>Catatan / Request Khusus</Text>
        <TextInput
          style={[inputStyle, styles.textarea]}
          placeholder="Tulis catatan untuk vendor..."
          placeholderTextColor={placeholder}
          value={notes}
          onChangeText={setNotes}
          multiline numberOfLines={4}
        />

        <Text style={[styles.sectionTitle, { color: subtext }]}>Metode Pembayaran</Text>
        <View style={styles.methodGrid}>
          {PAYMENT_METHODS.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[styles.methodCard, { backgroundColor: card, borderColor: paymentMethod === m.key ? '#3B5BDB' : cardBorder }]}
              onPress={() => setPaymentMethod(m.key)}
            >
              <Text style={styles.methodIcon}>{m.icon}</Text>
              <Text style={[styles.methodLabel, paymentMethod === m.key && styles.methodLabelActive, { color: paymentMethod === m.key ? '#3B5BDB' : subtext }]}>{m.label}</Text>
              <Text style={[styles.methodDesc, { color: subtext }]}>{m.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {selected && (
          <View style={[styles.summary, { backgroundColor: card }]}>
            <Text style={[styles.summaryTitle, { color: text }]}>Ringkasan Pesanan</Text>
            <SummaryRow label="Paket" value={selected.name} text={text} subtext={subtext} />
            <SummaryRow label="Harga Total" value={formatRp(selected.price)} text={text} subtext={subtext} />
            <SummaryRow label={`DP (${selected.dp_percent}%)`} value={formatRp(dpAmount)} highlight text={text} subtext={subtext} />
            <SummaryRow label="Sisa bayar setelah konfirmasi" value={formatRp(selected.price - dpAmount)} small text={text} subtext={subtext} />
          </View>
        )}

        <TouchableOpacity
          style={[styles.btn, (!selected || !date) && styles.btnDisabled]}
          onPress={handleBook}
          disabled={loading || !selected || !date}
        >
          <Text style={styles.btnText}>
            {loading ? 'Memproses...'
              : paymentMethod === 'tempo' ? 'Pesan Sekarang (Bayar Nanti)'
              : paymentMethod === 'cash' ? 'Pesan Sekarang (Bayar Tunai)'
              : `Lanjut Bayar ${payNow ? formatRp(payNow) : ''}`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

function SummaryRow({ label, value, highlight, small, text, subtext }: { label: string; value: string; highlight?: boolean; small?: boolean; text: string; subtext: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: subtext }, small && { fontSize: 11 }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: highlight ? '#3B5BDB' : text }, small && { fontSize: 11, color: subtext }]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  sectionTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, marginTop: 20, marginBottom: 10 },
  card: { padding: 14, borderWidth: 1.5, borderRadius: 14, marginBottom: 10 },
  serviceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  serviceName: { fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  serviceDesc: { fontFamily: 'Poppins_400Regular', fontSize: 13, marginTop: 2 },
  servicePrice: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: '#3B5BDB' },
  serviceDuration: { fontFamily: 'Poppins_400Regular', fontSize: 12, marginTop: 4 },
  input: { fontFamily: 'Poppins_400Regular', borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15 },
  textarea: { height: 100, textAlignVertical: 'top' },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  methodCard: { width: '30%', flexGrow: 1, borderWidth: 1.5, borderRadius: 12, padding: 10, alignItems: 'center' },
  methodIcon: { fontSize: 20, marginBottom: 4 },
  methodLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 11, textAlign: 'center' },
  methodLabelActive: { color: '#3B5BDB' },
  methodDesc: { fontFamily: 'Poppins_400Regular', fontSize: 10, textAlign: 'center', marginTop: 2 },
  summary: { borderRadius: 14, padding: 14, marginTop: 20, gap: 8 },
  summaryTitle: { fontFamily: 'Poppins_700Bold', fontSize: 14, marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontFamily: 'Poppins_400Regular', fontSize: 13 },
  summaryValue: { fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  btn: { backgroundColor: '#3B5BDB', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 20 },
  btnDisabled: { backgroundColor: '#1A2A5A' },
  btnText: { fontFamily: 'Poppins_700Bold', color: '#fff', fontSize: 16 },
})
