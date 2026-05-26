import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Colors, Fonts, FontSize } from '@/theme';
import { useAuthContext } from '@/context/AuthContext';

export default function PendingScreen() {
  const { profile, signOut, status } = useAuthContext();

  useEffect(() => {
    if (status === 'authenticated') router.replace('/(tabs)');
  }, [status]);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.content}>
        {/* Animated dot */}
        <View style={styles.dotWrap}>
          <View style={styles.dotOuter}><View style={styles.dotInner} /></View>
        </View>

        <Text style={styles.overline}>ÜYELİK BAŞVURUSU</Text>
        <Text style={styles.title}>{'Değerlendirme\nsürecinde.'}</Text>

        <View style={styles.divider} />

        <Text style={styles.body}>
          Başvurunuz komisyon tarafından inceleniyor. Onay süreciniz genellikle{' '}
          <Text style={styles.gold}>3–5 iş günü</Text> içinde tamamlanmaktadır.
        </Text>

        {profile?.member_code && (
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>BAŞVURU KODUNUZ</Text>
            <Text style={styles.codeValue}>{profile.member_code}</Text>
          </View>
        )}

        <View style={styles.infoBox}>
          {[
            ['AD SOYAD', profile?.full_name ?? '—'],
            ['TELEFON', profile?.phone ?? '—'],
            ['FİRMA', profile?.company ?? '—'],
            ['DURUM', 'ONAY BEKLENİYOR'],
          ].map(([k, v]) => (
            <View key={k} style={styles.infoRow}>
              <Text style={styles.infoKey}>{k}</Text>
              <Text style={[styles.infoVal, k === 'DURUM' && { color: Colors.gold }]}>{v}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={signOut} activeOpacity={0.7}>
          <Text style={styles.signOutText}>ÇIKIŞ YAP</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: Colors.navy },
  content:    { flex: 1, paddingHorizontal: 32, paddingTop: 64, alignItems: 'center' },
  dotWrap:    { marginBottom: 32 },
  dotOuter:   { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: Colors.goldLine, alignItems: 'center', justifyContent: 'center' },
  dotInner:   { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.gold },
  overline:   { fontFamily: Fonts.jakarta, fontSize: 8, letterSpacing: 3, color: Colors.gold, fontWeight: '700', marginBottom: 12 },
  title:      { fontFamily: Fonts.cormorant, fontSize: 36, color: Colors.ivory, fontStyle: 'italic', fontWeight: '300', textAlign: 'center', lineHeight: 42, marginBottom: 8 },
  divider:    { height: 0.5, backgroundColor: Colors.goldLine, width: '100%', marginVertical: 24 },
  body:       { fontFamily: Fonts.jakarta, fontSize: 12, color: Colors.textMuted, lineHeight: 20, textAlign: 'center', marginBottom: 28 },
  gold:       { color: Colors.gold },
  codeBox:    { borderWidth: 0.5, borderColor: Colors.gold, padding: 20, alignItems: 'center', width: '100%', marginBottom: 24 },
  codeLabel:  { fontFamily: Fonts.mono, fontSize: 7, color: Colors.textMuted, letterSpacing: 2, marginBottom: 10 },
  codeValue:  { fontFamily: Fonts.mono, fontSize: 18, color: Colors.gold, letterSpacing: 3 },
  infoBox:    { borderWidth: 0.5, borderColor: Colors.goldLine, width: '100%', marginBottom: 32 },
  infoRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.goldLine },
  infoKey:    { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 1.5, color: Colors.textMuted },
  infoVal:    { fontFamily: Fonts.jakarta, fontSize: 11, color: Colors.ivory },
  signOutBtn: { borderWidth: 0.5, borderColor: Colors.goldLine, paddingVertical: 14, paddingHorizontal: 40 },
  signOutText:{ fontFamily: Fonts.jakarta, fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 2 },
});
