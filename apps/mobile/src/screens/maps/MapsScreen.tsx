import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import * as Location from 'expo-location'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation'
import LeafletMap from '../../components/LeafletMap'
import api from '../../services/api'

type Nav = NativeStackNavigationProp<RootStackParamList>

const RADII = ['1km', '5km', '10km', '25km']
const CATEGORIES = ['Semua', 'EO', 'Fotografer', 'Katering', 'Sewa Mobil', 'Venue']

const LEGEND = [
  { color: '#6B7280', label: 'Event Organizer' },
  { color: '#3B5BDB', label: 'Fotografer' },
  { color: '#F59E0B', label: 'Katering' },
  { color: '#EF4444', label: 'Sewa Mobil' },
  { color: '#84CC16', label: 'Venue' },
]

export default function MapsScreen() {
  const navigation = useNavigation<Nav>()
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
      <View style={styles.filters}>
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
          onVendorPress={(id) => navigation.navigate('VendorDetail', { vendorId: id })}
          style={{ flex: 1 }}
        />
      )}

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Keterangan Warna Jasa</Text>
        {LEGEND.map((l) => (
          <View key={l.label} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: l.color }]} />
            <Text style={styles.legendLabel}>{l.label}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  filters: { backgroundColor: '#fff', paddingTop: 50, borderBottomWidth: 1, borderColor: '#E5E7EB' },
  filterRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#3B5BDB', borderColor: '#3B5BDB' },
  chipText: { fontSize: 12, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  divider: { width: 1, backgroundColor: '#E5E7EB', marginHorizontal: 4 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#6B7280' },
  legend: { position: 'absolute', bottom: 20, left: 16, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 10, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  legendTitle: { fontSize: 11, fontWeight: '600', color: '#374151', marginBottom: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 11, color: '#4B5563' },
})
