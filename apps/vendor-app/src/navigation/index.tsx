import { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text, View, ActivityIndicator } from 'react-native'
import { useAuthStore } from '../store/authStore'

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen'
import RegisterScreen from '../screens/auth/RegisterScreen'
import WaitingScreen from '../screens/auth/WaitingScreen'

// Main screens
import DashboardScreen from '../screens/main/DashboardScreen'
import OrdersScreen from '../screens/main/OrdersScreen'
import ChatListScreen from '../screens/main/ChatListScreen'
import ChatDetailScreen from '../screens/main/ChatDetailScreen'
import MapScreen from '../screens/main/MapScreen'
import ProfileScreen from '../screens/main/ProfileScreen'
import WalletScreen from '../screens/main/WalletScreen'

// Profile sub screens
import PortfolioScreen from '../screens/profile/PortfolioScreen'
import ServicesScreen from '../screens/profile/ServicesScreen'
import EditProfileScreen from '../screens/profile/EditProfileScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Beranda: '🏠', Pesanan: '📋', Chat: '💬', Peta: '🗺️', Profil: '👤',
  }
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>{icons[name] || '•'}</Text>
    </View>
  )
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarLabel: ({ focused }) => (
          <Text style={{ fontSize: 10, fontWeight: focused ? '700' : '400', color: focused ? '#3B5BDB' : '#4A6080', marginBottom: 2 }}>
            {route.name}
          </Text>
        ),
        tabBarStyle: { backgroundColor: '#111827', borderTopColor: '#1E3A5F', height: 62, paddingBottom: 8 },
        tabBarActiveTintColor: '#3B5BDB',
        tabBarInactiveTintColor: '#4A6080',
      })}
    >
      <Tab.Screen name="Beranda" component={DashboardScreen} />
      <Tab.Screen name="Pesanan" component={OrdersScreen} />
      <Tab.Screen name="Chat" component={ChatListScreen} />
      <Tab.Screen name="Peta" component={MapScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

export default function AppNavigation() {
  const { token, user, loadFromStorage } = useAuthStore()
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    loadFromStorage().then(() => setBooting(false))
  }, [])

  if (booting) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A1628', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#3B5BDB" size="large" />
      </View>
    )
  }

  const isLoggedIn = !!token && user?.role === 'vendor'

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!isLoggedIn ? (
          // Auth flow — Waiting bisa dicapai setelah Register
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Waiting" component={WaitingScreen} />
          </>
        ) : (
          // Logged in → langsung ke app
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
            <Stack.Screen name="Dompet" component={WalletScreen} />
            <Stack.Screen name="Portfolio" component={PortfolioScreen} />
            <Stack.Screen name="Layanan" component={ServicesScreen} />
            <Stack.Screen name="EditProfil" component={EditProfileScreen} />
            <Stack.Screen name="GantiPassword" component={EditProfileScreen} />
            <Stack.Screen name="Notifikasi" component={ProfileScreen} />
            <Stack.Screen name="Bantuan" component={ProfileScreen} />
            <Stack.Screen name="Pengaturan" component={EditProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
