import { Tabs, Redirect } from 'expo-router';
import { Colors, Fonts } from '@/theme';
import { Platform } from 'react-native';
import {
  HomeIcon,
  CalendarIcon,
  DirectoryIcon,
  AcademyIcon,
  CardIcon,
  SustainabilityIcon,
  AdminIcon,
} from '@/components/TabIcons';
import { useAuthContext } from '@/context/AuthContext';

const ADMIN_ROLES = new Set(['admin', 'board', 'president']);

export default function TabLayout() {
  const { profile, status } = useAuthContext();
  const isAdmin = ADMIN_ROLES.has(profile?.role ?? '');

  if (status === 'loading') return null;
  if (status === 'unauthenticated') return <Redirect href="/(auth)/login" />;
  if (status === 'pending') return <Redirect href="/(auth)/pending" />;

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
      <Tabs.Screen
        name="admin"
        options={{
          href: isAdmin ? undefined : null,
          title: 'YÖNETİM',
          tabBarIcon: ({ color }) => <AdminIcon color={color} />,
        }}
      />
    </Tabs>
  );
}
