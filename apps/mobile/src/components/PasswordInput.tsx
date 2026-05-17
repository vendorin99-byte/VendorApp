import { useState } from 'react'
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native'

interface Props {
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  style?: ViewStyle
}

export default function PasswordInput({ value, onChangeText, placeholder = 'Kata sandi', style }: Props) {
  const [show, setShow] = useState(false)
  return (
    <View style={[styles.wrapper, style]}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
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
  input: { flex: 1, padding: 14, fontSize: 15 },
  eye: { paddingHorizontal: 14, paddingVertical: 14 },
  eyeText: { fontSize: 18 },
})
