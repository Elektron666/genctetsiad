import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, FontSize } from '@/theme';

const EU_REGS = [
  { id:'AB-01', title:'CBAM', sub:'Karbon Sınır Mekanizması', desc:'2026\'dan itibaren AB\'ye ihraç edilen ürünlerde karbon fiyatlandırması zorunlu hale geliyor.' },
  { id:'AB-02', title:'Tekstil 2030', sub:'AB Döngüsel Ekonomi', desc:'2030\'a kadar AB pazarında satılan tekstillerin dayanıklı, geri dönüştürülebilir olması zorunlu.' },
  { id:'AB-03', title:'EUDR', sub:'Ormansızlaşma Tüzüğü', desc:'Tedarik zincirinde ormansızlaşmaya yol açan hammadde kullanımı yasaklanıyor.' },
  { id:'AB-04', title:'Ecodesign', sub:'Ürün Tasarımı Tüzüğü', desc:'Tekstil ürünlerinde dijital ürün pasaportu ve onarılabilirlik zorunluluğu.' },
];

const CHINA_RISKS = [
  'Çevre standartları yetersiz',
  'Nakliye süresi 30–45 gün',
  'AB CBAM yükümlülüğü yüksek',
  'Marka değeri zayıf',
  'ESG uyum riski artıyor',
];

const TURKEY_ADVANTAGES = [
  'Yakın coğrafya, 3–7 gün teslimat',
  'REACH & OEKO-TEX sertifikaları',
  'AB CBAM\'de avantajlı konum',
  'Güçlü üretim kapasitesi',
  'Sürdürülebilirlik dönüşümü hızlı',
];

const STATS = [
  { id:'ST-01', value:'%8–10', label:'Çin pazar kaybı', sub:'AB baskısından kaybedilecek' },
  { id:'ST-02', value:'4,2 Mr €', label:'Yıllık fırsat değeri', sub:'Türkiye\'ye aktarılabilecek' },
  { id:'ST-03', value:'%2,5', label:'Hedef pazar payı', sub:'2030\'a kadar ulaşılabilir' },
  { id:'ST-04', value:'+%12', label:'AB büyüme oranı', sub:'Sürdürülebilir tekstil talebi' },
];

const ACTION_STEPS = [
  'GRS / OEKO-TEX sertifikalarını tamamla — 2024–2025',
  'Tedarik zinciri izlenebilirliğini dijitalleştir — blockchain / QR',
  'Karbon ayak izi ölçümü başlat — Scope 1, 2, 3',
  'AB alıcı bağlantıları kur — HOMETEX & Heimtextil platformları',
  'Sektörel standart geliştirme — TETSİAD & AB komite katılımı',
];

export default function SustainabilityScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.section}>YEŞİL</Text>
        <Text style={styles.title}>Sürdürülebilir <Text style={{ fontStyle: 'italic' }}>tekstil.</Text></Text>
        <View style={styles.divider} />
      </View>

      {/* Hero image */}
      <View style={{ height: 200, position: 'relative' }}>
        <Image source={require('../../assets/images/hometex-2026-acilis.jpg')} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <LinearGradient colors={['transparent', Colors.navy]} style={StyleSheet.absoluteFill} />
      </View>

      {/* Lead */}
      <View style={styles.section_}>
        <Text style={styles.lead}>
          AB tekstil sektörü köklü bir dönüşüm yaşıyor. Direktifler, Çin rekabeti ve sürdürülebilirlik baskısı — Türkiye için tarihi bir fırsat penceresi.
        </Text>
      </View>

      {/* AB Direktifleri */}
      <View style={styles.section_}>
        <Text style={styles.sectionTitle}>AB DİREKTİFLERİ</Text>
        <View style={styles.grid2}>
          {EU_REGS.map(r => (
            <View key={r.id} style={styles.regCard}>
              <Text style={styles.regId}>{r.id}</Text>
              <Text style={styles.regTitle}>{r.title}</Text>
              <Text style={styles.regSub}>{r.sub}</Text>
              <View style={styles.regDivider} />
              <Text style={styles.regDesc}>{r.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Türkiye vs Çin */}
      <View style={styles.section_}>
        <Text style={styles.sectionTitle}>TÜRKİYE — ÇİN KARŞILAŞTIRMASI</Text>
        <View style={styles.compare}>
          <View style={styles.compareCol}>
            <Text style={styles.compareHeader}>ÇİN</Text>
            {CHINA_RISKS.map((r, i) => (
              <View key={i} style={styles.compareRow}>
                <Text style={styles.compareX}>✕</Text>
                <Text style={styles.compareText}>{r}</Text>
              </View>
            ))}
          </View>
          <View style={styles.compareDivider} />
          <View style={styles.compareCol}>
            <Text style={[styles.compareHeader, { color: Colors.gold }]}>TÜRKİYE</Text>
            {TURKEY_ADVANTAGES.map((r, i) => (
              <View key={i} style={styles.compareRow}>
                <Text style={styles.compareCheck}>✓</Text>
                <Text style={styles.compareText}>{r}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.section_}>
        <Text style={styles.sectionTitle}>FIRSAT HARİTASI</Text>
        <View style={styles.grid2}>
          {STATS.map(s => (
            <View key={s.id} style={styles.statCard}>
              <Text style={styles.statId}>{s.id}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={styles.statSub}>{s.sub}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Action plan */}
      <View style={styles.section_}>
        <Text style={styles.sectionTitle}>EYLEM PLANI</Text>
        {ACTION_STEPS.map((step, i) => (
          <View key={i} style={styles.actionRow}>
            <Text style={styles.actionNum}>{String(i + 1).padStart(2, '0')}</Text>
            <Text style={styles.actionText}>{step}</Text>
          </View>
        ))}
      </View>

      {/* Pull quote */}
      <View style={styles.quoteWrap}>
        <View style={styles.quoteLine} />
        <Text style={styles.quote}>
          "Sürdürülebilirlik artık bir tercih değil, AB pazarına giriş şartı."
        </Text>
        <Text style={styles.quoteAuthor}>GENÇ TETSİAD · 2026</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: Colors.navy },
  header:         { backgroundColor: Colors.navyDeep, paddingHorizontal: 24, paddingBottom: 16 },
  section:        { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 2, fontWeight: '600', marginBottom: 4 },
  title:          { fontFamily: 'CormorantGaramond', fontSize: 28, color: Colors.ivory, fontWeight: '300' },
  divider:        { height: 0.5, backgroundColor: Colors.goldLine, marginTop: 14 },
  section_:       { paddingHorizontal: 24, paddingTop: 32 },
  sectionTitle:   { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 2, color: Colors.textMuted, marginBottom: 16 },
  lead:           { fontFamily: 'CormorantGaramond', fontSize: 17, fontStyle: 'italic', color: Colors.ivory, lineHeight: 26, fontWeight: '300' },
  grid2:          { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  regCard:        { width: '48%', padding: 14, borderWidth: 0.5, borderColor: Colors.goldLine, backgroundColor: Colors.navyMid },
  regId:          { fontFamily: Fonts.mono, fontSize: 8, color: Colors.textMuted, letterSpacing: 1, marginBottom: 6 },
  regTitle:       { fontFamily: 'CormorantGaramond', fontSize: 18, color: Colors.gold, fontWeight: '500', marginBottom: 2 },
  regSub:         { fontFamily: Fonts.jakarta, fontSize: 8, color: Colors.textMuted, marginBottom: 8 },
  regDivider:     { height: 0.5, backgroundColor: Colors.goldLine, marginBottom: 8 },
  regDesc:        { fontFamily: Fonts.jakarta, fontSize: 10, color: Colors.textMuted, lineHeight: 14 },

  compare:        { flexDirection: 'row', borderWidth: 0.5, borderColor: Colors.goldLine },
  compareCol:     { flex: 1, padding: 14 },
  compareHeader:  { fontFamily: Fonts.jakarta, fontSize: 8, fontWeight: '700', letterSpacing: 2, color: Colors.textMuted, marginBottom: 12 },
  compareRow:     { flexDirection: 'row', gap: 6, marginBottom: 8, alignItems: 'flex-start' },
  compareX:       { fontFamily: Fonts.jakarta, fontSize: 10, color: '#e06060', marginTop: 1 },
  compareCheck:   { fontFamily: Fonts.jakarta, fontSize: 10, color: Colors.gold, marginTop: 1 },
  compareText:    { fontFamily: Fonts.jakarta, fontSize: 9.5, color: Colors.textMuted, lineHeight: 13, flex: 1 },
  compareDivider: { width: 0.5, backgroundColor: Colors.gold },

  statCard:       { width: '48%', padding: 16, borderWidth: 0.5, borderColor: Colors.goldLine, backgroundColor: Colors.navyMid },
  statId:         { fontFamily: Fonts.mono, fontSize: 8, color: Colors.textMuted, letterSpacing: 1, marginBottom: 8 },
  statValue:      { fontFamily: 'CormorantGaramond', fontSize: 26, color: Colors.gold, fontStyle: 'italic', fontWeight: '300', lineHeight: 28, marginBottom: 4 },
  statLabel:      { fontFamily: Fonts.jakarta, fontSize: 11, color: Colors.ivory, fontWeight: '500', marginBottom: 4 },
  statSub:        { fontFamily: Fonts.jakarta, fontSize: 9, color: Colors.textMuted, lineHeight: 13 },

  actionRow:      { flexDirection: 'row', gap: 14, paddingVertical: 14, borderTopWidth: 0.5, borderTopColor: Colors.goldLine, alignItems: 'flex-start' },
  actionNum:      { fontFamily: Fonts.mono, fontSize: 11, color: Colors.gold, letterSpacing: 1, paddingTop: 1 },
  actionText:     { flex: 1, fontFamily: Fonts.jakarta, fontSize: 12, color: Colors.textMuted, lineHeight: 18 },

  quoteWrap:      { paddingHorizontal: 24, paddingTop: 48, paddingBottom: 40 },
  quoteLine:      { width: 40, height: 0.5, backgroundColor: Colors.gold, marginBottom: 20 },
  quote:          { fontFamily: 'CormorantGaramond', fontSize: 24, color: Colors.ivory, fontStyle: 'italic', fontWeight: '300', lineHeight: 32, marginBottom: 16 },
  quoteAuthor:    { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 2 },
});
