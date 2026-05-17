import { useState, useEffect, useCallback } from 'react'
import { View, Text, TextInput, ScrollView, FlatList, TouchableOpacity, StyleSheet, RefreshControl, StatusBar } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RootStackParamList } from '../../navigation'
import VendorCard from '../../components/VendorCard'
import AdBanner from '../../components/AdBanner'
import AdPopup from '../../components/AdPopup'
import api from '../../services/api'

type Nav = NativeStackNavigationProp<RootStackParamList>

const CATEGORIES = ['Semua', 'EO', 'Fotografer', 'Wedding', 'Katering', 'Dekorasi', 'Sewa Mobil']

export default function HomeScreen() {
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const [vendors, setVendors] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Semua')
  const [refreshing, setRefreshing] = useState(false)
  const [adShown, setAdShown] = useState(false)

  async function fetchVendors() {
    try {
      const params: Record<string, string> = {}
      if (search) params.search = search
      if (category !== 'Semua') params.category = category
      const { data } = await api.get('/vendors', { params })
      setVendors(data.data || [])
    } catch {}
  }

  useEffect(() => { fetchVendors() }, [search, category])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchVendors()
    setRefreshing(false)
  }, [search, category])

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {!adShown && <AdPopup />}

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍  Cari jasa, vendor, dan lainnya"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, category === c && styles.chipActive]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <AdBanner />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rekomendasi Vendor</Text>
          <Text style={styles.sectionSub}>{vendors.length} vendor ditemukan</Text>
        </View>

        <View style={styles.list}>
          {vendors.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              onPress={() => navigation.navigate('VendorDetail', { vendorId: vendor.id })}
            />
          ))}
          {!vendors.length && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Tidak ada vendor ditemukan</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 10 },
  searchInput: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 12, fontSize: 15 },
  chips: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#3B5BDB', borderColor: '#3B5BDB' },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#1F2937' },
  sectionSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { color: '#9CA3AF', fontSize: 15 },
})
