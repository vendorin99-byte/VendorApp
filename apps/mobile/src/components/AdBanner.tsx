import { useEffect, useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import api from '../services/api'

interface Ad { id: string; business_name: string; description: string }

export default function AdBanner() {
  const [ads, setAds] = useState<Ad[]>([])

  useEffect(() => {
    api.get('/vendors?subscription=premium&limit=5').then((r) => setAds(r.data.data || [])).catch(() => {})
  }, [])

  if (!ads.length) return null

  return (
    <View style={styles.container}>
      <Text style={styles.label}>IKLAN HIGHLIGHT</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {ads.map((ad) => (
          <TouchableOpacity key={ad.id} style={styles.card} activeOpacity={0.9}>
            <View style={styles.badge}><Text style={styles.badgeText}>IKLAN VENDOR</Text></View>
            <Text style={styles.name} numberOfLines={1}>{ad.business_name}</Text>
            <Text style={styles.desc} numberOfLines={2}>{ad.description}</Text>
            <View style={styles.cta}><Text style={styles.ctaText}>Lihat Penawaran</Text></View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const { width } = Dimensions.get('window')
const CARD_W = width * 0.7

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  label: { fontSize: 12, fontWeight: '600', color: '#6B7280', paddingHorizontal: 16, marginBottom: 8 },
  scroll: { paddingHorizontal: 16, gap: 12 },
  card: { width: CARD_W, backgroundColor: '#EEF2FF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#C7D2FE' },
  badge: { backgroundColor: '#3B5BDB', alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 8 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  name: { fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  desc: { fontSize: 13, color: '#4B5563', marginBottom: 12 },
  cta: { backgroundColor: '#3B5BDB', borderRadius: 8, padding: 8, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '600', fontSize: 13 },
})
