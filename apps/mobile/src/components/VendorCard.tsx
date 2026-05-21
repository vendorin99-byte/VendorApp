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
    services?: { price: number; is_active?: boolean }[]
    verified?: boolean
    subscription?: string
  }
  onPress: () => void
  dark?: boolean
}

const CATEGORY_COLORS: Record<string, string> = {
  'Fotografer': '#3B5BDB',
  'Wedding': '#E64980',
  'EO': '#7950F2',
  'Katering': '#F76707',
  'Dekorasi': '#2F9E44',
  'Sewa Mobil': '#1971C2',
  'Musik': '#862E9C',
}

function getPlaceholderColor(name: string) {
  const colors = ['#3B5BDB', '#E64980', '#7950F2', '#F76707', '#2F9E44', '#1971C2', '#862E9C', '#C92A2A']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export default function VendorCard({ vendor, onPress, dark }: Props) {
  const coverImage = vendor.portfolios?.[0]?.image_url
  const activeServices = vendor.services?.filter((s) => s.is_active !== false) ?? []
  const minPrice = activeServices.length ? Math.min(...activeServices.map((s) => s.price)) : null
  const isSponsored = ['pro', 'premium', 'enterprise'].includes(vendor.subscription || '')
  const placeholderColor = getPlaceholderColor(vendor.business_name)
  const initial = vendor.business_name?.charAt(0)?.toUpperCase() ?? '?'

  const cardBg = dark ? '#1A1A2E' : '#fff'
  const textPrimary = dark ? '#fff' : '#1F2937'
  const textSub = dark ? '#9CA3AF' : '#6B7280'
  const dividerColor = dark ? '#2A2A4A' : '#F3F4F6'
  const categoryColor = CATEGORY_COLORS[vendor.category] ?? '#3B5BDB'

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: cardBg }]} onPress={onPress} activeOpacity={0.88}>
      {/* Thumbnail */}
      <View style={styles.thumbBox}>
        {coverImage ? (
          <Image source={{ uri: coverImage }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback, { backgroundColor: placeholderColor }]}>
            <Text style={styles.thumbInitial}>{initial}</Text>
          </View>
        )}
        {isSponsored && (
          <View style={styles.sponsoredBadge}>
            <Text style={styles.sponsoredText}>⭐</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        {/* Nama + verified */}
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: textPrimary }]} numberOfLines={1}>{vendor.business_name}</Text>
          {vendor.verified && <Text style={styles.verifiedBadge}>✓</Text>}
        </View>

        {/* Kategori + kota */}
        <View style={styles.metaRow}>
          <View style={[styles.categoryChip, { backgroundColor: categoryColor + '18' }]}>
            <Text style={[styles.categoryText, { color: categoryColor }]}>{vendor.category}</Text>
          </View>
          <Text style={[styles.city, { color: textSub }]}>📍 {vendor.city}</Text>
        </View>

        {/* Rating */}
        <View style={styles.ratingRow}>
          <Text style={styles.star}>★</Text>
          <Text style={styles.ratingNum}>{vendor.avg_rating?.toFixed(1) ?? '–'}</Text>
          <Text style={[styles.reviewCount, { color: textSub }]}>({vendor.total_reviews} ulasan)</Text>
        </View>

        {/* Divider + harga */}
        <View style={[styles.divider, { backgroundColor: dividerColor }]} />
        <View style={styles.priceRow}>
          {minPrice != null ? (
            <>
              <Text style={[styles.priceLabel, { color: textSub }]}>Mulai dari</Text>
              <Text style={styles.price}>{formatRp(minPrice)}</Text>
            </>
          ) : (
            <Text style={[styles.priceLabel, { color: textSub }]}>Hubungi untuk harga</Text>
          )}
          <View style={styles.arrow}>
            <Text style={{ color: '#3B5BDB', fontSize: 16 }}>›</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    height: 130,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  thumbBox: { position: 'relative' },
  thumb: { width: 110, height: 130 },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  thumbInitial: {
    fontSize: 36,
    fontFamily: 'Poppins_700Bold',
    color: 'rgba(255,255,255,0.9)',
  },
  sponsoredBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sponsoredText: { fontSize: 11 },
  info: { flex: 1, padding: 12, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  name: { fontFamily: 'Poppins_700Bold', fontSize: 15, flex: 1 },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    color: '#16A34A',
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  categoryChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  categoryText: { fontFamily: 'Poppins_600SemiBold', fontSize: 11 },
  city: { fontFamily: 'Poppins_400Regular', fontSize: 11 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 8 },
  star: { color: '#F59E0B', fontSize: 13 },
  ratingNum: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: '#F59E0B' },
  reviewCount: { fontFamily: 'Poppins_400Regular', fontSize: 11 },
  divider: { height: 1, marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceLabel: { fontFamily: 'Poppins_400Regular', fontSize: 11 },
  price: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: '#3B5BDB', flex: 1 },
  arrow: { width: 20, alignItems: 'center' },
})
