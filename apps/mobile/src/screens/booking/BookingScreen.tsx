import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, StatusBar, Modal, FlatList } from 'react-native'
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RootStackParamList } from '../../navigation'
import { useTheme } from '../../hooks/useTheme'
import { formatRp } from '../../utils/currency'
import api from '../../services/api'

type Route = RouteProp<RootStackParamList, 'Booking'>
type Nav = NativeStackNavigationProp<RootStackParamList>

const PAYMENT_METHODS = [
  { key: 'dp', label: 'DP Dulu', desc: 'Bayar DP via QRIS', icon: '🔖' },
  { key: 'lunas', label: 'Bayar Lunas', desc: 'Lunas via QRIS', icon: '✅' },
  { key: 'cash', label: 'Tunai', desc: 'Bayar cash saat event', icon: '💵' },
  { key: 'tempo', label: 'Tempo 7 Hari', desc: 'Bayar setelah event', icon: '📅' },
]

export default function BookingScreen() {
  const route = useRoute<Route>()
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const { vendorId, serviceId } = route.params
  const { isDark, bg, card, cardBorder, text, subtext, placeholder, statusBar, divider } = useTheme()

  const [services, setServices] = useState<any[]>([])
  const [vendor, setVendor] = useState<any>(null)
  const [selected, setSelected] = useState<any>(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [pickerDay, setPickerDay] = useState(1)
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth() + 1)
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear())
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<string>('dp')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get(`/vendors/${vendorId}`).then((r) => {
      const svc = r.data.services || []
      setVendor(r.data)
      setServices(svc.filter((s: any) => s.is_active))
      if (serviceId) setSelected(svc.find((s: any) => s.id === serviceId))
    }).catch(() => {})
  }, [])

  const dpPercent = selected?.dp_percent || 50
  const dpAmount = selected ? Math.floor(selected.price * (dpPercent / 100)) : 0
  const remaining = selected ? selected.price - dpAmount : 0
  const payNow = !selected ? 0
    : paymentMethod === 'dp' ? dpAmount
    : paymentMethod === 'tempo' || paymentMethod === 'cash' ? 0
    : selected.price

  const canSubmit = !!selected && !!date && agreed

  async function handleBook() {
    if (!selected || !date) return Alert.alert('Error', 'Pilih paket dan tanggal event')
    if (!agreed) return Alert.alert('Persetujuan', 'Centang persetujuan sebelum melanjutkan')
    setLoading(true)
    try {
      const { data } = await api.post('/bookings', {
        vendor_id: vendorId,
        service_id: selected.id,
        event_date: date,
        event_time: time || undefined,
        notes: notes || undefined,
        payment_method: paymentMethod,
        agreed_at: new Date().toISOString(),
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

  const inputStyle = [styles.input, { color: text, backgroundColor: card, borderColor: cardBorder }]

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <StatusBar barStyle={statusBar} backgroundColor={bg} />
      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Pilih Paket */}
        <Text style={[styles.sectionTitle, { color: subtext }]}>Pilih Paket Layanan</Text>
        {services.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.card, { backgroundColor: card, borderColor: selected?.id === s.id ? '#3B5BDB' : cardBorder }]}
            onPress={() => { setSelected(s); setAgreed(false) }}
          >
            <View style={styles.serviceRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.serviceName, { color: text }]}>{s.name}</Text>
                {s.description && <Text style={[styles.serviceDesc, { color: subtext }]} numberOfLines={2}>{s.description}</Text>}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.servicePrice}>{formatRp(s.price)}</Text>
                <Text style={[styles.serviceDP, { color: subtext }]}>DP {s.dp_percent}%</Text>
              </View>
            </View>
            {s.duration && <Text style={[styles.serviceDuration, { color: subtext }]}>⏱ {s.duration}</Text>}
          </TouchableOpacity>
        ))}

        {/* Tanggal & Jam */}
        <Text style={[styles.sectionTitle, { color: subtext }]}>Tanggal Event</Text>
        <TouchableOpacity
          style={[inputStyle, styles.dateBtn]}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 15, color: date ? text : placeholder }}>
            {date || 'Pilih tanggal event...'}
          </Text>
          <Text style={{ fontSize: 18 }}>📅</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: subtext }]}>Jam Event (opsional)</Text>
        <TextInput style={inputStyle} placeholder="HH:MM (cth: 09:00)" placeholderTextColor={placeholder} value={time} onChangeText={setTime} />

        <Text style={[styles.sectionTitle, { color: subtext }]}>Catatan / Request Khusus</Text>
        <TextInput
          style={[inputStyle, styles.textarea]}
          placeholder="Tulis catatan untuk vendor..."
          placeholderTextColor={placeholder}
          value={notes}
          onChangeText={setNotes}
          multiline numberOfLines={4}
        />

        {/* Metode Pembayaran */}
        <Text style={[styles.sectionTitle, { color: subtext }]}>Metode Pembayaran</Text>
        <View style={styles.methodGrid}>
          {PAYMENT_METHODS.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[styles.methodCard, { backgroundColor: card, borderColor: paymentMethod === m.key ? '#3B5BDB' : cardBorder }]}
              onPress={() => { setPaymentMethod(m.key); setAgreed(false) }}
            >
              <Text style={styles.methodIcon}>{m.icon}</Text>
              <Text style={[styles.methodLabel, { color: paymentMethod === m.key ? '#3B5BDB' : text }]}>{m.label}</Text>
              <Text style={[styles.methodDesc, { color: subtext }]}>{m.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Ringkasan & Breakdown Pembayaran */}
        {selected && date && (
          <View style={[styles.summary, { backgroundColor: card, borderColor: cardBorder }]}>
            <Text style={[styles.summaryTitle, { color: text }]}>📋 Ringkasan Pesanan</Text>
            <View style={[styles.divider, { backgroundColor: divider }]} />

            <SRow label="Vendor" value={vendor?.business_name || '-'} text={text} subtext={subtext} />
            <SRow label="Paket" value={selected.name} text={text} subtext={subtext} />
            <SRow label="Tanggal Event" value={date + (time ? ` pukul ${time}` : '')} text={text} subtext={subtext} />

            <View style={[styles.divider, { backgroundColor: divider }]} />
            <SRow label="Total Harga" value={formatRp(selected.price)} text={text} subtext={subtext} />

            {paymentMethod === 'dp' && (
              <>
                <SRow label={`DP Sekarang (${dpPercent}%)`} value={formatRp(dpAmount)} highlight text={text} subtext={subtext} />
                <SRow label="Sisa Pelunasan" value={formatRp(remaining)} note="Dibayar setelah vendor konfirmasi" text={text} subtext={subtext} />
              </>
            )}
            {paymentMethod === 'lunas' && (
              <SRow label="Dibayar Sekarang" value={formatRp(selected.price)} highlight text={text} subtext={subtext} />
            )}
            {paymentMethod === 'cash' && (
              <SRow label="Dibayar Tunai" value={formatRp(selected.price)} note="Saat hari event" text={text} subtext={subtext} />
            )}
            {paymentMethod === 'tempo' && (
              <SRow label="Dibayar Setelah Event" value={formatRp(selected.price)} note="Maks. 7 hari setelah acara" text={text} subtext={subtext} />
            )}

            {payNow > 0 && (
              <View style={styles.payNowBox}>
                <Text style={styles.payNowLabel}>Bayar Sekarang</Text>
                <Text style={styles.payNowAmount}>{formatRp(payNow)}</Text>
              </View>
            )}
          </View>
        )}

        {/* Persetujuan Elektronik */}
        {selected && date && (
          <View style={[styles.agreement, { backgroundColor: isDark ? '#0D1A0D' : '#F0FDF4', borderColor: agreed ? '#10B981' : cardBorder }]}>
            <Text style={[styles.agreementTitle, { color: text }]}>📝 Surat Perjanjian Elektronik</Text>
            <Text style={[styles.agreementBody, { color: subtext }]}>
              Saya yang bertanda tangan secara elektronik di bawah ini menyatakan bahwa:{'\n\n'}
              {'  '}1. Saya memesan layanan <Text style={{ color: text, fontFamily: 'Poppins_600SemiBold' }}>{selected.name}</Text> dari <Text style={{ color: text, fontFamily: 'Poppins_600SemiBold' }}>{vendor?.business_name}</Text> untuk tanggal <Text style={{ color: text, fontFamily: 'Poppins_600SemiBold' }}>{date}</Text>.{'\n\n'}
              {'  '}2. Total biaya yang disepakati adalah <Text style={{ color: '#3B5BDB', fontFamily: 'Poppins_600SemiBold' }}>{formatRp(selected.price)}</Text>
              {paymentMethod === 'dp' ? ` dengan DP ${dpPercent}% (${formatRp(dpAmount)}) dibayar sekarang dan sisa ${formatRp(remaining)} setelah konfirmasi vendor.` : '.'}
              {'\n\n'}
              {'  '}3. Pembatalan pesanan yang dilakukan kurang dari 7 hari sebelum event dapat dikenakan biaya pembatalan sesuai kebijakan vendor.{'\n\n'}
              {'  '}4. Dana yang telah dibayarkan dijamin melalui sistem escrow VendorIn dan hanya diteruskan ke vendor setelah pesanan selesai.{'\n\n'}
              {'  '}5. Saya menyetujui Syarat & Ketentuan VendorIn dan bertanggung jawab atas kebenaran data yang saya masukkan.
            </Text>

            <TouchableOpacity style={styles.checkRow} onPress={() => setAgreed(v => !v)} activeOpacity={0.7}>
              <View style={[styles.checkbox, { borderColor: agreed ? '#10B981' : cardBorder, backgroundColor: agreed ? '#10B981' : 'transparent' }]}>
                {agreed && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.checkLabel, { color: text }]}>
                Saya telah membaca dan <Text style={{ color: '#10B981', fontFamily: 'Poppins_600SemiBold' }}>menyetujui</Text> perjanjian di atas
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tombol Submit */}
        <TouchableOpacity
          style={[styles.btn, !canSubmit && styles.btnDisabled]}
          onPress={handleBook}
          disabled={loading || !canSubmit}
        >
          <Text style={styles.btnText}>
            {loading ? 'Memproses...'
              : !agreed && selected && date ? '⬆ Setujui Perjanjian Dulu'
              : paymentMethod === 'tempo' ? 'Pesan Sekarang (Bayar Nanti)'
              : paymentMethod === 'cash' ? 'Pesan Sekarang (Bayar Tunai)'
              : `Lanjut Bayar ${payNow ? formatRp(payNow) : ''}`}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal visible={showDatePicker} transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerSheet, { backgroundColor: card }]}>
            <Text style={[styles.pickerTitle, { color: text }]}>Pilih Tanggal</Text>
            <View style={styles.pickerRow}>
              <View style={styles.pickerCol}>
                <Text style={[styles.pickerLabel, { color: subtext }]}>Hari</Text>
                <FlatList
                  data={Array.from({ length: 31 }, (_, i) => i + 1)}
                  keyExtractor={(v) => String(v)}
                  style={styles.pickerList}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.pickerItem, pickerDay === item && styles.pickerItemActive]}
                      onPress={() => setPickerDay(item)}
                    >
                      <Text style={[styles.pickerItemText, { color: pickerDay === item ? '#fff' : text }]}>{String(item).padStart(2, '0')}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
              <View style={styles.pickerCol}>
                <Text style={[styles.pickerLabel, { color: subtext }]}>Bulan</Text>
                <FlatList
                  data={['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']}
                  keyExtractor={(_, i) => String(i)}
                  style={styles.pickerList}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      style={[styles.pickerItem, pickerMonth === index + 1 && styles.pickerItemActive]}
                      onPress={() => setPickerMonth(index + 1)}
                    >
                      <Text style={[styles.pickerItemText, { color: pickerMonth === index + 1 ? '#fff' : text }]}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
              <View style={styles.pickerCol}>
                <Text style={[styles.pickerLabel, { color: subtext }]}>Tahun</Text>
                <FlatList
                  data={Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i)}
                  keyExtractor={(v) => String(v)}
                  style={styles.pickerList}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.pickerItem, pickerYear === item && styles.pickerItemActive]}
                      onPress={() => setPickerYear(item)}
                    >
                      <Text style={[styles.pickerItemText, { color: pickerYear === item ? '#fff' : text }]}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
            <TouchableOpacity style={styles.pickerConfirm} onPress={() => {
              const d = `${pickerYear}-${String(pickerMonth).padStart(2,'0')}-${String(pickerDay).padStart(2,'0')}`
              setDate(d)
              setAgreed(false)
              setShowDatePicker(false)
            }}>
              <Text style={styles.pickerConfirmText}>Pilih Tanggal Ini</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickerCancel} onPress={() => setShowDatePicker(false)}>
              <Text style={[styles.pickerCancelText, { color: subtext }]}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

function SRow({ label, value, note, highlight, text, subtext }: {
  label: string; value: string; note?: string; highlight?: boolean; text: string; subtext: string
}) {
  return (
    <View style={styles.sRow}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.sLabel, { color: subtext }]}>{label}</Text>
        {note && <Text style={[styles.sNote, { color: subtext }]}>{note}</Text>}
      </View>
      <Text style={[styles.sValue, { color: highlight ? '#3B5BDB' : text }, highlight && { fontFamily: 'Poppins_700Bold' }]}>{value}</Text>
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
  serviceDP: { fontFamily: 'Poppins_400Regular', fontSize: 11, marginTop: 2 },
  serviceDuration: { fontFamily: 'Poppins_400Regular', fontSize: 12, marginTop: 6 },
  input: { fontFamily: 'Poppins_400Regular', borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15 },
  textarea: { height: 100, textAlignVertical: 'top' },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  methodCard: { width: '45%', flexGrow: 1, borderWidth: 1.5, borderRadius: 12, padding: 12, alignItems: 'center' },
  methodIcon: { fontSize: 22, marginBottom: 4 },
  methodLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, textAlign: 'center' },
  methodDesc: { fontFamily: 'Poppins_400Regular', fontSize: 10, textAlign: 'center', marginTop: 2 },
  summary: { borderRadius: 14, padding: 16, marginTop: 20, gap: 10, borderWidth: 1 },
  summaryTitle: { fontFamily: 'Poppins_700Bold', fontSize: 14 },
  divider: { height: 1, marginVertical: 4 },
  sRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  sLabel: { fontFamily: 'Poppins_400Regular', fontSize: 13 },
  sNote: { fontFamily: 'Poppins_400Regular', fontSize: 11, marginTop: 1 },
  sValue: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, textAlign: 'right', flexShrink: 1 },
  payNowBox: { backgroundColor: '#3B5BDB15', borderRadius: 10, padding: 12, marginTop: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payNowLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: '#3B5BDB' },
  payNowAmount: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#3B5BDB' },
  agreement: { borderRadius: 14, padding: 16, marginTop: 16, borderWidth: 1.5 },
  agreementTitle: { fontFamily: 'Poppins_700Bold', fontSize: 14, marginBottom: 10 },
  agreementBody: { fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 20, marginBottom: 16 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  checkmark: { color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 14 },
  checkLabel: { fontFamily: 'Poppins_400Regular', fontSize: 13, flex: 1, lineHeight: 20 },
  btn: { backgroundColor: '#3B5BDB', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 20 },
  btnDisabled: { backgroundColor: '#2A3A6A' },
  btnText: { fontFamily: 'Poppins_700Bold', color: '#fff', fontSize: 16 },
  dateBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  pickerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  pickerRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  pickerCol: { flex: 1 },
  pickerLabel: { fontFamily: 'Poppins_500Medium', fontSize: 12, textAlign: 'center', marginBottom: 8 },
  pickerList: { height: 180 },
  pickerItem: { paddingVertical: 10, paddingHorizontal: 6, borderRadius: 8, marginBottom: 4, alignItems: 'center' },
  pickerItemActive: { backgroundColor: '#3B5BDB' },
  pickerItemText: { fontFamily: 'Poppins_500Medium', fontSize: 14 },
  pickerConfirm: { backgroundColor: '#3B5BDB', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 8 },
  pickerConfirmText: { fontFamily: 'Poppins_700Bold', color: '#fff', fontSize: 15 },
  pickerCancel: { alignItems: 'center', padding: 10 },
  pickerCancelText: { fontFamily: 'Poppins_400Regular', fontSize: 14 },
})
