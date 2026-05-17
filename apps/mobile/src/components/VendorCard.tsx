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
}

export default function VendorCard({ vendor, onPress }: Props) {
  const coverImage = vendor.portfolios?.[0]?.image_url
  const minPrice = vendor.services?.length ? Math.min(...vendor.services.map((s) => s.price)) : null
  const isSponsored = ['pro', 'premium', 'enterprise'].includes(vendor.subscription || '')

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageBox}>
        {coverImage ? (
          <Image source={{ uri: coverImage }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Text style={{ fontSize: 32 }}>🏢</Text>
          </View>
        )}
        {isSponsored && (
          <View style={styles.sponsoredBadge}><Text style={styles.sponsoredText}>⭐ Sponsor</Text></View>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>{vendor.business_name}</Text>
          {vendor.verified && <Text style={styles.verified}>✅</Text>}
        </View>
        <Text style={styles.category}>{vendor.category} • {vendor.city}</Text>
        <View style={styles.row}>
          <Text style={styles.rating}>⭐ {vendor.avg_rating.toFixed(1)}</Text>
          <Text style={styles.reviews}>({vendor.total_reviews} ulasan)</Text>
        </View>
        {minPrice && <Text style={styles.price}>Mulai dari {formatRp(minPrice)}</Text>}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  imageBox: { position: 'relative' },
  image: { width: '100%', height: 160 },
  imageFallback: { backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  sponsoredBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#3B5BDB', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  sponsoredText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  info: { padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', flex: 1 },
  verified: { fontSize: 14 },
  category: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  rating: { fontSize: 13, color: '#F59E0B', fontWeight: '600', marginTop: 4 },
  reviews: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  price: { fontSize: 14, color: '#3B5BDB', fontWeight: '600', marginTop: 6 },
})
