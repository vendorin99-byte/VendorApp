import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins'
import RootNavigator from './src/navigation'
import UpdateChecker from './src/components/UpdateChecker'
import { usePushNotifications } from './src/hooks/usePushNotifications'

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

  if (!fontsLoaded) return null

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppInner />
      </NavigationContainer>
    </SafeAreaProvider>
  )
}
