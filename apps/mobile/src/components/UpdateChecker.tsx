import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import * as Updates from 'expo-updates'

export default function UpdateChecker() {
  const [available, setAvailable] = useState(false)
  const [updating, setUpdating] = useState(false)
  const slideAnim = useState(new Animated.Value(-80))[0]

  useEffect(() => {
    if (__DEV__) return
    checkUpdate()
  }, [])

  async function checkUpdate() {
    try {
      const result = await Updates.checkForUpdateAsync()
      if (result.isAvailable) {
        await Updates.fetchUpdateAsync()
        setAvailable(true)
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start()
      }
    } catch {
      // silently ignore — offline or dev mode
    }
  }

  async function applyUpdate() {
    setUpdating(true)
    await Updates.reloadAsync()
  }

  if (!available) return null

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.text}>✨ Versi baru tersedia!</Text>
      <TouchableOpacity style={styles.btn} onPress={applyUpdate} disabled={updating}>
        <Text style={styles.btnText}>{updating ? 'Memuat...' : 'Perbarui Sekarang'}</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#3B5BDB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 50,
    zIndex: 9999,
  },
  text: { color: '#fff', fontSize: 13, fontWeight: '600', flex: 1 },
  btn: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 12,
  },
  btnText: { color: '#3B5BDB', fontWeight: 'bold', fontSize: 13 },
})
