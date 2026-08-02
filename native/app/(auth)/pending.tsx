import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Colors, Fonts, FontSize } from '@/theme';
import { useAuthContext } from '@/context/AuthContext';

export default function PendingScreen() {
  const { profile, signOut, status, refreshProfile, deleteAccount } = useAuthContext();
  const [refreshing, setRefreshing] = useState(false);

  // Onay geldiğinde kullanıcı bunu ancak uygulamayı KAPATIP AÇARAK
  // görebiliyordu; ekranda yalnızca ilk açılışta çalışan bir efekt vardı.
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  // Kayıt 1. adımdan sonra yarıda bırakıldıysa profil boş kalır ve
  // kullanıcı burada "—" dolu bir ekrana kilitlenirdi.
  const incomplete = !profile?.full_name?.trim() || !profile?.company?.trim();

  const confirmDelete = () => {
    Alert.alert(
      'Başvuruyu Geri Çek',
      'Hesabınız ve başvurunuz kalıcı olarak silinecek. Bu işlem geri alınamaz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'KALICI OLARAK SİL',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteAccount();
            if (error) Alert.alert('Hata', 'Hesap silinemedi. Lütfen tekrar deneyin.');
            else router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/(auth)/login');
    if (status === 'authenticated') router.replace('/(tabs)');   // onay geldiyse içeri al
  }, [status]);

  // Ekran her açıldığında onay durumunu tazele
  useEffect(() => { refreshProfile(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} colors={[Colors.gold]} progressBackgroundColor={Colors.navyDeep} />
        }
      >
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

        {profile && (
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>
              {profile.member_code ? 'ÜYE KODUNUZ' : 'BAŞVURU REFERANSINIZ'}
            </Text>
            <Text style={styles.codeValue}>
              {profile.member_code ?? `GT-REF-${profile.id.slice(0, 8).toUpperCase()}`}
            </Text>
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

        {incomplete && (
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Başvuru bilgilerini tamamla"
          >
            <Text style={styles.completeText}>BAŞVURUNUZU TAMAMLAYIN →</Text>
            <Text style={styles.completeSub}>
              Başvuru bilgileriniz eksik. Tamamlanmayan başvurular değerlendirmeye alınamaz.
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.pullHint}>Onay durumunu yenilemek için aşağı çekin</Text>

        {/* Onay beklerken boş ekranda kalmasın: duyuru, etkinlik ve
            sürdürülebilirlik içeriği üye verisi içermiyor, güvenle
            gösterilebilir. Rehber ve bülten onaya bağlı kalır (RLS). */}
        <TouchableOpacity
          style={styles.browseBtn}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.8}
        >
          <Text style={styles.browseText}>DUYURU VE ETKİNLİKLERE GÖZ AT</Text>
        </TouchableOpacity>
        <Text style={styles.browseNote}>
          Üye rehberi ve bülten, üyeliğiniz onaylandığında açılacaktır.
        </Text>

        <TouchableOpacity style={styles.signOutBtn} onPress={signOut} activeOpacity={0.7}>
          <Text style={styles.signOutText}>ÇIKIŞ YAP</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete} activeOpacity={0.7}>
          <Text style={styles.deleteText}>Başvurumu geri çek ve hesabımı sil</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: Colors.navy },
  content:      { flexGrow: 1, paddingHorizontal: 32, paddingTop: 64, paddingBottom: 40, alignItems: 'center' },
  completeBtn:  { borderWidth: 0.5, borderColor: Colors.gold, backgroundColor: 'rgba(217,200,150,0.07)', padding: 16, width: '100%', marginBottom: 20 },
  completeText: { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, fontWeight: '700', color: Colors.gold, letterSpacing: 1.5, marginBottom: 6 },
  completeSub:  { fontFamily: Fonts.jakarta, fontSize: 9.5, color: Colors.textMuted, lineHeight: 15 },
  pullHint:     { fontFamily: Fonts.jakarta, fontSize: 9, color: Colors.textMuted, marginBottom: 18 },
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
  browseBtn:  { backgroundColor: Colors.gold, paddingVertical: 14, paddingHorizontal: 28, marginBottom: 12 },
  browseText: { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, fontWeight: '700', color: Colors.navyDeep, letterSpacing: 2 },
  browseNote: { fontFamily: Fonts.jakarta, fontSize: 9, color: Colors.textMuted, textAlign: 'center', marginBottom: 24, lineHeight: 14 },
  signOutBtn: { borderWidth: 0.5, borderColor: Colors.goldLine, paddingVertical: 14, paddingHorizontal: 40 },
  signOutText:{ fontFamily: Fonts.jakarta, fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 2 },
  deleteBtn:  { marginTop: 14, paddingVertical: 8 },
  deleteText: { fontFamily: Fonts.jakarta, fontSize: 9, color: 'rgba(224,96,96,0.7)', letterSpacing: 0.5 },
});
