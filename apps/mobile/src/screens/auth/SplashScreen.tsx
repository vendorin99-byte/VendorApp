import { useEffect } from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation'
import { useAuthStore } from '../../store/authStore'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Splash'>

export default function SplashScreen() {
  const navigation = useNavigation<Nav>()
  const { loadFromStorage } = useAuthStore()

  useEffect(() => {
    async function init() {
      await loadFromStorage()
      setTimeout(() => {
        const { token } = useAuthStore.getState()
        navigation.replace(token ? 'Main' : 'Onboarding')
      }, 1600)
    }
    init()
  }, [])

  return (
    <View style={styles.container}>
      <Image source={require('../../../assets/Logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.tagline}>Temukan Jasa Terbaik untuk Acaramu</Text>
      <Text style={styles.powered}>Powered By Gelas Kaca</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A', alignItems: 'center', justifyContent: 'center', padding: 40 },
  logo: { width: 160, height: 160 },
  tagline: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#9CA3AF', marginTop: 20, textAlign: 'center' },
  powered: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#555580', marginTop: 8 },
})
