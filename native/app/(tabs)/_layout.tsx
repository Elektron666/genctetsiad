import { Tabs } from 'expo-router';
import { Colors, Fonts } from '@/theme';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthContext } from '@/context/AuthContext';
import {
  HomeIcon,
  CalendarIcon,
  DirectoryIcon,
  AcademyIcon,
  CardIcon,
  SustainabilityIcon,
} from '@/components/TabIcons';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { profile, status } = useAuthContext();
  // Onay bekleyen kullanıcıya REHBER sekmesi gösteriliyordu; açtığında
  // RLS boş dönüyor ve "rehber henüz oluşturuluyor" gibi yanıltıcı bir
  // ekranla karşılaşıyordu. Onay alınca sekme kendiliğinden görünür.
  const approved = status === 'authenticated' && profile?.role !== 'pending';

  // Jest çubuğu olan Android cihazlarda sabit 64px sekme çubuğu sistem
  // gezinme çubuğuyla çakışıyordu.
  const bottomInset = Platform.OS === 'ios' ? 24 : Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.navyDeep,
          borderTopColor: Colors.goldLine,
          borderTopWidth: 0.5,
          height: 56 + bottomInset,
          paddingBottom: bottomInset,
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
      <Tabs.Screen
        name="index"
        options={{
          title: 'ANA SAYFA',
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'TAKVİM',
          tabBarIcon: ({ color }) => <CalendarIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="directory"
        options={{
          title: 'REHBER',
          tabBarIcon: ({ color }) => <DirectoryIcon color={color} />,
          href: approved ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="academy"
        options={{
          title: 'AKADEMİ',
          tabBarIcon: ({ color }) => <AcademyIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'KART',
          tabBarIcon: ({ color }) => <CardIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="sustainability"
        options={{
          title: 'YEŞİL',
          tabBarIcon: ({ color }) => <SustainabilityIcon color={color} />,
        }}
      />
    </Tabs>
  );
}
