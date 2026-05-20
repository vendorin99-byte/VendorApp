import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, StatusBar } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RootStackParamList } from '../../navigation'
import { useTheme } from '../../hooks/useTheme'
import api from '../../services/api'

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function NotificationsScreen() {
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const { bg, card, cardBorder, text, subtext, divider, statusBar, statusBarBg, headerBg, headerBorder } = useTheme()
  const [notifs, setNotifs] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  async function fetchNotifs() {
    const r = await api.get('/notifications').catch(() => null)
    if (r) setNotifs(r.data)
  }

  useEffect(() => { fetchNotifs() }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchNotifs()
    setRefreshing(false)
  }, [])

  async function markAllRead() {
    await api.post('/notifications/read-all').catch(() => {})
    setNotifs(notifs.map(n => ({ ...n, is_read: true })))
  }

  async function handlePress(notif: any) {
    if (!notif.is_read) {
      api.patch(`/notifications/${notif.id}/read`).catch(() => {})
      setNotifs(ns => ns.map(n => n.id === notif.id ? { ...n, is_read: true } : n))
    }
    const bookingId = notif.data?.bookingId
    if (bookingId) navigation.navigate('OrderDetail', { bookingId })
  }

  const unreadCount = notifs.filter(n => !n.is_read).length

  function formatTime(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Baru saja'
    if (diffMins < 60) return `${diffMins} menit lalu`
    const diffHrs = Math.floor(diffMins / 60)
    if (diffHrs < 24) return `${diffHrs} jam lalu`
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={statusBar} backgroundColor={statusBarBg} />
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: text }]}>Notifikasi</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.readAllBtn}>Tandai semua dibaca</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifs}
        keyExtractor={(n) => n.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B5BDB" />}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.item, { backgroundColor: item.is_read ? bg : card, borderBottomColor: divider }]}
            onPress={() => handlePress(item)}
          >
            {!item.is_read && <View style={styles.unreadDot} />}
            <View style={styles.itemContent}>
              <Text style={[styles.itemTitle, { color: text }]}>{item.title}</Text>
              <Text style={[styles.itemBody, { color: subtext }]} numberOfLines={2}>{item.body}</Text>
              <Text style={[styles.itemTime, { color: subtext }]}>{formatTime(item.created_at)}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={[styles.emptyText, { color: subtext }]}>Belum ada notifikasi</Text>
            <Text style={[styles.emptySub, { color: subtext }]}>Notifikasi pesanan, pembayaran, dan aktivitas lainnya akan muncul di sini</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 8 },
  backBtn: { padding: 4 },
  backText: { fontSize: 28, fontFamily: 'Poppins_400Regular', lineHeight: 32 },
  headerTitle: { flex: 1, fontFamily: 'Poppins_700Bold', fontSize: 18 },
  readAllBtn: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: '#3B5BDB' },
  item: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B5BDB', marginTop: 6, marginRight: 10, flexShrink: 0 },
  itemContent: { flex: 1 },
  itemTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, marginBottom: 3 },
  itemBody: { fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 18, marginBottom: 6 },
  itemTime: { fontFamily: 'Poppins_400Regular', fontSize: 11 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, marginBottom: 8 },
  emptySub: { fontFamily: 'Poppins_400Regular', fontSize: 13, textAlign: 'center', lineHeight: 20 },
})
