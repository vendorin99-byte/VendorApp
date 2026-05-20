import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Share, StatusBar } from 'react-native'
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RootStackParamList } from '../../navigation'
import { useAuthStore } from '../../store/authStore'
import { useTheme } from '../../hooks/useTheme'
import { formatRp } from '../../utils/currency'
import api from '../../services/api'

type Route = RouteProp<RootStackParamList, 'VendorDetail'>
type Nav = NativeStackNavigationProp<RootStackParamList>

const TABS = ['Tentang', 'Layanan & Harga', 'Ulasan']

export default function VendorDetailScreen() {
  const route = useRoute<Route>()
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const { vendorId } = route.params
  const { user } = useAuthStore()
  const { isDark, bg, card, cardBorder, text, subtext, statusBar, divider } = useTheme()
  const [vendor, setVendor] = useState<any>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    api.get(`/vendors/${vendorId}`).then((r) => setVendor(r.data)).catch(() => {})
  }, [vendorId])

  async function openChat() {
    const r = await api.post('/chat/rooms', { vendor_id: vendorId })
    navigation.navigate('ChatRoom', { roomId: r.data.id, vendorName: vendor.business_name, vendorId })
  }

  async function shareVendor() {
    try {
      const profileRes = await api.get('/customer/profile').catch(() => null)
      const refCode = profileRes?.data?.referral_code || ''
      const link = refCode ? `https://web-henna-five-13.vercel.app/i/${refCode}?vendor=${vendorId}` : ''
      const message = `Hei! Cek vendor *${vendor.business_name}* di VendorApp 📱\n${vendor.category} • ${vendor.city}\n⭐ ${vendor.avg_rating?.toFixed(1)}/5.0${link ? '\n' + link : ''}`
      Share.share({ message, title: vendor.business_name })
    } catch {}
  }

  if (!vendor) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <StatusBar barStyle={statusBar} backgroundColor={bg} />
        <ActivityIndicator size="large" color="#3B5BDB" />
      </View>
    )
  }

  const activeServices = vendor.services?.filter((s: any) => s.is_active) || []

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <StatusBar barStyle={statusBar} backgroundColor={bg} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero image */}
        {vendor.portfolios?.length > 0 ? (
          <View>
            <Image source={{ uri: vendor.portfolios[selectedImage]?.image_url }} style={styles.cover} />
            {vendor.portfolios.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.thumbRow, { backgroundColor: bg }]}>
                {vendor.portfolios.map((p: any, i: number) => (
                  <TouchableOpacity key={p.id} onPress={() => setSelectedImage(i)}>
                    <Image source={{ uri: p.image_url }} style={[styles.thumb, i === selectedImage && styles.thumbActive]} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        ) : (
          <View style={[styles.coverFallback, { backgroundColor: card }]}>
            <Text style={{ fontSize: 48 }}>🏢</Text>
          </View>
        )}

        {/* Info */}
        <View style={[styles.info, { backgroundColor: bg }]}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: text }]}>{vendor.business_name}</Text>
            {vendor.verified && <Text style={styles.verifiedBadge}>✅</Text>}
          </View>
          <Text style={[styles.meta, { color: subtext }]}>{vendor.category} • {vendor.city}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.rating}>⭐ {vendor.avg_rating?.toFixed(1) ?? '-'}</Text>
            <Text style={[styles.ratingCount, { color: subtext }]}>({vendor.total_reviews} ulasan)</Text>
            {vendor.service_radius_km && (
              <View style={[styles.radiusBadge, { backgroundColor: card }]}>
                <Text style={[styles.radiusText, { color: subtext }]}>📍 {vendor.service_radius_km} km</Text>
              </View>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabBar, { backgroundColor: bg, borderBottomColor: cardBorder }]}>
          {TABS.map((t, i) => (
            <TouchableOpacity key={t} style={[styles.tabBtn, activeTab === i && styles.tabBtnActive]} onPress={() => setActiveTab(i)}>
              <Text style={[styles.tabText, { color: subtext }, activeTab === i && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.tabContent, { backgroundColor: bg }]}>
          {/* Tentang */}
          {activeTab === 0 && (
            <View style={styles.section}>
              {vendor.description
                ? <Text style={[styles.desc, { color: isDark ? '#D1D5DB' : '#374151' }]}>{vendor.description}</Text>
                : <Text style={[styles.empty, { color: subtext }]}>Belum ada deskripsi</Text>}
              <View style={styles.contactList}>
                {vendor.address && <ContactRow icon="📍" label="Alamat" value={vendor.address} card={card} text={text} subtext={subtext} />}
                {vendor.whatsapp && <ContactRow icon="📱" label="WhatsApp" value={vendor.whatsapp} card={card} text={text} subtext={subtext} />}
                {vendor.service_radius_km && <ContactRow icon="🗺️" label="Jangkauan" value={`${vendor.service_radius_km} km`} card={card} text={text} subtext={subtext} />}
              </View>
            </View>
          )}

          {/* Layanan */}
          {activeTab === 1 && (
            <View style={styles.section}>
              {activeServices.length === 0 && <Text style={[styles.empty, { color: subtext }]}>Belum ada layanan aktif</Text>}
              {activeServices.map((s: any) => (
                <View key={s.id} style={[styles.serviceCard, { backgroundColor: card, borderColor: cardBorder }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.serviceName, { color: text }]}>{s.name}</Text>
                    {s.description && <Text style={[styles.serviceDesc, { color: subtext }]} numberOfLines={2}>{s.description}</Text>}
                    {s.duration && <Text style={[styles.serviceDuration, { color: subtext }]}>⏱ {s.duration}</Text>}
                    <Text style={styles.servicePrice}>{formatRp(s.price)}</Text>
                    {s.dp_percent && <Text style={[styles.serviceDuration, { color: subtext }]}>DP {s.dp_percent}% = {formatRp(Math.floor(s.price * s.dp_percent / 100))}</Text>}
                  </View>
                  <View style={styles.serviceActions}>
                    <TouchableOpacity style={styles.chatSmallBtn} onPress={openChat}>
                      <Text style={styles.chatSmallText}>💬</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.bookSmallBtn} onPress={() => navigation.navigate('Booking', { vendorId, serviceId: s.id })}>
                      <Text style={styles.bookSmallText}>Pesan</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Ulasan */}
          {activeTab === 2 && (
            <View style={styles.section}>
              <View style={[styles.ratingBig, { backgroundColor: card }]}>
                <Text style={[styles.ratingBigNum, { color: text }]}>{vendor.avg_rating?.toFixed(1) ?? '-'}</Text>
                <Text style={styles.stars}>{'⭐'.repeat(Math.round(vendor.avg_rating ?? 0))}</Text>
                <Text style={[styles.ratingBigSub, { color: subtext }]}>Berdasarkan {vendor.total_reviews} ulasan</Text>
              </View>
              {vendor.reviews?.length === 0 && <Text style={[styles.empty, { color: subtext }]}>Belum ada ulasan</Text>}
              {vendor.reviews?.map((r: any) => (
                <View key={r.id} style={[styles.reviewCard, { backgroundColor: card }]}>
                  <View style={styles.reviewHeader}>
                    <Text style={[styles.reviewName, { color: text }]}>{r.users?.name}</Text>
                    <Text style={{ fontSize: 12 }}>{'⭐'.repeat(r.rating)}</Text>
                  </View>
                  {r.comment && <Text style={[styles.reviewComment, { color: isDark ? '#D1D5DB' : '#374151' }]}>{r.comment}</Text>}
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12, borderTopColor: cardBorder, backgroundColor: bg }]}>
        <TouchableOpacity style={[styles.shareBtn, { borderColor: cardBorder }]} onPress={shareVendor}>
          <Text style={{ fontSize: 18 }}>🔗</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chatBtn} onPress={openChat}>
          <Text style={styles.chatBtnText}>💬 Konsultasi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bookBtn} onPress={() => navigation.navigate('Booking', { vendorId })}>
          <Text style={styles.bookBtnText}>📅 Pesan Sekarang</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function ContactRow({ icon, label, value, card, text, subtext }: { icon: string; label: string; value: string; card: string; text: string; subtext: string }) {
  return (
    <View style={[styles.contactRow, { backgroundColor: card }]}>
      <Text style={styles.contactIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.contactLabel, { color: subtext }]}>{label}</Text>
        <Text style={[styles.contactValue, { color: text }]}>{value}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cover: { width: '100%', height: 260 },
  coverFallback: { width: '100%', height: 200, alignItems: 'center', justifyContent: 'center' },
  thumbRow: { padding: 8, gap: 8 },
  thumb: { width: 60, height: 60, borderRadius: 8, opacity: 0.5 },
  thumbActive: { opacity: 1, borderWidth: 2, borderColor: '#3B5BDB' },
  info: { padding: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontFamily: 'Poppins_700Bold', fontSize: 22, flex: 1 },
  verifiedBadge: { fontSize: 18 },
  meta: { fontFamily: 'Poppins_400Regular', fontSize: 14, marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  rating: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: '#F59E0B' },
  ratingCount: { fontFamily: 'Poppins_400Regular', fontSize: 13 },
  radiusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  radiusText: { fontFamily: 'Poppins_400Regular', fontSize: 11 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderColor: '#3B5BDB' },
  tabText: { fontFamily: 'Poppins_500Medium', fontSize: 13 },
  tabTextActive: { fontFamily: 'Poppins_600SemiBold', color: '#3B5BDB' },
  tabContent: {},
  section: { padding: 16 },
  desc: { fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 22 },
  empty: { fontFamily: 'Poppins_400Regular', textAlign: 'center', paddingVertical: 20, fontSize: 14 },
  contactList: { marginTop: 16, gap: 12 },
  contactRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 10, padding: 12 },
  contactIcon: { fontSize: 18, marginTop: 2 },
  contactLabel: { fontFamily: 'Poppins_400Regular', fontSize: 11 },
  contactValue: { fontFamily: 'Poppins_500Medium', fontSize: 14, marginTop: 2 },
  serviceCard: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 14, borderWidth: 1, borderRadius: 12, marginBottom: 10, gap: 12 },
  serviceName: { fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  serviceDesc: { fontFamily: 'Poppins_400Regular', fontSize: 13, marginTop: 2 },
  serviceDuration: { fontFamily: 'Poppins_400Regular', fontSize: 11, marginTop: 4 },
  servicePrice: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#3B5BDB', marginTop: 8 },
  serviceActions: { alignItems: 'center', gap: 8, paddingTop: 4 },
  chatSmallBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, borderColor: '#3B5BDB', alignItems: 'center', justifyContent: 'center' },
  chatSmallText: { fontSize: 16 },
  bookSmallBtn: { backgroundColor: '#3B5BDB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  bookSmallText: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: '#fff' },
  ratingBig: { alignItems: 'center', paddingVertical: 24, borderRadius: 14, marginBottom: 16 },
  ratingBigNum: { fontFamily: 'Poppins_700Bold', fontSize: 48 },
  stars: { fontSize: 20, marginTop: 4 },
  ratingBigSub: { fontFamily: 'Poppins_400Regular', fontSize: 13, marginTop: 8 },
  reviewCard: { padding: 14, borderRadius: 12, marginBottom: 10 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  reviewName: { fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  reviewComment: { fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 20 },
  footer: { flexDirection: 'row', padding: 16, paddingTop: 12, gap: 10, borderTopWidth: 1 },
  shareBtn: { width: 48, borderWidth: 1.5, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chatBtn: { flex: 1, borderWidth: 1.5, borderColor: '#3B5BDB', borderRadius: 12, padding: 14, alignItems: 'center' },
  chatBtnText: { fontFamily: 'Poppins_600SemiBold', color: '#3B5BDB', fontSize: 14 },
  bookBtn: { flex: 2, backgroundColor: '#3B5BDB', borderRadius: 12, padding: 14, alignItems: 'center' },
  bookBtnText: { fontFamily: 'Poppins_700Bold', color: '#fff', fontSize: 14 },
})
