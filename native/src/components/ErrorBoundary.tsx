import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { Colors, Fonts, FontSize } from '@/theme';
import { isSentryEnabled } from '@/lib/sentry';

// React Native'de yakalanmayan bir render hatası tüm ağacı söker ve
// kullanıcı BOMBOŞ BEYAZ EKRAN görür — uygulama açık ama hiçbir şey yok,
// çıkış yolu da yok. Mağaza incelemecisi bunu "uygulama bozuk" olarak
// değerlendirir ve reddeder.
//
// Bu sınır, hatayı yakalayıp anlaşılır bir ekran gösterir ve Sentry'ye
// raporlar. Kullanıcı "TEKRAR DENE" ile uygulamaya geri dönebilir.

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (isSentryEnabled) {
      Sentry.captureException(error, {
        extra: { componentStack: info.componentStack },
      });
    }
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={s.root}>
        <View style={s.mark}>
          <Text style={s.markText}>!</Text>
        </View>

        <Text style={s.overline}>BEKLENMEYEN HATA</Text>
        <Text style={s.title}>{'Bir şeyler\nters gitti.'}</Text>

        <View style={s.rule} />

        <Text style={s.body}>
          Sorun teknik ekibimize otomatik olarak bildirildi. Aşağıdaki
          düğmeyle uygulamaya geri dönebilirsiniz.
        </Text>

        <TouchableOpacity style={s.cta} onPress={this.reset} activeOpacity={0.8}>
          <Text style={s.ctaText}>TEKRAR DENE</Text>
        </TouchableOpacity>

        <Text style={s.note}>
          Sorun sürerse info@tetsiad.org adresine yazabilirsiniz.
        </Text>
      </View>
    );
  }
}

const s = StyleSheet.create({
  root:     { flex: 1, backgroundColor: Colors.navy, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  mark:     { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: Colors.gold, alignItems: 'center', justifyContent: 'center', marginBottom: 26 },
  markText: { fontFamily: Fonts.cormorant, fontStyle: 'italic', fontSize: 24, color: Colors.gold },
  overline: { fontFamily: Fonts.jakarta, fontSize: 8, letterSpacing: 3, color: Colors.gold, fontWeight: '700', marginBottom: 12 },
  title:    { fontFamily: Fonts.cormorant, fontSize: 32, color: Colors.ivory, fontStyle: 'italic', fontWeight: '300', textAlign: 'center', lineHeight: 38 },
  rule:     { height: 0.5, width: 56, backgroundColor: Colors.goldLine, marginVertical: 22 },
  body:     { fontFamily: Fonts.jakarta, fontSize: 11, color: Colors.textMuted, textAlign: 'center', lineHeight: 18, marginBottom: 30 },
  cta:      { backgroundColor: Colors.gold, paddingVertical: 14, paddingHorizontal: 44 },
  ctaText:  { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, fontWeight: '700', color: Colors.navyDeep, letterSpacing: 3 },
  note:     { fontFamily: Fonts.jakarta, fontSize: 9, color: Colors.textMuted, textAlign: 'center', marginTop: 24 },
});
