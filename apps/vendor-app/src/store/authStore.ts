import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

interface User { id: string; name: string; email: string; role: string; vendorId?: string }
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
    await SecureStore.setItemAsync('va_token', token)
    await SecureStore.setItemAsync('va_user', JSON.stringify(user))
    set({ token, user })
  },
  logout: async () => {
    await SecureStore.deleteItemAsync('va_token')
    await SecureStore.deleteItemAsync('va_user')
    set({ token: null, user: null })
  },
  loadFromStorage: async () => {
    const token = await SecureStore.getItemAsync('va_token')
    const userStr = await SecureStore.getItemAsync('va_user')
    if (token && userStr) set({ token, user: JSON.parse(userStr) })
  },
}))
