import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text } from 'react-native'
import VendorOrdersScreen from '../screens/vendor-mobile/VendorOrdersScreen'
import VendorWalletScreen from '../screens/vendor-mobile/VendorWalletScreen'
import VendorProfileScreen from '../screens/vendor-mobile/VendorProfileScreen'
import ChatListScreen from '../screens/chat/ChatListScreen'

const Tab = createBottomTabNavigator()

const icon = (label: string) => ({ color }: { color: string }) => (
  <Text style={{ fontSize: 20, color }}>
    {label === 'Pesanan' ? '📋' : label === 'Chat' ? '💬' : label === 'Dompet' ? '💰' : '👤'}
  </Text>
)

export default function VendorTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3B5BDB',
        tabBarInactiveTintColor: '#9CA3AF',
        headerShown: false,
      }}
    >
      <Tab.Screen name="Pesanan" component={VendorOrdersScreen} options={{ tabBarIcon: icon('Pesanan') }} />
      <Tab.Screen name="Chat" component={ChatListScreen} options={{ tabBarIcon: icon('Chat') }} />
      <Tab.Screen name="Dompet" component={VendorWalletScreen} options={{ tabBarIcon: icon('Dompet') }} />
      <Tab.Screen name="Profil" component={VendorProfileScreen} options={{ tabBarIcon: icon('Profil') }} />
    </Tab.Navigator>
  )
}
