import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useThemeStore } from '../store/themeStore'

export default function DarkLightToggle() {
  const { isDark, toggle } = useThemeStore()
  return (
    <TouchableOpacity style={styles.container} onPress={toggle} activeOpacity={0.8}>
      <View style={[styles.pill, isDark && styles.pillDark]}>
        <View style={[styles.circle, isDark && styles.circleRight]} />
      </View>
      <Text style={styles.label}>Dark Light</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  pill: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  pillDark: { backgroundColor: '#1A1A2E' },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  circleRight: { alignSelf: 'flex-end', backgroundColor: '#3B5BDB' },
  label: { fontFamily: 'Poppins_400Regular', fontSize: 9, color: '#fff', marginTop: 2 },
})
