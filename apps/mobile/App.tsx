import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import RootNavigator from './src/navigation'
import UpdateChecker from './src/components/UpdateChecker'

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
        <UpdateChecker />
      </NavigationContainer>
    </SafeAreaProvider>
  )
}
