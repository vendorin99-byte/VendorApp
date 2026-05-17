import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text } from 'react-native'
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
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3B5BDB',
        tabBarInactiveTintColor: '#9CA3AF',
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
