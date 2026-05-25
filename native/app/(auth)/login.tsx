import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Animated, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, FontSize } from '@/theme';
import { useAuthContext } from '@/context/AuthContext';

type Step = 'phone' | 'otp';

export default function LoginScreen() {
  const { sendOtp, verifyOtp, status } = useAuthContext();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const otpRefs = Array.from({ length: 6 }, () => useRef<TextInput>(null));

  useEffect(() => {
    if (status === 'authenticated') router.replace('/(tabs)');
    if (status === 'pending') router.replace('/(auth)/pending');
  }, [status]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleDevam = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) return;
    setLoading(true);
    const error = await sendOtp(digits);
    setLoading(false);
    if (error) {
      Alert.alert('Hata', error.message ?? 'SMS gönderilemedi. Lütfen tekrar deneyin.');
      return;
    }
    Animated.timing(slideAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start(() => {
      setStep('otp');
      setCountdown(60);
      setTimeout(() => otpRefs[0].current?.focus(), 100);
    });
  };

  const handleOtpChange = async (val: string, idx: number) => {
    setOtpError(false);
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) {
      otpRefs[idx + 1].current?.focus();
    }
    if (next.every(d => d !== '')) {
      setLoading(true);
      const error = await verifyOtp(phone, next.join(''));
      setLoading(false);
      if (error) {
        setOtpError(true);
        setOtp(['', '', '', '', '', '']);
        otpRefs[0].current?.focus();
      }
      // on success, useEffect handles redirect via status change
    }
  };

  const handleOtpKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs[idx - 1].current?.focus();
    }
  };

  const handleResend = async () => {
    setOtp(['', '', '', '', '', '']);
    setLoading(true);
    await sendOtp(phone);
    setLoading(false);
    setCountdown(60);
    otpRefs[0].current?.focus();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={styles.topSection}>
            <View style={styles.brandRow}>
              <View style={styles.goldLineShort} />
              <Text style={styles.brandMono}>TETSİAD</Text>
              <View style={styles.goldLineShort} />
            </View>
            <Text style={styles.heading}>GENÇ TETSİAD</Text>
            <View style={styles.modeBadge}>
              <View style={styles.modeDot} />
              <Text style={styles.modeBadgeText}>
                {step === 'phone' ? 'GİRİŞ · OTP' : 'DOĞRULAMA · SMS'}
              </Text>
              <View style={styles.modeDot} />
            </View>
            <Text style={styles.subtitle}>
              {step === 'phone'
                ? 'Türkiye ev tekstilinin genç iş insanları platformu.'
                : `+90 ${phone} numarasına 6 haneli kod gönderdik.`}
            </Text>
          </View>

          <View style={styles.rule} />

          {/* PHONE STEP */}
          {step === 'phone' && (
            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>TELEFON NUMARASI</Text>
              <View style={styles.phoneRow}>
                <View style={styles.countryCodeWrap}>
                  <Text style={styles.countryCodeText}>+90</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="5__ ___ __ __"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                  maxLength={13}
                  editable={!loading}
                />
              </View>
              <View style={styles.inputUnderline} />
              <Text style={styles.helperText}>SMS ile tek kullanımlık doğrulama kodu gönderilecektir.</Text>
              <TouchableOpacity
                style={[styles.ctaButton, (phone.replace(/\D/g,'').length < 10 || loading) && styles.ctaDisabled]}
                onPress={handleDevam}
                activeOpacity={0.8}
                disabled={loading}
              >
                <Text style={styles.ctaButtonText}>{loading ? 'GÖNDERİLİYOR...' : 'DEVAM ET'}</Text>
              </TouchableOpacity>

              <View style={styles.orRow}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>VEYA</Text>
                <View style={styles.orLine} />
              </View>

              <TouchableOpacity style={styles.outlineButton} onPress={() => router.replace('/(tabs)')} activeOpacity={0.7}>
                <Text style={styles.outlineButtonText}>DEMO MOD İLE GİR</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* OTP STEP */}
          {step === 'otp' && (
            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>DOĞRULAMA KODU</Text>
              <View style={styles.otpRow}>
                {otp.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={otpRefs[i]}
                    style={[styles.otpBox, digit && styles.otpBoxFilled, otpError && styles.otpBoxError]}
                    value={digit}
                    onChangeText={v => handleOtpChange(v, i)}
                    onKeyPress={e => handleOtpKeyPress(e, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    selectTextOnFocus
                    editable={!loading}
                  />
                ))}
              </View>

              {otpError && <Text style={styles.errorText}>Kod hatalı. Tekrar deneyin.</Text>}
              {loading && <Text style={styles.helperText}>Doğrulanıyor...</Text>}

              <Text style={styles.helperText}>
                {countdown > 0
                  ? <Text>Kodu almadınız mı? <Text style={styles.countdown}>{countdown}s</Text></Text>
                  : 'Kod gelmedi mi?'}
              </Text>

              {countdown === 0 && (
                <TouchableOpacity onPress={handleResend} disabled={loading}>
                  <Text style={styles.resendLink}>Kodu tekrar gönder →</Text>
                </TouchableOpacity>
              )}

              <View style={{ height: 24 }} />

              <TouchableOpacity style={styles.textBack} onPress={() => { setStep('phone'); setOtp(['','','','','','']); }}>
                <Text style={styles.textBackText}>← Telefon numarasını değiştir</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.spacer} />

          {step === 'phone' && (
            <View style={styles.bottomSection}>
              <Text style={styles.registerIntro}>Henüz üye değil misiniz?</Text>
              <TouchableOpacity style={styles.registerLink} activeOpacity={0.7} onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.registerLinkText}>Üyelik başvurusu yap →</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.signature}>
            <Text style={styles.signatureText}>KONSEPT · <Text style={styles.signatureGold}>FATİH ÖZDEMİR</Text></Text>
            <Text style={styles.signatureText}>ORMEN TEKSTİL · ANKARA</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:         { flex: 1, backgroundColor: Colors.navy },
  flex:             { flex: 1 },
  scrollContent:    { flexGrow: 1, paddingHorizontal: 32, paddingBottom: 28 },
  topSection:       { paddingTop: 56, alignItems: 'center' },
  brandRow:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 32 },
  goldLineShort:    { width: 28, height: 0.5, backgroundColor: Colors.gold },
  brandMono:        { fontFamily: Fonts.mono, fontSize: FontSize.xs, color: Colors.gold, letterSpacing: 4 },
  heading:          { fontFamily: Fonts.cormorant, fontStyle: 'italic', fontSize: 42, color: Colors.ivory, lineHeight: 46, letterSpacing: -0.5, textAlign: 'center', marginBottom: 18 },
  modeBadge:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  modeDot:          { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.gold, opacity: 0.6 },
  modeBadgeText:    { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, color: Colors.gold, letterSpacing: 3, fontWeight: '600' },
  subtitle:         { fontFamily: Fonts.jakarta, fontSize: 11, fontWeight: '300', color: Colors.textMuted, textAlign: 'center', lineHeight: 18, maxWidth: 280 },
  rule:             { height: 0.5, backgroundColor: Colors.goldLine, marginTop: 36, marginBottom: 32 },
  formSection:      {},
  fieldLabel:       { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 2, fontWeight: '600', marginBottom: 14 },
  phoneRow:         { flexDirection: 'row', alignItems: 'flex-end', gap: 14 },
  countryCodeWrap:  { paddingBottom: 8 },
  countryCodeText:  { fontFamily: Fonts.cormorant, fontStyle: 'italic', fontSize: 26, color: Colors.gold, lineHeight: 30 },
  phoneInput:       { flex: 1, fontFamily: Fonts.cormorant, fontSize: 26, color: Colors.ivory, paddingBottom: 8, paddingTop: 0, lineHeight: 30 },
  inputUnderline:   { height: 0.5, backgroundColor: Colors.goldLine, marginBottom: 12 },
  helperText:       { fontFamily: Fonts.jakarta, fontSize: 10, color: Colors.textMuted, lineHeight: 16, marginBottom: 24 },
  ctaButton:        { backgroundColor: Colors.gold, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  ctaDisabled:      { opacity: 0.45 },
  ctaButtonText:    { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, fontWeight: '700', color: Colors.navyDeep, letterSpacing: 3 },
  orRow:            { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 24, marginBottom: 16 },
  orLine:           { flex: 1, height: 0.5, backgroundColor: Colors.goldLine },
  orText:           { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 2, fontWeight: '600' },
  outlineButton:    { borderWidth: 0.5, borderColor: Colors.goldLine, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  outlineButtonText:{ fontFamily: Fonts.jakarta, fontSize: FontSize.xs, fontWeight: '600', color: Colors.textMuted, letterSpacing: 2.5 },
  otpRow:           { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 24 },
  otpBox:           { width: 46, height: 64, borderWidth: 0.5, borderColor: Colors.goldLine, backgroundColor: Colors.navyMid, fontFamily: Fonts.cormorant, fontSize: 28, color: Colors.ivory, textAlign: 'center' },
  otpBoxFilled:     { borderColor: Colors.gold, backgroundColor: Colors.navyDeep },
  otpBoxError:      { borderColor: '#e06060' },
  errorText:        { fontFamily: Fonts.jakarta, fontSize: 10, color: '#e06060', marginBottom: 12 },
  countdown:        { color: Colors.gold },
  resendLink:       { fontFamily: Fonts.jakarta, fontSize: 11, color: Colors.gold, marginBottom: 8 },
  textBack:         { paddingVertical: 8 },
  textBackText:     { fontFamily: Fonts.jakarta, fontSize: 11, color: Colors.textMuted },
  spacer:           { flex: 1, minHeight: 40 },
  bottomSection:    { alignItems: 'center', marginBottom: 24, gap: 4 },
  registerIntro:    { fontFamily: Fonts.jakarta, fontSize: 11, color: Colors.textMuted },
  registerLink:     { paddingVertical: 6 },
  registerLinkText: { fontFamily: Fonts.jakarta, fontSize: 12, color: Colors.gold, letterSpacing: 0.3 },
  signature:        { borderTopWidth: 0.5, borderTopColor: Colors.goldLine, paddingTop: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  signatureText:    { fontFamily: Fonts.mono, fontSize: 7, color: Colors.textMuted, letterSpacing: 1.5 },
  signatureGold:    { color: Colors.gold },
});
