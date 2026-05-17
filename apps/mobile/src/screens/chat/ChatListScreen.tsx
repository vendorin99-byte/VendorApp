import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, RefreshControl, StatusBar } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RootStackParamList } from '../../navigation'
import { formatTime } from '../../utils/date'
import api from '../../services/api'

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function ChatListScreen() {
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const [rooms, setRooms] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  async function fetchRooms() {
    const { data } = await api.get('/chat/rooms')
    setRooms(data || [])
  }

  useEffect(() => { fetchRooms() }, [])
  const onRefresh = useCallback(async () => { setRefreshing(true); await fetchRooms(); setRefreshing(false) }, [])

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}><Text style={styles.title}>Pesan</Text></View>
      <FlatList
        data={rooms}
        keyExtractor={(r) => r.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item: room }) => {
          const other = room.vendors || room.users
          const lastMsg = room.messages?.[room.messages.length - 1]
          return (
            <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('ChatRoom', { roomId: room.id, vendorName: other?.business_name || other?.name, vendorId: room.vendor_id })}>
              <View style={styles.avatar}>
                {other?.avatar_url
                  ? <Image source={{ uri: other.avatar_url }} style={styles.avatarImg} />
                  : <Text style={styles.avatarText}>{(other?.business_name || other?.name || '?')[0]}</Text>
                }
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.row}>
                  <Text style={styles.name} numberOfLines={1}>{other?.business_name || other?.name}</Text>
                  {lastMsg && <Text style={styles.time}>{formatTime(lastMsg.created_at)}</Text>}
                </View>
                <Text style={styles.preview} numberOfLines={1}>{lastMsg?.content || 'Mulai percakapan'}</Text>
              </View>
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>Belum ada percakapan</Text></View>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingBottom: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: '#E5E7EB' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  item: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderColor: '#F3F4F6', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#3B5BDB', alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 48, height: 48, borderRadius: 24 },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  name: { fontSize: 15, fontWeight: '600', color: '#1F2937', flex: 1 },
  time: { fontSize: 12, color: '#9CA3AF' },
  preview: { fontSize: 13, color: '#6B7280' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#9CA3AF', fontSize: 15 },
})
