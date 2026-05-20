import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text } from 'react-native'
import { useThemeStore } from '../store/themeStore'
import VendorDashboardScreen from '../screens/vendor-mobile/VendorDashboardScreen'
import VendorOrdersScreen from '../screens/vendor-mobile/VendorOrdersScreen'
import VendorWalletScreen from '../screens/vendor-mobile/VendorWalletScreen'
import VendorProfileScreen from '../screens/vendor-mobile/VendorProfileScreen'
import ChatListScreen from '../screens/chat/ChatListScreen'

const Tab = createBottomTabNavigator()

const icon = (label: string) => ({ color }: { color: string }) => (
  <Text style={{ fontSize: 20, color }}>
    {label === 'Beranda' ? '🏠' : label === 'Pesanan' ? '📋' : label === 'Chat' ? '💬' : label === 'Dompet' ? '💰' : '👤'}
  </Text>
)

export default function VendorTabNavigator() {
  const { isDark } = useThemeStore()

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3B5BDB',
        tabBarInactiveTintColor: isDark ? '#6B7280' : '#9CA3AF',
        tabBarStyle: {
          backgroundColor: isDark ? '#1A1A2E' : '#fff',
          borderTopColor: isDark ? '#2A2A4A' : '#E5E7EB',
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontFamily: 'Poppins_500Medium',
          fontSize: 10,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen name="Beranda" component={VendorDashboardScreen} options={{ tabBarIcon: icon('Beranda') }} />
      <Tab.Screen name="Pesanan" component={VendorOrdersScreen} options={{ tabBarIcon: icon('Pesanan') }} />
      <Tab.Screen name="Chat" component={ChatListScreen} options={{ tabBarIcon: icon('Chat') }} />
      <Tab.Screen name="Dompet" component={VendorWalletScreen} options={{ tabBarIcon: icon('Dompet') }} />
      <Tab.Screen name="Profil" component={VendorProfileScreen} options={{ tabBarIcon: icon('Profil') }} />
    </Tab.Navigator>
  )
}
