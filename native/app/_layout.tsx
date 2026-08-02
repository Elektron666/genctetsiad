import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider } from '@/context/AuthContext';
import { initSentry } from '@/lib/sentry';
import { attachNotificationTapHandler } from '@/lib/notifications';
import { ErrorBoundary } from '@/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync();

// Çökme takibi — DSN yoksa hiçbir şey yapmaz (bkz. src/lib/sentry.ts)
initSentry();

// Auth yönlendirmesi app/index.tsx'te (status'a göre) ve ekranların kendi
// useEffect'lerinde yapılır; "DEMO MOD İLE GİR" akışı bilinçli olarak serbest.
function RootNavigator() {
  // Bildirime dokunulduğunda ilgili sekmeye götür
  useEffect(() => attachNotificationTapHandler(path => router.push(path as never)), []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="admin" />
      <Stack.Screen name="profile-edit" />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, fontError] = useFonts({
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

  // Font yüklemesi başarısız olursa (bozuk indirme, dolu disk) `loaded`
  // sonsuza kadar false kalır: açılış ekranı hiç kapanmaz ve uygulama
  // KİLİTLENİR. Hata durumunda da devam ediyoruz — yazı tipleri sistem
  // varsayılanına düşer ama uygulama açılır.
  const ready = loaded || !!fontError;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <SafeAreaProvider>
            <StatusBar style="light" />
            <RootNavigator />
          </SafeAreaProvider>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
