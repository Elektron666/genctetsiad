import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/theme';

export default function Index() {
  const { status } = useAuthContext();
  // Açılış üç saniyeden uzun sürerse sessiz bir çark yerine ne
  // beklendiğini söylüyoruz. Yavaş bağlantıda kullanıcı uygulamanın
  // donduğunu sanıp kapatıyordu.
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (status !== 'loading') { setSlow(false); return; }
    const t = setTimeout(() => setSlow(true), 3000);
    return () => clearTimeout(t);
  }, [status]);

  if (status === 'loading') {
    return (
      <View style={s.root}>
        <ActivityIndicator color={Colors.gold} />
        {slow && (
          <Text style={s.note}>
            Bağlantı kuruluyor...{'\n'}İnternet bağlantınız yavaşsa bu biraz sürebilir.
          </Text>
        )}
      </View>
    );
  }

  if (status === 'authenticated') return <Redirect href="/(tabs)" />;
  // Onay bekleyen kullanıcı önce durum ekranına düşer; oradan
  // duyuru/etkinliklere göz atmayı seçebilir (rehber ve bülten RLS ile kapalı).
  if (status === 'pending') return <Redirect href="/(auth)/pending" />;
  return <Redirect href="/(auth)/login" />;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.navy, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  note: { fontFamily: Fonts.jakarta, fontSize: 11, color: Colors.textMuted, textAlign: 'center', lineHeight: 18, marginTop: 20 },
});
