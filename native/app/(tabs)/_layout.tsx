import { Tabs } from 'expo-router';
import { Colors, Fonts } from '@/theme';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.navyDeep,
          borderTopColor: Colors.goldLine,
          borderTopWidth: 0.5,
          height: Platform.OS === 'ios' ? 82 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: Fonts.jakarta,
          fontSize: 7,
          letterSpacing: 1,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'ANA SAYFA' }} />
      <Tabs.Screen name="calendar" options={{ title: 'TAKVİM' }} />
      <Tabs.Screen name="directory" options={{ title: 'REHBER' }} />
      <Tabs.Screen name="academy" options={{ title: 'AKADEMİ' }} />
      <Tabs.Screen name="profile" options={{ title: 'KART' }} />
      <Tabs.Screen name="sustainability" options={{ title: 'YEŞİL' }} />
    </Tabs>
  );
}
