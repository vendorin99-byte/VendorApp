import { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold } from '@expo-google-fonts/poppins'
import * as SplashScreen from 'expo-splash-screen'
import * as Updates from 'expo-updates'
import AppNavigation from './src/navigation'

SplashScreen.preventAutoHideAsync()

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold,
  })
  const [showBanner, setShowBanner] = useState(false)
  const translateY = useRef(new Animated.Value(-80)).current

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
  }, [fontsLoaded])

  useEffect(() => {
    checkUpdate()
  }, [])

  async function checkUpdate() {
    try {
      if (__DEV__) return // skip di development/Expo Go
      const update = await Updates.checkForUpdateAsync()
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync()
        setShowBanner(true)
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 10,
        }).start()
      }
    } catch {
      // abaikan error update (misal tidak ada koneksi)
    }
  }

  async function restartApp() {
    await Updates.reloadAsync()
  }

  function dismissBanner() {
    Animated.timing(translateY, {
      toValue: -80,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setShowBanner(false))
  }

  if (!fontsLoaded) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppNavigation />

        {/* Update banner */}
        {showBanner && (
          <Animated.View style={[styles.banner, { transform: [{ translateY }] }]}>
            <View style={styles.bannerLeft}>
              <Text style={styles.bannerIcon}>🔄</Text>
              <View>
                <Text style={styles.bannerTitle}>Pembaruan tersedia</Text>
                <Text style={styles.bannerSub}>Restart untuk mendapat fitur terbaru</Text>
              </View>
            </View>
            <View style={styles.bannerActions}>
              <TouchableOpacity onPress={dismissBanner} style={styles.laterBtn}>
                <Text style={styles.laterText}>Nanti</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={restartApp} style={styles.restartBtn}>
                <Text style={styles.restartText}>Restart</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A2E50',
    borderBottomWidth: 1,
    borderBottomColor: '#2A4070',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  bannerIcon: { fontSize: 22 },
  bannerTitle: { fontSize: 13, fontWeight: '700', color: '#fff' },
  bannerSub: { fontSize: 11, color: '#8BA3C7', marginTop: 1 },
  bannerActions: { flexDirection: 'row', gap: 8, marginLeft: 8 },
  laterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A4070',
  },
  laterText: { fontSize: 12, fontWeight: '600', color: '#6B7DB3' },
  restartBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#3B5BDB',
  },
  restartText: { fontSize: 12, fontWeight: '700', color: '#fff' },
})
