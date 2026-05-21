import { useState, useEffect, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
  StatusBar, Modal, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import * as Location from 'expo-location'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RootStackParamList } from '../../navigation'
import { useTheme } from '../../hooks/useTheme'
import { useAuthStore } from '../../store/authStore'
import { formatRp } from '../../utils/currency'
import LeafletMap from '../../components/LeafletMap'
import api from '../../services/api'

type Nav = NativeStackNavigationProp<RootStackParamList>

const RADII = ['1km', '5km', '10km', '25km']
const CATEGORIES = ['Semua', 'EO', 'Fotografer', 'Wedding', 'Katering', 'Dekorasi', 'Sewa Mobil', 'Musik']
const REQ_CATEGORIES = ['EO', 'Fotografer', 'Wedding', 'Katering', 'Dekorasi', 'Sewa Mobil', 'Musik', 'Lainnya']

export default function MapsScreen() {
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const { isDark, bg, card, cardBorder, text, subtext, statusBar, statusBarBg } = useTheme()
  const { user } = useAuthStore()
  const isVendor = user?.role === 'vendor'

  const [vendors, setVendors] = useState<any[]>([])
  const [promos, setPromos] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationReady, setLocationReady] = useState(false)
  const [radius, setRadius] = useState('10km')
  const [category, setCategory] = useState('Semua')
  const [loading, setLoading] = useState(true)

  // Modal: customer post request
  const [showPostModal, setShowPostModal] = useState(false)
  const [postCat, setPostCat] = useState('EO')
  const [postDesc, setPostDesc] = useState('')
  const [postDate, setPostDate] = useState('')
  const [postBudget, setPostBudget] = useState('')
  const [postSubmitting, setPostSubmitting] = useState(false)

  // Modal: vendor kirim penawaran
  const [activeBidRequest, setActiveBidRequest] = useState<any>(null)
  const [bidPrice, setBidPrice] = useState('')
  const [bidNote, setBidNote] = useState('')
  const [bidSubmitting, setBidSubmitting] = useState(false)

  // Modal: vendor chat dari promo
  const [activePromo, setActivePromo] = useState<{ vendorId: string; text: string } | null>(null)

  // Modal: customer lihat request sendiri + bids masuk
  const [myRequest, setMyRequest] = useState<any>(null)
  const [myRequestBids, setMyRequestBids] = useState<any[]>([])
  const [myBidsLoading, setMyBidsLoading] = useState(false)
  const [acceptingBidId, setAcceptingBidId] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const timeout = setTimeout(() => setLocationReady(true), 4000)
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        }
      } finally {
        clearTimeout(timeout)
        setLocationReady(true)
      }
    }
    init()
    fetchPromos()
    fetchRequests()
  }, [])

  useEffect(() => {
    if (locationReady) fetchVendors()
  }, [location, radius, category, locationReady])

  async function fetchVendors() {
    setLoading(true)
    try {
      const params: Record<string, string> = {
        lat: String(location?.lat || -6.2),
        lng: String(location?.lng || 106.8),
        radius: radius.replace('km', ''),
      }
      if (category !== 'Semua') params.category = category
      const { data } = await api.get('/vendors/nearby', { params })
      setVendors(data || [])
    } catch {}
    setLoading(false)
  }

  async function fetchPromos() {
    api.get('/map-promos/active').then(r => setPromos(r.data || [])).catch(() => {})
  }

  async function fetchRequests() {
    api.get('/map-requests/active').then(r => setRequests(r.data || [])).catch(() => {})
  }

  async function submitRequest() {
    if (!postDesc.trim()) return Alert.alert('Error', 'Deskripsi wajib diisi')
    setPostSubmitting(true)
    try {
      await api.post('/map-requests', {
        lat: location?.lat || -6.2,
        lng: location?.lng || 106.8,
        category: postCat,
        description: postDesc.trim(),
        event_date: postDate || undefined,
        budget: postBudget ? parseInt(postBudget) : undefined,
      })
      setShowPostModal(false)
      setPostDesc(''); setPostDate(''); setPostBudget('')
      fetchRequests()
      Alert.alert('✅ Berhasil', 'Permintaan Anda sudah tampil di peta. Vendor terdekat dapat melihat dan mengirim penawaran.')
    } catch (e: any) {
      Alert.alert('Gagal', e.response?.data?.error || 'Coba lagi')
    } finally {
      setPostSubmitting(false)
    }
  }

  async function submitBid() {
    if (!bidPrice || parseInt(bidPrice) <= 0) return Alert.alert('Error', 'Harga penawaran wajib diisi')
    setBidSubmitting(true)
    try {
      await api.post(`/map-requests/${activeBidRequest.id}/bids`, {
        price: parseInt(bidPrice),
        note: bidNote.trim() || undefined,
      })
      setActiveBidRequest(null)
      setBidPrice(''); setBidNote('')
      Alert.alert('✅ Penawaran Terkirim', 'Customer akan mendapat notifikasi. Tunggu konfirmasi dari mereka.')
    } catch (e: any) {
      Alert.alert('Gagal', e.response?.data?.error || 'Coba lagi')
    } finally {
      setBidSubmitting(false)
    }
  }

  async function openMyRequest(req: any) {
    setMyRequest(req)
    setMyRequestBids([])
    setMyBidsLoading(true)
    try {
      const { data } = await api.get(`/map-requests/${req.id}/bids`)
      setMyRequestBids(data || [])
    } catch {}
    setMyBidsLoading(false)
  }

  async function deleteMyRequest() {
    if (!myRequest) return
    Alert.alert('Hapus Permintaan', 'Permintaan akan dihapus dari peta. Lanjutkan?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/map-requests/${myRequest.id}`)
            setMyRequest(null)
            fetchRequests()
          } catch (e: any) {
            Alert.alert('Gagal', e.response?.data?.error || 'Coba lagi')
          }
        },
      },
    ])
  }

  async function acceptBid(bidId: string, vendorName: string) {
    setAcceptingBidId(bidId)
    try {
      const { data } = await api.post(`/map-requests/bids/${bidId}/accept`)
      setMyRequest(null)
      fetchRequests()
      if (data.room_id) {
        navigation.navigate('ChatRoom', { roomId: data.room_id, vendorName: vendorName || 'Vendor' })
      }
    } catch (e: any) {
      Alert.alert('Gagal', e.response?.data?.error || 'Coba lagi')
    } finally {
      setAcceptingBidId(null)
    }
  }

  async function openPromoChat() {
    if (!activePromo) return
    try {
      const { data: room } = await api.post('/chat/rooms', { vendor_id: activePromo.vendorId })
      setActivePromo(null)
      navigation.navigate('ChatRoom', { roomId: room.id, vendorName: 'Vendor', vendorId: activePromo.vendorId })
    } catch { setActivePromo(null) }
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={statusBar} backgroundColor={statusBarBg} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6, backgroundColor: isDark ? '#1A1A2E' : '#fff', borderBottomColor: cardBorder }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: text }]}>🗺️ Peta Vendor</Text>
          {!loading && (
            <Text style={[styles.headerCount, { color: subtext }]}>
              {vendors.length} vendor · {promos.length} promo · {requests.length} req
            </Text>
          )}
        </View>

        {/* Radius row */}
        <View style={styles.radiusRow}>
          {RADII.map((r) => (
            <TouchableOpacity key={r} style={[styles.radiusChip, { backgroundColor: isDark ? '#2A2A4A' : '#F3F4F6', borderColor: cardBorder }, radius === r && styles.chipActive]} onPress={() => setRadius(r)}>
              <Text style={[styles.chipText, { color: radius === r ? '#fff' : text }]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category scroll row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity key={c} style={[styles.chip, { backgroundColor: isDark ? '#2A2A4A' : '#F3F4F6', borderColor: cardBorder }, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
              <Text style={[styles.chipText, { color: category === c ? '#fff' : text }]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#3B5BDB" />
          <Text style={[styles.loadingText, { color: subtext }]}>Memuat peta...</Text>
        </View>
      ) : (
        <LeafletMap
          vendors={vendors}
          promos={promos}
          requests={requests}
          userLat={location?.lat}
          userLng={location?.lng}
          radiusKm={parseInt(radius.replace('km', ''))}
          onVendorPress={(id) => navigation.navigate('VendorDetail', { vendorId: id })}
          onPromoPress={(vendorId, promoText) => setActivePromo({ vendorId, text: promoText })}
          onRequestPress={(id, description, category, eventDate, budget) => {
            const req = requests.find(r => r.id === id)
            if (!isVendor && req?.customer_id === user?.id) {
              openMyRequest(req)
            } else if (isVendor) {
              setActiveBidRequest({ id, description, category, eventDate, budget })
            }
          }}
          style={{ flex: 1 }}
        />
      )}

      {/* FAB: customer bisa post request */}
      {!isVendor && !loading && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowPostModal(true)}>
          <Text style={styles.fabText}>🙋 Butuh Jasa?</Text>
        </TouchableOpacity>
      )}

      {/* ── Modal: Post Request (Customer) ─────────────────────────────── */}
      <Modal visible={showPostModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: card }]}>
            <Text style={[styles.modalTitle, { color: text }]}>🙋 Pasang Permintaan Jasa</Text>
            <Text style={[styles.modalSub, { color: subtext }]}>Vendor terdekat akan melihat dan mengirim penawaran ke Anda</Text>

            <Text style={[styles.label, { color: text }]}>Kategori Jasa</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4, marginBottom: 12 }}>
              {REQ_CATEGORIES.map(c => (
                <TouchableOpacity key={c} style={[styles.catChip, postCat === c && styles.catChipActive]} onPress={() => setPostCat(c)}>
                  <Text style={[styles.catChipText, postCat === c && { color: '#fff' }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.label, { color: text }]}>Deskripsi *</Text>
            <TextInput
              style={[styles.input, styles.inputMulti, { backgroundColor: isDark ? '#0D0D1A' : '#F9FAFB', color: text, borderColor: cardBorder }]}
              placeholder="Contoh: Butuh fotografer outdoor untuk prewedding, lokasi Ubud Bali"
              placeholderTextColor={subtext}
              value={postDesc}
              onChangeText={setPostDesc}
              multiline
              numberOfLines={3}
            />

            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: text }]}>Tanggal Acara</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? '#0D0D1A' : '#F9FAFB', color: text, borderColor: cardBorder }]}
                  placeholder="2026-06-15"
                  placeholderTextColor={subtext}
                  value={postDate}
                  onChangeText={setPostDate}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: text }]}>Budget (Rp)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? '#0D0D1A' : '#F9FAFB', color: text, borderColor: cardBorder }]}
                  placeholder="5000000"
                  placeholderTextColor={subtext}
                  value={postBudget}
                  onChangeText={setPostBudget}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn2} onPress={() => setShowPostModal(false)}>
                <Text style={[styles.cancelBtn2Text, { color: subtext }]}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, postSubmitting && { opacity: 0.6 }]} onPress={submitRequest} disabled={postSubmitting}>
                <Text style={styles.submitBtnText}>{postSubmitting ? 'Mengirim...' : 'Pasang di Peta'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal: Kirim Penawaran (Vendor) ────────────────────────────── */}
      <Modal visible={!!activeBidRequest} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: card }]}>
            <Text style={[styles.modalTitle, { color: text }]}>💼 Kirim Penawaran</Text>
            {activeBidRequest && (
              <>
                <View style={[styles.requestPreview, { backgroundColor: isDark ? '#0D0D1A' : '#F0FDF4' }]}>
                  <Text style={[styles.requestPreviewCat, { color: '#0D9488' }]}>{activeBidRequest.category}</Text>
                  <Text style={[styles.requestPreviewDesc, { color: text }]}>{activeBidRequest.description}</Text>
                  {activeBidRequest.eventDate ? <Text style={[styles.requestPreviewMeta, { color: subtext }]}>📅 {activeBidRequest.eventDate}</Text> : null}
                  {activeBidRequest.budget ? <Text style={[styles.requestPreviewMeta, { color: subtext }]}>💰 Budget {formatRp(activeBidRequest.budget)}</Text> : null}
                </View>
                <Text style={[styles.label, { color: text }]}>Harga Penawaran Anda (Rp) *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? '#0D0D1A' : '#F9FAFB', color: text, borderColor: cardBorder }]}
                  placeholder="Masukkan harga"
                  placeholderTextColor={subtext}
                  value={bidPrice}
                  onChangeText={setBidPrice}
                  keyboardType="numeric"
                />
                <Text style={[styles.label, { color: text }]}>Catatan (opsional)</Text>
                <TextInput
                  style={[styles.input, styles.inputMulti, { backgroundColor: isDark ? '#0D0D1A' : '#F9FAFB', color: text, borderColor: cardBorder }]}
                  placeholder="Jelaskan apa yang termasuk dalam harga ini..."
                  placeholderTextColor={subtext}
                  value={bidNote}
                  onChangeText={setBidNote}
                  multiline
                  numberOfLines={3}
                />
              </>
            )}
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn2} onPress={() => { setActiveBidRequest(null); setBidPrice(''); setBidNote('') }}>
                <Text style={[styles.cancelBtn2Text, { color: subtext }]}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#0D9488' }, bidSubmitting && { opacity: 0.6 }]} onPress={submitBid} disabled={bidSubmitting}>
                <Text style={styles.submitBtnText}>{bidSubmitting ? 'Mengirim...' : 'Kirim Penawaran'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal: Customer lihat request sendiri + bids ───────────────── */}
      <Modal visible={!!myRequest} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: card }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text style={[styles.modalTitle, { color: text }]}>🙋 Permintaan Saya</Text>
              <TouchableOpacity onPress={deleteMyRequest}>
                <Text style={{ color: '#EF4444', fontFamily: 'Poppins_600SemiBold', fontSize: 13 }}>Hapus</Text>
              </TouchableOpacity>
            </View>

            {myRequest && (
              <View style={[styles.requestPreview, { backgroundColor: isDark ? '#0D0D1A' : '#F0FDF4', marginBottom: 12 }]}>
                <Text style={[styles.requestPreviewCat, { color: '#0D9488' }]}>{myRequest.category}</Text>
                <Text style={[styles.requestPreviewDesc, { color: text }]}>{myRequest.description}</Text>
                {myRequest.event_date ? <Text style={[styles.requestPreviewMeta, { color: subtext }]}>📅 {myRequest.event_date}</Text> : null}
                {myRequest.budget ? <Text style={[styles.requestPreviewMeta, { color: subtext }]}>💰 Budget {formatRp(myRequest.budget)}</Text> : null}
              </View>
            )}

            <Text style={[styles.label, { color: text, marginTop: 0 }]}>
              💼 Penawaran Masuk {myBidsLoading ? '...' : `(${myRequestBids.length})`}
            </Text>

            {myBidsLoading ? (
              <ActivityIndicator color="#3B5BDB" style={{ marginVertical: 16 }} />
            ) : myRequestBids.length === 0 ? (
              <Text style={[styles.modalSub, { color: subtext, textAlign: 'center', marginVertical: 12 }]}>
                Belum ada penawaran masuk. Vendor terdekat akan melihat permintaan Anda.
              </Text>
            ) : (
              <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
                {myRequestBids.map((bid) => (
                  <View key={bid.id} style={[styles.bidCard, { backgroundColor: isDark ? '#0D0D1A' : '#F9FAFB', borderColor: cardBorder }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.bidVendorName, { color: text }]}>{bid.vendors?.business_name || 'Vendor'}</Text>
                        <Text style={[styles.bidCategory, { color: subtext }]}>{bid.vendors?.category}</Text>
                        {bid.vendors?.avg_rating ? <Text style={[styles.bidRating, { color: '#F59E0B' }]}>⭐ {Number(bid.vendors.avg_rating).toFixed(1)}</Text> : null}
                        {bid.note ? <Text style={[styles.bidNote, { color: subtext }]}>{bid.note}</Text> : null}
                      </View>
                      <Text style={[styles.bidPrice, { color: '#3B5BDB' }]}>{formatRp(bid.price)}</Text>
                    </View>
                    {bid.status === 'pending' && (
                      <TouchableOpacity
                        style={[styles.acceptBtn, acceptingBidId === bid.id && { opacity: 0.6 }]}
                        onPress={() => acceptBid(bid.id, bid.vendors?.business_name)}
                        disabled={!!acceptingBidId}
                      >
                        <Text style={styles.acceptBtnText}>{acceptingBidId === bid.id ? 'Memproses...' : '✅ Terima Penawaran'}</Text>
                      </TouchableOpacity>
                    )}
                    {bid.status === 'accepted' && (
                      <View style={styles.acceptedBadge}>
                        <Text style={styles.acceptedBadgeText}>✅ Diterima</Text>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity style={[styles.cancelBtn2, { marginTop: 12, borderColor: cardBorder }]} onPress={() => setMyRequest(null)}>
              <Text style={[styles.cancelBtn2Text, { color: subtext }]}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal: Chat dari promo vendor ──────────────────────────────── */}
      <Modal visible={!!activePromo} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: card, paddingBottom: 28 }]}>
            <Text style={[styles.modalTitle, { color: text }]}>⚡ Promo Vendor</Text>
            {activePromo && <Text style={[styles.requestPreviewDesc, { color: subtext, textAlign: 'center', marginVertical: 12 }]}>{activePromo.text}</Text>}
            <TouchableOpacity style={styles.submitBtn} onPress={openPromoChat}>
              <Text style={styles.submitBtnText}>💬 Hubungi Vendor</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 12, alignItems: 'center' }} onPress={() => setActivePromo(null)}>
              <Text style={[styles.cancelBtn2Text, { color: subtext }]}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { borderBottomWidth: 1, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 8 },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 15 },
  headerCount: { fontFamily: 'Poppins_400Regular', fontSize: 11 },
  radiusRow: { flexDirection: 'row', paddingHorizontal: 14, gap: 8, marginBottom: 8 },
  radiusChip: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  catRow: { paddingHorizontal: 14, gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  chipActive: { backgroundColor: '#3B5BDB', borderColor: '#3B5BDB' },
  chipText: { fontFamily: 'Poppins_500Medium', fontSize: 12 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontFamily: 'Poppins_400Regular' },
  fab: {
    position: 'absolute', bottom: 24, alignSelf: 'center',
    backgroundColor: '#0D9488', borderRadius: 28, paddingHorizontal: 20, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
  },
  fabText: { fontFamily: 'Poppins_700Bold', color: '#fff', fontSize: 14 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 4 },
  modalTitle: { fontFamily: 'Poppins_700Bold', fontSize: 17, marginBottom: 4 },
  modalSub: { fontFamily: 'Poppins_400Regular', fontSize: 13, marginBottom: 12, lineHeight: 18 },
  label: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, marginBottom: 6, marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontFamily: 'Poppins_400Regular', fontSize: 14 },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  row2: { flexDirection: 'row', gap: 12 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  catChipActive: { backgroundColor: '#3B5BDB', borderColor: '#3B5BDB' },
  catChipText: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: '#374151' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn2: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  cancelBtn2Text: { fontFamily: 'Poppins_500Medium', fontSize: 14 },
  submitBtn: { flex: 2, backgroundColor: '#3B5BDB', paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { fontFamily: 'Poppins_700Bold', color: '#fff', fontSize: 14 },
  requestPreview: { borderRadius: 12, padding: 12, marginBottom: 4 },
  requestPreviewCat: { fontFamily: 'Poppins_700Bold', fontSize: 12, marginBottom: 4 },
  requestPreviewDesc: { fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 18 },
  requestPreviewMeta: { fontFamily: 'Poppins_400Regular', fontSize: 12, marginTop: 4 },
  bidCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  bidVendorName: { fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  bidCategory: { fontFamily: 'Poppins_400Regular', fontSize: 11, marginTop: 1 },
  bidRating: { fontFamily: 'Poppins_500Medium', fontSize: 11, marginTop: 2 },
  bidNote: { fontFamily: 'Poppins_400Regular', fontSize: 12, marginTop: 4, lineHeight: 17 },
  bidPrice: { fontFamily: 'Poppins_700Bold', fontSize: 14 },
  acceptBtn: { backgroundColor: '#3B5BDB', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 10 },
  acceptBtnText: { fontFamily: 'Poppins_700Bold', color: '#fff', fontSize: 13 },
  acceptedBadge: { backgroundColor: '#D1FAE5', borderRadius: 10, paddingVertical: 8, alignItems: 'center', marginTop: 10 },
  acceptedBadgeText: { fontFamily: 'Poppins_600SemiBold', color: '#059669', fontSize: 12 },
})
