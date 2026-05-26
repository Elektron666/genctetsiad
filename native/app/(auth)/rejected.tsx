import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors, Fonts, FontSize } from '@/theme';
import { useAuthContext } from '@/context/AuthContext';

export default function RejectedScreen() {
  const { profile, signOut } = useAuthContext();

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <View style={styles.iconOuter}><View style={styles.iconInner} /></View>
        </View>

        <Text style={styles.overline}>ÜYELİK BAŞVURUSU</Text>
        <Text style={styles.title}>{'Başvurunuz\nsonuçlandı.'}</Text>

        <View style={styles.divider} />

        <Text style={styles.body}>
          Üyelik başvurunuz komisyon tarafından değerlendirilmiş ve{' '}
          <Text style={styles.red}>kabul edilmemiştir</Text>.{'\n\n'}
          Daha fazla bilgi için{' '}
          <Text style={styles.gold}>info@tetsiad.org</Text>{' '}
          adresine ulaşabilirsiniz.
        </Text>

        {profile?.full_name ? (
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>AD SOYAD</Text>
              <Text style={styles.infoVal}>{profile.full_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>DURUM</Text>
              <Text style={[styles.infoVal, { color: '#e57373' }]}>KABUL EDİLMEDİ</Text>
            </View>
          </View>
        ) : null}

        <TouchableOpacity style={styles.signOutBtn} onPress={signOut} activeOpacity={0.7}>
          <Text style={styles.signOutText}>ÇIKIŞ YAP</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: Colors.navy },
  content:     { flex: 1, paddingHorizontal: 32, paddingTop: 64, alignItems: 'center' },
  iconWrap:    { marginBottom: 32 },
  iconOuter:   { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(229,115,115,0.5)', alignItems: 'center', justifyContent: 'center' },
  iconInner:   { width: 12, height: 12, borderRadius: 6, backgroundColor: '#e57373' },
  overline:    { fontFamily: Fonts.jakarta, fontSize: 8, letterSpacing: 3, color: '#e57373', fontWeight: '700', marginBottom: 12 },
  title:       { fontFamily: Fonts.cormorant, fontSize: 36, color: Colors.ivory, fontStyle: 'italic', fontWeight: '300', textAlign: 'center', lineHeight: 42, marginBottom: 8 },
  divider:     { height: 0.5, backgroundColor: Colors.goldLine, width: '100%', marginVertical: 24 },
  body:        { fontFamily: Fonts.jakarta, fontSize: 12, color: Colors.textMuted, lineHeight: 20, textAlign: 'center', marginBottom: 28 },
  gold:        { color: Colors.gold },
  red:         { color: '#e57373' },
  infoBox:     { borderWidth: 0.5, borderColor: Colors.goldLine, width: '100%', marginBottom: 32 },
  infoRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.goldLine },
  infoKey:     { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 1.5, color: Colors.textMuted },
  infoVal:     { fontFamily: Fonts.jakarta, fontSize: 11, color: Colors.ivory },
  signOutBtn:  { borderWidth: 0.5, borderColor: Colors.goldLine, paddingVertical: 14, paddingHorizontal: 40 },
  signOutText: { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 2 },
});
