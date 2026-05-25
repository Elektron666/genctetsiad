import { Stack, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider, useAuthContext } from '@/context/AuthContext';
import { Colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { status } = useAuthContext();

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.navy, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.gold} />
      </View>
    );
  }

  if (status === 'unauthenticated') return <Redirect href="/(auth)/login" />;
  if (status === 'pending') return <Redirect href="/(auth)/pending" />;
  return null; // authenticated → normal navigation
}

function RootNavigator() {
  const { status } = useAuthContext();

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
