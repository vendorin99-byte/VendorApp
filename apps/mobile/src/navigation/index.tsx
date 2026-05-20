import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import TabNavigator from './TabNavigator'
import VendorTabNavigator from './VendorTabNavigator'
import SplashScreen from '../screens/auth/SplashScreen'
import OnboardingScreen from '../screens/auth/OnboardingScreen'
import LoginScreen from '../screens/auth/LoginScreen'
import RegisterScreen from '../screens/auth/RegisterScreen'
import OTPScreen from '../screens/auth/OTPScreen'
import VendorDetailScreen from '../screens/vendor/VendorDetailScreen'
import BookingScreen from '../screens/booking/BookingScreen'
import PaymentScreen from '../screens/booking/PaymentScreen'
import OrderDetailScreen from '../screens/booking/OrderDetailScreen'
import ChatRoomScreen from '../screens/chat/ChatRoomScreen'
import RateOrderScreen from '../screens/booking/RateOrderScreen'
import EditProfileScreen from '../screens/profile/EditProfileScreen'
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen'
import AffiliateScreen from '../screens/profile/AffiliateScreen'
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen'
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen'
import NotificationsScreen from '../screens/profile/NotificationsScreen'
import VendorAdsScreen from '../screens/vendor-mobile/VendorAdsScreen'

export type RootStackParamList = {
  Splash: undefined
  Onboarding: undefined
  Login: undefined
  Register: undefined
  OTP: { email: string }
  ForgotPassword: undefined
  ResetPassword: { email: string }
  Main: undefined
  VendorDetail: { vendorId: string }
  Booking: { vendorId: string; serviceId?: string }
  Payment: { bookingId: string; amount: number; method: string; vendorBank?: { bank_code: string; account_number: string; account_name: string } | null }
  OrderDetail: { bookingId: string }
  ChatRoom: { roomId: string; vendorName: string; vendorId?: string; serviceHint?: string }
  EditProfile: undefined
  ChangePassword: undefined
  Affiliate: undefined
  RateOrder: { bookingId: string; vendorName: string }
  Notifications: undefined
  VendorAds: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function RootNavigator() {
  const { token, user } = useAuthStore()
  const { isDark } = useThemeStore()
  const isVendor = user?.role === 'vendor'

  const themedHeader = {
    headerStyle: { backgroundColor: isDark ? '#1A1A2E' : '#fff' },
    headerTintColor: isDark ? '#fff' : '#1F2937',
    headerTitleStyle: { fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
    headerShadowVisible: false,
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!token ? (
        <>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="OTP" component={OTPScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={isVendor ? VendorTabNavigator : TabNavigator} />
          <Stack.Screen name="VendorDetail" component={VendorDetailScreen} options={{ headerShown: true, title: '', ...themedHeader }} />
          <Stack.Screen name="Booking" component={BookingScreen} options={{ headerShown: true, title: 'Buat Pesanan', ...themedHeader }} />
          <Stack.Screen name="Payment" component={PaymentScreen} options={{ headerShown: true, title: 'Pembayaran', ...themedHeader }} />
          <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ headerShown: true, title: 'Detail Pesanan', ...themedHeader }} />
          <Stack.Screen name="ChatRoom" component={ChatRoomScreen} options={{ headerShown: true, ...themedHeader }} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Affiliate" component={AffiliateScreen} options={{ headerShown: false }} />
          <Stack.Screen name="RateOrder" component={RateOrderScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="VendorAds" component={VendorAdsScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  )
}
