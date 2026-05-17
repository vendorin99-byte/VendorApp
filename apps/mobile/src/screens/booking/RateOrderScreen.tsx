import { useState } from 'react'
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, ScrollView, StatusBar } from 'react-native'
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RootStackParamList } from '../../navigation'
import api from '../../services/api'

type Route = RouteProp<RootStackParamList, 'RateOrder'>

export default function RateOrderScreen() {
  const route = useRoute<Route>()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { bookingId, vendorName } = route.params
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (rating === 0) return Alert.alert('Pilih rating', 'Berikan bintang 1–5 untuk vendor')
    setLoading(true)
    try {
      await api.post('/reviews', { booking_id: bookingId, rating, comment: comment || undefined })
      Alert.alert('Terima kasih!', 'Ulasan Anda telah disimpan', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ])
    } catch (e: any) {
      Alert.alert('Gagal', e.response?.data?.error || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Kembali</Text></TouchableOpacity>
        <Text style={styles.title}>Tulis Ulasan</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.vendorName}>{vendorName}</Text>
        <Text style={styles.prompt}>Bagaimana pengalaman Anda dengan vendor ini?</Text>

        {/* Bintang */}
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((s) => (
            <TouchableOpacity key={s} onPress={() => setRating(s)}>
              <Text style={[styles.star, s <= rating && styles.starActive]}>★</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingLabel}>
          {rating === 0 ? 'Ketuk bintang untuk memberi nilai' :
           rating === 1 ? 'Sangat Buruk 😞' :
           rating === 2 ? 'Kurang Memuaskan 😕' :
           rating === 3 ? 'Cukup 🙂' :
           rating === 4 ? 'Bagus 😊' : 'Luar Biasa! 🤩'}
        </Text>

        {/* Komentar */}
        <Text style={styles.label}>Komentar (opsional)</Text>
        <TextInput
          style={styles.textarea}
          placeholder="Ceritakan pengalaman Anda dengan vendor ini..."
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          maxLength={500}
        />
        <Text style={styles.charCount}>{comment.length}/500</Text>

        <TouchableOpacity
          style={[styles.btn, (rating === 0 || loading) && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={rating === 0 || loading}
        >
          <Text style={styles.btnText}>{loading ? 'Menyimpan...' : 'Kirim Ulasan'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderColor: '#E5E7EB' },
  back: { color: '#3B5BDB', fontSize: 14, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  body: { padding: 24 },
  vendorName: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', textAlign: 'center', marginBottom: 4 },
  prompt: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  star: { fontSize: 44, color: '#E5E7EB' },
  starActive: { color: '#F59E0B' },
  ratingLabel: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24, height: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  textarea: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 14, minHeight: 120 },
  charCount: { fontSize: 12, color: '#9CA3AF', textAlign: 'right', marginTop: 4, marginBottom: 24 },
  btn: { backgroundColor: '#3B5BDB', borderRadius: 12, padding: 15, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#93C5FD' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
})
