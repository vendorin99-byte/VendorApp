import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: 'https://vendorapp-8h7d.onrender.com/api',
  timeout: 35000,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-retry sekali jika timeout atau network error (untuk Render cold start)
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const config = err.config
    if (!config || config.__retried) return Promise.reject(err)
    const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout')
    const isNetwork = !err.response
    if (isTimeout || isNetwork) {
      config.__retried = true
      await new Promise((r) => setTimeout(r, 3000))
      return api(config)
    }
    return Promise.reject(err)
  }
)

export default api
