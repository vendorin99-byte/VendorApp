import { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, StatusBar, KeyboardAvoidingView, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useAuthStore } from '../../store/authStore'
import api from '../../services/api'

export default function ChatDetailScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const { roomId, customerName } = route.params
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<FlatList>(null)

  async function fetchMessages() {
    try {
      const { data } = await api.get(`/chat/rooms/${roomId}/messages`)
      setMessages(data || [])
    } catch {}
  }

  useEffect(() => { fetchMessages() }, [roomId])
  useEffect(() => { if (messages.length > 0) listRef.current?.scrollToEnd({ animated: false }) }, [messages.length])

  // Poll for new messages every 5s
  useEffect(() => {
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [roomId])

  async function send() {
    if (!text.trim() || sending) return
    const msg = text.trim()
    setText('')
    setSending(true)
    try {
      await api.post(`/chat/rooms/${roomId}/messages`, { content: msg })
      fetchMessages()
    } catch {} finally { setSending(false) }
  }

  const myId = user?.id

  return (
    <KeyboardAvoidingView style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1628" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{customerName}</Text>
          <Text style={styles.headerSub}>Customer</Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 12, gap: 8, paddingBottom: 8 }}
        ListEmptyComponent={<View style={styles.emptyChat}><Text style={styles.emptyChatText}>Mulai percakapan 👋</Text></View>}
        renderItem={({ item: m }) => {
          const isMe = m.sender_id === myId
          return (
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
              <Text style={[styles.bubbleText, isMe ? styles.textMe : styles.textThem]}>{m.content}</Text>
              <Text style={[styles.bubbleTime, isMe ? { color: 'rgba(255,255,255,0.5)' } : { color: '#4A6080' }]}>
                {new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          )
        }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.input}
          placeholder="Tulis pesan..."
          placeholderTextColor="#3A4A60"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity style={[styles.sendBtn, (!text.trim() || sending) && { opacity: 0.5 }]}
          onPress={send} disabled={!text.trim() || sending}>
          <Text style={{ fontSize: 20 }}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const C = { bg: '#0A1628', card: '#111827', card2: '#0D1B2E', border: '#1E3A5F', primary: '#3B5BDB', text: '#fff', muted: '#6B7DB3' }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 28, color: C.text, lineHeight: 32 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700', color: C.text },
  headerSub: { fontSize: 12, color: C.muted },
  emptyChat: { paddingTop: 80, alignItems: 'center' },
  emptyChatText: { fontSize: 15, color: C.muted },
  bubble: { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: C.primary, borderBottomRightRadius: 4 },
  bubbleThem: { alignSelf: 'flex-start', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  textMe: { color: C.text },
  textThem: { color: C.text },
  bubbleTime: { fontSize: 10, marginTop: 4, textAlign: 'right' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.card2 },
  input: { flex: 1, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: C.text, fontSize: 15, maxHeight: 120 },
  sendBtn: { width: 44, height: 44, backgroundColor: C.primary, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
})
