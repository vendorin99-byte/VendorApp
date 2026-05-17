import { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation'
import { useAuthStore } from '../../store/authStore'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Splash'>

export default function SplashScreen() {
  const navigation = useNavigation<Nav>()
  const { loadFromStorage, token } = useAuthStore()

  useEffect(() => {
    async function init() {
      await loadFromStorage()
      setTimeout(() => {
        navigation.replace(token ? 'Main' : 'Onboarding')
      }, 1500)
    }
    init()
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>⚡</Text>
      <Text style={styles.name}>VendorIn</Text>
      <Text style={styles.tagline}>Temukan Jasa Terbaik untuk Acaramu</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#3B5BDB', alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 60, marginBottom: 12 },
  name: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 8 },
})
