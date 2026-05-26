import { Redirect } from 'expo-router';
import { useAuthContext } from '@/context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/theme';

export default function Index() {
  const { status } = useAuthContext();

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.navy, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.gold} />
      </View>
    );
  }

  if (status === 'authenticated') return <Redirect href="/(tabs)" />;
  if (status === 'pending') return <Redirect href="/(auth)/pending" />;
  if (status === 'rejected') return <Redirect href="/(auth)/rejected" />;
  return <Redirect href="/(auth)/login" />;
}
