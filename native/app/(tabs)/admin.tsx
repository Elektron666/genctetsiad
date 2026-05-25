import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors, Fonts, FontSize } from '@/theme';
import { useAuthContext } from '@/context/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import type { Profile } from '@/types/database';

const ROLE_LABELS: Record<string, string> = {
  admin: 'SİSTEM YÖNETİCİSİ',
  board: 'YÖNETİM KURULU',
  president: 'BAŞKAN',
};

const ADMIN_ROLES = new Set(['admin', 'board', 'president']);

// ── Pending member card ────────────────────────────────────────────────────

function PendingCard({
  member,
  onApprove,
  onReject,
}: {
  member: Profile;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
}) {
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);

  const handle = async (action: 'approve' | 'reject') => {
    setBusy(action);
    if (action === 'approve') await onApprove();
    else await onReject();
    setBusy(null);
  };

  const date = new Date(member.created_at).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.header}>
        <Text style={cardStyles.name}>{member.full_name || '—'}</Text>
        <Text style={cardStyles.date}>{date}</Text>
      </View>

      {(member.company || member.city || member.sector) ? (
        <View style={cardStyles.metaRow}>
          {member.company ? <Text style={cardStyles.meta}>{member.company}</Text> : null}
          {member.city ? <Text style={cardStyles.metaDot}>·</Text> : null}
          {member.city ? <Text style={cardStyles.meta}>{member.city}</Text> : null}
          {member.sector ? <Text style={cardStyles.metaDot}>·</Text> : null}
          {member.sector ? <Text style={cardStyles.meta}>{member.sector}</Text> : null}
        </View>
      ) : null}

      {member.position ? (
        <Text style={cardStyles.position}>{member.position}</Text>
      ) : null}

      <View style={cardStyles.actions}>
        <TouchableOpacity
          style={[cardStyles.btn, cardStyles.btnApprove]}
          activeOpacity={0.8}
          disabled={busy !== null}
          onPress={() => handle('approve')}
        >
          {busy === 'approve'
            ? <ActivityIndicator size="small" color={Colors.navyDeep} />
            : <Text style={cardStyles.btnApproveText}>ONAYLA</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[cardStyles.btn, cardStyles.btnReject]}
          activeOpacity={0.8}
          disabled={busy !== null}
          onPress={() =>
            Alert.alert(
              'Üyeyi Reddet',
              `${member.full_name || 'Bu üye'} başvurusu silinecek. Emin misin?`,
              [
                { text: 'Vazgeç', style: 'cancel' },
                { text: 'Reddet', style: 'destructive', onPress: () => handle('reject') },
              ]
            )
          }
        >
          {busy === 'reject'
            ? <ActivityIndicator size="small" color="#e57373" />
            : <Text style={cardStyles.btnRejectText}>REDDET</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.navyMid,
    borderWidth: 0.5,
    borderColor: Colors.goldLine,
    padding: 16,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  name: {
    fontFamily: Fonts.cormorant,
    fontSize: FontSize.xl,
    fontStyle: 'italic',
    fontWeight: '500',
    color: Colors.ivory,
    flex: 1,
    lineHeight: 22,
  },
  date: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginLeft: 8,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  meta: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  metaDot: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.xs,
    color: Colors.goldLine,
  },
  position: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.xs,
    color: 'rgba(217,200,150,0.55)',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 0.5,
    borderTopColor: Colors.goldLine,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  btnApprove: {
    backgroundColor: Colors.gold,
  },
  btnApproveText: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.navyDeep,
    letterSpacing: 2,
  },
  btnReject: {
    borderWidth: 0.5,
    borderColor: 'rgba(229,115,115,0.5)',
  },
  btnRejectText: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: '#e57373',
    letterSpacing: 2,
  },
});

// ── Main screen ────────────────────────────────────────────────────────────

export default function AdminScreen() {
  const { profile } = useAuthContext();
  const { pendingMembers, loading, fetchPending, approveMember, rejectMember, sendBroadcast } = useAdmin();

  const [bcTitle, setBcTitle] = useState('');
  const [bcBody, setBcBody] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const role = profile?.role ?? '';

  if (!ADMIN_ROLES.has(role)) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style="light" />
        <View style={styles.unauthorized}>
          <Text style={styles.unauthorizedText}>ERİŞİM YETKİSİ YOK</Text>
          <Text style={styles.unauthorizedSub}>Bu sayfa yalnızca yöneticilere açıktır.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSend = async () => {
    if (!bcTitle.trim() || !bcBody.trim()) return;
    setSending(true);
    setSendResult(null);
    const { data, error } = await sendBroadcast(bcTitle.trim(), bcBody.trim(), urgent);
    setSending(false);
    if (error) {
      setSendResult('Gönderim başarısız. Edge Function deploy edilmemiş olabilir.');
    } else {
      const res = data as { sent?: number; failed?: number } | null;
      setSendResult(`Gönderildi: ${res?.sent ?? 0} kişi · Başarısız: ${res?.failed ?? 0}`);
      setBcTitle('');
      setBcBody('');
      setUrgent(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ─────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLine} />
            <Text style={styles.headerOverline}>GENÇ TETSİAD</Text>
            <View style={styles.headerLine} />
          </View>
          <Text style={styles.headerTitle}>Yönetim{'\n'}Paneli</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{ROLE_LABELS[role] ?? role.toUpperCase()}</Text>
          </View>
        </View>

        {/* ── Broadcast section ──────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.diamond} />
            <Text style={styles.sectionLabel}>ACİL DUYURU GÖNDER</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>BAŞLIK</Text>
            <TextInput
              style={styles.input}
              value={bcTitle}
              onChangeText={setBcTitle}
              placeholder="Duyuru başlığı"
              placeholderTextColor={Colors.textMuted}
              maxLength={80}
            />

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>MESAİ</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={bcBody}
              onChangeText={setBcBody}
              placeholder="Duyuru metni..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />

            <TouchableOpacity
              style={[styles.urgentToggle, urgent && styles.urgentToggleActive]}
              onPress={() => setUrgent(v => !v)}
              activeOpacity={0.8}
            >
              <View style={[styles.urgentDot, urgent && styles.urgentDotActive]} />
              <Text style={[styles.urgentLabel, urgent && styles.urgentLabelActive]}>
                ACİL KANAL — DND BYPASS
              </Text>
            </TouchableOpacity>

            {sendResult ? (
              <View style={[
                styles.resultBanner,
                sendResult.startsWith('Gönderildi') ? styles.resultSuccess : styles.resultError,
              ]}>
                <Text style={styles.resultText}>{sendResult}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.sendBtn, (!bcTitle.trim() || !bcBody.trim() || sending) && styles.sendBtnDisabled]}
              activeOpacity={0.8}
              onPress={handleSend}
              disabled={!bcTitle.trim() || !bcBody.trim() || sending}
            >
              {sending
                ? <ActivityIndicator color={Colors.navyDeep} />
                : <Text style={styles.sendBtnText}>TÜM ÜYELERe GÖNDER</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Pending members section ─────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.diamond} />
            <Text style={styles.sectionLabel}>BEKLEYEN ÜYELER</Text>
            {pendingMembers.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{pendingMembers.length}</Text>
              </View>
            )}
            <TouchableOpacity onPress={fetchPending} style={styles.refreshBtn}>
              <Text style={styles.refreshBtnText}>YENİLE</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={Colors.gold} />
            </View>
          ) : pendingMembers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Bekleyen üye başvurusu yok</Text>
            </View>
          ) : (
            <View style={styles.memberList}>
              {pendingMembers.map(m => (
                <PendingCard
                  key={m.id}
                  member={m}
                  onApprove={async () => {
                    const { error } = await approveMember(m.id);
                    if (error) Alert.alert('Hata', 'Onaylama başarısız oldu.');
                  }}
                  onReject={async () => {
                    const { error } = await rejectMember(m.id);
                    if (error) Alert.alert('Hata', 'Red işlemi başarısız oldu.');
                  }}
                />
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.navy,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },

  unauthorized: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  unauthorizedText: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 3,
  },
  unauthorizedSub: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },

  // ── Header ────────────────────────────────────────────
  header: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.goldLine,
    backgroundColor: Colors.navyDeep,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  headerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: Colors.goldLine,
  },
  headerOverline: {
    fontFamily: Fonts.jakarta,
    fontSize: 7,
    color: Colors.gold,
    letterSpacing: 3,
    fontWeight: '600',
  },
  headerTitle: {
    fontFamily: Fonts.cormorant,
    fontStyle: 'italic',
    fontWeight: '300',
    fontSize: FontSize['4xl'],
    color: Colors.ivory,
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    borderWidth: 0.5,
    borderColor: Colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleBadgeText: {
    fontFamily: Fonts.jakarta,
    fontSize: 7,
    color: Colors.gold,
    letterSpacing: 2,
    fontWeight: '600',
  },

  // ── Section ───────────────────────────────────────────
  section: {
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  diamond: {
    width: 6,
    height: 6,
    backgroundColor: Colors.gold,
    transform: [{ rotate: '45deg' }],
  },
  sectionLabel: {
    fontFamily: Fonts.jakarta,
    fontSize: 7,
    color: Colors.gold,
    letterSpacing: 2.5,
    fontWeight: '600',
    flex: 1,
  },
  countBadge: {
    backgroundColor: Colors.gold,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.navyDeep,
    fontWeight: '700',
  },
  refreshBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 0.5,
    borderColor: Colors.goldLine,
  },
  refreshBtnText: {
    fontFamily: Fonts.jakarta,
    fontSize: 6,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    fontWeight: '600',
  },

  // ── Broadcast form ────────────────────────────────────
  formCard: {
    backgroundColor: Colors.navyMid,
    borderWidth: 0.5,
    borderColor: Colors.goldLine,
    padding: 16,
  },
  inputLabel: {
    fontFamily: Fonts.jakarta,
    fontSize: 7,
    color: Colors.textMuted,
    letterSpacing: 2,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.navyDeep,
    borderWidth: 0.5,
    borderColor: Colors.goldLine,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.base,
    color: Colors.ivory,
  },
  inputMulti: {
    minHeight: 96,
    paddingTop: 10,
  },
  urgentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderWidth: 0.5,
    borderColor: Colors.goldLine,
    backgroundColor: Colors.navyDeep,
  },
  urgentToggleActive: {
    borderColor: 'rgba(229,115,115,0.7)',
    backgroundColor: 'rgba(229,115,115,0.08)',
  },
  urgentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
  },
  urgentDotActive: {
    backgroundColor: '#e57373',
    borderColor: '#e57373',
  },
  urgentLabel: {
    fontFamily: Fonts.jakarta,
    fontSize: 7,
    color: Colors.textMuted,
    letterSpacing: 2,
    fontWeight: '600',
  },
  urgentLabelActive: {
    color: '#e57373',
  },
  resultBanner: {
    marginTop: 12,
    padding: 10,
    borderWidth: 0.5,
  },
  resultSuccess: {
    borderColor: 'rgba(129,199,132,0.5)',
    backgroundColor: 'rgba(129,199,132,0.07)',
  },
  resultError: {
    borderColor: 'rgba(229,115,115,0.5)',
    backgroundColor: 'rgba(229,115,115,0.07)',
  },
  resultText: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.xs,
    color: Colors.ivory,
    lineHeight: 16,
  },
  sendBtn: {
    backgroundColor: Colors.gold,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    minHeight: 46,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.navyDeep,
    letterSpacing: 2.5,
  },

  // ── Member list ───────────────────────────────────────
  memberList: {
    gap: 0,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
});
