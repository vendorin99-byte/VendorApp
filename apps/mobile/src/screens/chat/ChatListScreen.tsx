import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, RefreshControl, StatusBar, ScrollView } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RootStackParamList } from '../../navigation'
import { formatTime } from '../../utils/date'
import { useTheme } from '../../hooks/useTheme'
import api from '../../services/api'

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function ChatListScreen() {
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const { isDark, bg, card, cardBorder, text, subtext, statusBar, statusBarBg, headerBg, headerBorder, divider } = useTheme()
  const [rooms, setRooms] = useState<any[]>([])
  const [ads, setAds] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  async function fetchRooms() {
    const { data } = await api.get('/chat/rooms')
    setRooms(data || [])
  }

  useEffect(() => {
    fetchRooms()
    api.get('/ads/feed?limit=4').then(r => setAds(r.data || [])).catch(() => {})
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchRooms()
    setRefreshing(false)
  }, [])

  async function handleAdPress(ad: any) {
    api.post(`/ads/${ad.id}/click`).catch(() => {})
    const vendorId = ad.vendors?.id
    const vendorName = ad.vendors?.business_name || 'Vendor'
    try {
      const { data: room } = await api.post('/chat/rooms', { vendor_id: vendorId })
      navigation.navigate('ChatRoom', { roomId: room.id, vendorName, vendorId })
    } catch {
      navigation.navigate('VendorDetail', { vendorId })
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={statusBar} backgroundColor={statusBarBg} />
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
        <Text style={[styles.title, { color: text }]}>Pesan</Text>
      </View>

      <FlatList
        data={rooms}
        keyExtractor={(r) => r.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B5BDB" />}
        ListHeaderComponent={ads.length > 0 ? (
          <View style={[styles.adsSection, { borderBottomColor: divider }]}>
            <Text style={[styles.adsTitle, { color: subtext }]}>⚡ Vendor Disarankan</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.adsRow}>
              {ads.map((ad: any) => (
                <TouchableOpacity
                  key={ad.id}
                  style={[styles.adCard, { backgroundColor: card, borderColor: cardBorder }]}
                  onPress={() => handleAdPress(ad)}
                  activeOpacity={0.85}
                >
                  <View style={styles.adAvatar}>
                    {ad.vendors?.portfolios?.[0]?.image_url
                      ? <Image source={{ uri: ad.vendors.portfolios[0].image_url }} style={styles.adAvatarImg} />
                      : <Text style={styles.adAvatarText}>{(ad.vendors?.business_name || '?')[0]}</Text>
                    }
                  </View>
                  <Text style={[styles.adName, { color: text }]} numberOfLines={1}>{ad.vendors?.business_name}</Text>
                  <Text style={[styles.adCategory, { color: subtext }]} numberOfLines={1}>{ad.vendors?.category}</Text>
                  <View style={[styles.adBtn, { backgroundColor: isDark ? '#1E3A8A' : '#EEF2FF' }]}>
                    <Text style={styles.adBtnText}>💬 Chat</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}
        renderItem={({ item: room }) => {
          const other = room.vendors || room.users
          const lastMsg = room.messages?.[room.messages.length - 1]
          return (
            <TouchableOpacity
              style={[styles.item, { borderBottomColor: divider }]}
              onPress={() => navigation.navigate('ChatRoom', { roomId: room.id, vendorName: other?.business_name || other?.name, vendorId: room.vendor_id })}
            >
              <View style={styles.avatar}>
                {other?.avatar_url
                  ? <Image source={{ uri: other.avatar_url }} style={styles.avatarImg} />
                  : <Text style={styles.avatarText}>{(other?.business_name || other?.name || '?')[0]}</Text>
                }
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.row}>
                  <Text style={[styles.name, { color: text }]} numberOfLines={1}>{other?.business_name || other?.name}</Text>
                  {lastMsg && <Text style={[styles.time, { color: subtext }]}>{formatTime(lastMsg.created_at)}</Text>}
                </View>
                <Text style={[styles.preview, { color: subtext }]} numberOfLines={1}>{lastMsg?.content || 'Mulai percakapan'}</Text>
              </View>
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: subtext }]}>Belum ada percakapan</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 20 },
  adsSection: { paddingTop: 14, paddingBottom: 14, borderBottomWidth: 1 },
  adsTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 14, marginBottom: 10 },
  adsRow: { paddingHorizontal: 14, gap: 10 },
  adCard: { width: 110, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, gap: 4 },
  adAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#3B5BDB', alignItems: 'center', justifyContent: 'center', marginBottom: 4, overflow: 'hidden' },
  adAvatarImg: { width: 48, height: 48 },
  adAvatarText: { color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 20 },
  adName: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, textAlign: 'center' },
  adCategory: { fontFamily: 'Poppins_400Regular', fontSize: 10, textAlign: 'center' },
  adBtn: { marginTop: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  adBtnText: { fontFamily: 'Poppins_600SemiBold', fontSize: 11, color: '#3B5BDB' },
  item: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#3B5BDB', alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 48, height: 48, borderRadius: 24 },
  avatarText: { color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 18 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  name: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, flex: 1 },
  time: { fontFamily: 'Poppins_400Regular', fontSize: 12 },
  preview: { fontFamily: 'Poppins_400Regular', fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontFamily: 'Poppins_400Regular', fontSize: 15 },
})
