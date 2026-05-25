import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Animated, Share, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, FontSize } from '@/theme';
import { useAuthContext } from '@/context/AuthContext';

const TOTAL_STEPS = 5;

const CITIES = ['Ankara', 'İstanbul', 'İzmir', 'Bursa', 'Gaziantep', 'Konya', 'Adana', 'Kayseri', 'Mersin', 'Denizli', 'Tekirdağ', 'Antalya', 'Eskişehir', 'Samsun', 'Trabzon', 'Diyarbakır'];

const SECTORS = [
  // Üretim
  'Kumaş Üreticisi',
  'Döşemelik Kumaş Üreticisi',
  'Perdelik Kumaş Üreticisi',
  'Havlu & Bornoz Üreticisi',
  'Yatak & Nevresim Üreticisi',
  'Perde & Tül Üreticisi',
  'Halı & Kilim Üreticisi',
  'Battaniye & Pike Üreticisi',
  'Banyo Tekstili',
  'Mutfak & Sofra Tekstili',
  'Bebek & Çocuk Tekstili',
  'Masa Örtüsü & Runner',
  // Ticaret
  'Kumaş Mağazası',
  'Ev Tekstili Mağazası',
  'Toptan & Dağıtım',
  'İhracat & Dış Ticaret',
  'E-ticaret & Online Satış',
  // Hizmet & Yan sanayi
  'Tasarım & Marka',
  'Dijital & Tekstil Baskı',
  'Boyama & Apre',
  'İplik & Hammadde',
  'Aksesuar (Fermuar, Düğme, Etiket)',
  'Teknik & Endüstriyel Tekstil',
  'Lojistik & Tedarik Zinciri',
  'Diğer',
];

function ProgressBar({ step }: { step: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: step / TOTAL_STEPS,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [step]);

  return (
    <View style={pb.wrap}>
      <View style={pb.track}>
        <Animated.View style={[pb.fill, { flex: anim }]} />
        <Animated.View style={{ flex: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }} />
      </View>
      <Text style={pb.label}>{step} / {TOTAL_STEPS}</Text>
    </View>
  );
}

const pb = StyleSheet.create({
  wrap:  { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 10 },
  track: { flexDirection: 'row', height: 1.5, backgroundColor: Colors.goldLine, marginBottom: 6 },
  fill:  { backgroundColor: Colors.gold },
  label: { fontFamily: Fonts.mono, fontSize: 7, color: Colors.textMuted, letterSpacing: 2, textAlign: 'right' },
});

export default function RegisterScreen() {
  const { sendOtp, verifyOtp, updateProfile } = useAuthContext();

  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [firm, setFirm] = useState('');
  const [city, setCity] = useState('');
  const [sector, setSector] = useState('');
  const [position, setPosition] = useState('');
  const [memberType, setMemberType] = useState<'student' | 'company'>('company');
  const [kvkkChecked, setKvkkChecked] = useState(false);
  const [memberCode, setMemberCode] = useState('');
  const [codeAnim] = useState(new Animated.Value(0));
  const otpRefs = Array.from({ length: 6 }, () => useRef<TextInput>(null));

  const handleOtpSend = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) return;
    setOtpLoading(true);
    const error = await sendOtp(digits);
    setOtpLoading(false);
    if (error) {
      Alert.alert('Hata', error.message ?? 'SMS gönderilemedi.');
    }
  };

  const handleOtp = async (val: string, i: number) => {
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) otpRefs[i + 1].current?.focus();
    if (next.every(d => d)) {
      setOtpLoading(true);
      const error = await verifyOtp(phone, next.join(''));
      setOtpLoading(false);
      if (error) {
        Alert.alert('Hata', 'Kod hatalı. Tekrar deneyin.');
        setOtp(['', '', '', '', '', '']);
        otpRefs[0].current?.focus();
        return;
      }
      setTimeout(() => setStep(2), 300);
    }
  };

  const generateCode = () => {
    const num = Math.floor(10000 + Math.random() * 90000);
    return `GT-2026-${num}`;
  };

  const next = async () => {
    if (step === TOTAL_STEPS) {
      const { error } = await updateProfile({
        full_name: `${firstName} ${lastName}`.trim(),
        email,
        company: firm,
        city,
        sector,
        position,
        role: 'pending',
      });
      if (error) {
        Alert.alert('Hata', 'Başvuru kaydedilemedi. Tekrar deneyin.');
        return;
      }
      setMemberCode(generateCode()); // local display only; real code assigned by DB trigger
      setStep(6);
      Animated.timing(codeAnim, { toValue: 1, duration: 1200, useNativeDriver: true }).start();
    } else {
      setStep(s => s + 1);
    }
  };

  const canNext = () => {
    if (step === 2) return firstName.trim().length > 1 && lastName.trim().length > 1 && email.includes('@');
    if (step === 3) return firm.trim().length > 1 && city.length > 0 && sector.length > 0;
    if (step === 5) return kvkkChecked;
    return true;
  };

  return (
    <SafeAreaView style={s.safeArea}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => step > 1 && step < 6 ? setStep(p => p - 1) : router.back()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>ÜYELİK BAŞVURUSU</Text>
        <View style={{ width: 32 }} />
      </View>

      {step < 6 && <ProgressBar step={step} />}

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── ADIM 1: Telefon OTP ─────────────────────────── */}
          {step === 1 && (
            <View style={s.stepWrap}>
              <Text style={s.stepNum}>01</Text>
              <Text style={s.stepTitle}>Telefon Doğrulama</Text>
              <Text style={s.stepSub}>Kayıt sürecine başlamak için telefon numaranızı doğrulayın.</Text>

              <View style={s.rule} />

              <Text style={s.fieldLabel}>TELEFON NUMARASI</Text>
              <View style={s.phoneRow}>
                <Text style={s.cc}>+90</Text>
                <TextInput
                  style={s.phoneInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="5__ ___ __ __"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                  maxLength={13}
                />
              </View>
              <View style={s.underline} />

              <View style={{ height: 32 }} />
              <Text style={s.fieldLabel}>DOĞRULAMA KODU</Text>
              <TouchableOpacity
                style={[s.ctaButton, { marginBottom: 16 }, phone.replace(/\D/g,'').length < 10 && s.ctaDisabled]}
                onPress={handleOtpSend}
                activeOpacity={0.8}
                disabled={otpLoading}
              >
                <Text style={s.ctaText}>{otpLoading ? 'GÖNDERİLİYOR...' : 'KOD GÖNDER'}</Text>
              </TouchableOpacity>

              <Text style={s.fieldLabel}>DOĞRULAMA KODU</Text>
              <View style={s.otpRow}>
                {otp.map((d, i) => (
                  <TextInput
                    key={i}
                    ref={otpRefs[i]}
                    style={[s.otpBox, d && s.otpFilled]}
                    value={d}
                    onChangeText={v => handleOtp(v, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    editable={!otpLoading}
                  />
                ))}
              </View>
              <Text style={s.helper}>Telefon numaranıza 6 haneli SMS kodu gönderilecektir.</Text>
            </View>
          )}

          {/* ── ADIM 2: Kişisel Bilgiler ─────────────────── */}
          {step === 2 && (
            <View style={s.stepWrap}>
              <Text style={s.stepNum}>02</Text>
              <Text style={s.stepTitle}>Kişisel Bilgiler</Text>
              <Text style={s.stepSub}>Platformdaki profiliniz için temel bilgileriniz.</Text>
              <View style={s.rule} />

              {[
                { label: 'AD', value: firstName, set: setFirstName, placeholder: 'Adınız' },
                { label: 'SOYAD', value: lastName, set: setLastName, placeholder: 'Soyadınız' },
                { label: 'E-POSTA', value: email, set: setEmail, placeholder: 'ornek@firma.com', keyboard: 'email-address' as const },
              ].map(f => (
                <View key={f.label} style={s.fieldWrap}>
                  <Text style={s.fieldLabel}>{f.label}</Text>
                  <TextInput
                    style={s.textInput}
                    value={f.value}
                    onChangeText={f.set}
                    placeholder={f.placeholder}
                    placeholderTextColor={Colors.textMuted}
                    keyboardType={f.keyboard ?? 'default'}
                    autoCapitalize="words"
                  />
                  <View style={s.underline} />
                </View>
              ))}
            </View>
          )}

          {/* ── ADIM 3: Firma Bilgileri ───────────────────── */}
          {step === 3 && (
            <View style={s.stepWrap}>
              <Text style={s.stepNum}>03</Text>
              <Text style={s.stepTitle}>Firma Bilgileri</Text>
              <Text style={s.stepSub}>Sektördeki konumunuzu belirtin.</Text>
              <View style={s.rule} />

              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>FİRMA ADI</Text>
                <TextInput style={s.textInput} value={firm} onChangeText={setFirm} placeholder="Firma adı" placeholderTextColor={Colors.textMuted} />
                <View style={s.underline} />
              </View>

              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>POZİSYON</Text>
                <TextInput style={s.textInput} value={position} onChangeText={setPosition} placeholder="Genel Müdür, Satış Direktörü..." placeholderTextColor={Colors.textMuted} />
                <View style={s.underline} />
              </View>

              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>ŞEHİR</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillScroll}>
                  {CITIES.map(c => (
                    <TouchableOpacity key={c} style={[s.pill, city === c && s.pillActive]} onPress={() => setCity(c)}>
                      <Text style={[s.pillText, city === c && s.pillTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>SEKTÖR</Text>
                <View style={s.pillGrid}>
                  {SECTORS.map(sec => (
                    <TouchableOpacity key={sec} style={[s.pill, sector === sec && s.pillActive]} onPress={() => setSector(sec)}>
                      <Text style={[s.pillText, sector === sec && s.pillTextActive]}>{sec}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* ── ADIM 4: Üye Tipi ─────────────────────────── */}
          {step === 4 && (
            <View style={s.stepWrap}>
              <Text style={s.stepNum}>04</Text>
              <Text style={s.stepTitle}>Üyelik Tipi</Text>
              <Text style={s.stepSub}>Hangi kategoride yer alıyorsunuz?</Text>
              <View style={s.rule} />

              <View style={s.typeRow}>
                <TouchableOpacity
                  style={[s.typeCard, memberType === 'company' && s.typeCardActive]}
                  onPress={() => setMemberType('company')}
                  activeOpacity={0.8}
                >
                  <Text style={s.typeIcon}>◆</Text>
                  <Text style={[s.typeLabel, memberType === 'company' && s.typeLabelActive]}>ŞİRKET</Text>
                  <Text style={s.typeDesc}>Tekstil sektöründe aktif firma temsilcisi veya yönetici</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.typeCard, memberType === 'student' && s.typeCardActive]}
                  onPress={() => setMemberType('student')}
                  activeOpacity={0.8}
                >
                  <Text style={s.typeIcon}>◈</Text>
                  <Text style={[s.typeLabel, memberType === 'student' && s.typeLabelActive]}>ÜNİVERSİTE</Text>
                  <Text style={s.typeDesc}>Tekstil, tasarım veya işletme bölümü öğrencisi</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── ADIM 5: KVKK ─────────────────────────────── */}
          {step === 5 && (
            <View style={s.stepWrap}>
              <Text style={s.stepNum}>05</Text>
              <Text style={s.stepTitle}>KVKK Onayı</Text>
              <Text style={s.stepSub}>Başvurunuzu tamamlamak için aydınlatma metnini onaylayın.</Text>
              <View style={s.rule} />

              <ScrollView style={s.kvkkBox} nestedScrollEnabled>
                <Text style={s.kvkkText}>
                  TETSİAD Tekstil Sanayicileri ve İşadamları Derneği olarak kişisel verilerinizi 6698 sayılı KVKK kapsamında işlemekteyiz.{'\n\n'}
                  Toplanan veriler: Ad, soyad, telefon, e-posta, firma bilgileri, üyelik durumu ve platform kullanım verileri.{'\n\n'}
                  Amaç: Üyelik yönetimi, etkinlik bildirimleri, sektörel iletişim ve platform geliştirilmesi.{'\n\n'}
                  Verileriniz üçüncü taraflarla paylaşılmaz. Haklarınız hakkında info@tetsiad.org adresine başvurabilirsiniz.{'\n\n'}
                  Saklama süresi: Üyelik süresi boyunca ve sonrasında yasal zorunluluklar dahilinde 10 yıl.
                </Text>
              </ScrollView>

              <TouchableOpacity style={s.checkRow} onPress={() => setKvkkChecked(v => !v)} activeOpacity={0.7}>
                <View style={[s.checkbox, kvkkChecked && s.checkboxChecked]}>
                  {kvkkChecked && <Text style={s.checkmark}>✓</Text>}
                </View>
                <Text style={s.checkLabel}>
                  Aydınlatma metnini okudum, kişisel verilerimin işlenmesini onaylıyorum.
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── ADIM 6: Sonuç ────────────────────────────── */}
          {step === 6 && (
            <View style={[s.stepWrap, { alignItems: 'center', paddingTop: 48 }]}>
              <View style={s.successDot} />
              <Text style={s.successTitle}>Başvurunuz{'\n'}Alındı</Text>
              <View style={s.rule} />
              <Text style={s.successSub}>
                Üyelik başvurunuz komisyon tarafından değerlendirmeye alınmıştır. Onay süreciniz 3-5 iş günü içinde tamamlanacaktır.
              </Text>

              <View style={s.codeWrap}>
                <Text style={s.codeLabel}>ÜYELİK BAŞVURU KODUNUZ</Text>
                <Animated.Text style={[s.codeValue, { opacity: codeAnim }]}>
                  {memberCode}
                </Animated.Text>
              </View>

              <Text style={s.successNote}>
                Bu kodu kaydedin. Başvuru durumunuzu sorgulamak için kullanabilirsiniz.
              </Text>

              <TouchableOpacity
                style={[s.ctaButton, s.ctaOutline, { marginTop: 24, width: '100%' }]}
                onPress={() => Share.share({ message: memberCode })}
                activeOpacity={0.8}
              >
                <Text style={[s.ctaText, { color: Colors.gold }]}>KODU PAYLAŞ / KOPYALA</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.ctaButton, { marginTop: 10, width: '100%' }]}
                onPress={() => router.replace('/(auth)/login')}
                activeOpacity={0.8}
              >
                <Text style={s.ctaText}>GİRİŞ EKRANINA DÖN</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Next button */}
      {step > 1 && step < 6 && (
        <View style={s.bottomBar}>
          <TouchableOpacity
            style={[s.ctaButton, !canNext() && s.ctaDisabled]}
            onPress={next}
            activeOpacity={0.8}
            disabled={!canNext()}
          >
            <Text style={s.ctaText}>
              {step === TOTAL_STEPS ? 'BAŞVURUYU TAMAMLA' : 'DEVAM ET'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea:       { flex: 1, backgroundColor: Colors.navy },
  flex:           { flex: 1 },
  scroll:         { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 16 },

  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  backBtn:        { width: 32, height: 32, justifyContent: 'center' },
  backText:       { fontFamily: Fonts.cormorant, fontSize: 24, color: Colors.gold },
  headerTitle:    { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted, letterSpacing: 2 },

  stepWrap:       { paddingTop: 24 },
  stepNum:        { fontFamily: Fonts.mono, fontSize: 10, color: Colors.gold, letterSpacing: 2, marginBottom: 6 },
  stepTitle:      { fontFamily: Fonts.cormorant, fontStyle: 'italic', fontSize: 32, color: Colors.ivory, fontWeight: '300', marginBottom: 8 },
  stepSub:        { fontFamily: Fonts.jakarta, fontSize: 11, color: Colors.textMuted, lineHeight: 17 },
  rule:           { height: 0.5, backgroundColor: Colors.goldLine, marginVertical: 24 },

  fieldWrap:      { marginBottom: 24 },
  fieldLabel:     { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 2, fontWeight: '600', marginBottom: 10 },
  textInput:      { fontFamily: Fonts.cormorant, fontSize: 20, color: Colors.ivory, paddingBottom: 8, paddingTop: 0 },
  underline:      { height: 0.5, backgroundColor: Colors.goldLine },
  helper:         { fontFamily: Fonts.jakarta, fontSize: 9, color: Colors.textMuted, marginTop: 12 },

  phoneRow:       { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  cc:             { fontFamily: Fonts.cormorant, fontStyle: 'italic', fontSize: 24, color: Colors.gold, paddingBottom: 8 },
  phoneInput:     { flex: 1, fontFamily: Fonts.cormorant, fontSize: 24, color: Colors.ivory, paddingBottom: 8 },

  otpRow:         { flexDirection: 'row', gap: 12, marginBottom: 16 },
  otpBox:         { width: 64, height: 76, borderWidth: 0.5, borderColor: Colors.goldLine, backgroundColor: Colors.navyMid, fontFamily: Fonts.cormorant, fontSize: 30, color: Colors.ivory, textAlign: 'center' },
  otpFilled:      { borderColor: Colors.gold },

  pillScroll:     { marginTop: 4 },
  pillGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  pill:           { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 0.5, borderColor: Colors.goldLine, marginRight: 8 },
  pillActive:     { backgroundColor: Colors.gold, borderColor: Colors.gold },
  pillText:       { fontFamily: Fonts.jakarta, fontSize: 10, color: Colors.textMuted, letterSpacing: 0.5 },
  pillTextActive: { color: Colors.navyDeep, fontWeight: '600' },

  typeRow:        { flexDirection: 'row', gap: 12 },
  typeCard:       { flex: 1, padding: 20, borderWidth: 0.5, borderColor: Colors.goldLine, alignItems: 'center' },
  typeCardActive: { borderColor: Colors.gold, backgroundColor: Colors.navyMid },
  typeIcon:       { fontSize: 20, color: Colors.gold, marginBottom: 12 },
  typeLabel:      { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted, letterSpacing: 2, marginBottom: 10 },
  typeLabelActive:{ color: Colors.gold },
  typeDesc:       { fontFamily: Fonts.jakarta, fontSize: 9, color: Colors.textMuted, textAlign: 'center', lineHeight: 14 },

  kvkkBox:        { maxHeight: 220, borderWidth: 0.5, borderColor: Colors.goldLine, padding: 16, marginBottom: 20 },
  kvkkText:       { fontFamily: Fonts.jakarta, fontSize: 10, color: Colors.textMuted, lineHeight: 16 },
  checkRow:       { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  checkbox:       { width: 20, height: 20, borderWidth: 0.5, borderColor: Colors.goldLine, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxChecked:{ backgroundColor: Colors.gold, borderColor: Colors.gold },
  checkmark:      { fontFamily: Fonts.jakarta, fontSize: 12, color: Colors.navyDeep, fontWeight: '700' },
  checkLabel:     { flex: 1, fontFamily: Fonts.jakarta, fontSize: 10, color: Colors.textMuted, lineHeight: 16 },

  successDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.gold, marginBottom: 24 },
  successTitle:   { fontFamily: Fonts.cormorant, fontStyle: 'italic', fontSize: 38, color: Colors.ivory, fontWeight: '300', textAlign: 'center', lineHeight: 44, marginBottom: 8 },
  successSub:     { fontFamily: Fonts.jakarta, fontSize: 11, color: Colors.textMuted, textAlign: 'center', lineHeight: 18, marginBottom: 32 },
  codeWrap:       { borderWidth: 0.5, borderColor: Colors.gold, padding: 24, alignItems: 'center', width: '100%' },
  codeLabel:      { fontFamily: Fonts.mono, fontSize: 7, color: Colors.textMuted, letterSpacing: 2, marginBottom: 14 },
  codeValue:      { fontFamily: Fonts.mono, fontSize: 20, color: Colors.gold, letterSpacing: 3 },
  successNote:    { fontFamily: Fonts.jakarta, fontSize: 10, color: Colors.textMuted, textAlign: 'center', lineHeight: 16, marginTop: 20 },

  bottomBar:      { paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 8 : 16, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: Colors.goldLine },
  ctaButton:      { backgroundColor: Colors.gold, paddingVertical: 16, alignItems: 'center' },
  ctaOutline:     { backgroundColor: 'transparent', borderWidth: 0.5, borderColor: Colors.gold },
  ctaDisabled:    { opacity: 0.4 },
  ctaText:        { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, fontWeight: '700', color: Colors.navyDeep, letterSpacing: 3 },
});
