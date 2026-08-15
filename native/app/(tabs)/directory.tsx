import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Modal, StyleSheet, Linking, FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, FontSize } from '@/theme';
import { openTel, openMail } from '@/lib/links';
import { useMembers } from '@/hooks/useMembers';
import type { Profile, MemberRole } from '@/types/database';
import { initials } from '@/lib/format';

type Member = {
  id: string;
  name: string;
  role: string;
  roleKey: MemberRole;
  firm: string;
  city: string;
  memberNo: string;
  phone: string;
  sector: string;
  email?: string;
};

type FilterKey = 'TÜMÜ' | 'YÖNETİM' | 'ÜYE' | 'ÖĞRENCİ';

const ROLE_LABELS: Record<MemberRole, string> = {
  pending:   'Onay Bekliyor',
  member:    'Üye',
  student:   'Öğrenci Üye',
  board:     'Yönetim Kurulu',
  president: 'Başkan',
  admin:     'Admin',
};

function profileToMember(p: Profile): Member {
  return {
    id:       p.id,
    name:     p.full_name,
    role:     ROLE_LABELS[p.role] ?? p.role,
    // Filtreler metin etiketine göre çalışıyordu: ROLE_LABELS'ta tek
    // harflik bir değişiklik filtreleri sessizce bozardı.
    roleKey:  p.role,
    firm:     p.company ?? '—',
    city:     p.city ?? '—',
    memberNo: p.member_code ?? '—',
    // Üye telefonunu rehberde gizlemeyi seçebilir (migration 011).
    phone:    p.phone_visible === false ? '—' : (p.phone ?? '—'),
    sector:   p.sector ?? '—',
    email:    p.email ?? undefined,
  };
}

// Sunum verisi. 19 uydurma üye + telefon numaraları; bunlar arasında
// gerçek kişilerin adları da var. Yayın paketine hiç girmemeli.
const DEMO_MEMBERS: Member[] = [
  { id:'1',  name:'Resul Öden',       roleKey:'president' as MemberRole, role:'Başkan',          firm:'ROSSA HOME',             city:'İstanbul', memberNo:'GT-2026-00001', phone:'+90 532 101 00 01', sector:'Ev Tekstili' },
  { id:'2',  name:'Fatih Özdemir',    roleKey:'board' as MemberRole, role:'Yönetim Kurulu',  firm:'ORMEN TEKSTİL',          city:'Ankara',   memberNo:'GT-2026-00002', phone:'+90 542 312 04 60', sector:'Dokuma' },
  { id:'3',  name:'Elif Yıldız',      roleKey:'member' as MemberRole, role:'Üye',             firm:'YILDIZ HOME',            city:'Bursa',    memberNo:'GT-2026-00003', phone:'+90 505 234 56 78', sector:'Tasarım' },
  { id:'4',  name:'Kerem Bayraktar',  roleKey:'member' as MemberRole, role:'Üye',             firm:'BAYRAKTAR TEKSTİL',      city:'İstanbul', memberNo:'GT-2026-00004', phone:'+90 533 456 78 90', sector:'İhracat' },
  { id:'5',  name:'Ayşe Kaya',        roleKey:'student' as MemberRole, role:'Öğrenci Üye',     firm:'İTÜ Tekstil Müh.',       city:'İstanbul', memberNo:'GT-2026-00005', phone:'+90 544 567 89 01', sector:'Öğrenci' },
  { id:'6',  name:'Mert Arslan',      roleKey:'board' as MemberRole, role:'Yönetim Kurulu',  firm:'ARSLAN TEKSTİL',         city:'Denizli',  memberNo:'GT-2026-00006', phone:'+90 532 678 90 12', sector:'Dokuma' },
  { id:'7',  name:'Selin Çelik',      roleKey:'member' as MemberRole, role:'Üye',             firm:'ÇELİK HOME',             city:'İstanbul', memberNo:'GT-2026-00007', phone:'+90 506 789 01 23', sector:'Ev Tekstili' },
  { id:'8',  name:'Burak Öztürk',     roleKey:'member' as MemberRole, role:'Üye',             firm:'ÖZTÜRK BOYA',            city:'Bursa',    memberNo:'GT-2026-00008', phone:'+90 535 890 12 34', sector:'Boya & Terbiye' },
  { id:'9',  name:'Zeynep Şahin',     roleKey:'student' as MemberRole, role:'Öğrenci Üye',     firm:'Uludağ Üniversitesi',    city:'Bursa',    memberNo:'GT-2026-00009', phone:'+90 545 901 23 45', sector:'Öğrenci' },
  { id:'10', name:'Emre Yılmaz',      roleKey:'member' as MemberRole, role:'Üye',             firm:'YILMAZ DOKUMA',          city:'K.Maraş',  memberNo:'GT-2026-00010', phone:'+90 532 012 34 56', sector:'Dokuma' },
  { id:'11', name:'Hande Kılıç',      roleKey:'member' as MemberRole, role:'Üye',             firm:'KILIÇ TEKSTİL',          city:'İstanbul', memberNo:'GT-2026-00011', phone:'+90 507 123 45 67', sector:'İhracat' },
  { id:'12', name:'Oğuz Aydın',       roleKey:'board' as MemberRole, role:'Yönetim Kurulu',  firm:'AYDIN GROUP',            city:'İzmir',    memberNo:'GT-2026-00012', phone:'+90 533 234 56 78', sector:'Ev Tekstili' },
  { id:'13', name:'Ceren Doğan',      roleKey:'member' as MemberRole, role:'Üye',             firm:'DOĞAN TEKSTİL',          city:'Gaziantep',memberNo:'GT-2026-00013', phone:'+90 543 345 67 89', sector:'Dokuma' },
  { id:'14', name:'Alp Çakır',        roleKey:'student' as MemberRole, role:'Öğrenci Üye',     firm:'İTÜ Tekstil Müh.',       city:'İstanbul', memberNo:'GT-2026-00014', phone:'+90 535 456 78 90', sector:'Öğrenci' },
  { id:'15', name:'Nisan Güler',      roleKey:'member' as MemberRole, role:'Üye',             firm:'GÜLER HOME DESIGN',      city:'İstanbul', memberNo:'GT-2026-00015', phone:'+90 506 567 89 01', sector:'Tasarım' },
  { id:'16', name:'Tarık Erdoğan',    roleKey:'board' as MemberRole, role:'Yönetim Kurulu',  firm:'ERDOĞAN TEKSTİL',        city:'Denizli',  memberNo:'GT-2026-00016', phone:'+90 542 678 90 12', sector:'İhracat' },
  { id:'17', name:'Büşra Kara',       roleKey:'member' as MemberRole, role:'Üye',             firm:'KARA BOYA',              city:'Bursa',    memberNo:'GT-2026-00017', phone:'+90 532 789 01 23', sector:'Boya & Terbiye' },
  { id:'18', name:'Ege Demir',        roleKey:'student' as MemberRole, role:'Öğrenci Üye',     firm:'Pamukkale Üniversitesi', city:'Denizli',  memberNo:'GT-2026-00018', phone:'+90 507 890 12 34', sector:'Öğrenci' },
  { id:'19', name:'Görkem Yıldırım',  roleKey:'member' as MemberRole, role:'Üye',             firm:'YILDIRIM EV TEKSTİLİ',  city:'İstanbul', memberNo:'GT-2026-00019', phone:'+90 534 901 23 45', sector:'Ev Tekstili' },
];

const FALLBACK_MEMBERS: Member[] = __DEV__ ? DEMO_MEMBERS : [];

export default function DirectoryScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterKey>('TÜMÜ');
  const [search, setSearch] = useState('');
  // Her tuş vuruşunda 1.500 kaydı Türkçe'ye duyarlı küçültmeyle taramak
  // düşük segment cihazlarda yazmayı takılmalı hâle getiriyordu.
  const [query, setQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 220);
    return () => clearTimeout(t);
  }, [search]);
  const [selected, setSelected] = useState<Member | null>(null);

  const { members: supabaseMembers, loading, loadingAll, error, total, refetch } = useMembers();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };
  // Yayın sürümünde kurgu üye gösterilmez — gerçek rehber neyse odur.
  // Demo verisi yalnızca geliştirme/sunumda devreye girer.
  const allMembers: Member[] = supabaseMembers.length > 0
    ? supabaseMembers.map(profileToMember)
    : __DEV__ ? FALLBACK_MEMBERS : [];

  // Arama anahtarı üye başına BİR KEZ hesaplanır. Eskiden her tuş
  // vuruşunda her üye için iki kez toLocaleLowerCase çağrılıyordu.
  const indexed = useMemo(
    () => allMembers.map(m => ({
      m,
      key: `${m.name} ${m.firm} ${m.city}`.toLocaleLowerCase('tr-TR'),
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [supabaseMembers],
  );

  const filtered = useMemo(() => {
    let list = indexed;
    if (filter === 'YÖNETİM') list = list.filter(x => x.m.roleKey === 'president' || x.m.roleKey === 'board' || x.m.roleKey === 'admin');
    else if (filter === 'ÜYE')      list = list.filter(x => x.m.roleKey === 'member');
    else if (filter === 'ÖĞRENCİ') list = list.filter(x => x.m.roleKey === 'student');
    if (query) {
      // Türkçe'de 'I'.toLowerCase() → 'i' olmaz; 'İSTANBUL' araması
      // locale-aware küçültme olmadan 'İstanbul'u bulamaz.
      const q = query.toLocaleLowerCase('tr-TR');
      list = list.filter(x => x.key.includes(q));
    }
    return list.map(x => x.m);
  }, [filter, query, indexed]);

  const FILTERS: FilterKey[] = ['TÜMÜ', 'YÖNETİM', 'ÜYE', 'ÖĞRENCİ'];

  return (
    <SafeAreaView style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.section}>REHBER</Text>
        <Text style={styles.title}>Üye <Text style={{ fontStyle: 'italic' }}>dizini.</Text></Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="İsim veya firma ara..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.pills}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={[styles.pill, filter === f && styles.pillActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.pillText, filter === f && styles.pillTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.countRow}>
        <Text style={styles.count}>{filtered.length} ÜYE</Text>
        {loading && <ActivityIndicator size="small" color={Colors.gold} style={{ marginLeft: 8 }} />}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={m => String(m.id)}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={{ paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        initialNumToRender={12}
        removeClippedSubviews
        ListFooterComponent={
          loadingAll ? (
            <Text style={styles.loadingMore}>
              {`Üyeler yükleniyor — ${supabaseMembers.length} / ${total}`}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyDot} />
              <Text style={styles.emptyTitle}>
                {error
                  ? 'Bağlantı kurulamadı.'
                  : search.trim() || filter !== 'TÜMÜ'
                  ? 'Sonuç bulunamadı.'
                  : 'Rehber henüz oluşturuluyor.'}
              </Text>
              <Text style={styles.emptySub}>
                {error
                  ? 'İnternet bağlantınızı kontrol edip aşağı çekerek yeniden deneyin.'
                  : search.trim() || filter !== 'TÜMÜ'
                  ? 'Farklı bir arama veya filtre deneyin.'
                  : 'Onaylanan üyeler burada listelenecek. Aşağı çekerek yenileyebilirsiniz.'}
              </Text>
            </View>
          )
        }
        renderItem={({ item: m }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => setSelected(m)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${m.name}, ${m.firm}, ${m.city}. Detay için dokunun.`}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(m.name)}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>{m.name}</Text>
              <Text style={styles.firm} numberOfLines={1}>{m.firm}</Text>
              <View style={styles.tags}>
                <View style={styles.roleTag}>
                  <Text style={styles.roleTagText}>{m.role.toUpperCase()}</Text>
                </View>
                <Text style={styles.city}>{m.city}</Text>
              </View>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        )}
      />

      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            {selected && <>
              <View style={styles.modalAvatar}>
                <Text style={styles.modalAvatarText}>{initials(selected.name)}</Text>
              </View>
              <Text style={styles.modalName} numberOfLines={2}>{selected.name}</Text>
              <Text style={styles.modalRole}>{selected.role.toUpperCase()}</Text>
              <View style={styles.modalDivider} />
              {([
                ['FİRMA', selected.firm],
                ['ŞEHİR', selected.city],
                ['SEKTÖR', selected.sector],
                ['ÜYE NO', selected.memberNo],
                ...(selected.email ? [['E-POSTA', selected.email] as [string, string]] : []),
              ] as [string, string][]).map(([label, value]) => (
                <View key={label} style={styles.modalRow}>
                  <Text style={styles.modalLabel}>{label}</Text>
                  <Text style={styles.modalValue}>{value}</Text>
                </View>
              ))}
              {selected.phone !== '—' && (
                <TouchableOpacity
                  style={styles.phoneBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`${selected.name} adlı üyeyi ara`}
                  onPress={() => openTel(selected.phone)}
                >
                  <Text style={styles.phoneBtnText}>☎  {selected.phone}</Text>
                </TouchableOpacity>
              )}
              {!!selected.email && (
                <TouchableOpacity
                  style={styles.mailBtn}
                  onPress={() => openMail(selected.email!)}
                >
                  <Text style={styles.mailBtnText}>✉  E-POSTA GÖNDER</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
                <Text style={styles.closeBtnText}>KAPAT</Text>
              </TouchableOpacity>
            </>}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: Colors.navy },
  header:         { backgroundColor: Colors.navyDeep, paddingHorizontal: 24, paddingBottom: 16 },
  section:        { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 2, fontWeight: '600', marginBottom: 4 },
  title:          { fontFamily: 'CormorantGaramond', fontSize: 28, color: Colors.ivory, fontWeight: '300' },
  divider:        { height: 0.5, backgroundColor: Colors.goldLine, marginTop: 14 },
  searchWrap:     { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: Colors.navyDeep },
  search:         { borderWidth: 0.5, borderColor: Colors.goldLine, paddingHorizontal: 14, paddingVertical: 10, color: Colors.ivory, fontFamily: Fonts.jakarta, fontSize: FontSize.base },
  pills:          { flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 12, gap: 6, backgroundColor: Colors.navyDeep },
  pill:           { flex: 1, paddingVertical: 8, borderWidth: 0.5, borderColor: Colors.goldLine, alignItems: 'center' },
  pillActive:     { backgroundColor: Colors.gold, borderColor: Colors.gold },
  pillText:       { fontFamily: Fonts.jakarta, fontSize: 7, fontWeight: '600', letterSpacing: 1, color: Colors.textMuted },
  pillTextActive: { color: Colors.navy },
  countRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 10 },
  count:          { fontFamily: Fonts.mono, fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 1.5 },
  loadingMore: { fontFamily: Fonts.jakarta, fontSize: 10, color: Colors.textMuted, textAlign: 'center', paddingVertical: 18 },
  separator:      { height: 0.5, backgroundColor: Colors.goldLine },
  emptyWrap:      { alignItems: 'center', paddingTop: 72, paddingHorizontal: 44 },
  emptyDot:       { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: Colors.goldLine, marginBottom: 20 },
  emptyTitle:     { fontFamily: 'CormorantGaramond', fontSize: 20, color: Colors.ivory, fontStyle: 'italic', fontWeight: '300', marginBottom: 10, textAlign: 'center' },
  emptySub:       { fontFamily: Fonts.jakarta, fontSize: 10, color: Colors.textMuted, textAlign: 'center', lineHeight: 16 },
  row:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, gap: 14 },
  avatar:         { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: Colors.gold, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.navyMid },
  avatarText:     { fontFamily: Fonts.mono, fontSize: 11, color: Colors.gold, fontWeight: '500' },
  info:           { flex: 1 },
  name:           { fontFamily: 'CormorantGaramond', fontSize: 16, color: Colors.ivory, fontWeight: '500', marginBottom: 2 },
  firm:           { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 6 },
  tags:           { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleTag:        { paddingHorizontal: 6, paddingVertical: 2, backgroundColor: Colors.navyMid, borderWidth: 0.5, borderColor: Colors.goldLine },
  roleTagText:    { fontFamily: Fonts.jakarta, fontSize: 6.5, color: Colors.textMuted, letterSpacing: 1 },
  city:           { fontFamily: Fonts.jakarta, fontSize: 9, color: Colors.textMuted },
  arrow:          { fontFamily: Fonts.jakarta, fontSize: 14, color: Colors.gold },

  overlay:        { flex: 1, backgroundColor: 'rgba(3,15,9,0.92)', justifyContent: 'flex-end' },
  card:           { backgroundColor: Colors.navyDeep, borderTopWidth: 0.5, borderTopColor: Colors.goldLine, padding: 32, paddingBottom: 48, alignItems: 'center' },
  modalAvatar:    { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: Colors.gold, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.navyMid, marginBottom: 16 },
  modalAvatarText:{ fontFamily: Fonts.mono, fontSize: 18, color: Colors.gold },
  modalName:      { fontFamily: 'CormorantGaramond', fontSize: 28, color: Colors.ivory, fontStyle: 'italic', fontWeight: '300', marginBottom: 4 },
  modalRole:      { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, color: Colors.gold, letterSpacing: 2, marginBottom: 20 },
  modalDivider:   { height: 0.5, backgroundColor: Colors.goldLine, width: '100%', marginBottom: 20 },
  modalRow:       { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.goldLine },
  modalLabel:     { fontFamily: Fonts.mono, fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 1 },
  modalValue:     { fontFamily: Fonts.jakarta, fontSize: FontSize.sm, color: Colors.ivory },
  phoneBtn:       { marginTop: 20, backgroundColor: Colors.gold, paddingVertical: 12, width: '100%', alignItems: 'center' },
  phoneBtnText:   { fontFamily: Fonts.jakarta, fontSize: FontSize.sm, fontWeight: '700', color: Colors.navy },
  mailBtn:        { marginTop: 10, borderWidth: 0.5, borderColor: Colors.gold, paddingVertical: 12, width: '100%', alignItems: 'center' },
  mailBtnText:    { fontFamily: Fonts.jakarta, fontSize: FontSize.sm, fontWeight: '600', color: Colors.gold },
  closeBtn:       { marginTop: 12, paddingVertical: 12, width: '100%', alignItems: 'center', borderWidth: 0.5, borderColor: Colors.goldLine },
  closeBtnText:   { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 2 },
});
