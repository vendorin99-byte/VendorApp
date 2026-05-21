import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, StatusBar, Alert, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import * as ImagePicker from 'expo-image-picker'
import api from '../../services/api'

export default function PortfolioScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<any>()
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function fetchPhotos() {
    setLoading(true)
    try {
      const { data } = await api.get('/vendor/portfolio')
      setPhotos(data || [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchPhotos() }, [])

  async function addPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: false,
    })
    if (result.canceled || !result.assets?.[0]) return
    const asset = result.assets[0]
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', { uri: asset.uri, name: 'photo.jpg', type: 'image/jpeg' } as any)
      await api.post('/vendor/portfolio', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      fetchPhotos()
    } catch (e: any) {
      Alert.alert('Gagal', e.response?.data?.error || 'Upload gagal')
    } finally { setUploading(false) }
  }

  async function deletePhoto(id: string) {
    Alert.alert('Hapus Foto', 'Yakin ingin menghapus foto ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/vendor/portfolio/${id}`)
          fetchPhotos()
        } catch {}
      }},
    ])
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1628" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🖼️ Portfolio</Text>
        <TouchableOpacity onPress={addPhoto} style={styles.addBtn} disabled={uploading}>
          {uploading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.addBtnText}>+ Tambah</Text>}
        </TouchableOpacity>
      </View>

      {loading
        ? <View style={styles.center}><ActivityIndicator color="#3B5BDB" size="large" /></View>
        : (
          <FlatList
            data={photos}
            keyExtractor={i => i.id}
            numColumns={2}
            contentContainerStyle={{ padding: 12, gap: 10 }}
            columnWrapperStyle={{ gap: 10 }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>🖼️</Text>
                <Text style={styles.emptyTitle}>Belum ada foto</Text>
                <Text style={styles.emptyText}>Tambahkan foto karya terbaik Anda untuk menarik lebih banyak customer</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={addPhoto}>
                  <Text style={styles.emptyBtnText}>+ Upload Foto Pertama</Text>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.photoCard} onLongPress={() => deletePhoto(item.id)}>
                <Image source={{ uri: item.image_url }} style={styles.photo} resizeMode="cover" />
                {item.caption && <Text style={styles.caption} numberOfLines={2}>{item.caption}</Text>}
              </TouchableOpacity>
            )}
          />
        )
      }
    </View>
  )
}

const C = { bg: '#0A1628', card: '#111827', border: '#1E3A5F', primary: '#3B5BDB', text: '#fff', muted: '#6B7DB3' }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 28, color: C.text, lineHeight: 32 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  addBtn: { backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: C.text, fontSize: 13, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 8 },
  emptyText: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emptyBtn: { backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: C.text, fontSize: 14, fontWeight: '700' },
  photoCard: { flex: 1, backgroundColor: C.card, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  photo: { width: '100%', aspectRatio: 1 },
  caption: { fontSize: 11, color: C.muted, padding: 8, lineHeight: 15 },
})
