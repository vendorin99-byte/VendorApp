import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import * as FileSystem from 'expo-file-system'

const NAV_STATE_FILE = FileSystem.documentDirectory + 'nav_state.json'

interface User { id: string; name: string; email: string; role: string }
interface AuthState {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  logout: () => void
  loadFromStorage: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  setAuth: async (token, user) => {
    await SecureStore.setItemAsync('auth_token', token)
    await SecureStore.setItemAsync('auth_user', JSON.stringify(user))
    set({ token, user })
  },
  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token')
    await SecureStore.deleteItemAsync('auth_user')
    FileSystem.deleteAsync(NAV_STATE_FILE, { idempotent: true }).catch(() => {})
    set({ token: null, user: null })
  },
  loadFromStorage: async () => {
    const token = await SecureStore.getItemAsync('auth_token')
    const userStr = await SecureStore.getItemAsync('auth_user')
    if (token && userStr) set({ token, user: JSON.parse(userStr) })
  },
}))
