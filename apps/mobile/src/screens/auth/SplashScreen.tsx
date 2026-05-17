import { useEffect } from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
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
      }, 1800)
    }
    init()
  }, [])

  return (
    <View style={styles.container}>
      <Image source={require('../../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.tagline}>Temukan Jasa Terbaik untuk Acaramu</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 40 },
  logo: { width: 200, height: 200 },
  tagline: { fontSize: 14, color: '#6B7280', marginTop: 16, textAlign: 'center' },
})
