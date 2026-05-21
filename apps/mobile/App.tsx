import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins'
import { useState, useEffect, useRef } from 'react'
import * as FileSystem from 'expo-file-system'
import RootNavigator from './src/navigation'
import UpdateChecker from './src/components/UpdateChecker'
import { usePushNotifications } from './src/hooks/usePushNotifications'
import { useAuthStore } from './src/store/authStore'

const NAV_STATE_FILE = FileSystem.documentDirectory + 'nav_state.json'
const AUTH_SCREENS = new Set(['Splash', 'Onboarding', 'Login', 'Register', 'OTP', 'ForgotPassword', 'ResetPassword'])

function AppInner() {
  usePushNotifications()
  return (
    <>
      <RootNavigator />
      <UpdateChecker />
    </>
  )
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  })
  const [isReady, setIsReady] = useState(false)
  const [initialNavState, setInitialNavState] = useState<any>(undefined)
  const loadFromStorage = useAuthStore(s => s.loadFromStorage)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function bootstrap() {
      const [savedState] = await Promise.all([
        FileSystem.readAsStringAsync(NAV_STATE_FILE)
          .then(s => JSON.parse(s))
          .catch(() => undefined),
        loadFromStorage(),
      ])
      setInitialNavState(savedState)
      setIsReady(true)
    }
    bootstrap()
  }, [])

  if (!fontsLoaded || !isReady) return null

  function onNavStateChange(state: any) {
    if (!state) return
    const topRoute = state.routes?.[state.index]?.name
    if (!topRoute || AUTH_SCREENS.has(topRoute)) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      FileSystem.writeAsStringAsync(NAV_STATE_FILE, JSON.stringify(state)).catch(() => {})
    }, 500)
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer initialState={initialNavState} onStateChange={onNavStateChange}>
        <AppInner />
      </NavigationContainer>
    </SafeAreaProvider>
  )
}
