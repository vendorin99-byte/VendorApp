import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Modal, StyleSheet, Dimensions } from 'react-native'
import api from '../services/api'

export default function AdPopup() {
  const [ad, setAd] = useState<any>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    api.get('/vendors?sort=sponsored&limit=1').then((r) => {
      if (r.data.data?.[0]) {
        setAd(r.data.data[0])
        setVisible(true)
      }
    }).catch(() => {})
  }, [])

  if (!ad) return null

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.sheetLabel}>IKLAN POP UP</Text>

          <View style={styles.adCard}>
            <Text style={styles.adTitle}>IKLAN VENDOR</Text>
            <Text style={styles.adSub}>{ad.subscription === 'premium' ? '100rb per 2 day' : 'Iklan berbayar'}</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.contentTitle}>Promo Spesial dari {ad.business_name}!</Text>
            <Text style={styles.contentDesc} numberOfLines={3}>{ad.description || 'Temukan penawaran terbaik dari vendor terpercaya kami.'}</Text>

            <TouchableOpacity style={styles.btn} onPress={() => setVisible(false)}>
              <Text style={styles.btnText}>Lihat Penawaran</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipBtn} onPress={() => setVisible(false)}>
              <Text style={styles.skipText}>Lewati</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const { width } = Dimensions.get('window')

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  sheet: { width: width - 48, backgroundColor: '#1A1A2E', borderRadius: 20, overflow: 'hidden' },
  sheetLabel: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: '#fff', textAlign: 'center', paddingVertical: 14, letterSpacing: 1 },
  adCard: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, paddingVertical: 24, alignItems: 'center', marginBottom: 16 },
  adTitle: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: '#3B5BDB', letterSpacing: 2 },
  adSub: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#3B5BDB', marginTop: 4 },
  content: { padding: 16, paddingTop: 0, gap: 12 },
  contentTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#fff', textAlign: 'center' },
  contentDesc: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
  btn: { backgroundColor: '#3B5BDB', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText: { fontFamily: 'Poppins_700Bold', color: '#fff', fontSize: 15 },
  skipBtn: { alignItems: 'center', paddingBottom: 8 },
  skipText: { fontFamily: 'Poppins_400Regular', color: '#6B7280', fontSize: 13 },
})
