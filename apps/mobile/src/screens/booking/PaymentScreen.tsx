import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator, StatusBar } from 'react-native'
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import QRCode from 'react-native-qrcode-svg'
import ViewShot from 'react-native-view-shot'
import * as MediaLibrary from 'expo-media-library'
import { RootStackParamList } from '../../navigation'
import { useTheme } from '../../hooks/useTheme'
import { formatRp } from '../../utils/currency'
import api from '../../services/api'

type Route = RouteProp<RootStackParamList, 'Payment'>
type Nav = NativeStackNavigationProp<RootStackParamList>

export default function PaymentScreen() {
  const route = useRoute<Route>()
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const { bookingId, amount, method } = route.params
  const { isDark, bg, card, cardBorder, text, subtext, statusBar } = useTheme()

  const [qrString, setQrString] = useState<string | null>(null)
  const [loadingQr, setLoadingQr] = useState(false)
  const [paid, setPaid] = useState(false)
  const [saving, setSaving] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(900) // 15 menit
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const viewShotRef = useRef<ViewShot>(null)

  const isQris = ['dp', 'lunas', 'qris'].includes(method)

  useEffect(() => {
    if (isQris) generateQr()
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  async function generateQr() {
    setLoadingQr(true)
    try {
      const { data } = await api.post(`/bookings/${bookingId}/create-payment`)
      setQrString(data.qr_string)
      startPolling()
      timerRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) { clearInterval(timerRef.current!); return 0 }
          return s - 1
        })
      }, 1000)
    } catch (e: any) {
      Alert.alert('Gagal', e.response?.data?.error || 'Gagal membuat QRIS')
    } finally {
      setLoadingQr(false)
    }
  }

  async function downloadQr() {
    setSaving(true)
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Izin Diperlukan', 'Izinkan akses galeri untuk menyimpan QR code')
        return
      }
      const uri = await viewShotRef.current!.capture!()
      await MediaLibrary.saveToLibraryAsync(uri)
      Alert.alert('Tersimpan', 'QR Code berhasil disimpan ke galeri')
    } catch {
      Alert.alert('Gagal', 'Tidak dapat menyimpan QR Code')
    } finally {
      setSaving(false)
    }
  }

  function startPolling() {
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/bookings/${bookingId}/payment-status`)
        if (['dp_paid', 'fully_paid', 'confirmed'].includes(data.status)) {
          clearInterval(pollRef.current!)
          clearInterval(timerRef.current!)
          setPaid(true)
        }
      } catch {}
    }, 3000)
  }

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const timerStr = `${minutes}:${seconds.toString().padStart(2, '0')}`

  if (paid) {
    return (
      <View style={[styles.successRoot, { paddingTop: insets.top + 20, backgroundColor: bg }]}>
        <StatusBar barStyle={statusBar} backgroundColor={bg} />
        <Text style={styles.successIcon}>✅</Text>
        <Text style={[styles.successTitle, { color: text }]}>Pembayaran Berhasil!</Text>
        <Text style={[styles.successSub, { color: subtext }]}>{formatRp(amount)} telah diterima</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.replace('OrderDetail', { bookingId })}>
          <Text style={styles.doneBtnText}>Lihat Pesanan</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView style={[styles.root, { backgroundColor: bg }]} contentContainerStyle={{ paddingBottom: 40 }}>
      <StatusBar barStyle={statusBar} backgroundColor={bg} />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerLabel}>
          {method === 'dp' ? 'Bayar DP' : method === 'lunas' ? 'Bayar Lunas' : 'Pembayaran'}
        </Text>
        <Text style={styles.headerAmount}>{formatRp(amount)}</Text>
        {method === 'dp' && <Text style={styles.headerSub}>Bayar DP sekarang, sisa dibayar setelah konfirmasi vendor</Text>}
      </View>

      <View style={styles.body}>
        {/* QRIS */}
        {isQris && (
          <View style={[styles.payCard, { backgroundColor: card, borderColor: cardBorder }]}>
            <Text style={[styles.cardTitle, { color: text }]}>📲  Bayar dengan QRIS</Text>

            {loadingQr && (
              <View style={styles.qrCenter}>
                <ActivityIndicator size="large" color="#3B5BDB" />
                <Text style={[styles.qrNote, { color: subtext, marginTop: 12 }]}>Membuat QRIS...</Text>
              </View>
            )}

            {qrString && !loadingQr && (
              <>
                <View style={styles.qrCenter}>
                  <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
                    <View style={styles.qrWrapper}>
                      <Text style={styles.qrBrand}>VendorIn</Text>
                      <QRCode value={qrString} size={200} />
                      <Text style={styles.qrCaption}>Scan untuk bayar · QRIS</Text>
                    </View>
                  </ViewShot>
                  {secondsLeft > 0 ? (
                    <View style={styles.timerRow}>
                      <Text style={styles.timerDot}>⏱</Text>
                      <Text style={[styles.timerText, secondsLeft < 60 && styles.timerRed]}>{timerStr}</Text>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.refreshBtn} onPress={generateQr}>
                      <Text style={styles.refreshText}>🔄 QR Expired — Buat Ulang</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.downloadBtn} onPress={downloadQr} disabled={saving}>
                    {saving
                      ? <ActivityIndicator size="small" color="#3B5BDB" />
                      : <Text style={styles.downloadText}>⬇ Simpan QR ke Galeri</Text>}
                  </TouchableOpacity>
                </View>
                <Text style={[styles.qrNote, { color: subtext }]}>
                  Scan QR di atas menggunakan GoPay, OVO, Dana, BCA Mobile, BRImo, atau m-banking lainnya
                </Text>
                <View style={[styles.waitingRow, { backgroundColor: isDark ? '#0D0D1A' : '#F0F4FF' }]}>
                  <ActivityIndicator size="small" color="#3B5BDB" />
                  <Text style={[styles.waitingText, { color: subtext }]}>Menunggu konfirmasi pembayaran...</Text>
                </View>
              </>
            )}
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
            <TouchableOpacity style={styles.payBtn} onPress={() => navigation.replace('OrderDetail', { bookingId })}>
              <Text style={styles.payBtnText}>✓  Mengerti, Bayar Saat Event</Text>
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
            <TouchableOpacity style={styles.payBtn} onPress={() => navigation.replace('OrderDetail', { bookingId })}>
              <Text style={styles.payBtnText}>✓  Setujui Pesanan Tempo</Text>
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

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { backgroundColor: '#3B5BDB', padding: 20, paddingBottom: 28, alignItems: 'center' },
  headerLabel: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  headerAmount: { fontFamily: 'Poppins_700Bold', fontSize: 32, color: '#fff' },
  headerSub: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 6, textAlign: 'center' },
  body: { padding: 16, gap: 16, marginTop: -12 },
  payCard: { borderRadius: 16, padding: 18, borderWidth: 1 },
  cardTitle: { fontFamily: 'Poppins_700Bold', fontSize: 15, marginBottom: 16 },
  qrCenter: { alignItems: 'center', marginBottom: 16 },
  qrWrapper: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, alignItems: 'center' },
  qrBrand: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#3B5BDB', marginBottom: 10 },
  qrCaption: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#9CA3AF', marginTop: 10 },
  downloadBtn: { marginTop: 10, paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: '#3B5BDB', minWidth: 180, alignItems: 'center' },
  downloadText: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#3B5BDB' },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timerDot: { fontSize: 14 },
  timerText: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: '#3B5BDB' },
  timerRed: { color: '#EF4444' },
  refreshBtn: { marginTop: 8 },
  refreshText: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#EF4444' },
  qrNote: { fontFamily: 'Poppins_400Regular', fontSize: 12, textAlign: 'center', marginBottom: 14, lineHeight: 18 },
  waitingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, padding: 12 },
  waitingText: { fontFamily: 'Poppins_400Regular', fontSize: 13, flex: 1 },
  cashDesc: { fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 21, marginBottom: 16 },
  amountBox: { borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 16 },
  amountLabel: { fontFamily: 'Poppins_400Regular', fontSize: 12 },
  amountValue: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: '#3B5BDB', marginTop: 4 },
  payBtn: { backgroundColor: '#3B5BDB', borderRadius: 12, padding: 15, alignItems: 'center' },
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
