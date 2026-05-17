import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar } from 'react-native'
import * as Location from 'expo-location'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RootStackParamList } from '../../navigation'
import LeafletMap from '../../components/LeafletMap'
import api from '../../services/api'

type Nav = NativeStackNavigationProp<RootStackParamList>

const RADII = ['1km', '5km', '10km', '25km']
const CATEGORIES = ['Semua', 'EO', 'Fotografer', 'Katering', 'Sewa Mobil', 'Venue']


export default function MapsScreen() {
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
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
    async function fetch() {
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
    fetch()
  }, [location, radius, category])

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={[styles.filters, { paddingTop: insets.top + 4 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {RADII.map((r) => (
            <TouchableOpacity key={r} style={[styles.chip, radius === r && styles.chipActive]} onPress={() => setRadius(r)}>
              <Text style={[styles.chipText, radius === r && styles.chipTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.divider} />
          {CATEGORIES.map((c) => (
            <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
              <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {!loading && (
        <View style={styles.info}>
          <Text style={styles.infoText}>📍 {vendors.length} vendor dalam radius {radius}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#3B5BDB" />
          <Text style={styles.loadingText}>Mencari vendor terdekat...</Text>
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
  container: { flex: 1, backgroundColor: '#fff' },
  filters: { backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#E5E7EB' },
  filterRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#3B5BDB', borderColor: '#3B5BDB' },
  chipText: { fontSize: 12, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  divider: { width: 1, backgroundColor: '#E5E7EB', marginHorizontal: 4 },
  info: { backgroundColor: '#EEF2FF', paddingHorizontal: 14, paddingVertical: 6 },
  infoText: { fontSize: 12, color: '#3B5BDB', fontWeight: '500' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#6B7280' },
})
