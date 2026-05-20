import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { formatRp } from '../utils/currency'
import api from '../services/api'

interface Props {
  ad: any
  dark: boolean
  onPress: () => void
}

export default function AdCard({ ad, dark, onPress }: Props) {
  const vendor = ad.vendors
  const service = ad.services
  const imageUrl = vendor?.portfolios?.[0]?.image_url

  async function handlePress() {
    api.post(`/ads/${ad.id}/click`).catch(() => {})
    onPress()
  }

  const bg = dark ? '#1A1A2E' : '#fff'
  const border = dark ? '#2A2A4A' : '#E5E7EB'
  const textColor = dark ? '#fff' : '#1F2937'
  const subColor = dark ? '#9CA3AF' : '#6B7280'

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: bg, borderColor: border }]} onPress={handlePress} activeOpacity={0.85}>
      {/* Badge Disponsori */}
      <View style={styles.sponsoredBadge}>
        <Text style={styles.sponsoredText}>⚡ Disponsori</Text>
      </View>

      <View style={styles.row}>
        {imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: textColor }]} numberOfLines={2}>{ad.title}</Text>
          {ad.description && (
            <Text style={[styles.desc, { color: subColor }]} numberOfLines={2}>{ad.description}</Text>
          )}
          <TouchableOpacity onPress={handlePress}>
            <Text style={styles.vendorName}>🏢 {vendor?.business_name}</Text>
          </TouchableOpacity>
          {service && (
            <View style={styles.priceRow}>
              <Text style={styles.price}>{formatRp(service.price)}</Text>
              {service.dp_percent && (
                <Text style={[styles.dp, { color: subColor }]}>DP {service.dp_percent}%</Text>
              )}
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.ctaBtn} onPress={handlePress}>
        <Text style={styles.ctaText}>Lihat Penawaran →</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1.5, padding: 14, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
  sponsoredBadge: { backgroundColor: '#FEF3C7', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 10 },
  sponsoredText: { fontFamily: 'Poppins_600SemiBold', fontSize: 10, color: '#92400E' },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  image: { width: 80, height: 80, borderRadius: 10 },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 14, marginBottom: 4 },
  desc: { fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 17, marginBottom: 6 },
  vendorName: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: '#3B5BDB', marginBottom: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#3B5BDB' },
  dp: { fontFamily: 'Poppins_400Regular', fontSize: 11 },
  ctaBtn: { backgroundColor: '#F59E0B', borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  ctaText: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: '#fff' },
})
