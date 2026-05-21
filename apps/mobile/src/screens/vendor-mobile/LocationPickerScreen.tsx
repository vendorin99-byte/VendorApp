import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
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

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status === 'granted') {
        Location.getCurrentPositionAsync({}).then(pos => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        })
      }
    })
  }, [])

  async function saveLocation() {
    if (!picked) return Alert.alert('Pilih Lokasi', 'Tap peta untuk menentukan lokasi usaha Anda')
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
        onLocationPicked={(lat, lng) => setPicked({ lat, lng })}
        style={{ flex: 1 }}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {!picked && (
          <Text style={styles.hint}>Tap titik mana saja di peta untuk menentukan lokasi usaha Anda</Text>
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
  coordBanner: { backgroundColor: '#1A2A4A', paddingHorizontal: 16, paddingVertical: 8 },
  coordText: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#60A5FA' },
  footer: { backgroundColor: '#1A1A2E', padding: 16, gap: 10, borderTopWidth: 1, borderColor: '#2A2A4A' },
  hint: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  saveBtn: { backgroundColor: '#3B5BDB', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  saveBtnDisabled: { backgroundColor: '#2A2A4A' },
  saveBtnText: { fontFamily: 'Poppins_700Bold', color: '#fff', fontSize: 15 },
})
