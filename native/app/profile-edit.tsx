import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, BackHandler,
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

const CITIES = ['İstanbul', 'Bursa', 'Denizli', 'Ankara', 'İzmir', 'Gaziantep', 'Kahramanmaraş', 'Uşak', 'Tekirdağ', 'Konya', 'Adana', 'Kayseri', 'Mersin', 'Diğer'];
const SECTORS = ['Havlu & Bornoz', 'Yatak & Nevresim', 'Perde & Döşeme', 'Halı & Kilim', 'İplik & Örme', 'Teknik Tekstil', 'Diğer'];

export default function ProfileEditScreen() {
  const { profile, session, updateProfile, refreshProfile } = useAuthContext();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [company, setCompany] = useState(profile?.company ?? '');
  const [position, setPosition] = useState(profile?.position ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [sector, setSector] = useState(profile?.sector ?? '');
  const [mentorBio, setMentorBio] = useState(profile?.mentor_bio ?? '');
  // KVKK m.11: üye kendi iletişim bilgisinin görünürlüğünü seçebilmeli.
  // "İsteyen üye adresini görünür kılar" tasarımı vardı ama böyle bir
  // anahtar yoktu; herkesin numarası tüm onaylı üyelere açıktı.
  const [phoneVisible, setPhoneVisible] = useState(profile?.phone_visible !== false);
  const [busy, setBusy] = useState(false);

  const emailOk = email.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const valid = fullName.trim().length > 2 && emailOk;

  const dirty =
    fullName !== (profile?.full_name ?? '') ||
    email !== (profile?.email ?? '') ||
    phone !== (profile?.phone ?? '') ||
    company !== (profile?.company ?? '') ||
    position !== (profile?.position ?? '') ||
    city !== (profile?.city ?? '') ||
    sector !== (profile?.sector ?? '') ||
    mentorBio !== (profile?.mentor_bio ?? '') ||
    phoneVisible !== (profile?.phone_visible !== false);

  // Geri tuşu kaydedilmemiş değişiklikleri sessizce siliyordu.
  const goBack = React.useCallback(() => {
    if (!dirty) { router.back(); return true; }
    Alert.alert('Değişiklikler kaydedilmedi', 'Çıkarsanız yaptığınız düzenlemeler kaybolur.', [
      { text: 'Düzenlemeye devam et', style: 'cancel' },
      { text: 'Çık', style: 'destructive', onPress: () => router.back() },
    ]);
    return true;
  }, [dirty]);

  React.useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', goBack);
    return () => sub.remove();
  }, [goBack]);

  const save = async () => {
    if (!valid || busy) return;
    setBusy(true);
    const { error } = await updateProfile({
      full_name: fullName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      phone_visible: phoneVisible,
      company: company.trim() || null,
      position: position.trim() || null,
      city: city || null,
      sector: sector || null,
      ...(profile?.is_mentor ? { mentor_bio: mentorBio.trim() || null } : {}),
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
        <TouchableOpacity onPress={goBack} style={s.backBtn} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Geri">
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

          <Text style={[s.fieldLabel, { marginTop: 24 }]}>E-POSTA (REHBERDE GÖRÜNEN)</Text>
          <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="ornek@firma.com" placeholderTextColor={Colors.textMuted} keyboardType="email-address" autoCapitalize="none" />
          <View style={s.underline} />

          {/* Telefon, rehberde her üyeye görünen alan. KVKK m.11 düzeltme
              hakkının en çok işe yaradığı yer burasıydı ama düzenlenemiyordu. */}
          <Text style={[s.fieldLabel, { marginTop: 24 }]}>TELEFON</Text>
          <TextInput style={s.input} value={phone} onChangeText={setPhone} placeholder="+90 5__ ___ __ __" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />
          <View style={s.underline} />

          <TouchableOpacity
            style={s.toggleRow}
            onPress={() => setPhoneVisible(v => !v)}
            activeOpacity={0.7}
            accessibilityRole="switch"
            accessibilityState={{ checked: phoneVisible }}
            accessibilityLabel="Telefon numaram rehberde görünsün"
          >
            <View style={[s.checkbox, phoneVisible && s.checkboxOn]}>
              {phoneVisible && <Text style={s.checkmark}>✓</Text>}
            </View>
            <Text style={s.toggleLabel}>
              Telefon numaram üye rehberinde görünsün.{'\n'}
              <Text style={{ color: Colors.textMuted }}>
                Kapatırsanız diğer üyeler size yalnızca e-posta ile ulaşabilir.
              </Text>
            </Text>
          </TouchableOpacity>

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

          {/* Mentor tanıtımı — yönetim bir üyeyi mentor yapıyordu ama
              üye kendi tanıtımını YAZAMIYORDU; mentor kartı sektör
              alanına düşüyordu. */}
          {profile?.is_mentor && (
            <>
              <Text style={[s.fieldLabel, { marginTop: 24 }]}>MENTOR TANITIMINIZ</Text>
              <TextInput
                style={[s.input, { minHeight: 80, paddingTop: 6 }]}
                value={mentorBio}
                onChangeText={setMentorBio}
                placeholder="Hangi konularda mentorluk verebilirsiniz?"
                placeholderTextColor={Colors.textMuted}
                multiline
                textAlignVertical="top"
                maxLength={300}
              />
              <View style={s.underline} />
              <Text style={s.helperNote}>{mentorBio.length} / 300 · mentör listesinde görünür</Text>
            </>
          )}

          {/* Değiştirilemeyen alanlar — neden değiştirilemediği açıkça yazılı */}
          <View style={s.lockedBox}>
            <Text style={s.lockedHead}>DEĞİŞTİRİLEMEYEN BİLGİLER</Text>
            <View style={s.lockedRow}>
              <Text style={s.lockedKey}>ÜYE KODU</Text>
              <Text style={s.lockedVal}>{profile?.member_code ?? 'Onay bekliyor'}</Text>
            </View>
            <View style={s.lockedRow}>
              <Text style={s.lockedKey}>GİRİŞ E-POSTASI</Text>
              <Text style={s.lockedVal}>{session?.user?.email ?? '—'}</Text>
            </View>
            <Text style={s.lockedNote}>
              Üye kodunuz ve üyelik rolünüz dernek kayıtlarına bağlı olduğu için
              buradan değiştirilemez. Giriş e-postanız kimlik doğrulamada
              kullanıldığından ayrıca değiştirilir — yukarıdaki e-posta alanı
              yalnızca rehberde görünen adrestir. Değişiklik için
              info@tetsiad.org adresine yazabilirsiniz.
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
  toggleRow:   { flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginTop: 20 },
  checkbox:    { width: 20, height: 20, borderWidth: 0.5, borderColor: Colors.goldLine, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxOn:  { backgroundColor: Colors.gold, borderColor: Colors.gold },
  checkmark:   { fontFamily: Fonts.jakarta, fontSize: 12, color: Colors.navyDeep, fontWeight: '700' },
  toggleLabel: { flex: 1, fontFamily: Fonts.jakarta, fontSize: 10, color: Colors.ivory, lineHeight: 16 },
  helperNote: { fontFamily: Fonts.jakarta, fontSize: 9, color: Colors.textMuted, marginTop: 6 },
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
