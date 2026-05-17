import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Share, ScrollView, ActivityIndicator, StatusBar } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import api from '../../services/api'
import { formatRp } from '../../utils/currency'
import { formatDate } from '../../utils/date'

export default function AffiliateScreen() {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/customer/profile/affiliate').then(({ data }) => {
      setData(data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function handleShare() {
    if (!data?.referral_link) return
    await Share.share({
      message: `Temukan vendor acara terbaik di VendorApp! Daftar sekarang pakai link saya dan dapatkan kemudahan booking vendor:\n${data.referral_link}`,
      url: data.referral_link,
    })
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B5BDB" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#3B5BDB" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTextWhite}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Program Affiliate</Text>
        <Text style={styles.headerSub}>Ajak teman, dapatkan komisi 2% setiap booking!</Text>
      </View>

      {/* Saldo */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Saldo Affiliate Anda</Text>
        <Text style={styles.balanceAmount}>{formatRp(data?.balance || 0)}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{data?.total_referrals || 0}</Text>
            <Text style={styles.statLabel}>Teman Diajak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{data?.transactions?.length || 0}</Text>
            <Text style={styles.statLabel}>Komisi Diterima</Text>
          </View>
        </View>
      </View>

      {/* Cara kerja */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cara Kerja Affiliate</Text>
        {[
          { step: '1', text: 'Bagikan link referral Anda ke teman' },
          { step: '2', text: 'Teman mendaftar menggunakan link Anda' },
          { step: '3', text: 'Teman melakukan booking & pembayaran' },
          { step: '4', text: 'Anda otomatis dapat komisi 2% dari nilai booking!' },
        ].map((item) => (
          <View key={item.step} style={styles.step}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>{item.step}</Text></View>
            <Text style={styles.stepText}>{item.text}</Text>
          </View>
        ))}
      </View>

      {/* Link referral */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Link Referral Anda</Text>
        <View style={styles.linkBox}>
          <Text style={styles.linkCode}>Kode: {data?.referral_code}</Text>
          <Text style={styles.linkUrl} numberOfLines={1}>{data?.referral_link}</Text>
        </View>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareBtnText}>🔗  Bagikan Link Sekarang</Text>
        </TouchableOpacity>
      </View>

      {/* Riwayat komisi */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Riwayat Komisi</Text>
        {data?.transactions?.length === 0 && (
          <Text style={styles.emptyText}>Belum ada komisi. Ajak teman untuk mulai!</Text>
        )}
        {data?.transactions?.map((txn: any) => (
          <View key={txn.id} style={styles.txnItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.txnDesc}>{txn.description}</Text>
              <Text style={styles.txnDate}>{formatDate(txn.created_at)}</Text>
            </View>
            <Text style={styles.txnAmount}>+{formatRp(txn.amount)}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: '#3B5BDB', paddingHorizontal: 16, paddingBottom: 24 },
  backBtn: { marginBottom: 12 },
  backTextWhite: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  balanceCard: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, alignItems: 'center' },
  balanceLabel: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  balanceAmount: { fontSize: 32, fontWeight: 'bold', color: '#1F2937' },
  statsRow: { flexDirection: 'row', marginTop: 16, width: '100%' },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#E5E7EB' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#3B5BDB' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  section: { backgroundColor: '#fff', margin: 16, marginTop: 0, borderRadius: 14, padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: '#3B5BDB', fontWeight: 'bold', fontSize: 13 },
  stepText: { flex: 1, fontSize: 14, color: '#374151', paddingTop: 4 },
  linkBox: { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 14, marginBottom: 10 },
  linkCode: { fontSize: 16, fontWeight: 'bold', color: '#3B5BDB', marginBottom: 4 },
  linkUrl: { fontSize: 12, color: '#6B7280' },
  shareBtn: { backgroundColor: '#3B5BDB', borderRadius: 12, padding: 14, alignItems: 'center' },
  shareBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  emptyText: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  txnItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderColor: '#F3F4F6' },
  txnDesc: { fontSize: 13, color: '#374151' },
  txnDate: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  txnAmount: { fontSize: 14, fontWeight: 'bold', color: '#10B981' },
})
