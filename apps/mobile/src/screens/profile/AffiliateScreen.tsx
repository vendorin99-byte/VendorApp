import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Share, ScrollView, ActivityIndicator, StatusBar, TextInput, Modal, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import api from '../../services/api'
import { formatRp } from '../../utils/currency'
import { formatDate } from '../../utils/date'

const BANK_LIST = ['BCA', 'BNI', 'BRI', 'Mandiri', 'CIMB', 'Danamon', 'BSI', 'Permata', 'BTN', 'Jenius', 'GoPay', 'OVO', 'Dana']

export default function AffiliateScreen() {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Withdraw modal
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [useNewBank, setUseNewBank] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [showBankPicker, setShowBankPicker] = useState(false)
  const [withdrawForm, setWithdrawForm] = useState({ bank_code: '', account_number: '', account_name: '' })
  const [submitting, setSubmitting] = useState(false)

  // Add bank account modal
  const [showAddBank, setShowAddBank] = useState(false)
  const [showAddBankPicker, setShowAddBankPicker] = useState(false)
  const [addBankForm, setAddBankForm] = useState({ bank_code: '', account_number: '', account_name: '', is_primary: false })
  const [addingBank, setAddingBank] = useState(false)

  async function fetchData() {
    api.get('/customer/profile/affiliate').then(({ data }) => {
      setData(data)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  async function handleShare() {
    if (!data?.referral_code) return
    const link = `https://web-henna-five-13.vercel.app/i/${data.referral_code}`
    await Share.share({
      message: `Hei! Coba VendorApp — platform booking vendor jasa acara terpercaya 🎉\n\nDaftar pakai kode *${data.referral_code}*:\n${link}`,
      url: link,
    })
  }

  async function handleWithdraw() {
    const amount = parseInt(withdrawAmount)
    if (!amount || amount < 50000) return Alert.alert('Error', 'Minimal pencairan Rp 50.000')

    let payload: any = { amount }

    if (useNewBank || !selectedAccountId) {
      if (!withdrawForm.bank_code) return Alert.alert('Error', 'Pilih bank tujuan')
      if (!withdrawForm.account_number) return Alert.alert('Error', 'Masukkan nomor rekening')
      if (!withdrawForm.account_name) return Alert.alert('Error', 'Masukkan nama pemilik rekening')
      payload = { ...payload, bank_code: withdrawForm.bank_code, account_number: withdrawForm.account_number, account_name: withdrawForm.account_name }
    } else {
      payload.bank_account_id = selectedAccountId
    }

    setSubmitting(true)
    try {
      const { data: res } = await api.post('/customer/profile/affiliate/withdraw', payload)
      Alert.alert('Berhasil! 🎉', res.message || 'Pencairan berhasil diajukan', [
        { text: 'OK', onPress: () => { setShowWithdraw(false); setWithdrawAmount(''); fetchData() } }
      ])
    } catch (e: any) {
      Alert.alert('Gagal', e.response?.data?.error || 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAddBank() {
    if (!addBankForm.bank_code) return Alert.alert('Error', 'Pilih bank')
    if (!addBankForm.account_number) return Alert.alert('Error', 'Masukkan nomor rekening')
    if (!addBankForm.account_name) return Alert.alert('Error', 'Masukkan nama pemilik rekening')
    setAddingBank(true)
    try {
      await api.post('/customer/profile/bank-accounts', addBankForm)
      setShowAddBank(false)
      setAddBankForm({ bank_code: '', account_number: '', account_name: '', is_primary: false })
      fetchData()
    } catch (e: any) {
      Alert.alert('Gagal', e.response?.data?.error || 'Coba lagi')
    } finally {
      setAddingBank(false)
    }
  }

  async function handleDeleteBank(id: string) {
    Alert.alert('Hapus Rekening', 'Yakin ingin menghapus rekening ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
        await api.delete(`/customer/profile/bank-accounts/${id}`).catch(() => {})
        fetchData()
      }}
    ])
  }

  async function handleSetPrimary(id: string) {
    await api.patch(`/customer/profile/bank-accounts/${id}/set-primary`).catch(() => {})
    fetchData()
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#3B5BDB" /></View>
  }

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3B5BDB" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Kembali</Text>
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
            <Text style={styles.statValue}>{data?.transactions?.filter((t: any) => t.type !== 'withdraw').length || 0}</Text>
            <Text style={styles.statLabel}>Komisi Diterima</Text>
          </View>
        </View>
        {(data?.balance || 0) >= 50000 && (
          <TouchableOpacity style={styles.withdrawBtn} onPress={() => setShowWithdraw(true)}>
            <Text style={styles.withdrawBtnText}>💸  Cairkan Komisi</Text>
          </TouchableOpacity>
        )}
        {(data?.balance || 0) > 0 && (data?.balance || 0) < 50000 && (
          <Text style={styles.minNote}>Minimal pencairan Rp 50.000 (saldo: {formatRp(data?.balance || 0)})</Text>
        )}
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

      {/* Rekening Bank */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Rekening Pencairan</Text>
          <TouchableOpacity onPress={() => setShowAddBank(true)}>
            <Text style={styles.addBankBtn}>+ Tambah</Text>
          </TouchableOpacity>
        </View>

        {(!data?.bank_accounts || data.bank_accounts.length === 0) ? (
          <TouchableOpacity style={styles.emptyBankBox} onPress={() => setShowAddBank(true)}>
            <Text style={styles.emptyBankIcon}>🏦</Text>
            <Text style={styles.emptyBankText}>Tambahkan rekening bank untuk pencairan komisi</Text>
            <Text style={styles.emptyBankAdd}>+ Tambah Rekening</Text>
          </TouchableOpacity>
        ) : (
          data.bank_accounts.map((acc: any) => (
            <View key={acc.id} style={styles.bankCard}>
              <View style={styles.bankCardLeft}>
                <View style={styles.bankLogo}>
                  <Text style={styles.bankLogoText}>{acc.bank_code[0]}</Text>
                </View>
                <View>
                  <View style={styles.bankNameRow}>
                    <Text style={styles.bankCode}>{acc.bank_code}</Text>
                    {acc.is_primary && <View style={styles.primaryBadge}><Text style={styles.primaryBadgeText}>Utama</Text></View>}
                  </View>
                  <Text style={styles.bankNumber}>{acc.account_number}</Text>
                  <Text style={styles.bankHolder}>{acc.account_name}</Text>
                </View>
              </View>
              <View style={styles.bankActions}>
                {!acc.is_primary && (
                  <TouchableOpacity style={styles.bankActionBtn} onPress={() => handleSetPrimary(acc.id)}>
                    <Text style={styles.bankActionBtnText}>Set Utama</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => handleDeleteBank(acc.id)}>
                  <Text style={styles.bankDeleteBtn}>🗑</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Riwayat */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Riwayat Komisi</Text>
        {(!data?.transactions || data.transactions.length === 0) && (
          <Text style={styles.emptyText}>Belum ada riwayat. Ajak teman untuk mulai!</Text>
        )}
        {data?.transactions?.map((txn: any) => (
          <View key={txn.id} style={styles.txnItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.txnDesc}>{txn.description}</Text>
              <Text style={styles.txnDate}>{formatDate(txn.created_at)}</Text>
            </View>
            <Text style={[styles.txnAmount, txn.type === 'withdraw' && { color: '#EF4444' }]}>
              {txn.type === 'withdraw' ? '-' : '+'}{formatRp(txn.amount)}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ height: 32 }} />

      {/* Modal Cairkan Komisi */}
      <Modal visible={showWithdraw} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>💸 Cairkan Komisi</Text>
              <Text style={styles.modalSub}>Saldo: <Text style={{ color: '#3B5BDB', fontFamily: 'Poppins_700Bold' }}>{formatRp(data?.balance || 0)}</Text></Text>

              <Text style={styles.fieldLabel}>Jumlah Pencairan</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Min. Rp 50.000"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                value={withdrawAmount}
                onChangeText={(v) => setWithdrawAmount(v.replace(/\D/g, ''))}
              />

              <Text style={styles.fieldLabel}>Rekening Tujuan</Text>

              {/* Rekening tersimpan */}
              {(data?.bank_accounts || []).map((acc: any) => (
                <TouchableOpacity
                  key={acc.id}
                  style={[styles.savedAccountRow, selectedAccountId === acc.id && !useNewBank && styles.savedAccountRowActive]}
                  onPress={() => { setSelectedAccountId(acc.id); setUseNewBank(false) }}
                >
                  <View style={styles.savedAccountRadio}>
                    {selectedAccountId === acc.id && !useNewBank && <View style={styles.savedAccountRadioDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.savedAccountBank}>{acc.bank_code} {acc.is_primary ? '⭐' : ''}</Text>
                    <Text style={styles.savedAccountNum}>{acc.account_number} · {acc.account_name}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Opsi rekening baru */}
              <TouchableOpacity
                style={[styles.savedAccountRow, useNewBank && styles.savedAccountRowActive]}
                onPress={() => setUseNewBank(true)}
              >
                <View style={styles.savedAccountRadio}>
                  {useNewBank && <View style={styles.savedAccountRadioDot} />}
                </View>
                <Text style={styles.savedAccountBank}>+ Gunakan rekening lain</Text>
              </TouchableOpacity>

              {useNewBank && (
                <>
                  <TouchableOpacity style={styles.bankSelector} onPress={() => setShowBankPicker(true)}>
                    <Text style={[styles.bankSelectorText, !withdrawForm.bank_code && { color: '#9CA3AF' }]}>
                      {withdrawForm.bank_code || 'Pilih Bank'}
                    </Text>
                    <Text style={{ color: '#6B7280' }}>▾</Text>
                  </TouchableOpacity>
                  <TextInput style={styles.modalInput} placeholder="Nomor rekening" placeholderTextColor="#9CA3AF" keyboardType="number-pad" value={withdrawForm.account_number} onChangeText={(v) => setWithdrawForm({ ...withdrawForm, account_number: v })} />
                  <TextInput style={styles.modalInput} placeholder="Nama pemilik rekening" placeholderTextColor="#9CA3AF" autoCapitalize="words" value={withdrawForm.account_name} onChangeText={(v) => setWithdrawForm({ ...withdrawForm, account_name: v })} />
                </>
              )}

              <Text style={styles.withdrawNote}>Pencairan diproses 1–3 hari kerja</Text>
              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowWithdraw(false)}>
                  <Text style={styles.cancelBtnText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitBtn} onPress={handleWithdraw} disabled={submitting}>
                  <Text style={styles.submitBtnText}>{submitting ? 'Memproses...' : 'Ajukan'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal Tambah Rekening */}
      <Modal visible={showAddBank} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>🏦 Tambah Rekening</Text>

            <Text style={styles.fieldLabel}>Bank</Text>
            <TouchableOpacity style={styles.bankSelector} onPress={() => setShowAddBankPicker(true)}>
              <Text style={[styles.bankSelectorText, !addBankForm.bank_code && { color: '#9CA3AF' }]}>
                {addBankForm.bank_code || 'Pilih Bank'}
              </Text>
              <Text style={{ color: '#6B7280' }}>▾</Text>
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Nomor Rekening</Text>
            <TextInput style={styles.modalInput} placeholder="Masukkan nomor rekening" placeholderTextColor="#9CA3AF" keyboardType="number-pad" value={addBankForm.account_number} onChangeText={(v) => setAddBankForm({ ...addBankForm, account_number: v })} />

            <Text style={styles.fieldLabel}>Nama Pemilik Rekening</Text>
            <TextInput style={styles.modalInput} placeholder="Sesuai buku tabungan" placeholderTextColor="#9CA3AF" autoCapitalize="words" value={addBankForm.account_name} onChangeText={(v) => setAddBankForm({ ...addBankForm, account_name: v })} />

            <TouchableOpacity style={styles.primaryToggle} onPress={() => setAddBankForm({ ...addBankForm, is_primary: !addBankForm.is_primary })}>
              <View style={[styles.checkbox, addBankForm.is_primary && styles.checkboxChecked]}>
                {addBankForm.is_primary && <Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>}
              </View>
              <Text style={styles.primaryToggleText}>Jadikan rekening utama</Text>
            </TouchableOpacity>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowAddBank(false); setAddBankForm({ bank_code: '', account_number: '', account_name: '', is_primary: false }) }}>
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleAddBank} disabled={addingBank}>
                <Text style={styles.submitBtnText}>{addingBank ? 'Menyimpan...' : 'Simpan'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bank Picker (withdraw) */}
      <Modal visible={showBankPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: 400 }]}>
            <Text style={styles.modalTitle}>Pilih Bank</Text>
            <ScrollView>
              {BANK_LIST.map((b) => (
                <TouchableOpacity key={b} style={styles.bankOption} onPress={() => { setWithdrawForm({ ...withdrawForm, bank_code: b }); setShowBankPicker(false) }}>
                  <Text style={styles.bankOptionText}>{b}</Text>
                  {withdrawForm.bank_code === b && <Text style={{ color: '#3B5BDB' }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowBankPicker(false)}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bank Picker (add bank) */}
      <Modal visible={showAddBankPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: 400 }]}>
            <Text style={styles.modalTitle}>Pilih Bank</Text>
            <ScrollView>
              {BANK_LIST.map((b) => (
                <TouchableOpacity key={b} style={styles.bankOption} onPress={() => { setAddBankForm({ ...addBankForm, bank_code: b }); setShowAddBankPicker(false) }}>
                  <Text style={styles.bankOptionText}>{b}</Text>
                  {addBankForm.bank_code === b && <Text style={{ color: '#3B5BDB' }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddBankPicker(false)}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: '#3B5BDB', paddingHorizontal: 16, paddingBottom: 24 },
  backText: { color: 'rgba(255,255,255,0.8)', fontFamily: 'Poppins_500Medium', fontSize: 14, marginBottom: 12 },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: '#fff' },
  headerSub: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  balanceCard: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, alignItems: 'center' },
  balanceLabel: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#6B7280', marginBottom: 4 },
  balanceAmount: { fontFamily: 'Poppins_700Bold', fontSize: 32, color: '#1F2937' },
  statsRow: { flexDirection: 'row', marginTop: 16, width: '100%' },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#E5E7EB' },
  statValue: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: '#3B5BDB' },
  statLabel: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#6B7280', marginTop: 2 },
  withdrawBtn: { marginTop: 16, backgroundColor: '#3B5BDB', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 24 },
  withdrawBtnText: { fontFamily: 'Poppins_700Bold', color: '#fff', fontSize: 14 },
  minNote: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#9CA3AF', marginTop: 10, textAlign: 'center' },
  section: { backgroundColor: '#fff', margin: 16, marginTop: 0, borderRadius: 14, padding: 16 },
  sectionTitle: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: '#1F2937', marginBottom: 12 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontFamily: 'Poppins_700Bold', color: '#3B5BDB', fontSize: 13 },
  stepText: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#374151', paddingTop: 4 },
  linkBox: { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 14, marginBottom: 10 },
  linkCode: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#3B5BDB', marginBottom: 4 },
  linkUrl: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#6B7280' },
  shareBtn: { backgroundColor: '#3B5BDB', borderRadius: 12, padding: 14, alignItems: 'center' },
  shareBtnText: { fontFamily: 'Poppins_700Bold', color: '#fff', fontSize: 15 },
  emptyText: { fontFamily: 'Poppins_400Regular', color: '#9CA3AF', fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  txnItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderColor: '#F3F4F6' },
  txnDesc: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#374151' },
  txnDate: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  txnAmount: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#10B981' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#1F2937', marginBottom: 4 },
  modalSub: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#6B7280', marginBottom: 16 },
  fieldLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: '#374151', marginBottom: 6, marginTop: 12 },
  modalInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 13, fontFamily: 'Poppins_400Regular', fontSize: 15, color: '#1F2937' },
  bankSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 13 },
  bankSelectorText: { fontFamily: 'Poppins_400Regular', fontSize: 15, color: '#1F2937' },
  withdrawNote: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 12 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 12 },
  cancelBtnText: { fontFamily: 'Poppins_600SemiBold', color: '#6B7280', fontSize: 14 },
  submitBtn: { flex: 2, backgroundColor: '#3B5BDB', borderRadius: 10, padding: 13, alignItems: 'center' },
  submitBtnText: { fontFamily: 'Poppins_700Bold', color: '#fff', fontSize: 14 },
  bankOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  bankOptionText: { fontFamily: 'Poppins_500Medium', fontSize: 15, color: '#1F2937' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addBankBtn: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: '#3B5BDB' },
  emptyBankBox: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 20, alignItems: 'center', borderStyle: 'dashed', gap: 6 },
  emptyBankIcon: { fontSize: 28 },
  emptyBankText: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#6B7280', textAlign: 'center' },
  emptyBankAdd: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: '#3B5BDB', marginTop: 4 },
  bankCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  bankCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  bankLogo: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#3B5BDB', alignItems: 'center', justifyContent: 'center' },
  bankLogoText: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#fff' },
  bankNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  bankCode: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#1F2937' },
  primaryBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  primaryBadgeText: { fontFamily: 'Poppins_600SemiBold', fontSize: 10, color: '#3B5BDB' },
  bankNumber: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#374151' },
  bankHolder: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#9CA3AF' },
  bankActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bankActionBtn: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  bankActionBtnText: { fontFamily: 'Poppins_600SemiBold', fontSize: 11, color: '#3B5BDB' },
  bankDeleteBtn: { fontSize: 16, padding: 4 },
  savedAccountRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 8 },
  savedAccountRowActive: { borderColor: '#3B5BDB', backgroundColor: '#EEF2FF' },
  savedAccountRadio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#9CA3AF', alignItems: 'center', justifyContent: 'center' },
  savedAccountRadioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B5BDB' },
  savedAccountBank: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: '#1F2937' },
  savedAccountNum: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#6B7280' },
  primaryToggle: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#9CA3AF', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#3B5BDB', borderColor: '#3B5BDB' },
  primaryToggleText: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#374151' },
})
