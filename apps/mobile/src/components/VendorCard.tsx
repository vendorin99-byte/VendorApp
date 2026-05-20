import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { formatRp } from '../utils/currency'

interface Props {
  vendor: {
    id: string
    business_name: string
    category: string
    city: string
    avg_rating: number
    total_reviews: number
    portfolios?: { image_url: string }[]
    services?: { price: number }[]
    verified?: boolean
    subscription?: string
  }
  onPress: () => void
  dark?: boolean
}

export default function VendorCard({ vendor, onPress, dark }: Props) {
  const coverImage = vendor.portfolios?.[0]?.image_url
  const minPrice = vendor.services?.length ? Math.min(...vendor.services.map((s) => s.price)) : null
  const isSponsored = ['pro', 'premium', 'enterprise'].includes(vendor.subscription || '')

  const cardBg = dark ? '#1A1A2E' : '#fff'
  const textPrimary = dark ? '#fff' : '#1F2937'
  const textSub = dark ? '#9CA3AF' : '#6B7280'

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: cardBg }]} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageBox}>
        {coverImage ? (
          <Image source={{ uri: coverImage }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imageFallback, { backgroundColor: dark ? '#2A2A4A' : '#F3F4F6' }]}>
            <Text style={{ fontSize: 32 }}>🏢</Text>
          </View>
        )}
        {isSponsored && (
          <View style={styles.sponsoredBadge}><Text style={styles.sponsoredText}>⭐ Sponsor</Text></View>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={[styles.name, { color: textPrimary }]} numberOfLines={1}>{vendor.business_name}</Text>
          {vendor.verified && <Text style={styles.verified}>✅</Text>}
        </View>
        <Text style={[styles.category, { color: textSub }]}>{vendor.category} • {vendor.city}</Text>
        <View style={styles.row}>
          <Text style={styles.rating}>⭐ {vendor.avg_rating?.toFixed(1) ?? '-'}</Text>
          <Text style={[styles.reviews, { color: textSub }]}>({vendor.total_reviews} ulasan)</Text>
        </View>
        {minPrice != null && <Text style={styles.price}>Mulai dari {formatRp(minPrice)}</Text>}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, overflow: 'hidden', marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  imageBox: { position: 'relative' },
  image: { width: '100%', height: 160 },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  sponsoredBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#3B5BDB', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  sponsoredText: { color: '#fff', fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  info: { padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontFamily: 'Poppins_700Bold', fontSize: 16, flex: 1 },
  verified: { fontSize: 14 },
  category: { fontFamily: 'Poppins_400Regular', fontSize: 13, marginTop: 2 },
  rating: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: '#F59E0B', marginTop: 4 },
  reviews: { fontFamily: 'Poppins_400Regular', fontSize: 12, marginTop: 4 },
  price: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#3B5BDB', marginTop: 6 },
})
