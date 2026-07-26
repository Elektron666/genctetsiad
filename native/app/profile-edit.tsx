import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, FontSize } from '@/theme';
import { useAuthContext } from '@/context/AuthContext';

// KVKK m.11 "verilerin düzeltilmesini isteme" hakkının uygulama içi
// karşılığı. Aydınlatma metninde bu hak taahhüt ediliyordu ancak
// kullanıcı kayıt sonrası hiçbir bilgisini değiştiremiyordu.
//
// Rol, üye kodu ve mentor işareti burada YOK — onlar RLS tarafından
// korunuyor (migration 006) ve yalnızca yönetim değiştirebilir.

const CITIES = ['İstanbul', 'Bursa', 'Denizli', 'Ankara', 'İzmir', 'Gaziantep', 'Kahramanmaraş', 'Uşak', 'Tekirdağ', 'Konya', 'Adana', 'Kayseri', 'Mersin'];
const SECTORS = ['Havlu & Bornoz', 'Yatak & Nevresim', 'Perde & Döşeme', 'Halı & Kilim', 'İplik & Örme', 'Teknik Tekstil', 'Diğer'];

export default function ProfileEditScreen() {
  const { profile, updateProfile, refreshProfile } = useAuthContext();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [company, setCompany] = useState(profile?.company ?? '');
  const [position, setPosition] = useState(profile?.position ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [sector, setSector] = useState(profile?.sector ?? '');
  const [busy, setBusy] = useState(false);

  const valid = fullName.trim().length > 2 && (email.trim() === '' || email.includes('@'));

  const save = async () => {
    if (!valid || busy) return;
    setBusy(true);
    const { error } = await updateProfile({
      full_name: fullName.trim(),
      email: email.trim() || null,
      company: company.trim() || null,
      position: position.trim() || null,
      city: city || null,
      sector: sector || null,
    });
    setBusy(false);

    if (error) {
      Alert.alert('Hata', 'Bilgiler kaydedilemedi. Lütfen tekrar deneyin.');
      return;
    }
    await refreshProfile();
    Alert.alert('Kaydedildi', 'Profil bilgileriniz güncellendi.', [
      { text: 'Tamam', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>PROFİLİ DÜZENLE</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <Text style={s.fieldLabel}>AD SOYAD</Text>
          <TextInput style={s.input} value={fullName} onChangeText={setFullName} placeholder="Adınız Soyadınız" placeholderTextColor={Colors.textMuted} autoCapitalize="words" />
          <View style={s.underline} />

          <Text style={[s.fieldLabel, { marginTop: 24 }]}>E-POSTA</Text>
          <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="ornek@firma.com" placeholderTextColor={Colors.textMuted} keyboardType="email-address" autoCapitalize="none" />
          <View style={s.underline} />

          <Text style={[s.fieldLabel, { marginTop: 24 }]}>FİRMA</Text>
          <TextInput style={s.input} value={company} onChangeText={setCompany} placeholder="Firma adı" placeholderTextColor={Colors.textMuted} />
          <View style={s.underline} />

          <Text style={[s.fieldLabel, { marginTop: 24 }]}>POZİSYON</Text>
          <TextInput style={s.input} value={position} onChangeText={setPosition} placeholder="Genel Müdür, Satış Direktörü..." placeholderTextColor={Colors.textMuted} />
          <View style={s.underline} />

          <Text style={[s.fieldLabel, { marginTop: 24 }]}>ŞEHİR</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
            {CITIES.map(c => (
              <TouchableOpacity key={c} style={[s.pill, city === c && s.pillActive]} onPress={() => setCity(city === c ? '' : c)} activeOpacity={0.8}>
                <Text style={[s.pillText, city === c && s.pillTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[s.fieldLabel, { marginTop: 24 }]}>SEKTÖR</Text>
          <View style={s.pillGrid}>
            {SECTORS.map(sec => (
              <TouchableOpacity key={sec} style={[s.pill, sector === sec && s.pillActive]} onPress={() => setSector(sector === sec ? '' : sec)} activeOpacity={0.8}>
                <Text style={[s.pillText, sector === sec && s.pillTextActive]}>{sec}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Değiştirilemeyen alanlar — neden değiştirilemediği açıkça yazılı */}
          <View style={s.lockedBox}>
            <Text style={s.lockedHead}>DEĞİŞTİRİLEMEYEN BİLGİLER</Text>
            <View style={s.lockedRow}>
              <Text style={s.lockedKey}>TELEFON</Text>
              <Text style={s.lockedVal}>{profile?.phone ?? '—'}</Text>
            </View>
            <View style={s.lockedRow}>
              <Text style={s.lockedKey}>ÜYE KODU</Text>
              <Text style={s.lockedVal}>{profile?.member_code ?? 'Onay bekliyor'}</Text>
            </View>
            <Text style={s.lockedNote}>
              Telefon numaranız kimlik doğrulamada kullanıldığı için, üye kodunuz ve
              üyelik tipiniz ise dernek kayıtlarına bağlı olduğu için buradan
              değiştirilemez. Değişiklik için info@tetsiad.org adresine yazabilirsiniz.
            </Text>
          </View>

          <TouchableOpacity style={[s.cta, (!valid || busy) && s.disabled]} onPress={save} disabled={!valid || busy} activeOpacity={0.8}>
            <Text style={s.ctaText}>{busy ? 'KAYDEDİLİYOR...' : 'KAYDET'}</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: Colors.navy },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, backgroundColor: Colors.navyDeep, borderBottomWidth: 0.5, borderBottomColor: Colors.goldLine },
  backBtn:     { width: 32, height: 32, justifyContent: 'center' },
  backText:    { fontFamily: Fonts.cormorant, fontSize: 24, color: Colors.gold },
  headerTitle: { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted, letterSpacing: 2 },
  scroll:      { paddingHorizontal: 24, paddingTop: 28 },

  fieldLabel:  { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 2, fontWeight: '600', marginBottom: 10 },
  input:       { fontFamily: Fonts.cormorant, fontSize: 20, color: Colors.ivory, paddingBottom: 8, paddingTop: 0 },
  underline:   { height: 0.5, backgroundColor: Colors.goldLine },

  pill:           { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 0.5, borderColor: Colors.goldLine, marginRight: 8, marginTop: 8 },
  pillActive:     { backgroundColor: Colors.gold, borderColor: Colors.gold },
  pillText:       { fontFamily: Fonts.jakarta, fontSize: 10, color: Colors.textMuted, letterSpacing: 0.5 },
  pillTextActive: { color: Colors.navyDeep, fontWeight: '600' },
  pillGrid:       { flexDirection: 'row', flexWrap: 'wrap' },

  lockedBox:   { marginTop: 32, borderWidth: 0.5, borderColor: Colors.goldLine, padding: 16, backgroundColor: Colors.navyMid },
  lockedHead:  { fontFamily: Fonts.jakarta, fontSize: 8, letterSpacing: 2, color: Colors.gold, fontWeight: '700', marginBottom: 12 },
  lockedRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: Colors.goldLine },
  lockedKey:   { fontFamily: Fonts.mono, fontSize: 8, color: Colors.textMuted, letterSpacing: 1.5 },
  lockedVal:   { fontFamily: Fonts.jakarta, fontSize: 11, color: Colors.ivory },
  lockedNote:  { fontFamily: Fonts.jakarta, fontSize: 9, color: Colors.textMuted, lineHeight: 15, marginTop: 12 },

  cta:         { backgroundColor: Colors.gold, paddingVertical: 16, alignItems: 'center', marginTop: 32 },
  ctaText:     { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, fontWeight: '700', color: Colors.navyDeep, letterSpacing: 3 },
  disabled:    { opacity: 0.4 },
});
