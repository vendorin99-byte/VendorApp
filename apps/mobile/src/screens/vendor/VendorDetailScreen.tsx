import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native'
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation'
import { formatRp } from '../../utils/currency'
import api from '../../services/api'

type Route = RouteProp<RootStackParamList, 'VendorDetail'>
type Nav = NativeStackNavigationProp<RootStackParamList>

export default function VendorDetailScreen() {
  const route = useRoute<Route>()
  const navigation = useNavigation<Nav>()
  const { vendorId } = route.params
  const [vendor, setVendor] = useState<any>(null)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    api.get(`/vendors/${vendorId}`).then((r) => setVendor(r.data)).catch(() => {})
  }, [vendorId])

  if (!vendor) return <View style={styles.center}><ActivityIndicator size="large" color="#3B5BDB" /></View>

  const activeServices = vendor.services?.filter((s: any) => s.is_active) || []

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {vendor.portfolios?.length > 0 && (
          <View>
            <Image source={{ uri: vendor.portfolios[selectedImage]?.image_url }} style={styles.cover} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
              {vendor.portfolios.map((p: any, i: number) => (
                <TouchableOpacity key={p.id} onPress={() => setSelectedImage(i)}>
                  <Image source={{ uri: p.image_url }} style={[styles.thumb, i === selectedImage && styles.thumbActive]} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{vendor.business_name}</Text>
            {vendor.verified && <Text>✅</Text>}
          </View>
          <Text style={styles.meta}>{vendor.category} • {vendor.city}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.rating}>⭐ {vendor.avg_rating?.toFixed(1)}</Text>
            <Text style={styles.ratingCount}>({vendor.total_reviews} ulasan)</Text>
          </View>

          {vendor.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tentang Kami</Text>
              <Text style={styles.desc}>{vendor.description}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Paket Layanan</Text>
            {activeServices.map((s: any) => (
              <TouchableOpacity key={s.id} style={styles.serviceCard} onPress={() => navigation.navigate('Booking', { vendorId, serviceId: s.id })}>
                <View>
                  <Text style={styles.serviceName}>{s.name}</Text>
                  {s.description && <Text style={styles.serviceDesc} numberOfLines={2}>{s.description}</Text>}
                  <Text style={styles.servicePrice}>{formatRp(s.price)}</Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          {vendor.reviews?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ulasan Customer</Text>
              {vendor.reviews.slice(0, 3).map((r: any) => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewName}>{r.users?.name}</Text>
                    <Text style={styles.reviewRating}>{'⭐'.repeat(r.rating)}</Text>
                  </View>
                  {r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.chatBtn} onPress={async () => {
          const r = await api.post('/chat/rooms', { vendor_id: vendorId })
          navigation.navigate('ChatRoom', { roomId: r.data.id, vendorName: vendor.business_name })
        }}>
          <Text style={styles.chatBtnText}>💬 Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bookBtn} onPress={() => navigation.navigate('Booking', { vendorId })}>
          <Text style={styles.bookBtnText}>📅 Pesan Sekarang</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cover: { width: '100%', height: 240 },
  thumbRow: { padding: 8, gap: 8 },
  thumb: { width: 60, height: 60, borderRadius: 8, opacity: 0.6 },
  thumbActive: { opacity: 1, borderWidth: 2, borderColor: '#3B5BDB' },
  body: { padding: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', flex: 1 },
  meta: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, marginBottom: 16 },
  rating: { fontSize: 15, color: '#F59E0B', fontWeight: '600' },
  ratingCount: { fontSize: 13, color: '#9CA3AF' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 10 },
  desc: { fontSize: 14, color: '#4B5563', lineHeight: 22 },
  serviceCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, marginBottom: 8 },
  serviceName: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  serviceDesc: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  servicePrice: { fontSize: 15, color: '#3B5BDB', fontWeight: 'bold', marginTop: 4 },
  arrow: { fontSize: 22, color: '#9CA3AF' },
  reviewCard: { padding: 12, backgroundColor: '#F9FAFB', borderRadius: 12, marginBottom: 8 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  reviewName: { fontSize: 13, fontWeight: '600', color: '#374151' },
  reviewRating: { fontSize: 12 },
  reviewComment: { fontSize: 13, color: '#4B5563' },
  footer: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  chatBtn: { flex: 1, borderWidth: 1.5, borderColor: '#3B5BDB', borderRadius: 12, padding: 14, alignItems: 'center' },
  chatBtnText: { color: '#3B5BDB', fontWeight: '600', fontSize: 15 },
  bookBtn: { flex: 2, backgroundColor: '#3B5BDB', borderRadius: 12, padding: 14, alignItems: 'center' },
  bookBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
})
