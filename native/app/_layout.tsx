import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider } from '@/context/AuthContext';
import { addForegroundNotificationListener, addNotificationResponseListener } from '@/lib/notifications';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    CormorantGaramond: require('../assets/fonts/CormorantGaramond-Regular.ttf'),
    'CormorantGaramond-Italic': require('../assets/fonts/CormorantGaramond-Italic.ttf'),
    'CormorantGaramond-Medium': require('../assets/fonts/CormorantGaramond-Medium.ttf'),
    'CormorantGaramond-Light': require('../assets/fonts/CormorantGaramond-Light.ttf'),
    PlusJakartaSans: require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'PlusJakartaSans-Medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'PlusJakartaSans-SemiBold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'PlusJakartaSans-Light': require('../assets/fonts/PlusJakartaSans-Light.ttf'),
    JetBrainsMono: require('../assets/fonts/JetBrainsMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  useEffect(() => {
    const foreground = addForegroundNotificationListener((notif) => {
      // Bildirim ön plandayken logla; gerekirse toast gösterilebilir
      console.log('[Push] Foreground:', notif.request.content.title);
    });
    const response = addNotificationResponseListener((res) => {
      // Bildirime tıklandığında ilgili sayfaya yönlendirilebilir
      console.log('[Push] Tapped:', res.notification.request.content.title);
    });
    return () => { foreground.remove(); response.remove(); };
  }, []);

  if (!loaded) return null;

  return (
    <AuthProvider>
      <AppProvider>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </SafeAreaProvider>
      </AppProvider>
    </AuthProvider>
  );
}
