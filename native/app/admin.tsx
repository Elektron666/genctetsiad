import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, RefreshControl, Alert, KeyboardAvoidingView, Platform, Modal, FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, FontSize } from '@/theme';
import { useAuthContext } from '@/context/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import type { AuditRow } from '@/hooks/useAdmin';
import { useToast } from '@/components/Toast';
import type { Profile } from '@/types/database';

const ADMIN_ROLES = ['board', 'president', 'admin'];

type AdminTab = 'ONAYLAR' | 'ÜYELER' | 'BÜLTEN' | 'DUYURU' | 'ETKİNLİK' | 'KURS' | 'KAYIT';

const ROLE_LABELS: Record<string, string> = {
  pending:   'Onay Bekliyor',
  member:    'Üye',
  student:   'Öğrenci Üye',
  board:     'Yönetim Kurulu',
  president: 'Başkan',
  admin:     'Admin',
};

function initials(name: string) {
  return name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '—';
}

const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_TR[d.getMonth()] ?? ''} ${d.getFullYear()}`;
}

// ─── Bekleyen başvuru kartı ───────────────────────────────────────────────────

function PendingCard({ p, onApprove, onReject }: {
  p: Profile;
  onApprove: (role: 'member' | 'student') => void;
  onReject: () => void;
}) {
  const [busy, setBusy] = useState(false);

  // Sahte/spam başvurular eskiden sonsuza kadar kuyrukta kalıyordu:
  // yönetimin elinde yalnızca ONAYLA vardı. Reddetme kaydı audit_log'a
  // yazılır, kişisel veri ise silinir (KVKK: gereksiz veriyi tutma).
  const confirmReject = () => {
    Alert.alert(
      'Başvuruyu Reddet',
      `${p.full_name || 'Bu başvuru'} reddedilecek ve kişisel verileri silinecek. İşlem denetim kaydına yazılır ve geri alınamaz.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'REDDET', style: 'destructive', onPress: onReject },
      ]
    );
  };

  const confirm = (role: 'member' | 'student') => {
    Alert.alert(
      'Başvuruyu Onayla',
      `${p.full_name || 'İsimsiz başvuru'} — ${role === 'member' ? 'ÜYE' : 'ÖĞRENCİ ÜYE'} olarak onaylansın mı?\n\nÜye kodu otomatik atanacaktır.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Onayla', onPress: () => { setBusy(true); onApprove(role); } },
      ]
    );
  };

  return (
    <View style={s.pCard}>
      <View style={s.pTop}>
        <View style={s.pAvatar}>
          <Text style={s.pAvatarText}>{initials(p.full_name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.pName}>{p.full_name || 'İsimsiz başvuru'}</Text>
          <Text style={s.pFirm}>{[p.company, p.city].filter(Boolean).join(' · ') || '—'}</Text>
          <Text style={s.pMeta}>{p.phone ?? '—'}{p.sector ? `  ·  ${p.sector}` : ''}</Text>
        </View>
      </View>
      <View style={s.pBtnRow}>
        <TouchableOpacity
          style={[s.pBtn, s.pBtnFill, busy && s.disabled]}
          onPress={() => confirm('member')}
          disabled={busy}
          activeOpacity={0.8}
        >
          <Text style={s.pBtnFillText}>✓ ÜYE OLARAK ONAYLA</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.pBtn, s.pBtnOutline, busy && s.disabled]}
          onPress={() => confirm('student')}
          disabled={busy}
          activeOpacity={0.8}
        >
          <Text style={s.pBtnOutlineText}>ÖĞRENCİ</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={confirmReject} disabled={busy} activeOpacity={0.7} style={s.pRejectBtn}>
        <Text style={s.pRejectText}>Başvuruyu reddet ve sil</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Üye yönetimi ─────────────────────────────────────────────────────────────

const ASSIGNABLE_ROLES: { key: MemberRoleKey; label: string; desc: string }[] = [
  { key: 'member',    label: 'ÜYE',             desc: 'Standart üyelik' },
  { key: 'student',   label: 'ÖĞRENCİ ÜYE',     desc: 'Üniversite öğrencisi' },
  { key: 'board',     label: 'YÖNETİM KURULU',  desc: 'Panel erişimi verir' },
  { key: 'admin',     label: 'ADMİN',           desc: 'Tam yetki' },
  { key: 'pending',   label: 'ONAYA GERİ AL',   desc: 'Üyeliği askıya alır' },
];

type MemberRoleKey = 'member' | 'student' | 'board' | 'admin' | 'pending';

function MembersTab({
  members,
  currentUserId,
  onSetRole,
}: {
  members: Profile[];
  currentUserId?: string;
  onSetRole: (p: Profile, role: MemberRoleKey) => void;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Profile | null>(null);

  // Türkçe'de 'I'.toLowerCase() → 'i' olmaz; locale-aware küçültme şart.
  // Aksi hâlde 'İSTANBUL' araması 'İstanbul'u bulamaz.
  const lower = (t: string) => t.toLocaleLowerCase('tr-TR');
  const q = lower(search.trim());
  const filtered = q
    ? members.filter(m =>
        lower(m.full_name).includes(q) ||
        lower(m.company ?? '').includes(q))
    : members;

  const pickRole = (role: MemberRoleKey) => {
    if (!selected) return;
    const isSelf = selected.id === currentUserId;
    Alert.alert(
      'Rol Değişikliği',
      `${selected.full_name} → ${ROLE_LABELS[role]}${isSelf ? '\n\n⚠️ KENDİ rolünüzü değiştiriyorsunuz — admin yetkinizi kaybedebilirsiniz!' : ''}`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Onayla', style: role === 'pending' ? 'destructive' : 'default', onPress: () => { onSetRole(selected, role); setSelected(null); } },
      ]
    );
  };

  return (
    <View style={{ paddingTop: 12 }}>
      <View style={s.searchWrap}>
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="İsim veya firma ara..."
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      {/* Üye sayısı binlere çıkabilir — sanallaştırılmış liste şart */}
      <FlatList
        data={filtered}
        keyExtractor={m => m.id}
        scrollEnabled={false}
        initialNumToRender={12}
        removeClippedSubviews
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptySub}>{q ? 'Aramayla eşleşen üye yok.' : 'Henüz onaylı üye yok.'}</Text>
          </View>
        }
        renderItem={({ item: m }) => (
          <TouchableOpacity
            style={s.mRow}
            onPress={() => setSelected(m)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${m.full_name}, ${ROLE_LABELS[m.role] ?? m.role}. Rol değiştirmek için dokunun.`}
          >
            <View style={s.pAvatar}>
              <Text style={s.pAvatarText}>{initials(m.full_name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.pName}>{m.full_name || '—'}{m.id === currentUserId ? '  (SİZ)' : ''}</Text>
              <Text style={s.pFirm}>{[m.company, m.city].filter(Boolean).join(' · ') || '—'}</Text>
            </View>
            <View style={[s.roleTag, ADMIN_ROLES.includes(m.role) && s.roleTagGold]}>
              <Text style={[s.roleTagText, ADMIN_ROLES.includes(m.role) && s.roleTagTextGold]}>
                {(ROLE_LABELS[m.role] ?? m.role).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Rol seçme alt menüsü */}
      {selected && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={s.roleSheetOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setSelected(null)} activeOpacity={1} />
          <View style={s.roleSheet}>
            <Text style={s.roleSheetName}>{selected.full_name}</Text>
            <Text style={s.roleSheetSub}>
              {(ROLE_LABELS[selected.role] ?? selected.role).toUpperCase()}
              {selected.member_code ? `  ·  ${selected.member_code}` : ''}
            </Text>
            <View style={s.roleSheetDivider} />
            {/* Kendi rolünü değiştirmek RLS tarafından da engellenir
                (migration 011) — düğmeyi hiç göstermiyoruz ki yönetici
                başarısız olacak bir işlemi denemesin. */}
            {ASSIGNABLE_ROLES.filter(r => r.key !== selected.role && selected.id !== currentUserId).map(r => (
              <TouchableOpacity key={r.key} style={s.roleOption} onPress={() => pickRole(r.key)} activeOpacity={0.7}>
                <Text style={[s.roleOptionLabel, r.key === 'pending' && { color: 'rgba(224,96,96,0.85)' }]}>{r.label}</Text>
                <Text style={s.roleOptionDesc}>{r.desc}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={s.roleCancel} onPress={() => setSelected(null)} activeOpacity={0.7}>
              <Text style={s.roleCancelText}>VAZGEÇ</Text>
            </TouchableOpacity>
          </View>
        </View>
        </Modal>
      )}
    </View>
  );
}

// ─── Bülten inceleme kuyruğu ─────────────────────────────────────────────────

function ArticleReview({
  load,
  onReview,
  reloadKey,
}: {
  load: () => Promise<{ id: string; title: string; summary: string | null; body: string; author_name: string; created_at: string }[]>;
  onReview: (id: string, decision: 'published' | 'rejected', note: string | undefined, title: string) => Promise<boolean>;
  reloadKey: number;
}) {
  const [items, setItems] = useState<Awaited<ReturnType<typeof load>>>([]);
  const [open, setOpen] = useState<(typeof items)[0] | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    let cancelled = false;
    load().then(r => { if (!cancelled) setItems(r); });
    return () => { cancelled = true; };
  }, [reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const decide = async (decision: 'published' | 'rejected') => {
    if (!open) return;
    if (decision === 'rejected' && note.trim().length < 5) {
      Alert.alert('Gerekçe gerekli', 'Yazarın neyi düzelteceğini bilmesi için kısa bir not yazın.');
      return;
    }
    const ok = await onReview(open.id, decision, decision === 'rejected' ? note.trim() : undefined, open.title);
    if (ok) {
      setItems(prev => prev.filter(i => i.id !== open.id));
      setOpen(null);
      setNote('');
    }
  };

  return (
    <View style={{ paddingTop: 12 }}>
      {items.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyDot} />
          <Text style={s.emptyTitle}>İncelenecek yazı yok.</Text>
          <Text style={s.emptySub}>
            Üyelerin gönderdiği yazılar burada listelenir. Onayladığınız yazı
            bültende yayımlanır ve tüm üyelere bildirim gider.
          </Text>
        </View>
      ) : items.map(a => (
        <TouchableOpacity key={a.id} style={s.pCard} onPress={() => { setOpen(a); setNote(''); }} activeOpacity={0.8}>
          <Text style={s.pName}>{a.title}</Text>
          <Text style={s.pFirm}>{a.author_name} · {fmtDate(a.created_at)}</Text>
          {!!a.summary && <Text style={s.artSummary} numberOfLines={2}>{a.summary}</Text>}
          <Text style={s.artOpen}>OKU VE KARAR VER →</Text>
        </TouchableOpacity>
      ))}

      {open && (
        <Modal visible animationType="slide" onRequestClose={() => setOpen(null)}>
          <View style={s.artRoot}>
            <View style={s.artBar}>
              <TouchableOpacity onPress={() => setOpen(null)} activeOpacity={0.7}>
                <Text style={s.artBack}>← KUYRUĞA DÖN</Text>
              </TouchableOpacity>
              <Text style={s.artMeta}>{open.author_name}</Text>
            </View>

            <ScrollView contentContainerStyle={s.artBody} keyboardShouldPersistTaps="handled">
              <Text style={s.artTitle}>{open.title}</Text>
              {!!open.summary && <Text style={s.artLead}>{open.summary}</Text>}
              <View style={s.artRule} />
              <Text style={s.artText}>{open.body}</Text>

              <View style={s.artRule} />
              <Text style={s.fieldLabel}>REVİZYON NOTU <Text style={{ fontWeight: '400' }}>(reddederken zorunlu)</Text></Text>
              <TextInput
                style={[s.input, { minHeight: 70, fontFamily: Fonts.jakarta, fontSize: 13 }]}
                value={note}
                onChangeText={setNote}
                placeholder="Yazarın neyi düzeltmesi gerektiğini yazın..."
                placeholderTextColor={Colors.textMuted}
                multiline
                textAlignVertical="top"
                maxLength={400}
              />
              <View style={s.underline} />

              <TouchableOpacity style={s.cta} onPress={() => decide('published')} activeOpacity={0.8}>
                <Text style={s.ctaText}>✓ YAYINLA</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.artReject} onPress={() => decide('rejected')} activeOpacity={0.8}>
                <Text style={s.artRejectText}>REVİZYON İSTE</Text>
              </TouchableOpacity>
              <Text style={s.helper}>
                Yayınlarsanız tüm üyelere bildirim gider. Revizyon isterseniz
                yazar notunuzu görüp düzeltip yeniden gönderebilir.
              </Text>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
}

// ─── Kurs formu ───────────────────────────────────────────────────────────────

const LEVELS: { key: 'beginner' | 'intermediate' | 'advanced'; label: string }[] = [
  { key: 'beginner',     label: 'BAŞLANGIÇ' },
  { key: 'intermediate', label: 'ORTA' },
  { key: 'advanced',     label: 'İLERİ' },
];

function CourseForm({ onCreate }: {
  onCreate: (input: {
    title: string; description?: string; instructor?: string;
    duration_hours?: number | null;
    level?: 'beginner' | 'intermediate' | 'advanced';
  }) => Promise<boolean>;
}) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [instructor, setInstructor] = useState('');
  const [hours, setHours] = useState('');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [busy, setBusy] = useState(false);

  const valid = title.trim().length > 3;

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    const ok = await onCreate({
      title: title.trim(),
      description: desc.trim() || undefined,
      instructor: instructor.trim() || undefined,
      duration_hours: hours.trim() ? parseInt(hours.trim(), 10) || null : null,
      level,
    });
    setBusy(false);
    if (ok) { setTitle(''); setDesc(''); setInstructor(''); setHours(''); setLevel('beginner'); }
  };

  return (
    <View style={s.form}>
      <Text style={s.fieldLabel}>KURS ADI</Text>
      <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="Örn. İhracatta Dijital Pazarlama" placeholderTextColor={Colors.textMuted} maxLength={80} />
      <View style={s.underline} />

      <Text style={[s.fieldLabel, { marginTop: 20 }]}>AÇIKLAMA</Text>
      <TextInput style={[s.input, s.textArea, { minHeight: 70 }]} value={desc} onChangeText={setDesc} placeholder="Kurs içeriği (opsiyonel)" placeholderTextColor={Colors.textMuted} multiline textAlignVertical="top" maxLength={400} />
      <View style={s.underline} />

      <View style={s.row2}>
        <View style={{ flex: 1 }}>
          <Text style={[s.fieldLabel, { marginTop: 20 }]}>EĞİTMEN</Text>
          <TextInput style={s.input} value={instructor} onChangeText={setInstructor} placeholder="Ad Soyad" placeholderTextColor={Colors.textMuted} />
          <View style={s.underline} />
        </View>
        <View style={{ width: 100 }}>
          <Text style={[s.fieldLabel, { marginTop: 20 }]}>SÜRE (SAAT)</Text>
          <TextInput style={s.input} value={hours} onChangeText={setHours} placeholder="8" placeholderTextColor={Colors.textMuted} keyboardType="number-pad" maxLength={3} />
          <View style={s.underline} />
        </View>
      </View>

      <Text style={[s.fieldLabel, { marginTop: 20 }]}>SEVİYE</Text>
      <View style={s.pillRow}>
        {LEVELS.map(l => (
          <TouchableOpacity key={l.key} style={[s.pill, level === l.key && s.pillActive]} onPress={() => setLevel(l.key)} activeOpacity={0.8}>
            <Text style={[s.pillText, level === l.key && s.pillTextActive]}>{l.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[s.cta, (!valid || busy) && s.disabled]} onPress={submit} disabled={!valid || busy} activeOpacity={0.8}>
        <Text style={s.ctaText}>{busy ? 'EKLENİYOR...' : 'KURSU YAYINLA'}</Text>
      </TouchableOpacity>
      <Text style={s.helper}>Kurs, Akademi sekmesinde tüm üyelere anında açılır.</Text>
    </View>
  );
}

// ─── Katılımcı listesi ────────────────────────────────────────────────────────

function AttendeeSheet({
  eventTitle,
  load,
  onClose,
}: {
  eventTitle: string;
  load: () => Promise<{ user_id: string; full_name: string; company: string | null; phone: string | null }[]>;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<{ user_id: string; full_name: string; company: string | null; phone: string | null }[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    load().then(r => { if (!cancelled) setRows(r); });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.roleSheetOverlay}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
        <View style={[s.roleSheet, { maxHeight: '75%' }]}>
          <Text style={s.roleSheetName} numberOfLines={2}>{eventTitle}</Text>
          <Text style={s.roleSheetSub}>
            {rows === null ? 'YÜKLENİYOR...' : `${rows.length} KATILIMCI`}
          </Text>
          <View style={s.roleSheetDivider} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {rows?.length === 0 && (
              <Text style={s.emptySub}>Bu etkinliğe henüz kimse kaydolmadı.</Text>
            )}
            {rows?.map((r, i) => (
              <View key={r.user_id} style={s.attRow}>
                <Text style={s.attNo}>{String(i + 1).padStart(2, '0')}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.attName}>{r.full_name}</Text>
                  <Text style={s.attMeta}>
                    {[r.company, r.phone].filter(Boolean).join(' · ') || '—'}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={s.roleCancel} onPress={onClose} activeOpacity={0.7}>
            <Text style={s.roleCancelText}>KAPAT</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Yayınlananlar listesi (silme) ───────────────────────────────────────────

// Düzenleme alanları liste satırının yanında taşınır; böylece
// yayınlanmış içerik yeniden yazılmadan düzeltilebilir.
type EditField = { key: string; label: string; value: string; multiline?: boolean; keyboard?: 'default' | 'number-pad' };
type PublishedItem = { id: string; title: string; subtitle: string; edit?: EditField[] };

function PublishedList({
  heading,
  load,
  onDelete,
  onDetail,
  onEdit,
  detailLabel,
  reloadKey,
}: {
  heading: string;
  load: () => Promise<PublishedItem[]>;
  onDelete: (item: PublishedItem) => Promise<boolean>;
  onDetail?: (item: PublishedItem) => void;
  onEdit?: (item: PublishedItem, values: Record<string, string>) => Promise<boolean>;
  detailLabel?: string;
  reloadKey: number;
}) {
  const [items, setItems] = useState<PublishedItem[]>([]);
  // useAdmin'de update* fonksiyonları vardı ama hiçbir arayüz onları
  // ÇAĞIRMIYORDU: yönetim yayınlanmış bir duyurudaki yazım hatasını
  // ancak silip yeniden yazarak düzeltebiliyordu — bu da üyelere
  // İKİNCİ KEZ bildirim gitmesi demekti. Düzenlemede bildirim gitmez.
  const [editing, setEditing] = useState<PublishedItem | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const openEdit = (item: PublishedItem) => {
    setValues(Object.fromEntries((item.edit ?? []).map(f => [f.key, f.value])));
    setEditing(item);
  };

  const saveEdit = async () => {
    if (!editing || !onEdit || saving) return;
    setSaving(true);
    const ok = await onEdit(editing, values);
    setSaving(false);
    if (ok) { setEditing(null); load().then(setItems); }
  };

  useEffect(() => {
    let cancelled = false;
    load().then(rows => { if (!cancelled) setItems(rows); });
    return () => { cancelled = true; };
  }, [reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const confirmDelete = (item: PublishedItem) => {
    Alert.alert(
      'Kaldır',
      `"${item.title}" kalıcı olarak kaldırılacak. Bu işlem geri alınamaz.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'KALDIR',
          style: 'destructive',
          onPress: async () => {
            const ok = await onDelete(item);
            if (ok) setItems(prev => prev.filter(i => i.id !== item.id));
          },
        },
      ]
    );
  };

  if (items.length === 0) return null;

  return (
    <View style={s.pubWrap}>
      <View style={s.pubDivider} />
      <Text style={s.pubHeading}>{heading} ({items.length})</Text>
      {items.map(item => (
        <View key={item.id} style={s.pubRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.pubTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={s.pubSub} numberOfLines={1}>{item.subtitle}</Text>
          </View>
          {onDetail && (
            <TouchableOpacity onPress={() => onDetail(item)} activeOpacity={0.7} style={s.pubDetailBtn}>
              <Text style={s.pubDetailText}>{detailLabel ?? 'DETAY'}</Text>
            </TouchableOpacity>
          )}
          {onEdit && item.edit && (
            <TouchableOpacity onPress={() => openEdit(item)} activeOpacity={0.7} style={s.pubDetailBtn}
              accessibilityRole="button" accessibilityLabel={`${item.title} kaydını düzenle`}>
              <Text style={s.pubDetailText}>DÜZENLE</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => confirmDelete(item)} activeOpacity={0.7} style={s.pubDelBtn}
            accessibilityRole="button" accessibilityLabel={`${item.title} kaydını kaldır`}>
            <Text style={s.pubDelText}>KALDIR</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Modal visible={!!editing} transparent animationType="slide" onRequestClose={() => setEditing(null)}>
        <View style={s.roleSheetOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setEditing(null)} activeOpacity={1} />
          <View style={s.roleSheet}>
            <Text style={s.roleSheetName}>Düzenle</Text>
            <View style={s.roleSheetDivider} />
            <ScrollView style={{ maxHeight: 340 }} keyboardShouldPersistTaps="handled">
              {(editing?.edit ?? []).map(f => (
                <View key={f.key} style={{ marginBottom: 16 }}>
                  <Text style={s.fieldLabel}>{f.label}</Text>
                  <TextInput
                    style={[s.input, f.multiline && s.textArea]}
                    value={values[f.key] ?? ''}
                    onChangeText={v => setValues(prev => ({ ...prev, [f.key]: v }))}
                    multiline={f.multiline}
                    textAlignVertical={f.multiline ? 'top' : 'center'}
                    keyboardType={f.keyboard ?? 'default'}
                    placeholderTextColor={Colors.textMuted}
                  />
                  <View style={s.underline} />
                </View>
              ))}
            </ScrollView>
            <Text style={s.helper}>Düzenleme yeni bildirim GÖNDERMEZ.</Text>
            <TouchableOpacity style={[s.cta, saving && s.disabled]} onPress={saveEdit} disabled={saving} activeOpacity={0.8}>
              <Text style={s.ctaText}>{saving ? 'KAYDEDİLİYOR...' : 'KAYDET'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.roleCancel} onPress={() => setEditing(null)} activeOpacity={0.7}>
              <Text style={s.roleCancelText}>VAZGEÇ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Duyuru formu ─────────────────────────────────────────────────────────────

const ANN_TYPES: { key: 'general' | 'event' | 'system'; label: string }[] = [
  { key: 'general', label: 'GENEL' },
  { key: 'event',   label: 'ETKİNLİK' },
  { key: 'system',  label: 'SİSTEM' },
];

function AnnouncementForm({ onPublish }: { onPublish: (input: { title: string; body: string; type: 'general' | 'event' | 'system' }) => Promise<boolean> }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<'general' | 'event' | 'system'>('general');
  const [busy, setBusy] = useState(false);

  const valid = title.trim().length > 3 && body.trim().length > 10;

  // Duyuru yayınlamak GERİ ALINAMAZ bir işlemdir: metin uygulamadan
  // silinse bile bildirim 1.500 telefona düşmüş olur. Onay adımı,
  // gidecek metni son kez gösteriyor.
  const submit = () => {
    if (!valid || busy) return;
    Alert.alert(
      'Duyuru yayınlansın mı?',
      `Bu metin TÜM ÜYELERİN telefonuna bildirim olarak gidecek ve geri alınamaz.\n\n"${title.trim()}"\n\n${body.trim()}`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'YAYINLA',
          onPress: async () => {
            setBusy(true);
            const ok = await onPublish({ title: title.trim(), body: body.trim(), type });
            setBusy(false);
            if (ok) { setTitle(''); setBody(''); setType('general'); }
          },
        },
      ]
    );
  };

  return (
    <View style={s.form}>
      <Text style={s.fieldLabel}>BAŞLIK</Text>
      <TextInput
        style={s.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Duyuru başlığı"
        placeholderTextColor={Colors.textMuted}
        maxLength={80}
      />
      <View style={s.underline} />

      <Text style={[s.fieldLabel, { marginTop: 20 }]}>METİN</Text>
      <TextInput
        style={[s.input, s.textArea]}
        value={body}
        onChangeText={setBody}
        placeholder="Duyuru metni — üyelerin ana sayfasında ve bildirimlerinde görünür."
        placeholderTextColor={Colors.textMuted}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
        maxLength={400}
      />
      <View style={s.underline} />
      <Text style={s.charCount}>{body.length} / 400</Text>

      <Text style={[s.fieldLabel, { marginTop: 16 }]}>KATEGORİ</Text>
      <View style={s.pillRow}>
        {ANN_TYPES.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.pill, type === t.key && s.pillActive]}
            onPress={() => setType(t.key)}
            activeOpacity={0.8}
          >
            <Text style={[s.pillText, type === t.key && s.pillTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[s.cta, (!valid || busy) && s.disabled]}
        onPress={submit}
        disabled={!valid || busy}
        activeOpacity={0.8}
      >
        <Text style={s.ctaText}>{busy ? 'YAYINLANIYOR...' : 'DUYURUYU YAYINLA'}</Text>
      </TouchableOpacity>
      <Text style={s.helper}>Yayınlanan duyuru tüm üyelerin uygulamasında anında görünür.</Text>
    </View>
  );
}

// ─── Etkinlik formu ───────────────────────────────────────────────────────────

function EventForm({ onCreate }: { onCreate: (input: { title: string; description?: string; location?: string; city?: string; starts_at: string; max_attendees?: number | null }) => Promise<boolean> }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [date, setDate] = useState('');   // GG.AA.YYYY
  const [time, setTime] = useState('');   // SS:DD
  const [quota, setQuota] = useState('');
  const [busy, setBusy] = useState(false);

  // JavaScript'te new Date(2026, 12, 31) HATA VERMEZ — sessizce 2027
  // Ocak'a taşar. Yönetici "24.13.2026" yazdığında etkinlik bir yıl
  // sonraya kayıyor ve kimse fark etmiyordu. Gün/ay/saat aralıkları
  // artık açıkça denetleniyor ve sonuç geri okunarak taşma yakalanıyor.
  const parseDateTime = (): Date | null => {
    const m = date.trim().match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
    if (!m) return null;
    const dd = parseInt(m[1], 10), mm = parseInt(m[2], 10), yy = parseInt(m[3], 10);
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || yy < 2026 || yy > 2100) return null;

    const tm = time.trim() === '' ? null : time.trim().match(/^(\d{1,2})[:.](\d{2})$/);
    if (time.trim() !== '' && !tm) return null;
    const hh = tm ? parseInt(tm[1], 10) : 10;
    const mi = tm ? parseInt(tm[2], 10) : 0;
    if (hh > 23 || mi > 59) return null;

    const d = new Date(yy, mm - 1, dd, hh, mi);
    if (isNaN(d.getTime())) return null;
    // 31.02 → 3 Mart'a taşar; geri okuyup yakalıyoruz
    if (d.getDate() !== dd || d.getMonth() !== mm - 1 || d.getFullYear() !== yy) return null;
    return d;
  };

  const dt = parseDateTime();
  const inPast = dt !== null && dt.getTime() < Date.now();
  const quotaNum = quota.trim() === '' ? null : parseInt(quota.trim(), 10);
  const quotaOk = quotaNum === null || (Number.isFinite(quotaNum) && quotaNum > 0);
  const valid = title.trim().length > 3 && dt !== null && !inPast && quotaOk;

  const submit = async () => {
    if (!dt || !valid || busy) return;
    setBusy(true);
    const ok = await onCreate({
      title: title.trim(),
      description: desc.trim() || undefined,
      location: location.trim() || undefined,
      city: city.trim() || undefined,
      starts_at: dt.toISOString(),
      max_attendees: quotaNum,
    });
    setBusy(false);
    if (ok) { setTitle(''); setDesc(''); setLocation(''); setCity(''); setDate(''); setTime(''); setQuota(''); }
  };

  return (
    <View style={s.form}>
      <Text style={s.fieldLabel}>ETKİNLİK ADI</Text>
      <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="Örn. Denizli Fabrika Ziyareti" placeholderTextColor={Colors.textMuted} maxLength={80} />
      <View style={s.underline} />

      <Text style={[s.fieldLabel, { marginTop: 20 }]}>AÇIKLAMA</Text>
      <TextInput style={[s.input, s.textArea, { minHeight: 70 }]} value={desc} onChangeText={setDesc} placeholder="Program detayı (opsiyonel)" placeholderTextColor={Colors.textMuted} multiline textAlignVertical="top" maxLength={400} />
      <View style={s.underline} />

      <View style={s.row2}>
        <View style={{ flex: 1 }}>
          <Text style={[s.fieldLabel, { marginTop: 20 }]}>YER</Text>
          <TextInput style={s.input} value={location} onChangeText={setLocation} placeholder="Örn. OSB Konferans Salonu" placeholderTextColor={Colors.textMuted} />
          <View style={s.underline} />
        </View>
        <View style={{ width: 110 }}>
          <Text style={[s.fieldLabel, { marginTop: 20 }]}>ŞEHİR</Text>
          <TextInput style={s.input} value={city} onChangeText={setCity} placeholder="İstanbul" placeholderTextColor={Colors.textMuted} />
          <View style={s.underline} />
        </View>
      </View>

      <View style={s.row2}>
        <View style={{ flex: 1 }}>
          <Text style={[s.fieldLabel, { marginTop: 20 }]}>TARİH</Text>
          <TextInput style={s.input} value={date} onChangeText={setDate} placeholder="24.07.2026" placeholderTextColor={Colors.textMuted} keyboardType="numbers-and-punctuation" maxLength={10} />
          <View style={s.underline} />
        </View>
        <View style={{ width: 90 }}>
          <Text style={[s.fieldLabel, { marginTop: 20 }]}>SAAT</Text>
          <TextInput style={s.input} value={time} onChangeText={setTime} placeholder="10:00" placeholderTextColor={Colors.textMuted} keyboardType="numbers-and-punctuation" maxLength={5} />
          <View style={s.underline} />
        </View>
        <View style={{ width: 90 }}>
          <Text style={[s.fieldLabel, { marginTop: 20 }]}>KONTENJAN</Text>
          <TextInput style={s.input} value={quota} onChangeText={setQuota} placeholder="—" placeholderTextColor={Colors.textMuted} keyboardType="number-pad" maxLength={4} />
          <View style={s.underline} />
        </View>
      </View>

      <TouchableOpacity style={[s.cta, (!valid || busy) && s.disabled]} onPress={submit} disabled={!valid || busy} activeOpacity={0.8}>
        <Text style={s.ctaText}>{busy ? 'EKLENİYOR...' : 'ETKİNLİĞİ YAYINLA'}</Text>
      </TouchableOpacity>
      <Text style={s.helper}>
        {date.trim() !== '' && dt === null
          ? '⚠ Tarih geçersiz. Biçim: GG.AA.YYYY (örn. 24.07.2026)'
          : inPast
          ? '⚠ Bu tarih geçmişte. Etkinlik takvimde görünmez.'
          : !quotaOk
          ? '⚠ Kontenjan 1 veya daha büyük olmalı (boş bırakırsanız sınırsız).'
          : 'Etkinlik takvim sekmesinde tüm üyelere anında açılır ve herkese bildirim gider.'}
      </Text>
    </View>
  );
}

// ─── Denetim kaydı ────────────────────────────────────────────────────────────
// Kayıt 009/010 ile tutuluyordu ama uygulamada okunamıyordu; yönetimin
// resmî bir talebe cevap verebilmesi için görünür olması gerekiyor.

const ACTION_TR: Record<string, string> = {
  role_change:          'Rol değişikliği',
  application_rejected: 'Başvuru reddi',
  article_published:    'Yazı yayınlandı',
  article_rejected:     'Yazı reddedildi',
  article_pending:      'Yazı yeniden gönderildi',
  article_deleted:      'Yazı silindi',
  announcement_created: 'Duyuru yayınlandı',
  announcement_deleted: 'Duyuru kaldırıldı',
  event_created:        'Etkinlik açıldı',
  event_deleted:        'Etkinlik kaldırıldı',
};

function AuditTab({ load }: { load: () => Promise<AuditRow[]> }) {
  const [rows, setRows] = useState<AuditRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    load().then(r => { if (!cancelled) setRows(r); });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (rows === null) {
    return <Text style={s.emptySub}>Yükleniyor...</Text>;
  }
  if (rows.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyTitle}>Denetim kaydı boş.</Text>
        <Text style={s.emptySub}>
          Rol değişiklikleri, onaylar, yayınlar ve silmeler burada
          otomatik olarak kayda geçer. Kayıtlar değiştirilemez ve silinemez.
        </Text>
      </View>
    );
  }

  return (
    <View style={s.form}>
      <Text style={s.helper}>
        Son {rows.length} işlem. Kayıtlar yalnızca eklenebilir — değiştirilemez,
        silinemez. Resmî bir talep hâlinde bu döküm kullanılabilir.
      </Text>
      {rows.map(r => (
        <View key={r.id} style={s.auditRow}>
          <View style={s.auditTop}>
            <Text style={s.auditAction}>{ACTION_TR[r.action] ?? r.action}</Text>
            <Text style={s.auditDate}>{fmtDate(r.created_at)}</Text>
          </View>
          <Text style={s.auditTarget} numberOfLines={2}>
            {r.target_name ?? r.target_type ?? '—'}
          </Text>
          <Text style={s.auditActor}>{r.actor_name ?? 'Bilinmiyor'}</Text>
          {r.details && Object.keys(r.details).length > 0 && (
            <Text style={s.auditDetails} numberOfLines={3}>
              {Object.entries(r.details)
                .filter(([, v]) => v !== null && v !== undefined && v !== '')
                .map(([k, v]) => `${k}: ${String(v)}`)
                .join('  ·  ')}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

// ─── Ana ekran ────────────────────────────────────────────────────────────────

export default function AdminScreen() {
  const { profile, status } = useAuthContext();
  const {
    pending, members, stats, loading, refetch, approve, rejectApplication, setRole,
    publishAnnouncement, createEvent,
    listAnnouncements, deleteAnnouncement, updateAnnouncement,
    listEvents, deleteEvent, updateEvent,
    listCourses, createCourse, updateCourse, deleteCourse,
    listAttendees, listPendingArticles, reviewArticle, listAudit,
  } = useAdmin();
  const [tab, setTab] = useState<AdminTab>('ONAYLAR');
  const [reloadKey, setReloadKey] = useState(0);
  const [attendeesFor, setAttendeesFor] = useState<{ id: string; title: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { show: showToast, ToastComponent } = useToast();

  const isAdmin = !!profile && ADMIN_ROLES.includes(profile.role);

  // Yetkisiz erişimi engelle
  useEffect(() => {
    if (status !== 'loading' && !isAdmin) router.replace('/(tabs)');
  }, [status, isAdmin]);

  if (!isAdmin) return <View style={{ flex: 1, backgroundColor: Colors.navy }} />;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleApprove = async (p: Profile, role: 'member' | 'student') => {
    const error = await approve(p.id, role);
    if (error) {
      showToast('Onay başarısız — yetkinizi kontrol edin.', 'error');
    } else {
      showToast(`${p.full_name || 'Üye'} onaylandı — üye kodu atandı.`, 'success');
    }
  };

  const handleReject = async (p: Profile) => {
    const error = await rejectApplication(p.id);
    showToast(error ? 'Reddedilemedi — yetkinizi kontrol edin.' : 'Başvuru reddedildi.', error ? 'error' : 'success');
  };

  const handlePublish = async (input: { title: string; body: string; type: 'general' | 'event' | 'system' }) => {
    const { error, sent } = await publishAnnouncement(input);
    if (error) { showToast('Duyuru yayınlanamadı.', 'error'); return false; }
    showToast(sent > 0 ? `Duyuru yayınlandı — ${sent} cihaza bildirim gönderildi.` : 'Duyuru yayınlandı.', 'success');
    setReloadKey(k => k + 1);
    return true;
  };

  const handleCreateEvent = async (input: { title: string; description?: string; location?: string; city?: string; starts_at: string; max_attendees?: number | null }) => {
    const { error, sent } = await createEvent(input);
    if (error) { showToast('Etkinlik eklenemedi.', 'error'); return false; }
    showToast(sent > 0 ? `Etkinlik yayınlandı — ${sent} cihaza bildirim gönderildi.` : 'Etkinlik yayınlandı.', 'success');
    setReloadKey(k => k + 1);
    return true;
  };

  const handleSetRole = async (p: Profile, role: MemberRoleKey) => {
    const error = await setRole(p.id, role);
    if (error) showToast('Rol değiştirilemedi.', 'error');
    else showToast(`${p.full_name} → ${ROLE_LABELS[role]}`, 'success');
  };

  const STAT_CELLS = [
    { value: stats.pending,       label: 'BEKLEYEN' },
    { value: stats.members,       label: 'ÜYE' },
    { value: stats.events,        label: 'ETKİNLİK' },
    { value: stats.announcements, label: 'DUYURU' },
  ];

  const TABS: AdminTab[] = ['ONAYLAR', 'ÜYELER', 'BÜLTEN', 'DUYURU', 'ETKİNLİK', 'KURS', 'KAYIT'];

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={s.headerOverline}>GENÇ TETSİAD</Text>
          <Text style={s.headerTitle}>Yönetim Paneli</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        {STAT_CELLS.map((c, i) => (
          <View key={c.label} style={[s.statCell, i < STAT_CELLS.length - 1 && s.statCellBorder]}>
            <Text style={[s.statValue, c.label === 'BEKLEYEN' && c.value > 0 && { color: Colors.gold }]}>
              {String(c.value).padStart(2, '0')}
            </Text>
            <Text style={s.statLabel}>{c.label}</Text>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[s.tabItem, tab === t && s.tabItemActive]} onPress={() => setTab(t)} activeOpacity={0.8}>
            <Text style={[s.tabLabel, tab === t && s.tabLabelActive]}>
              {t}{t === 'ONAYLAR' && stats.pending > 0 ? ` (${stats.pending})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} colors={[Colors.gold]} progressBackgroundColor={Colors.navyDeep} />
          }
        >
          {tab === 'ONAYLAR' && (
            <View>
              {pending.length === 0 ? (
                <View style={s.empty}>
                  <View style={s.emptyDot} />
                  <Text style={s.emptyTitle}>{loading ? 'Yükleniyor...' : 'Bekleyen başvuru yok.'}</Text>
                  <Text style={s.emptySub}>Yeni başvurular burada listelenir; onayladığınız üyeye otomatik üye kodu atanır.</Text>
                </View>
              ) : (
                pending.map(p => (
                  <PendingCard key={p.id} p={p} onApprove={(role) => handleApprove(p, role)} onReject={() => handleReject(p)} />
                ))
              )}
            </View>
          )}

          {tab === 'ÜYELER' && (
            <MembersTab members={members} currentUserId={profile?.id} onSetRole={handleSetRole} />
          )}

          {tab === 'BÜLTEN' && (
            <ArticleReview
              reloadKey={reloadKey}
              load={listPendingArticles}
              onReview={async (id, decision, noteText, title) => {
                const { error, sent } = await reviewArticle(id, decision, noteText, title);
                if (error) { showToast('İşlem başarısız.', 'error'); return false; }
                showToast(
                  decision === 'published'
                    ? (sent > 0 ? `Yayınlandı — ${sent} cihaza bildirim gönderildi.` : 'Yazı yayınlandı.')
                    : 'Revizyon istendi, yazara iletildi.',
                  'success',
                );
                return true;
              }}
            />
          )}

          {tab === 'DUYURU' && (
            <>
              <AnnouncementForm onPublish={handlePublish} />
              <PublishedList
                heading="YAYINDAKİ DUYURULAR"
                reloadKey={reloadKey}
                load={async () => (await listAnnouncements()).map(a => ({
                  id: a.id,
                  title: a.title,
                  subtitle: fmtDate(a.published_at),
                  edit: [
                    { key: 'title', label: 'BAŞLIK', value: a.title },
                    { key: 'body',  label: 'METİN',  value: a.body, multiline: true },
                  ],
                  _type: a.type,
                }))}
                onEdit={async (item, v) => {
                  const error = await updateAnnouncement(item.id, {
                    title: v.title.trim(),
                    body: v.body.trim(),
                     
                    type: (item as any)._type ?? 'general',
                  });
                  showToast(error ? 'Güncellenemedi.' : 'Duyuru güncellendi.', error ? 'error' : 'success');
                  return !error;
                }}
                onDelete={async (item) => {
                  const error = await deleteAnnouncement(item.id);
                  showToast(error ? 'Duyuru kaldırılamadı.' : 'Duyuru kaldırıldı.', error ? 'error' : 'success');
                  return !error;
                }}
              />
            </>
          )}
          {tab === 'ETKİNLİK' && (
            <>
              <EventForm onCreate={handleCreateEvent} />
              <PublishedList
                heading="YAYINDAKİ ETKİNLİKLER"
                reloadKey={reloadKey}
                load={async () => (await listEvents()).map(e => ({
                  id: e.id,
                  title: e.title,
                  subtitle: [fmtDate(e.starts_at), e.city].filter(Boolean).join(' · '),
                  edit: [
                    { key: 'title',    label: 'ETKİNLİK ADI', value: e.title },
                    { key: 'desc',     label: 'AÇIKLAMA',     value: e.description ?? '', multiline: true },
                    { key: 'location', label: 'YER',          value: e.location ?? '' },
                    { key: 'city',     label: 'ŞEHİR',        value: e.city ?? '' },
                    { key: 'quota',    label: 'KONTENJAN (boş = sınırsız)', value: e.max_attendees != null ? String(e.max_attendees) : '', keyboard: 'number-pad' as const },
                  ],
                  _startsAt: e.starts_at,
                }))}
                onEdit={async (item, v) => {
                  const q = v.quota.trim() === '' ? null : parseInt(v.quota.trim(), 10);
                  if (q !== null && (!Number.isFinite(q) || q < 1)) {
                    showToast('Kontenjan 1 veya daha büyük olmalı.', 'error');
                    return false;
                  }
                  const error = await updateEvent(item.id, {
                    title: v.title.trim(),
                    description: v.desc.trim() || undefined,
                    location: v.location.trim() || undefined,
                    city: v.city.trim() || undefined,
                     
                    starts_at: (item as any)._startsAt,
                    max_attendees: q,
                  });
                  showToast(error ? 'Güncellenemedi.' : 'Etkinlik güncellendi.', error ? 'error' : 'success');
                  return !error;
                }}
                onDelete={async (item) => {
                  const error = await deleteEvent(item.id);
                  showToast(error ? 'Etkinlik kaldırılamadı.' : 'Etkinlik kaldırıldı.', error ? 'error' : 'success');
                  return !error;
                }}
                onDetail={(item) => setAttendeesFor(item)}
                detailLabel="KATILIMCI"
              />
            </>
          )}

          {tab === 'KAYIT' && <AuditTab load={listAudit} />}

          {tab === 'KURS' && (
            <>
              <CourseForm
                onCreate={async (input) => {
                  const error = await createCourse(input);
                  showToast(error ? 'Kurs eklenemedi.' : 'Kurs yayınlandı.', error ? 'error' : 'success');
                  if (!error) setReloadKey(k => k + 1);
                  return !error;
                }}
              />
              <PublishedList
                heading="YAYINDAKİ KURSLAR"
                reloadKey={reloadKey}
                load={async () => (await listCourses()).map(c => ({
                  id: c.id,
                  title: c.title,
                  subtitle: [c.instructor, c.duration_hours ? `${c.duration_hours} saat` : null]
                    .filter(Boolean).join(' · ') || '—',
                  edit: [
                    { key: 'title',      label: 'KURS ADI',   value: c.title },
                    { key: 'desc',       label: 'AÇIKLAMA',   value: c.description ?? '', multiline: true },
                    { key: 'instructor', label: 'EĞİTMEN',    value: c.instructor ?? '' },
                    { key: 'hours',      label: 'SÜRE (SAAT)', value: c.duration_hours != null ? String(c.duration_hours) : '', keyboard: 'number-pad' as const },
                  ],
                  _level: c.level,
                }))}
                onEdit={async (item, v) => {
                  const h = v.hours.trim() === '' ? null : parseInt(v.hours.trim(), 10);
                  const error = await updateCourse(item.id, {
                    title: v.title.trim(),
                    description: v.desc.trim() || undefined,
                    instructor: v.instructor.trim() || undefined,
                    duration_hours: Number.isFinite(h as number) ? h : null,
                     
                    level: (item as any)._level ?? undefined,
                  });
                  showToast(error ? 'Güncellenemedi.' : 'Kurs güncellendi.', error ? 'error' : 'success');
                  return !error;
                }}
                onDelete={async (item) => {
                  const error = await deleteCourse(item.id);
                  showToast(error ? 'Kurs kaldırılamadı.' : 'Kurs kaldırıldı.', error ? 'error' : 'success');
                  return !error;
                }}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {attendeesFor && (
        <AttendeeSheet
          eventTitle={attendeesFor.title}
          load={() => listAttendees(attendeesFor.id)}
          onClose={() => setAttendeesFor(null)}
        />
      )}

      {ToastComponent}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  auditRow:     { borderWidth: 0.5, borderColor: Colors.goldLine, padding: 14, marginBottom: 10 },
  auditTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  auditAction:  { fontFamily: Fonts.jakarta, fontSize: 10, fontWeight: '700', color: Colors.gold, letterSpacing: 1 },
  auditDate:    { fontFamily: Fonts.mono, fontSize: 8, color: Colors.textMuted },
  auditTarget:  { fontFamily: Fonts.cormorant, fontSize: 16, color: Colors.ivory, marginBottom: 4 },
  auditActor:   { fontFamily: Fonts.jakarta, fontSize: 9, color: Colors.textMuted },
  auditDetails: { fontFamily: Fonts.mono, fontSize: 8, color: Colors.textMuted, marginTop: 6, lineHeight: 13 },
  pRejectBtn:  { marginTop: 12, alignItems: 'center', paddingVertical: 6 },
  pRejectText: { fontFamily: Fonts.jakarta, fontSize: 9, color: 'rgba(224,96,96,0.75)', letterSpacing: 0.5 },
  root:           { flex: 1, backgroundColor: Colors.navy },

  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, backgroundColor: Colors.navyDeep, borderBottomWidth: 0.5, borderBottomColor: Colors.goldLine },
  backBtn:        { width: 32, height: 32, justifyContent: 'center' },
  backText:       { fontFamily: Fonts.cormorant, fontSize: 24, color: Colors.gold },
  headerOverline: { fontFamily: Fonts.mono, fontSize: 7, letterSpacing: 3, color: Colors.gold, textAlign: 'center', marginBottom: 4 },
  headerTitle:    { fontFamily: Fonts.cormorant, fontSize: 24, color: Colors.ivory, fontStyle: 'italic', fontWeight: '300', textAlign: 'center' },

  statsRow:       { flexDirection: 'row', backgroundColor: Colors.navyDeep, borderBottomWidth: 0.5, borderBottomColor: Colors.goldLine, paddingVertical: 16 },
  statCell:       { flex: 1, alignItems: 'center' },
  statCellBorder: { borderRightWidth: 0.5, borderRightColor: Colors.goldLine },
  statValue:      { fontFamily: Fonts.cormorant, fontSize: 26, color: Colors.ivory, fontStyle: 'italic', fontWeight: '300', lineHeight: 30 },
  statLabel:      { fontFamily: Fonts.mono, fontSize: 6.5, letterSpacing: 1.5, color: Colors.textMuted, marginTop: 4 },

  tabRow:         { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: Colors.goldLine },
  tabItem:        { flex: 1, paddingVertical: 14, paddingHorizontal: 2, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive:  { borderBottomColor: Colors.gold },
  tabLabel:       { fontFamily: Fonts.jakarta, fontSize: 7.5, letterSpacing: 0.6, color: Colors.textMuted, fontWeight: '600' },
  tabLabelActive: { color: Colors.gold },

  // Pending cards
  pCard:          { marginHorizontal: 20, marginTop: 16, borderWidth: 0.5, borderColor: Colors.goldLine, backgroundColor: Colors.navyMid, padding: 16 },
  pTop:           { flexDirection: 'row', gap: 14, marginBottom: 14 },
  pAvatar:        { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: Colors.gold, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.navyDeep },
  pAvatarText:    { fontFamily: Fonts.mono, fontSize: 11, color: Colors.gold },
  pName:          { fontFamily: Fonts.cormorant, fontSize: 18, color: Colors.ivory, fontWeight: '500', marginBottom: 2 },
  pFirm:          { fontFamily: Fonts.jakarta, fontSize: 10, color: Colors.textMuted, marginBottom: 4 },
  pMeta:          { fontFamily: Fonts.mono, fontSize: 8, color: Colors.textMuted, letterSpacing: 0.5 },
  pBtnRow:        { flexDirection: 'row', gap: 8 },
  pBtn:           { paddingVertical: 11, alignItems: 'center' },
  pBtnFill:       { flex: 1, backgroundColor: Colors.gold },
  pBtnFillText:   { fontFamily: Fonts.jakarta, fontSize: 8, letterSpacing: 1.5, color: Colors.navyDeep, fontWeight: '700' },
  pBtnOutline:    { paddingHorizontal: 16, borderWidth: 0.5, borderColor: Colors.goldLine },
  pBtnOutlineText:{ fontFamily: Fonts.jakarta, fontSize: 8, letterSpacing: 1.5, color: Colors.textMuted, fontWeight: '600' },

  // Forms
  form:           { paddingHorizontal: 24, paddingTop: 24 },
  fieldLabel:     { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 2, fontWeight: '600', marginBottom: 8 },
  input:          { fontFamily: Fonts.cormorant, fontSize: 18, color: Colors.ivory, paddingBottom: 8, paddingTop: 0 },
  textArea:       { minHeight: 100, fontSize: 14, fontFamily: Fonts.jakarta, lineHeight: 21 },
  underline:      { height: 0.5, backgroundColor: Colors.goldLine },
  charCount:      { fontFamily: Fonts.mono, fontSize: 7, color: Colors.textMuted, textAlign: 'right', marginTop: 6 },
  pillRow:        { flexDirection: 'row', gap: 8, marginTop: 4 },
  pill:           { paddingHorizontal: 16, paddingVertical: 8, borderWidth: 0.5, borderColor: Colors.goldLine },
  pillActive:     { backgroundColor: Colors.gold, borderColor: Colors.gold },
  pillText:       { fontFamily: Fonts.jakarta, fontSize: 8, letterSpacing: 1.5, color: Colors.textMuted, fontWeight: '600' },
  pillTextActive: { color: Colors.navyDeep },
  row2:           { flexDirection: 'row', gap: 16 },
  cta:            { backgroundColor: Colors.gold, paddingVertical: 15, alignItems: 'center', marginTop: 28 },
  ctaText:        { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, fontWeight: '700', color: Colors.navyDeep, letterSpacing: 2.5 },
  helper:         { fontFamily: Fonts.jakarta, fontSize: 9, color: Colors.textMuted, marginTop: 12, lineHeight: 14 },
  disabled:       { opacity: 0.4 },

  // Members tab
  searchWrap:     { paddingHorizontal: 20, paddingBottom: 4 },
  searchInput:    { borderWidth: 0.5, borderColor: Colors.goldLine, paddingHorizontal: 14, paddingVertical: 10, color: Colors.ivory, fontFamily: Fonts.jakarta, fontSize: 12, backgroundColor: Colors.navyMid },
  mRow:           { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.goldLine },
  roleTag:        { paddingHorizontal: 8, paddingVertical: 4, borderWidth: 0.5, borderColor: Colors.goldLine },
  roleTagGold:    { borderColor: Colors.gold, backgroundColor: 'rgba(217,200,150,0.08)' },
  roleTagText:    { fontFamily: Fonts.jakarta, fontSize: 6.5, letterSpacing: 1, color: Colors.textMuted, fontWeight: '600' },
  roleTagTextGold:{ color: Colors.gold },
  roleSheetOverlay:{ flex: 1, backgroundColor: 'rgba(3,15,9,0.90)', justifyContent: 'flex-end' },
  roleSheet:      { backgroundColor: Colors.navyDeep, borderTopWidth: 0.5, borderTopColor: Colors.gold, padding: 24, paddingBottom: 40 },
  roleSheetName:  { fontFamily: Fonts.cormorant, fontSize: 24, color: Colors.ivory, fontStyle: 'italic', fontWeight: '300' },
  roleSheetSub:   { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 1.5, color: Colors.gold, marginTop: 6 },
  roleSheetDivider:{ height: 0.5, backgroundColor: Colors.goldLine, marginVertical: 16 },
  roleOption:     { paddingVertical: 13, borderBottomWidth: 0.5, borderBottomColor: Colors.goldLine },
  roleOptionLabel:{ fontFamily: Fonts.jakarta, fontSize: 11, letterSpacing: 2, color: Colors.ivory, fontWeight: '600' },
  roleOptionDesc: { fontFamily: Fonts.jakarta, fontSize: 9, color: Colors.textMuted, marginTop: 3 },
  roleCancel:     { marginTop: 18, borderWidth: 0.5, borderColor: Colors.goldLine, paddingVertical: 12, alignItems: 'center' },
  roleCancelText: { fontFamily: Fonts.jakarta, fontSize: 9, letterSpacing: 2, color: Colors.textMuted },

  // Yayınlananlar listesi
  pubWrap:        { paddingHorizontal: 24, paddingTop: 8 },
  pubDivider:     { height: 0.5, backgroundColor: Colors.goldLine, marginBottom: 18, marginTop: 12 },
  pubHeading:     { fontFamily: Fonts.jakarta, fontSize: 8, letterSpacing: 2, color: Colors.gold, fontWeight: '700', marginBottom: 12 },
  pubRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.goldLine },
  pubTitle:       { fontFamily: Fonts.jakarta, fontSize: 11, color: Colors.ivory, fontWeight: '600', marginBottom: 3 },
  pubSub:         { fontFamily: Fonts.mono, fontSize: 8, color: Colors.textMuted, letterSpacing: 0.5 },
  pubDelBtn:      { paddingHorizontal: 12, paddingVertical: 7, borderWidth: 0.5, borderColor: 'rgba(224,96,96,0.4)' },
  pubDelText:     { fontFamily: Fonts.jakarta, fontSize: 7.5, letterSpacing: 1.2, color: 'rgba(224,96,96,0.85)', fontWeight: '700' },
  pubDetailBtn:   { paddingHorizontal: 10, paddingVertical: 7, borderWidth: 0.5, borderColor: Colors.goldLine },
  pubDetailText:  { fontFamily: Fonts.jakarta, fontSize: 7.5, letterSpacing: 1.2, color: Colors.gold, fontWeight: '700' },
  attRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 0.5, borderBottomColor: Colors.goldLine },
  attNo:          { fontFamily: Fonts.mono, fontSize: 9, color: Colors.gold, width: 22 },
  attName:        { fontFamily: Fonts.jakarta, fontSize: 12, color: Colors.ivory, fontWeight: '600' },
  attMeta:        { fontFamily: Fonts.mono, fontSize: 8, color: Colors.textMuted, marginTop: 2 },
  artSummary:     { fontFamily: Fonts.jakarta, fontSize: 10, color: Colors.textMuted, lineHeight: 15, marginTop: 8 },
  artOpen:        { fontFamily: Fonts.jakarta, fontSize: 8, letterSpacing: 1.5, color: Colors.gold, fontWeight: '700', marginTop: 12 },
  artRoot:        { flex: 1, backgroundColor: Colors.navy, paddingTop: 44 },
  artBar:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 14, borderBottomWidth: 0.5, borderBottomColor: Colors.goldLine },
  artBack:        { fontFamily: Fonts.jakarta, fontSize: 8, letterSpacing: 2, color: Colors.gold, fontWeight: '700' },
  artMeta:        { fontFamily: Fonts.mono, fontSize: 7.5, letterSpacing: 1, color: Colors.textMuted },
  artBody:        { paddingHorizontal: 24, paddingTop: 24 },
  artTitle:       { fontFamily: Fonts.cormorant, fontSize: 27, color: Colors.ivory, fontWeight: '500', lineHeight: 34 },
  artLead:        { fontFamily: Fonts.cormorant, fontSize: 16, fontStyle: 'italic', color: Colors.ivory, opacity: 0.85, lineHeight: 24, marginTop: 12 },
  artRule:        { height: 0.5, backgroundColor: Colors.goldLine, marginVertical: 20 },
  artText:        { fontFamily: Fonts.jakarta, fontSize: 13, color: Colors.textMuted, lineHeight: 22 },
  artReject:      { marginTop: 10, borderWidth: 0.5, borderColor: 'rgba(224,96,96,0.45)', paddingVertical: 14, alignItems: 'center' },
  artRejectText:  { fontFamily: Fonts.jakarta, fontSize: 9, letterSpacing: 2, color: 'rgba(224,96,96,0.9)', fontWeight: '700' },

  // Empty state
  empty:          { alignItems: 'center', paddingTop: 64, paddingHorizontal: 40 },
  emptyDot:       { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: Colors.goldLine, marginBottom: 20 },
  emptyTitle:     { fontFamily: Fonts.cormorant, fontSize: 20, color: Colors.ivory, fontStyle: 'italic', fontWeight: '300', marginBottom: 10 },
  emptySub:       { fontFamily: Fonts.jakarta, fontSize: 10, color: Colors.textMuted, textAlign: 'center', lineHeight: 16 },
});
