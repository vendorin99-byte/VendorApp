import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, StatusBar } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import api from '../../services/api'

export default function ChatListScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<any>()
  const [rooms, setRooms] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  async function fetchRooms() {
    try {
      const { data } = await api.get('/chat/rooms')
      setRooms(data || [])
    } catch {}
  }

  useEffect(() => { fetchRooms() }, [])
  const onRefresh = useCallback(async () => { setRefreshing(true); await fetchRooms(); setRefreshing(false) }, [])

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1628" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💬 Pesan</Text>
      </View>

      <FlatList
        data={rooms}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B5BDB" />}
        contentContainerStyle={{ flexGrow: 1, padding: 12, gap: 8 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 36, marginBottom: 12 }}>💬</Text>
            <Text style={styles.emptyTitle}>Belum ada pesan</Text>
            <Text style={styles.emptyText}>Pesan dari customer akan muncul di sini</Text>
          </View>
        }
        renderItem={({ item: r }) => (
          <TouchableOpacity style={styles.card}
            onPress={() => navigation.navigate('ChatDetail', { roomId: r.id, customerName: r.other_user?.name || 'Customer' })}>
            <View style={styles.avatar}>
              <Text style={{ fontSize: 22 }}>👤</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.cardTop}>
                <Text style={styles.name}>{r.other_user?.name || 'Customer'}</Text>
                <Text style={styles.time}>{r.last_message_at ? new Date(r.last_message_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : ''}</Text>
              </View>
              <View style={styles.cardBot}>
                <Text style={styles.preview} numberOfLines={1}>{r.last_message || 'Belum ada pesan'}</Text>
                {(r.unread_count || 0) > 0 && (
                  <View style={styles.badge}><Text style={styles.badgeText}>{r.unread_count}</Text></View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const C = { bg: '#0A1628', card: '#111827', border: '#1E3A5F', primary: '#3B5BDB', text: '#fff', muted: '#6B7DB3' }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 6 },
  emptyText: { fontSize: 13, color: C.muted, textAlign: 'center' },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.border },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1A2E50', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2A4070' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '700', color: C.text },
  time: { fontSize: 11, color: C.muted },
  cardBot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  preview: { fontSize: 13, color: C.muted, flex: 1 },
  badge: { backgroundColor: C.primary, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 11, fontWeight: '700', color: C.text },
})
