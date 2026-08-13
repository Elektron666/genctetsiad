import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, StyleSheet, RefreshControl, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Colors, Fonts, FontSize } from '@/theme';
import { useAuthContext } from '@/context/AuthContext';
import { useArticles, useMyArticles } from '@/hooks/useArticles';
import { useToast } from '@/components/Toast';
import type { Article } from '@/types/database';

const DRAFT_KEY = 'gt_bulletin_draft';

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const fmt = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const STATUS_LABEL: Record<string, string> = {
  pending:   'İNCELEMEDE',
  published: 'YAYINDA',
  rejected:  'REVİZYON İSTENDİ',
};

// ─── Yazı okuma ───────────────────────────────────────────────

function ArticleReader({ article, onClose }: { article: Article; onClose: () => void }) {
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={s.readerRoot}>
        <View style={s.readerBar}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Bültene dön">
            <Text style={s.readerBack}>← BÜLTEN</Text>
          </TouchableOpacity>
          <Text style={s.readerDate}>{fmt(article.published_at)}</Text>
        </View>

        <ScrollView contentContainerStyle={s.readerBody} showsVerticalScrollIndicator={false}>
          <Text style={s.readerTitle}>{article.title}</Text>

          <View style={s.readerByline}>
            <View style={s.readerAvatar}>
              <Text style={s.readerAvatarText}>
                {(article.author_name ?? 'Ü').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={s.readerAuthor}>{article.author_name}</Text>
              {!!article.author_company && (
                <Text style={s.readerFirm}>{article.author_company}</Text>
              )}
            </View>
          </View>

          <View style={s.readerRule} />
          {!!article.summary && <Text style={s.readerSummary}>{article.summary}</Text>}
          <Text style={s.readerText}>{article.body}</Text>
          <View style={{ height: 48 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Yazı gönderme / düzeltme ─────────────────────────────────

function ComposeModal({
  editing,
  onClose,
  onSubmit,
}: {
  editing: Article | null;
  onClose: () => void;
  onSubmit: (input: { title: string; summary?: string; body: string }, id?: string) => Promise<boolean>;
}) {
  const [title, setTitle] = useState(editing?.title ?? '');
  const [summary, setSummary] = useState(editing?.summary ?? '');
  const [body, setBody] = useState(editing?.body ?? '');
  const [busy, setBusy] = useState(false);
  const [restored, setRestored] = useState(false);

  // Bu, uygulamadaki en uzun form (en az 200, en fazla 20.000 karakter).
  // Taslak hiçbir yerde saklanmıyordu: kullanıcı yazarken bir telefon
  // gelse ve sistem uygulamayı bellekten düşürse yazının tamamı yok
  // oluyordu. Yazdıkça yerel taslağa kaydediyoruz.
  useEffect(() => {
    if (editing) return;                       // düzenlemede taslak yükleme
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(DRAFT_KEY);
        if (!raw) return;
        const d = JSON.parse(raw) as { title: string; summary: string; body: string };
        if (!d.title && !d.body) return;
        setTitle(d.title ?? ''); setSummary(d.summary ?? ''); setBody(d.body ?? '');
        setRestored(true);
      } catch { /* taslak okunamazsa boş başla */ }
    })();
  }, [editing]);

  useEffect(() => {
    if (editing) return;
    const t = setTimeout(() => {
      SecureStore.setItemAsync(DRAFT_KEY, JSON.stringify({ title, summary, body })).catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [title, summary, body, editing]);

  // Kapatırken kaydedilmemiş metin varsa uyar — eskiden ✕ dokunuşu
  // her şeyi sessizce siliyordu.
  const requestClose = () => {
    if (busy) return;
    const dirty = title.trim().length > 0 || body.trim().length > 0;
    if (!dirty) { onClose(); return; }
    Alert.alert(
      'Yazıdan çıkılsın mı?',
      editing
        ? 'Yaptığınız değişiklikler kaydedilmeyecek.'
        : 'Yazınız taslak olarak saklanır; bu ekranı tekrar açtığınızda kaldığınız yerden devam edebilirsiniz.',
      [
        { text: 'Yazmaya devam et', style: 'cancel' },
        { text: 'Çık', onPress: onClose },
      ]
    );
  };

  // Sunucudaki CHECK kısıtıyla aynı sınırlar — kullanıcı hata almadan görsün
  const titleOk = title.trim().length >= 5 && title.trim().length <= 120;
  const bodyOk  = body.trim().length >= 200 && body.trim().length <= 20000;
  const valid = titleOk && bodyOk;

  const send = async () => {
    if (!valid || busy) return;
    setBusy(true);
    const ok = await onSubmit(
      { title: title.trim(), summary: summary.trim() || undefined, body: body.trim() },
      editing?.id,
    );
    setBusy(false);
    if (ok) {
      if (!editing) await SecureStore.deleteItemAsync(DRAFT_KEY).catch(() => {});
      onClose();
    }
  };

  return (
    <Modal visible animationType="slide" onRequestClose={requestClose}>
      <View style={s.readerRoot}>
        {restored && (
          <View style={s.draftBar}>
            <Text style={s.draftText}>Kaydedilmemiş taslağınız geri yüklendi</Text>
          </View>
        )}
        <View style={s.readerBar}>
          <TouchableOpacity onPress={requestClose} accessibilityRole="button" accessibilityLabel="Vazgeç" activeOpacity={0.7}>
            <Text style={s.readerBack}>← VAZGEÇ</Text>
          </TouchableOpacity>
          <Text style={s.readerDate}>{editing ? 'DÜZENLE' : 'YENİ YAZI'}</Text>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={s.composeBody} keyboardShouldPersistTaps="handled">
            <Text style={s.label}>BAŞLIK</Text>
            <TextInput
              style={s.inputTitle}
              value={title}
              onChangeText={setTitle}
              placeholder="Yazınızın başlığı"
              placeholderTextColor={Colors.textMuted}
              maxLength={120}
              multiline
            />
            <View style={s.underline} />
            <Text style={[s.counter, !titleOk && title.length > 0 && s.counterWarn]}>
              {title.trim().length} / 120 {titleOk ? '' : '· en az 5 karakter'}
            </Text>

            <Text style={[s.label, { marginTop: 22 }]}>ÖZET <Text style={s.optional}>(opsiyonel)</Text></Text>
            <TextInput
              style={s.input}
              value={summary}
              onChangeText={setSummary}
              placeholder="Listede görünecek kısa tanıtım"
              placeholderTextColor={Colors.textMuted}
              maxLength={200}
              multiline
            />
            <View style={s.underline} />

            <Text style={[s.label, { marginTop: 22 }]}>YAZI</Text>
            <TextInput
              style={[s.input, s.inputBody]}
              value={body}
              onChangeText={setBody}
              placeholder="Sektörel deneyiminizi, gözleminizi veya analizinizi paylaşın..."
              placeholderTextColor={Colors.textMuted}
              multiline
              textAlignVertical="top"
              maxLength={20000}
            />
            <View style={s.underline} />
            <Text style={[s.counter, !bodyOk && body.length > 0 && s.counterWarn]}>
              {body.trim().length} karakter {bodyOk ? '' : '· en az 200'}
            </Text>

            <TouchableOpacity
              style={[s.cta, (!valid || busy) && s.disabled]}
              onPress={send}
              disabled={!valid || busy}
              activeOpacity={0.8}
            >
              <Text style={s.ctaText}>{busy ? 'GÖNDERİLİYOR...' : 'YÖNETİME GÖNDER'}</Text>
            </TouchableOpacity>

            <Text style={s.note}>
              Yazınız dernek yönetimi tarafından incelendikten sonra bültende
              yayımlanır. İnceleme sonucunu bu ekrandan takip edebilirsiniz.
            </Text>
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Ana sekme ────────────────────────────────────────────────

export function BulletinTab() {
  const { session, profile } = useAuthContext();
  const { articles, loading, error, refetch } = useArticles();
  const { mine, submit, update, withdraw, refetch: refetchMine } = useMyArticles(session?.user.id);
  const { show: showToast, ToastComponent } = useToast();

  const [reading, setReading] = useState<Article | null>(null);
  const [composing, setComposing] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const canWrite = !!profile && profile.role !== 'pending';

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchMine()]);
    setRefreshing(false);
  };

  const handleSubmit = async (input: { title: string; summary?: string; body: string }, id?: string) => {
    const { error: err } = id ? await update(id, input) : await submit(input);
    if (err) {
      showToast('Gönderilemedi. Lütfen tekrar deneyin.', 'error');
      return false;
    }
    showToast('Yazınız yönetime iletildi.', 'success');
    return true;
  };

  const confirmWithdraw = (a: Article) => {
    Alert.alert('Yazıyı Geri Çek', `"${a.title}" silinecek. Bu işlem geri alınamaz.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'GERİ ÇEK',
        style: 'destructive',
        onPress: async () => {
          const { error: err } = await withdraw(a.id);
          showToast(err ? 'Geri çekilemedi.' : 'Yazı geri çekildi.', err ? 'error' : 'success');
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} colors={[Colors.gold]} progressBackgroundColor={Colors.navyDeep} />
        }
      >
        <Text style={s.intro}>
          Üyelerin kaleminden sektörel deneyim, gözlem ve analizler.
          {canWrite ? ' Siz de yazabilirsiniz.' : ''}
        </Text>

        {canWrite && (
          <TouchableOpacity style={s.writeBtn} onPress={() => { setEditing(null); setComposing(true); }} activeOpacity={0.8}>
            <Text style={s.writeBtnText}>✎  YAZI GÖNDER</Text>
          </TouchableOpacity>
        )}

        {/* Kendi gönderilerim */}
        {mine.length > 0 && (
          <View style={s.mineWrap}>
            <Text style={s.sectionHead}>GÖNDERİLERİM</Text>
            {mine.map(a => (
              <View key={a.id} style={s.mineCard}>
                <View style={s.mineTop}>
                  <Text style={s.mineTitle} numberOfLines={2}>{a.title}</Text>
                  <View style={[
                    s.badge,
                    a.status === 'published' && s.badgeOk,
                    a.status === 'rejected' && s.badgeWarn,
                  ]}>
                    <Text style={[
                      s.badgeText,
                      a.status === 'published' && s.badgeTextOk,
                      a.status === 'rejected' && s.badgeTextWarn,
                    ]}>{STATUS_LABEL[a.status]}</Text>
                  </View>
                </View>

                {a.status === 'rejected' && !!a.review_note && (
                  <Text style={s.reviewNote}>Yönetim notu: {a.review_note}</Text>
                )}

                {a.status !== 'published' && (
                  <View style={s.mineActions}>
                    <TouchableOpacity onPress={() => { setEditing(a); setComposing(true); }} activeOpacity={0.7}>
                      <Text style={s.mineAction}>DÜZENLE</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmWithdraw(a)} activeOpacity={0.7}>
                      <Text style={[s.mineAction, s.mineActionDanger]}>GERİ ÇEK</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Yayındaki yazılar */}
        <Text style={[s.sectionHead, { marginTop: mine.length > 0 ? 28 : 8 }]}>
          YAYINDAKİ YAZILAR
        </Text>

        {articles.map(a => (
          <TouchableOpacity key={a.id} style={s.card} onPress={() => setReading(a)} activeOpacity={0.85}>
            <Text style={s.cardDate}>{fmt(a.published_at)}</Text>
            <Text style={s.cardTitle}>{a.title}</Text>
            {!!a.summary && <Text style={s.cardSummary} numberOfLines={3}>{a.summary}</Text>}
            <View style={s.cardFooter}>
              <Text style={s.cardAuthor}>{a.author_name}</Text>
              {!!a.author_company && <Text style={s.cardFirm}> · {a.author_company}</Text>}
            </View>
          </TouchableOpacity>
        ))}

        {articles.length === 0 && !loading && (
          <View style={s.empty}>
            <View style={s.emptyDot} />
            <Text style={s.emptyTitle}>
              {error ? 'Bağlantı kurulamadı.' : 'Bülten henüz başlamadı.'}
            </Text>
            <Text style={s.emptySub}>
              {error
                ? 'Aşağı çekerek yeniden deneyin.'
                : canWrite
                ? 'İlk yazıyı siz gönderebilirsiniz.'
                : 'Yayımlanan yazılar burada görünecek.'}
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {reading && <ArticleReader article={reading} onClose={() => setReading(null)} />}
      {composing && (
        <ComposeModal
          editing={editing}
          onClose={() => { setComposing(false); setEditing(null); }}
          onSubmit={handleSubmit}
        />
      )}
      {ToastComponent}
    </View>
  );
}

const s = StyleSheet.create({
  draftBar:  { backgroundColor: 'rgba(217,200,150,0.10)', borderBottomWidth: 0.5, borderBottomColor: Colors.goldLine, paddingVertical: 8, paddingHorizontal: 20 },
  draftText: { fontFamily: Fonts.jakarta, fontSize: 9.5, color: Colors.gold, letterSpacing: 0.3 },
  listContent:  { paddingHorizontal: 24, paddingTop: 20 },
  intro:        { fontFamily: Fonts.jakarta, fontSize: 11, color: Colors.textMuted, lineHeight: 18, marginBottom: 18 },

  writeBtn:     { borderWidth: 0.5, borderColor: Colors.gold, paddingVertical: 13, alignItems: 'center', marginBottom: 24 },
  writeBtnText: { fontFamily: Fonts.jakarta, fontSize: 9, letterSpacing: 2.5, color: Colors.gold, fontWeight: '700' },

  sectionHead:  { fontFamily: Fonts.jakarta, fontSize: 8, letterSpacing: 2.5, color: Colors.gold, fontWeight: '700', marginBottom: 14 },

  mineWrap:     {},
  mineCard:     { borderWidth: 0.5, borderColor: Colors.goldLine, backgroundColor: Colors.navyMid, padding: 14, marginBottom: 10 },
  mineTop:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  mineTitle:    { flex: 1, fontFamily: Fonts.cormorant, fontSize: 16, color: Colors.ivory, fontWeight: '500' },
  badge:        { paddingHorizontal: 8, paddingVertical: 3, borderWidth: 0.5, borderColor: Colors.goldLine },
  badgeOk:      { borderColor: Colors.gold, backgroundColor: 'rgba(217,200,150,0.10)' },
  badgeWarn:    { borderColor: 'rgba(224,96,96,0.5)' },
  badgeText:    { fontFamily: Fonts.jakarta, fontSize: 6.5, letterSpacing: 1, color: Colors.textMuted, fontWeight: '700' },
  badgeTextOk:  { color: Colors.gold },
  badgeTextWarn:{ color: 'rgba(224,96,96,0.9)' },
  reviewNote:   { fontFamily: Fonts.jakarta, fontSize: 10, color: 'rgba(224,96,96,0.85)', lineHeight: 15, marginTop: 8 },
  mineActions:  { flexDirection: 'row', gap: 18, marginTop: 12 },
  mineAction:   { fontFamily: Fonts.jakarta, fontSize: 8, letterSpacing: 1.5, color: Colors.gold, fontWeight: '700' },
  mineActionDanger: { color: 'rgba(224,96,96,0.85)' },

  card:         { borderTopWidth: 0.5, borderTopColor: Colors.goldLine, paddingVertical: 18 },
  cardDate:     { fontFamily: Fonts.mono, fontSize: 7.5, letterSpacing: 1.5, color: Colors.textMuted, marginBottom: 8 },
  cardTitle:    { fontFamily: Fonts.cormorant, fontSize: 21, color: Colors.ivory, fontWeight: '500', lineHeight: 26, marginBottom: 8 },
  cardSummary:  { fontFamily: Fonts.jakarta, fontSize: 11, color: Colors.textMuted, lineHeight: 17, marginBottom: 10 },
  cardFooter:   { flexDirection: 'row', alignItems: 'center' },
  cardAuthor:   { fontFamily: Fonts.jakarta, fontSize: 9.5, color: Colors.gold, fontWeight: '600' },
  cardFirm:     { fontFamily: Fonts.jakarta, fontSize: 9.5, color: Colors.textMuted },

  empty:        { alignItems: 'center', paddingTop: 40, paddingHorizontal: 20 },
  emptyDot:     { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: Colors.goldLine, marginBottom: 18 },
  emptyTitle:   { fontFamily: Fonts.cormorant, fontSize: 20, color: Colors.ivory, fontStyle: 'italic', fontWeight: '300', marginBottom: 8 },
  emptySub:     { fontFamily: Fonts.jakarta, fontSize: 10, color: Colors.textMuted, textAlign: 'center', lineHeight: 16 },

  // Okuma / yazma ekranı
  readerRoot:   { flex: 1, backgroundColor: Colors.navy, paddingTop: 44 },
  readerBar:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 14, borderBottomWidth: 0.5, borderBottomColor: Colors.goldLine },
  readerBack:   { fontFamily: Fonts.jakarta, fontSize: 8, letterSpacing: 2, color: Colors.gold, fontWeight: '700' },
  readerDate:   { fontFamily: Fonts.mono, fontSize: 7.5, letterSpacing: 1.5, color: Colors.textMuted },
  readerBody:   { paddingHorizontal: 24, paddingTop: 28 },
  readerTitle:  { fontFamily: Fonts.cormorant, fontSize: 30, color: Colors.ivory, fontWeight: '500', lineHeight: 37 },
  readerByline: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18 },
  readerAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
  readerAvatarText: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.gold },
  readerAuthor: { fontFamily: Fonts.jakarta, fontSize: 12, color: Colors.ivory, fontWeight: '600' },
  readerFirm:   { fontFamily: Fonts.jakarta, fontSize: 9.5, color: Colors.textMuted, marginTop: 2 },
  readerRule:   { height: 0.5, backgroundColor: Colors.goldLine, marginVertical: 22 },
  readerSummary:{ fontFamily: Fonts.cormorant, fontSize: 17, fontStyle: 'italic', color: Colors.ivory, lineHeight: 26, marginBottom: 20, opacity: 0.9 },
  readerText:   { fontFamily: Fonts.jakarta, fontSize: 13, color: Colors.textMuted, lineHeight: 23 },

  composeBody:  { paddingHorizontal: 24, paddingTop: 24 },
  label:        { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, letterSpacing: 2, color: Colors.textMuted, fontWeight: '600', marginBottom: 8 },
  optional:     { color: Colors.textMuted, fontWeight: '400', letterSpacing: 0.5 },
  inputTitle:   { fontFamily: Fonts.cormorant, fontSize: 22, color: Colors.ivory, paddingBottom: 8, lineHeight: 28 },
  input:        { fontFamily: Fonts.jakarta, fontSize: 13, color: Colors.ivory, paddingBottom: 8, lineHeight: 20 },
  inputBody:    { minHeight: 220 },
  underline:    { height: 0.5, backgroundColor: Colors.goldLine },
  counter:      { fontFamily: Fonts.mono, fontSize: 7.5, color: Colors.textMuted, textAlign: 'right', marginTop: 6 },
  counterWarn:  { color: 'rgba(224,96,96,0.85)' },
  cta:          { backgroundColor: Colors.gold, paddingVertical: 15, alignItems: 'center', marginTop: 28 },
  ctaText:      { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, fontWeight: '700', color: Colors.navyDeep, letterSpacing: 2.5 },
  disabled:     { opacity: 0.4 },
  note:         { fontFamily: Fonts.jakarta, fontSize: 9.5, color: Colors.textMuted, lineHeight: 15, marginTop: 14 },
});
