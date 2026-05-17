import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>

const slides = [
  { title: 'Selamat Datang di VendorApp', desc: 'Platform terpercaya untuk menemukan vendor acara terbaik di Indonesia', emoji: '🎉' },
  { title: 'Perbandingan Harga Mudah', desc: 'Bandingkan harga dan paket dari ratusan vendor dalam satu aplikasi', emoji: '💡' },
  { title: 'Vendor Terlengkap', desc: 'EO, fotografer, katering, dekorasi, sewa mobil, dan masih banyak lagi', emoji: '🌟' },
]

export default function OnboardingScreen() {
  const navigation = useNavigation<Nav>()
  const [current, setCurrent] = useState(0)

  function next() {
    if (current < slides.length - 1) setCurrent(current + 1)
    else navigation.replace('Login')
  }

  const slide = slides[current]

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>{slide.emoji}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.desc}>{slide.desc}</Text>
      </View>

      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
        ))}
      </View>

      <TouchableOpacity style={styles.btn} onPress={next}>
        <Text style={styles.btnText}>{current < slides.length - 1 ? 'Lanjut' : 'Mulai'}</Text>
      </TouchableOpacity>

      {current < slides.length - 1 && (
        <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.skip}>
          <Text style={styles.skipText}>Lewati</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 32 },
  content: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  emoji: { fontSize: 80, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#1F2937', marginBottom: 12 },
  desc: { fontSize: 16, textAlign: 'center', color: '#6B7280', lineHeight: 24 },
  dots: { flexDirection: 'row', gap: 8, marginBottom: 32 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB' },
  dotActive: { backgroundColor: '#3B5BDB', width: 24 },
  btn: { backgroundColor: '#3B5BDB', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 48, width: '100%', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  skip: { marginTop: 16, padding: 8 },
  skipText: { color: '#9CA3AF', fontSize: 14 },
})
