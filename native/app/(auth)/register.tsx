import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Animated, Share, Alert, BackHandler,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, FontSize } from '@/theme';
import { useAuthContext } from '@/context/AuthContext';
import { openExternal, PRIVACY_URL } from '@/lib/links';
import { authErrorTR } from '@/lib/errors';

const TOTAL_STEPS = 5;

const CITIES = ['İstanbul', 'Bursa', 'Denizli', 'Ankara', 'İzmir', 'Gaziantep', 'Kahramanmaraş', 'Uşak', 'Tekirdağ', 'Konya', 'Adana', 'Kayseri', 'Mersin', 'Diğer'];
const SECTORS = ['Havlu & Bornoz', 'Yatak & Nevresim', 'Perde & Döşeme', 'Halı & Kilim', 'İplik & Örme', 'Teknik Tekstil', 'Diğer'];

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
  const { sendEmailOtp, verifyEmailOtp, updateProfile, session, profile } = useAuthContext();

  // Zaten oturum açmışsa doğrulama adımı atlanır. Bu, yarım kalan
  // kaydı KURTARIR: 1. adımda kod doğrulanınca kullanıcı giriş yapmış
  // olur; 2. adımda vazgeçerse boş bir profille onay ekranına düşüyor ve
  // kaydı tamamlamanın hiçbir yolu kalmıyordu.
  const [step, setStep] = useState(session?.user ? 2 : 1);
  const [phone, setPhone] = useState((profile?.phone ?? '').replace(/^\+90/, ''));
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const verifyingRef = useRef(false);
  const nameParts = (profile?.full_name ?? '').trim().split(' ');
  const [firstName, setFirstName] = useState(nameParts.slice(0, -1).join(' ') || nameParts[0] || '');
  const [lastName, setLastName] = useState(nameParts.length > 1 ? nameParts[nameParts.length - 1] : '');
  const [email, setEmail] = useState(profile?.email ?? session?.user?.email ?? '');
  const [firm, setFirm] = useState(profile?.company ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [sector, setSector] = useState(profile?.sector ?? '');
  const [position, setPosition] = useState(profile?.position ?? '');
  const [memberType, setMemberType] = useState<'student' | 'company'>('company');
  const [kvkkChecked, setKvkkChecked] = useState(false);
  const [transferConsent, setTransferConsent] = useState(false);
  const [memberCode, setMemberCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [codeAnim] = useState(new Animated.Value(0));
  // useRef bir döngü/geri çağırma içinde çağrılıyordu — uzunluk sabit
  // olduğu için çalışıyordu ama hook kuralı ihlali; tek bir ref dizisi
  // hem doğru hem daha ucuz.
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleOtpSend = async () => {
    if (!emailValid) return;
    setOtpLoading(true);
    const error = await sendEmailOtp(email);
    setOtpLoading(false);
    if (error) {
      Alert.alert('Kod gönderilemedi', authErrorTR(error));
      return;
    }
    setOtpSent(true);
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  const handleOtp = async (val: string, i: number) => {
    const digits = val.replace(/\D/g, '');
    const next = [...otp];

    // Yapıştırma desteği — bkz. login.tsx
    if (digits.length > 1) {
      for (let k = 0; k < 6 - i; k++) next[i + k] = digits[k] ?? '';
      setOtp(next);
      otpRefs.current[Math.min(i + digits.length, 5)]?.focus();
    } else {
      next[i] = digits.slice(-1);
      setOtp(next);
      if (digits && i < 5) otpRefs.current[i + 1]?.focus();
    }

    if (next.every(d => d) && !verifyingRef.current) {
      verifyingRef.current = true;
      setOtpLoading(true);
      const error = await verifyEmailOtp(email, next.join(''));
      setOtpLoading(false);
      verifyingRef.current = false;
      if (error) {
        Alert.alert('Doğrulanamadı', authErrorTR(error));
        setOtp(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
        return;
      }
      setTimeout(() => setStep(2), 300);
    }
  };

  const next = async () => {
    if (step === TOTAL_STEPS) {
      if (submitting) return;
      setSubmitting(true);
      // Üyelik tipi ve KVKK onayları artık KAYDEDİLİYOR.
      // Daha önce 4. adımdaki seçim ve iki açık rıza kutusu hiçbir yere
      // yazılmıyordu: KVKK denetiminde rızayı KANITLAMAK gerekir ve
      // kullanıcının seçtiği üyelik tipi tamamen çöpe gidiyordu.
      const now = new Date().toISOString();
      const { error } = await updateProfile({
        full_name: `${firstName} ${lastName}`.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() ? `+90${phone.replace(/\D/g, '').replace(/^0+/, '')}` : null,
        company: firm,
        city,
        sector,
        position,
        member_type: memberType,
        kvkk_accepted_at: kvkkChecked ? now : null,
        transfer_consent_at: transferConsent ? now : null,
        role: 'pending',
         
      } as any);
      setSubmitting(false);
      if (error) {
        Alert.alert('Hata', 'Başvuru kaydedilemedi. Tekrar deneyin.');
        return;
      }
      // Gerçek, sorgulanabilir referans: kullanıcının Supabase kimliğinden türetilir.
      // Asıl üye kodu (GT-YYYY-XXXXX) onay anında DB trigger'ı tarafından atanır.
      const ref = session?.user.id
        ? `GT-REF-${session.user.id.slice(0, 8).toUpperCase()}`
        : 'GT-REF-BAŞVURU';
      setMemberCode(ref);
      setStep(6);
      Animated.timing(codeAnim, { toValue: 1, duration: 1200, useNativeDriver: true }).start();
    } else {
      setStep(s => s + 1);
    }
  };

  // Donanım geri tuşu tüm akışı terk ediyordu: 5 adım doldurup geri
  // tuşuna basan kullanıcı her şeyi kaybediyordu.
  const goBack = React.useCallback(() => {
    const first = session?.user ? 2 : 1;
    if (step > first && step < 6) { setStep(p => p - 1); return true; }
    if (step >= 6) { router.replace('/(auth)/login'); return true; }
    if (firstName || lastName || firm) {
      Alert.alert('Başvurudan çıkılsın mı?', 'Girdiğiniz bilgiler kaydedilmeyecek.', [
        { text: 'Devam et', style: 'cancel' },
        { text: 'Çık', style: 'destructive', onPress: () => router.back() },
      ]);
      return true;
    }
    router.back();
    return true;
  }, [step, session, firstName, lastName, firm]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', goBack);
    return () => sub.remove();
  }, [goBack]);

  const canNext = () => {
    if (step === 2) return firstName.trim().length > 1 && lastName.trim().length > 1 && phone.replace(/\D/g, '').length >= 10;
    if (step === 3) return firm.trim().length > 1 && city.length > 0 && sector.length > 0;
    if (step === 5) return kvkkChecked && transferConsent;
    return true;
  };

  return (
    <SafeAreaView style={s.safeArea}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={goBack} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Geri">
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
              <Text style={s.stepTitle}>E-posta Doğrulama</Text>
              <Text style={s.stepSub}>Kayıt sürecine başlamak için e-posta adresinizi doğrulayın.</Text>

              <View style={s.rule} />

              <Text style={s.fieldLabel}>E-POSTA ADRESİ</Text>
              <TextInput
                style={s.phoneInput}
                value={email}
                onChangeText={setEmail}
                placeholder="ornek@firma.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={s.underline} />

              <View style={{ height: 32 }} />
              <TouchableOpacity
                style={[s.ctaButton, { marginBottom: 24 }, !emailValid && s.ctaDisabled]}
                onPress={handleOtpSend}
                activeOpacity={0.8}
                disabled={otpLoading || !emailValid}
              >
                <Text style={s.ctaText}>
                  {otpLoading ? 'GÖNDERİLİYOR...' : otpSent ? 'KODU TEKRAR GÖNDER' : 'KOD GÖNDER'}
                </Text>
              </TouchableOpacity>

              <Text style={s.fieldLabel}>DOĞRULAMA KODU</Text>
              <View style={[s.otpRow, !otpSent && { opacity: 0.35 }]}>
                {otp.map((d, i) => (
                  <TextInput
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    style={[s.otpBox, d && s.otpFilled]}
                    value={d}
                    onChangeText={v => handleOtp(v, i)}
                    keyboardType="number-pad"
                    autoComplete="sms-otp"
                    textContentType="oneTimeCode"
                    maxLength={6}
                    textAlign="center"
                    editable={otpSent && !otpLoading}
                  />
                ))}
              </View>
              <Text style={s.helper}>
                {otpSent
                  ? `${email.trim()} adresine gönderilen 6 haneli kodu girin.`
                  : 'E-posta adresinizi yazıp KOD GÖNDER butonuna basın.'}
              </Text>
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
                { label: 'TELEFON', value: phone, set: setPhone, placeholder: '5__ ___ __ __', keyboard: 'phone-pad' as const },
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
                  <Text style={s.kvkkHead}>VERİ SORUMLUSU{'\n'}</Text>
                  TETSİAD — Tekstil Sanayicileri ve İşadamları Derneği{'\n'}
                  info@tetsiad.org · +90 212 292 04 04{'\n\n'}

                  <Text style={s.kvkkHead}>İŞLENEN VERİLER{'\n'}</Text>
                  Ad, soyad, telefon numarası, e-posta adresi, firma adı, pozisyon, şehir, sektör; etkinlik katılımları, kurs kayıtları, mentorluk başvuruları ve bildirim izni verdiyseniz cihaz bildirim kimliği.{'\n\n'}

                  <Text style={s.kvkkHead}>AMAÇ VE HUKUKİ SEBEP{'\n'}</Text>
                  Üyelik başvurusunun değerlendirilmesi, üyelik kaydının yürütülmesi, etkinlik ve eğitim organizasyonu, üye rehberi ve duyuruların iletilmesi amaçlarıyla; KVKK m.5/2-c (sözleşmenin ifası) ve m.5/2-f (meşru menfaat) kapsamında, bildirim gönderimi için açık rızanıza dayanılarak işlenir.{'\n\n'}

                  <Text style={s.kvkkHead}>AKTARIM VE YURT DIŞI AKTARIM{'\n'}</Text>
                  Verileriniz pazarlama amacıyla kimseyle paylaşılmaz ve satılmaz. Hizmetin çalışması için şu tedarikçilere sınırlı teknik aktarım yapılır:{'\n'}
                  • Supabase — veritabanı barındırma (Almanya / Frankfurt){'\n'}
                  • Google Firebase & Expo — bildirim iletimi (ABD){'\n'}
                  • E-posta sağlayıcısı (Resend / Supabase) — doğrulama kodu iletimi (AB){'\n'}
                  • Sentry — teknik hata kayıtları (Almanya / AB). Yalnızca hata mesajı,
                  kod konumu, cihaz modeli ve uygulama sürümü gönderilir;
                  kimlik bilgisi, telefon numarası veya yazdığınız metinler
                  gönderilmez.{'\n'}
                  Bu tedarikçilerin sunucuları yurt dışında bulunduğundan, verileriniz KVKK m.9 kapsamında yurt dışına aktarılmaktadır. Bu aktarım için ayrıca açık rızanız alınmaktadır.{'\n\n'}

                  <Text style={s.kvkkHead}>SAKLAMA SÜRESİ{'\n'}</Text>
                  Verileriniz üyeliğiniz süresince saklanır. Hesabınızı uygulama içinden sildiğinizde tüm kişisel verileriniz derhâl ve kalıcı olarak silinir. Yalnızca yasal saklama yükümlülüğü bulunan kayıtlar ilgili mevzuattaki süre boyunca tutulur.{'\n\n'}

                  <Text style={s.kvkkHead}>HAKLARINIZ (KVKK m.11){'\n'}</Text>
                  Verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, işleme amacını öğrenme, aktarıldığı üçüncü kişileri bilme, düzeltilmesini veya silinmesini isteme, işlemeye itiraz etme ve zarara uğramanız hâlinde tazminat talep etme haklarına sahipsiniz. Başvurularınızı info@tetsiad.org adresine iletebilirsiniz.{'\n\n'}

                </Text>
                <TouchableOpacity onPress={() => openExternal(PRIVACY_URL)} activeOpacity={0.7}>
                  <Text style={[s.kvkkText, { color: Colors.gold, marginTop: 10 }]}>
                    Aydınlatma metninin tam hâlini okuyun →
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              <TouchableOpacity style={s.checkRow} onPress={() => setKvkkChecked(v => !v)} activeOpacity={0.7}>
                <View style={[s.checkbox, kvkkChecked && s.checkboxChecked]}>
                  {kvkkChecked && <Text style={s.checkmark}>✓</Text>}
                </View>
                <Text style={s.checkLabel}>
                  Aydınlatma metnini okudum; kişisel verilerimin yukarıdaki amaçlarla işlenmesini kabul ediyorum.
                </Text>
              </TouchableOpacity>

              {/* Yurt dışı aktarım KVKK m.9 gereği ayrı açık rıza ister —
                  aydınlatma onayıyla birleştirilemez. */}
              <TouchableOpacity style={[s.checkRow, { marginTop: 14 }]} onPress={() => setTransferConsent(v => !v)} activeOpacity={0.7}>
                <View style={[s.checkbox, transferConsent && s.checkboxChecked]}>
                  {transferConsent && <Text style={s.checkmark}>✓</Text>}
                </View>
                <Text style={s.checkLabel}>
                  Verilerimin hizmetin sunulabilmesi için yurt dışındaki tedarikçilere (Supabase — Almanya, Google/Expo — ABD) aktarılmasına <Text style={{ color: Colors.gold }}>açık rıza</Text> veriyorum.
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
                <Text style={s.codeLabel}>BAŞVURU REFERANS KODUNUZ</Text>
                <Animated.Text style={[s.codeValue, { opacity: codeAnim }]}>
                  {memberCode}
                </Animated.Text>
              </View>

              <Text style={s.successNote}>
                Bu kodu kaydedin. Yönetimle iletişimde başvurunuzu bu kodla belirtebilirsiniz.
              </Text>

              <TouchableOpacity
                style={[s.ctaButton, s.ctaOutline, { marginTop: 24, width: '100%' }]}
                onPress={() => Share.share({ message: memberCode })}
                activeOpacity={0.8}
              >
                <Text style={[s.ctaText, { color: Colors.gold }]}>REFERANS KODUNU PAYLAŞ</Text>
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
            disabled={!canNext() || submitting}
          >
            <Text style={s.ctaText}>
              {step === TOTAL_STEPS
                ? (submitting ? 'GÖNDERİLİYOR...' : 'BAŞVURUYU TAMAMLA')
                : 'DEVAM ET'}
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

  kvkkBox:        { maxHeight: 260, borderWidth: 0.5, borderColor: Colors.goldLine, padding: 16, marginBottom: 20 },
  kvkkText:       { fontFamily: Fonts.jakarta, fontSize: 10, color: Colors.textMuted, lineHeight: 16 },
  kvkkHead:       { fontFamily: Fonts.jakarta, fontSize: 8, color: Colors.gold, letterSpacing: 1.5, fontWeight: '700' },
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
