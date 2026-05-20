import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar } from 'react-native'
import * as Location from 'expo-location'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RootStackParamList } from '../../navigation'
import { useTheme } from '../../hooks/useTheme'
import LeafletMap from '../../components/LeafletMap'
import api from '../../services/api'

type Nav = NativeStackNavigationProp<RootStackParamList>

const RADII = ['1km', '5km', '10km', '25km']
const CATEGORIES = ['Semua', 'EO', 'Fotografer', 'Katering', 'Sewa Mobil', 'Venue']

export default function MapsScreen() {
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const { isDark, bg, card, cardBorder, text, subtext, statusBar, statusBarBg } = useTheme()
  const [vendors, setVendors] = useState<any[]>([])
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [radius, setRadius] = useState('10km')
  const [category, setCategory] = useState('Semua')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({})
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      }
    }
    init()
  }, [])

  useEffect(() => {
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
    fetchVendors()
  }, [location, radius, category])

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={statusBar} backgroundColor={statusBarBg} />
      <View style={[styles.filters, { paddingTop: insets.top + 4, backgroundColor: isDark ? '#1A1A2E' : '#fff', borderBottomColor: cardBorder }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {RADII.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.chip, { backgroundColor: isDark ? '#2A2A4A' : '#F3F4F6', borderColor: cardBorder }, radius === r && styles.chipActive]}
              onPress={() => setRadius(r)}
            >
              <Text style={[styles.chipText, { color: radius === r ? '#fff' : text }]}>{r}</Text>
            </TouchableOpacity>
          ))}
          <View style={[styles.divider, { backgroundColor: cardBorder }]} />
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, { backgroundColor: isDark ? '#2A2A4A' : '#F3F4F6', borderColor: cardBorder }, category === c && styles.chipActive]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.chipText, { color: category === c ? '#fff' : text }]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {!loading && (
        <View style={[styles.info, { backgroundColor: isDark ? '#1A2A4A' : '#EEF2FF' }]}>
          <Text style={styles.infoText}>📍 {vendors.length} vendor dalam radius {radius}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#3B5BDB" />
          <Text style={[styles.loadingText, { color: subtext }]}>Mencari vendor terdekat...</Text>
        </View>
      ) : (
        <LeafletMap
          vendors={vendors}
          userLat={location?.lat}
          userLng={location?.lng}
          radiusKm={parseInt(radius.replace('km', ''))}
          onVendorPress={(id) => navigation.navigate('VendorDetail', { vendorId: id })}
          style={{ flex: 1 }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filters: { borderBottomWidth: 1 },
  filterRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  chipActive: { backgroundColor: '#3B5BDB', borderColor: '#3B5BDB' },
  chipText: { fontFamily: 'Poppins_500Medium', fontSize: 12 },
  divider: { width: 1, marginHorizontal: 4 },
  info: { paddingHorizontal: 14, paddingVertical: 6 },
  infoText: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: '#3B5BDB' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontFamily: 'Poppins_400Regular' },
})
