import { useState, useEffect, useCallback } from 'react'
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, StatusBar, FlatList } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RootStackParamList } from '../../navigation'
import VendorCard from '../../components/VendorCard'
import AdPopup from '../../components/AdPopup'
import DarkLightToggle from '../../components/DarkLightToggle'
import { useThemeStore } from '../../store/themeStore'
import api from '../../services/api'

type Nav = NativeStackNavigationProp<RootStackParamList>

const CATEGORIES = [
  { key: 'Semua', label: 'Semua', icon: '🏠' },
  { key: 'EO', label: 'Event\nOrganizer', icon: '🎪' },
  { key: 'Fotografer', label: 'Foto /\nVideo', icon: '📷' },
  { key: 'Wedding', label: 'Wedding', icon: '💒' },
  { key: 'Katering', label: 'Food &\nBeverages', icon: '🍽️' },
  { key: 'Dekorasi', label: 'Decoration', icon: '🎀' },
  { key: 'Sewa Mobil', label: 'Sewa\nMobil', icon: '🚗' },
  { key: 'Musik', label: 'Music', icon: '🎵' },
]

export default function HomeScreen() {
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const { isDark } = useThemeStore()
  const [vendors, setVendors] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Semua')
  const [refreshing, setRefreshing] = useState(false)

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

  const bg = isDark ? '#0D0D1A' : '#F9FAFB'
  const cardBg = isDark ? '#1A1A2E' : '#fff'
  const textPrimary = isDark ? '#fff' : '#1F2937'
  const textSub = isDark ? '#9CA3AF' : '#6B7280'

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" backgroundColor="#3B5BDB" />
      <AdPopup />

      {/* Blue header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Temukan Jasa Terbaik{'\n'}untuk Acara Anda</Text>
          </View>
          <DarkLightToggle />
        </View>

        {/* Search inputs */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari jasa EO, Sewa Mobil..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>

        {/* Category circles */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={styles.catItem}
              onPress={() => setCategory(c.key)}
            >
              <View style={[styles.catCircle, category === c.key && styles.catCircleActive]}>
                <Text style={styles.catIcon}>{c.icon}</Text>
              </View>
              <Text style={styles.catLabel}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Vendor list */}
      <FlatList
        data={vendors}
        keyExtractor={(v) => v.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B5BDB" />}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={[styles.listTitle, { color: textPrimary }]}>Rekomendasi Vendor</Text>
            <Text style={[styles.listSub, { color: textSub }]}>{vendors.length} vendor ditemukan</Text>
          </View>
        }
        renderItem={({ item }) => (
          <VendorCard
            vendor={item}
            dark={isDark}
            onPress={() => navigation.navigate('VendorDetail', { vendorId: item.id })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: textSub }]}>Tidak ada vendor ditemukan</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { backgroundColor: '#3B5BDB', paddingHorizontal: 20, paddingBottom: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: '#fff', lineHeight: 32 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 16,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { fontFamily: 'Poppins_400Regular', flex: 1, fontSize: 14, color: '#1F2937' },
  catRow: { gap: 16, paddingBottom: 4 },
  catItem: { alignItems: 'center', width: 64 },
  catCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  catCircleActive: { backgroundColor: '#fff' },
  catIcon: { fontSize: 22 },
  catLabel: { fontFamily: 'Poppins_500Medium', fontSize: 10, color: '#fff', textAlign: 'center', lineHeight: 14 },
  list: { padding: 16, paddingBottom: 24 },
  listHeader: { marginBottom: 12 },
  listTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16 },
  listSub: { fontFamily: 'Poppins_400Regular', fontSize: 13, marginTop: 2 },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { fontFamily: 'Poppins_400Regular', fontSize: 15 },
})
