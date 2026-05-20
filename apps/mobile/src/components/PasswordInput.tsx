import { useState } from 'react'
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native'

interface Props {
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  style?: ViewStyle
  dark?: boolean
}

export default function PasswordInput({ value, onChangeText, placeholder = 'Kata sandi', style, dark }: Props) {
  const [show, setShow] = useState(false)
  return (
    <View style={[styles.wrapper, dark && styles.wrapperDark, style]}>
      <TextInput
        style={[styles.input, dark && styles.inputDark]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={dark ? '#555580' : '#9CA3AF'}
        secureTextEntry={!show}
        autoCapitalize="none"
      />
      <TouchableOpacity onPress={() => setShow((s) => !s)} style={styles.eye}>
        <Text style={styles.eyeText}>{show ? '🙈' : '👁️'}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  wrapperDark: {
    backgroundColor: '#1A1A2E',
    borderColor: '#2A2A4A',
  },
  input: { flex: 1, padding: 14, fontSize: 15, color: '#1F2937' },
  inputDark: { color: '#fff' },
  eye: { paddingHorizontal: 14, paddingVertical: 14 },
  eyeText: { fontSize: 18 },
})
