import { useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import WebView from 'react-native-webview'
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation'
import { formatRp } from '../../utils/currency'

type Route = RouteProp<RootStackParamList, 'Payment'>
type Nav = NativeStackNavigationProp<RootStackParamList>

export default function PaymentScreen() {
  const route = useRoute<Route>()
  const navigation = useNavigation<Nav>()
  const { bookingId, amount, paymentUrl } = route.params

  function handleNavChange(event: any) {
    const url: string = event.url
    if (url.includes('success') || url.includes('paid')) {
      navigation.replace('OrderDetail', { bookingId })
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.amount}>{formatRp(amount)}</Text>
        <Text style={styles.label}>Selesaikan pembayaran di bawah ini</Text>
      </View>
      <WebView
        source={{ uri: paymentUrl }}
        onNavigationStateChange={handleNavChange}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#3B5BDB" />
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#3B5BDB', padding: 20, alignItems: 'center' },
  amount: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  label: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  loading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
})
