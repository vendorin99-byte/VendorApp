import { useState, useEffect, useRef } from 'react'
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation'
import { useAuthStore } from '../../store/authStore'
import { formatTime } from '../../utils/date'
import api from '../../services/api'

type Route = RouteProp<RootStackParamList, 'ChatRoom'>
type Nav = NativeStackNavigationProp<RootStackParamList>

export default function ChatRoomScreen() {
  const route = useRoute<Route>()
  const { user } = useAuthStore()
  const { roomId, vendorName, vendorId } = route.params
  const navigation = useNavigation<Nav>()

  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const flatRef = useRef<FlatList>(null)

  useEffect(() => {
    navigation.setOptions({ title: vendorName })
    fetchMessages()
    const id = setInterval(fetchMessages, 3000)
    return () => clearInterval(id)
  }, [])

  async function fetchMessages() {
    const { data } = await api.get(`/chat/rooms/${roomId}/messages`)
    setMessages(data || [])
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100)
  }

  async function sendMessage() {
    const content = text.trim()
    if (!content) return
    setText('')
    await api.post(`/chat/rooms/${roomId}/messages`, { content })
    fetchMessages()
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      {vendorId && (
        <TouchableOpacity style={styles.orderBanner} onPress={() => navigation.navigate('Booking', { vendorId })}>
          <Text style={styles.orderBannerText}>📅 Sudah sepakat? Buat Pesanan Sekarang →</Text>
        </TouchableOpacity>
      )}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item: m }) => {
          const isMine = m.sender_id === user?.id
          return (
            <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
              <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{m.content}</Text>
              <Text style={[styles.bubbleTime, isMine && { color: 'rgba(255,255,255,0.7)' }]}>{formatTime(m.created_at)}</Text>
            </View>
          )
        }}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Tulis pesan..."
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={styles.sendText}>›</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  orderBanner: { backgroundColor: '#EEF2FF', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#C7D2FE' },
  orderBannerText: { color: '#3730A3', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  messageList: { padding: 16, gap: 8 },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 16 },
  bubbleMine: { backgroundColor: '#3B5BDB', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#F3F4F6', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, color: '#1F2937' },
  bubbleTextMine: { color: '#fff' },
  bubbleTime: { fontSize: 11, color: '#9CA3AF', marginTop: 4, alignSelf: 'flex-end' },
  inputRow: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff', gap: 10, alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, backgroundColor: '#3B5BDB', borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: '#fff', fontSize: 24, lineHeight: 28 },
})
