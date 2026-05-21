import { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
  TextInput, FlatList, Keyboard,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import * as Location from 'expo-location'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import LeafletMap from '../../components/LeafletMap'
import api from '../../services/api'

export default function LocationPickerScreen() {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null)
  const [saving, setSaving] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status === 'granted') {
        Location.getCurrentPositionAsync({}).then(pos => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        })
      }
    })
  }, [])

  function onSearchChange(text: string) {
    setSearchQuery(text)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!text.trim()) { setSuggestions([]); return }
    searchTimer.current = setTimeout(() => searchAddress(text), 600)
  }

  async function searchAddress(query: string) {
    setSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=id&accept-language=id`
      )
      const data = await res.json()
      setSuggestions(data || [])
    } catch {}
    setSearching(false)
  }

  function selectSuggestion(item: any) {
    const lat = parseFloat(item.lat)
    const lng = parseFloat(item.lon)
    setSuggestions([])
    setSearchQuery(item.display_name.split(',').slice(0, 2).join(', '))
    Keyboard.dismiss()
    setFlyTo({ lat, lng })
    setPicked({ lat, lng })
  }

  async function saveLocation() {
    if (!picked) return Alert.alert('Pilih Lokasi', 'Tap peta atau cari alamat untuk menentukan lokasi usaha Anda')
    setSaving(true)
    try {
      await api.patch('/vendor/profile', { lat: picked.lat, lng: picked.lng })
      Alert.alert('✅ Lokasi Disimpan', 'Lokasi usaha Anda sudah diperbarui di peta.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ])
    } catch (e: any) {
      Alert.alert('Gagal', e.response?.data?.error || 'Coba lagi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Batal</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Atur Lokasi Usaha</Text>
        <View style={{ width: 70 }} />
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari alamat, nama jalan, gedung..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={onSearchChange}
            returnKeyType="search"
            onSubmitEditing={() => searchQuery.trim() && searchAddress(searchQuery)}
          />
          {searching && <ActivityIndicator size="small" color="#3B5BDB" />}
        </View>

        {suggestions.length > 0 && (
          <FlatList
            style={styles.suggestions}
            data={suggestions}
            keyExtractor={(_, i) => String(i)}
            keyboardShouldPersistTaps="always"
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.suggestionItem} onPress={() => selectSuggestion(item)}>
                <Text style={styles.suggestionText} numberOfLines={2}>
                  📍 {item.display_name}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {picked && (
        <View style={styles.coordBanner}>
          <Text style={styles.coordText}>
            📍 {picked.lat.toFixed(5)}, {picked.lng.toFixed(5)}
          </Text>
        </View>
      )}

      <LeafletMap
        vendors={[]}
        mode="pick-location"
        userLat={userLocation?.lat || -6.2}
        userLng={userLocation?.lng || 106.8}
        flyTo={flyTo}
        onLocationPicked={(lat, lng) => setPicked({ lat, lng })}
        style={{ flex: 1 }}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {!picked && (
          <Text style={styles.hint}>Cari alamat di atas atau tap titik di peta</Text>
        )}
        <TouchableOpacity
          style={[styles.saveBtn, !picked && styles.saveBtnDisabled]}
          onPress={saveLocation}
          disabled={!picked || saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>💾 Simpan Lokasi Ini</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#1A1A2E',
    borderBottomWidth: 1, borderColor: '#2A2A4A',
  },
  backBtn: { width: 70 },
  backText: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#9CA3AF' },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: '#fff' },
  searchContainer: { backgroundColor: '#1A1A2E', zIndex: 10 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 12, marginVertical: 10,
    backgroundColor: '#0D0D1A', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: '#2A2A4A',
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1, color: '#fff', fontFamily: 'Poppins_400Regular',
    fontSize: 14, padding: 0,
  },
  suggestions: {
    maxHeight: 200, backgroundColor: '#1A1A2E',
    borderTopWidth: 1, borderColor: '#2A2A4A',
  },
  suggestionItem: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderColor: '#2A2A4A',
  },
  suggestionText: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#D1D5DB', lineHeight: 18 },
  coordBanner: { backgroundColor: '#1A2A4A', paddingHorizontal: 16, paddingVertical: 8 },
  coordText: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#60A5FA' },
  footer: { backgroundColor: '#1A1A2E', padding: 16, gap: 10, borderTopWidth: 1, borderColor: '#2A2A4A' },
  hint: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  saveBtn: { backgroundColor: '#3B5BDB', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnDisabled: { backgroundColor: '#2A2A4A' },
  saveBtnText: { fontFamily: 'Poppins_700Bold', color: '#fff', fontSize: 15 },
})
