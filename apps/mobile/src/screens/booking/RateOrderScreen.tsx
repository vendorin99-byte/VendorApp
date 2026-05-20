import { useState } from 'react'
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, ScrollView, StatusBar } from 'react-native'
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RootStackParamList } from '../../navigation'
import { useTheme } from '../../hooks/useTheme'
import api from '../../services/api'

type Route = RouteProp<RootStackParamList, 'RateOrder'>

export default function RateOrderScreen() {
  const route = useRoute<Route>()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { bookingId, vendorName } = route.params
  const { bg, card, cardBorder, text, subtext, statusBar, statusBarBg } = useTheme()
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

  const ratingLabel = ['', 'Sangat Buruk 😞', 'Kurang Memuaskan 😕', 'Cukup 🙂', 'Bagus 😊', 'Luar Biasa! 🤩']

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={statusBar} backgroundColor={statusBarBg} />
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: cardBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: '#3B5BDB', fontSize: 14, fontFamily: 'Poppins_500Medium' }}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: text }]}>Tulis Ulasan</Text>
      </View>

      <View style={styles.body}>
        <View style={[styles.vendorCard, { backgroundColor: card, borderColor: cardBorder }]}>
          <Text style={[styles.vendorName, { color: text }]}>{vendorName}</Text>
          <Text style={[styles.prompt, { color: subtext }]}>Bagaimana pengalaman Anda?</Text>
        </View>

        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((s) => (
            <TouchableOpacity key={s} onPress={() => setRating(s)}>
              <Text style={[styles.star, s <= rating && styles.starActive]}>★</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.ratingLabel, { color: subtext }]}>
          {rating === 0 ? 'Ketuk bintang untuk memberi nilai' : ratingLabel[rating]}
        </Text>

        <Text style={[styles.label, { color: subtext }]}>Komentar (opsional)</Text>
        <TextInput
          style={[styles.textarea, { backgroundColor: card, borderColor: cardBorder, color: text }]}
          placeholder="Ceritakan pengalaman Anda dengan vendor ini..."
          placeholderTextColor={subtext}
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          maxLength={500}
        />
        <Text style={[styles.charCount, { color: subtext }]}>{comment.length}/500</Text>

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
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1 },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 20, marginTop: 8 },
  body: { padding: 24 },
  vendorCard: { borderRadius: 14, padding: 16, marginBottom: 24, alignItems: 'center', borderWidth: 1 },
  vendorName: { fontFamily: 'Poppins_700Bold', fontSize: 18, textAlign: 'center' },
  prompt: { fontFamily: 'Poppins_400Regular', fontSize: 13, textAlign: 'center', marginTop: 4 },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  star: { fontSize: 44, color: '#2A2A4A' },
  starActive: { color: '#F59E0B' },
  ratingLabel: { fontFamily: 'Poppins_400Regular', fontSize: 14, textAlign: 'center', marginBottom: 24, height: 22 },
  label: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, marginBottom: 8 },
  textarea: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, minHeight: 120 },
  charCount: { fontFamily: 'Poppins_400Regular', fontSize: 12, textAlign: 'right', marginTop: 4, marginBottom: 24 },
  btn: { backgroundColor: '#3B5BDB', borderRadius: 12, padding: 15, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontFamily: 'Poppins_700Bold', color: '#fff', fontSize: 16 },
})
