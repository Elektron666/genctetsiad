import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, FontSize } from '@/theme';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');

  const handleDevam = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Top brand block ───────────────────────────────── */}
          <View style={styles.topSection}>
            {/* Wordmark row */}
            <View style={styles.brandRow}>
              <View style={styles.goldLineShort} />
              <Text style={styles.brandMono}>TETSİAD</Text>
              <View style={styles.goldLineShort} />
            </View>

            {/* Main heading */}
            <Text style={styles.heading}>GENÇ TETSİAD</Text>

            {/* Mode badge */}
            <View style={styles.modeBadge}>
              <View style={styles.modeDot} />
              <Text style={styles.modeBadgeText}>GİRİŞ · OTP</Text>
              <View style={styles.modeDot} />
            </View>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              Türkiye ev tekstilinin genç iş insanları platformu.
            </Text>
          </View>

          {/* ── Horizontal rule ───────────────────────────────── */}
          <View style={styles.rule} />

          {/* ── Phone form ────────────────────────────────────── */}
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
                autoFocus={false}
              />
            </View>

            <View style={styles.inputUnderline} />

            <Text style={styles.helperText}>
              SMS ile tek kullanımlık doğrulama kodu gönderilecektir.
            </Text>

            {/* Primary CTA */}
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={handleDevam}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaButtonText}>DEVAM ET</Text>
            </TouchableOpacity>
          </View>

          {/* ── OR divider ────────────────────────────────────── */}
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>VEYA</Text>
            <View style={styles.orLine} />
          </View>

          {/* Face ID outline button */}
          <TouchableOpacity
            style={styles.outlineButton}
            onPress={handleDevam}
            activeOpacity={0.7}
          >
            <Text style={styles.outlineButtonText}>FACE ID İLE GİRİŞ</Text>
          </TouchableOpacity>

          {/* Flexible spacer */}
          <View style={styles.spacer} />

          {/* ── Register link ─────────────────────────────────── */}
          <View style={styles.bottomSection}>
            <Text style={styles.registerIntro}>Henüz üye değil misiniz?</Text>
            <TouchableOpacity style={styles.registerLink} activeOpacity={0.7}>
              <Text style={styles.registerLinkText}>Üyelik başvurusu yap →</Text>
            </TouchableOpacity>
          </View>

          {/* ── Concept signature ─────────────────────────────── */}
          <View style={styles.signature}>
            <Text style={styles.signatureText}>
              KONSEPT · <Text style={styles.signatureGold}>FATİH ÖZDEMİR</Text>
            </Text>
            <Text style={styles.signatureText}>ORMEN TEKSTİL · ANKARA</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.navy,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingBottom: 28,
  },

  // ── Top section ──────────────────────────────────────
  topSection: {
    paddingTop: 56,
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 32,
  },
  goldLineShort: {
    width: 28,
    height: 0.5,
    backgroundColor: Colors.gold,
  },
  brandMono: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.xs,
    color: Colors.gold,
    letterSpacing: 4,
  },
  heading: {
    fontFamily: Fonts.cormorant,
    fontStyle: 'italic',
    fontSize: 42,
    color: Colors.ivory,
    lineHeight: 46,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 18,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  modeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gold,
    opacity: 0.6,
  },
  modeBadgeText: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.xs,
    color: Colors.gold,
    letterSpacing: 3,
    fontWeight: '600',
  },
  subtitle: {
    fontFamily: Fonts.jakarta,
    fontSize: 11,
    fontWeight: '300',
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },

  // ── Rule ──────────────────────────────────────────────
  rule: {
    height: 0.5,
    backgroundColor: Colors.goldLine,
    marginTop: 36,
    marginBottom: 32,
  },

  // ── Form ──────────────────────────────────────────────
  formSection: {},
  fieldLabel: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 2,
    fontWeight: '600',
    marginBottom: 14,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 14,
  },
  countryCodeWrap: {
    paddingBottom: 8,
  },
  countryCodeText: {
    fontFamily: Fonts.cormorant,
    fontStyle: 'italic',
    fontSize: 26,
    color: Colors.gold,
    lineHeight: 30,
  },
  phoneInput: {
    flex: 1,
    fontFamily: Fonts.cormorant,
    fontSize: 26,
    color: Colors.ivory,
    paddingBottom: 8,
    paddingTop: 0,
    lineHeight: 30,
  },
  inputUnderline: {
    height: 0.5,
    backgroundColor: Colors.goldLine,
    marginBottom: 12,
  },
  helperText: {
    fontFamily: Fonts.jakarta,
    fontSize: 10,
    color: Colors.textMuted,
    lineHeight: 16,
    marginBottom: 36,
  },
  ctaButton: {
    backgroundColor: Colors.gold,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.navyDeep,
    letterSpacing: 3,
  },

  // ── OR row ────────────────────────────────────────────
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 28,
    marginBottom: 18,
  },
  orLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: Colors.goldLine,
  },
  orText: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 2,
    fontWeight: '600',
  },

  // ── Outline button ────────────────────────────────────
  outlineButton: {
    borderWidth: 0.5,
    borderColor: Colors.gold,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButtonText: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.gold,
    letterSpacing: 2.5,
  },

  // ── Spacer ────────────────────────────────────────────
  spacer: {
    flex: 1,
    minHeight: 40,
  },

  // ── Bottom ────────────────────────────────────────────
  bottomSection: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 4,
  },
  registerIntro: {
    fontFamily: Fonts.jakarta,
    fontSize: 11,
    color: Colors.textMuted,
  },
  registerLink: {
    paddingVertical: 6,
  },
  registerLinkText: {
    fontFamily: Fonts.jakarta,
    fontSize: 12,
    color: Colors.gold,
    letterSpacing: 0.3,
  },

  // ── Concept signature ─────────────────────────────────
  signature: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.goldLine,
    paddingTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  signatureText: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  signatureGold: {
    color: Colors.gold,
  },
});
