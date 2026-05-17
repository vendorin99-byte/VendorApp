import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../../store/authStore'
import api from '../../services/api'

export default function Chat() {
  const { user } = useAuthStore()
  const [rooms, setRooms] = useState<any[]>([])
  const [activeRoom, setActiveRoom] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.get('/chat/rooms').then((r) => setRooms(r.data || []))
  }, [])

  useEffect(() => {
    if (!activeRoom) return
    fetchMessages()
    const id = setInterval(fetchMessages, 3000)
    return () => clearInterval(id)
  }, [activeRoom])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchMessages() {
    const r = await api.get(`/chat/rooms/${activeRoom.id}/messages`)
    setMessages(r.data || [])
  }

  async function send() {
    if (!text.trim()) return
    await api.post(`/chat/rooms/${activeRoom.id}/messages`, { content: text.trim() })
    setText('')
    fetchMessages()
  }

  return (
    <div className="flex h-[calc(100vh-88px)] bg-white rounded-xl border overflow-hidden">
      <div className="w-72 border-r flex flex-col">
        <div className="p-4 border-b font-semibold text-gray-700">Pesan</div>
        <div className="flex-1 overflow-y-auto">
          {rooms.map((room) => {
            const other = room.users
            const last = room.messages?.at(-1)
            return (
              <button
                key={room.id}
                onClick={() => setActiveRoom(room)}
                className={`w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 border-b transition-colors ${activeRoom?.id === room.id ? 'bg-blue-50' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold shrink-0">
                  {(other?.name || '?')[0]}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{other?.name}</div>
                  <div className="text-xs text-gray-400 truncate">{last?.content || 'Mulai percakapan'}</div>
                </div>
              </button>
            )
          })}
          {!rooms.length && <div className="p-4 text-sm text-gray-400">Belum ada percakapan</div>}
        </div>
      </div>

      {activeRoom ? (
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b font-semibold text-gray-700">{activeRoom.users?.name}</div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.map((m) => {
              const isMine = m.sender_id === user?.id
              return (
                <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${isMine ? 'bg-primary text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                    {m.content}
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
          <div className="p-3 border-t flex gap-2">
            <input
              className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Tulis pesan..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
            />
            <button onClick={send} className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-primary-dark transition-colors">
              Kirim
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Pilih percakapan untuk memulai
        </div>
      )}
    </div>
  )
}
