import { useEffect, useState } from 'react'
import { View, Text, Image, TouchableOpacity, Modal, StyleSheet, Dimensions } from 'react-native'
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
        <View style={styles.popup}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setVisible(false)}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.adBadge}><Text style={styles.adBadgeText}>IKLAN VENDOR</Text></View>
          <Text style={styles.adSub}>{ad.subscription === 'premium' ? '100rb per 2 day' : ''}</Text>

          <Text style={styles.title}>Promo Spesial dari {ad.business_name}!</Text>
          <Text style={styles.desc} numberOfLines={3}>{ad.description}</Text>

          <TouchableOpacity style={styles.btn} onPress={() => setVisible(false)}>
            <Text style={styles.btnText}>Lihat Penawaran</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const { width } = Dimensions.get('window')

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  popup: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: width - 48, alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 12, right: 12, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 16, color: '#6B7280' },
  adBadge: { backgroundColor: '#3B5BDB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 4 },
  adBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  adSub: { fontSize: 12, color: '#6B7280', marginBottom: 16 },
  title: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  desc: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 20 },
  btn: { backgroundColor: '#3B5BDB', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 32 },
  btnText: { color: '#fff', fontWeight: 'bold' },
})
