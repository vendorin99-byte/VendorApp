import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text } from 'react-native'
import { useThemeStore } from '../store/themeStore'
import HomeScreen from '../screens/home/HomeScreen'
import MapsScreen from '../screens/maps/MapsScreen'
import ChatListScreen from '../screens/chat/ChatListScreen'
import OrderListScreen from '../screens/booking/OrderListScreen'
import ProfileScreen from '../screens/profile/ProfileScreen'

const Tab = createBottomTabNavigator()

const tabIcon = (label: string) => ({ color }: { color: string }) => (
  <Text style={{ fontSize: 20, color }}>
    {label === 'Beranda' ? '🏠' : label === 'Maps' ? '🗺️' : label === 'Chat' ? '💬' : label === 'Pesanan' ? '📋' : '👤'}
  </Text>
)

export default function TabNavigator() {
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
      <Tab.Screen name="Beranda" component={HomeScreen} options={{ tabBarIcon: tabIcon('Beranda') }} />
      <Tab.Screen name="Maps" component={MapsScreen} options={{ tabBarIcon: tabIcon('Maps') }} />
      <Tab.Screen name="Chat" component={ChatListScreen} options={{ tabBarIcon: tabIcon('Chat') }} />
      <Tab.Screen name="Pesanan" component={OrderListScreen} options={{ tabBarIcon: tabIcon('Pesanan') }} />
      <Tab.Screen name="Profil" component={ProfileScreen} options={{ tabBarIcon: tabIcon('Profil') }} />
    </Tab.Navigator>
  )
}
