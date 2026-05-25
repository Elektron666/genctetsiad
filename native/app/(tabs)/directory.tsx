import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Modal, StyleSheet, Linking, FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, FontSize } from '@/theme';
import { useMembers } from '@/hooks/useMembers';
import type { Profile, MemberRole } from '@/types/database';

type Member = {
  id: string;
  name: string;
  role: string;
  firm: string;
  city: string;
  memberNo: string;
  phone: string;
  sector: string;
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
    firm:     p.company ?? '—',
    city:     p.city ?? '—',
    memberNo: p.member_code ?? '—',
    phone:    p.phone ?? '—',
    sector:   p.sector ?? '—',
  };
}

const FALLBACK_MEMBERS: Member[] = [
  { id:'1',  name:'Resul Öden',       role:'Başkan',          firm:'ROSSA HOME',             city:'İstanbul', memberNo:'GT-2026-00001', phone:'+90 532 101 00 01', sector:'Ev Tekstili' },
  { id:'2',  name:'Fatih Özdemir',    role:'Yönetim Kurulu',  firm:'ORMEN TEKSTİL',          city:'Ankara',   memberNo:'GT-2026-00002', phone:'+90 542 312 04 60', sector:'Dokuma' },
  { id:'3',  name:'Elif Yıldız',      role:'Üye',             firm:'YILDIZ HOME',            city:'Bursa',    memberNo:'GT-2026-00003', phone:'+90 505 234 56 78', sector:'Tasarım' },
  { id:'4',  name:'Kerem Bayraktar',  role:'Üye',             firm:'BAYRAKTAR TEKSTİL',      city:'İstanbul', memberNo:'GT-2026-00004', phone:'+90 533 456 78 90', sector:'İhracat' },
  { id:'5',  name:'Ayşe Kaya',        role:'Öğrenci Üye',     firm:'İTÜ Tekstil Müh.',       city:'İstanbul', memberNo:'GT-2026-00005', phone:'+90 544 567 89 01', sector:'Öğrenci' },
  { id:'6',  name:'Mert Arslan',      role:'Yönetim Kurulu',  firm:'ARSLAN TEKSTİL',         city:'Denizli',  memberNo:'GT-2026-00006', phone:'+90 532 678 90 12', sector:'Dokuma' },
  { id:'7',  name:'Selin Çelik',      role:'Üye',             firm:'ÇELİK HOME',             city:'İstanbul', memberNo:'GT-2026-00007', phone:'+90 506 789 01 23', sector:'Ev Tekstili' },
  { id:'8',  name:'Burak Öztürk',     role:'Üye',             firm:'ÖZTÜRK BOYA',            city:'Bursa',    memberNo:'GT-2026-00008', phone:'+90 535 890 12 34', sector:'Boya & Terbiye' },
  { id:'9',  name:'Zeynep Şahin',     role:'Öğrenci Üye',     firm:'Uludağ Üniversitesi',    city:'Bursa',    memberNo:'GT-2026-00009', phone:'+90 545 901 23 45', sector:'Öğrenci' },
  { id:'10', name:'Emre Yılmaz',      role:'Üye',             firm:'YILMAZ DOKUMA',          city:'K.Maraş',  memberNo:'GT-2026-00010', phone:'+90 532 012 34 56', sector:'Dokuma' },
  { id:'11', name:'Hande Kılıç',      role:'Üye',             firm:'KILIÇ TEKSTİL',          city:'İstanbul', memberNo:'GT-2026-00011', phone:'+90 507 123 45 67', sector:'İhracat' },
  { id:'12', name:'Oğuz Aydın',       role:'Yönetim Kurulu',  firm:'AYDIN GROUP',            city:'İzmir',    memberNo:'GT-2026-00012', phone:'+90 533 234 56 78', sector:'Ev Tekstili' },
  { id:'13', name:'Ceren Doğan',      role:'Üye',             firm:'DOĞAN TEKSTİL',          city:'Gaziantep',memberNo:'GT-2026-00013', phone:'+90 543 345 67 89', sector:'Dokuma' },
  { id:'14', name:'Alp Çakır',        role:'Öğrenci Üye',     firm:'İTÜ Tekstil Müh.',       city:'İstanbul', memberNo:'GT-2026-00014', phone:'+90 535 456 78 90', sector:'Öğrenci' },
  { id:'15', name:'Nisan Güler',      role:'Üye',             firm:'GÜLER HOME DESIGN',      city:'İstanbul', memberNo:'GT-2026-00015', phone:'+90 506 567 89 01', sector:'Tasarım' },
  { id:'16', name:'Tarık Erdoğan',    role:'Yönetim Kurulu',  firm:'ERDOĞAN TEKSTİL',        city:'Denizli',  memberNo:'GT-2026-00016', phone:'+90 542 678 90 12', sector:'İhracat' },
  { id:'17', name:'Büşra Kara',       role:'Üye',             firm:'KARA BOYA',              city:'Bursa',    memberNo:'GT-2026-00017', phone:'+90 532 789 01 23', sector:'Boya & Terbiye' },
  { id:'18', name:'Ege Demir',        role:'Öğrenci Üye',     firm:'Pamukkale Üniversitesi', city:'Denizli',  memberNo:'GT-2026-00018', phone:'+90 507 890 12 34', sector:'Öğrenci' },
  { id:'19', name:'Görkem Yıldırım',  role:'Üye',             firm:'YILDIRIM EV TEKSTİLİ',  city:'İstanbul', memberNo:'GT-2026-00019', phone:'+90 534 901 23 45', sector:'Ev Tekstili' },
];

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function DirectoryScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterKey>('TÜMÜ');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Member | null>(null);

  const { members: supabaseMembers, loading } = useMembers();
  const allMembers: Member[] = supabaseMembers.length > 0
    ? supabaseMembers.map(profileToMember)
    : FALLBACK_MEMBERS;

  const filtered = useMemo(() => {
    let list = allMembers;
    if (filter === 'YÖNETİM') list = list.filter(m => m.role === 'Başkan' || m.role === 'Yönetim Kurulu');
    else if (filter === 'ÜYE')      list = list.filter(m => m.role === 'Üye');
    else if (filter === 'ÖĞRENCİ') list = list.filter(m => m.role === 'Öğrenci Üye');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m => m.name.toLowerCase().includes(q) || m.firm.toLowerCase().includes(q));
    }
    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search, allMembers.length]);

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
        contentContainerStyle={{ paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item: m }) => (
          <TouchableOpacity style={styles.row} onPress={() => setSelected(m)} activeOpacity={0.7}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(m.name)}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{m.name}</Text>
              <Text style={styles.firm}>{m.firm}</Text>
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

      <Modal visible={!!selected} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.card}>
            {selected && <>
              <View style={styles.modalAvatar}>
                <Text style={styles.modalAvatarText}>{initials(selected.name)}</Text>
              </View>
              <Text style={styles.modalName}>{selected.name}</Text>
              <Text style={styles.modalRole}>{selected.role.toUpperCase()}</Text>
              <View style={styles.modalDivider} />
              {([
                ['FİRMA', selected.firm],
                ['ŞEHİR', selected.city],
                ['SEKTÖR', selected.sector],
                ['ÜYE NO', selected.memberNo],
              ] as [string, string][]).map(([label, value]) => (
                <View key={label} style={styles.modalRow}>
                  <Text style={styles.modalLabel}>{label}</Text>
                  <Text style={styles.modalValue}>{value}</Text>
                </View>
              ))}
              <TouchableOpacity style={styles.phoneBtn} onPress={() => Linking.openURL(`tel:${selected.phone}`)}>
                <Text style={styles.phoneBtnText}>☎  {selected.phone}</Text>
              </TouchableOpacity>
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
  separator:      { height: 0.5, backgroundColor: Colors.goldLine },
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
  closeBtn:       { marginTop: 12, paddingVertical: 12, width: '100%', alignItems: 'center', borderWidth: 0.5, borderColor: Colors.goldLine },
  closeBtnText:   { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 2 },
});
