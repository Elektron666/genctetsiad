import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { sendPushBatch } from '@/lib/notifications';
import type { Profile, MemberRole } from '@/types/database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export type AdminStats = {
  pending: number;
  members: number;
  events: number;
  announcements: number;
};

export type AdminAnnouncement = { id: string; title: string; body: string; published_at: string };
export type AdminEvent = { id: string; title: string; starts_at: string; city: string | null };

export function useAdmin() {
  const [pending, setPending] = useState<Profile[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [stats, setStats] = useState<AdminStats>({ pending: 0, members: 0, events: 0, announcements: 0 });
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);

    const [pendingRes, membersRes, eventsRes, annRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'pending').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').neq('role', 'pending').order('full_name', { ascending: true }),
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('announcements').select('id', { count: 'exact', head: true }),
    ]);

    const pendingRows = (pendingRes.data ?? []) as Profile[];
    const memberRows = (membersRes.data ?? []) as Profile[];
    setPending(pendingRows);
    setMembers(memberRows);
    setStats({
      pending: pendingRows.length,
      members: memberRows.length,
      events: eventsRes.count ?? 0,
      announcements: annRes.count ?? 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  // Tek kullanıcının cihazına push gönderir (token yoksa sessizce geçer)
  const pushToUser = useCallback(async (userId: string, title: string, body: string) => {
    const { data } = await supabase.from('push_tokens').select('token').eq('user_id', userId);
    const tokens = ((data ?? []) as { token: string }[]).map(t => t.token);
    if (tokens.length > 0) await sendPushBatch(tokens, title, body);
  }, []);

  // Başvuruyu onayla — rol değişince DB trigger'ı GT-YYYY-XXXXX üye kodunu atar,
  // kullanıcının telefonuna hoş geldin bildirimi gider
  const approve = useCallback(async (userId: string, role: Extract<MemberRole, 'member' | 'student'>) => {
    const { error } = await sb.from('profiles').update({ role }).eq('id', userId);
    if (!error) {
      setPending(prev => {
        const approved = prev.find(p => p.id === userId);
        if (approved) setMembers(m => [...m, { ...approved, role }].sort((a, b) => a.full_name.localeCompare(b.full_name, 'tr')));
        return prev.filter(p => p.id !== userId);
      });
      setStats(prev => ({ ...prev, pending: prev.pending - 1, members: prev.members + 1 }));
      pushToUser(
        userId,
        'Üyeliğiniz Onaylandı 🎉',
        'Genç TETSİAD üyeliğiniz aktif edildi. Üye kodunuz profilinizde hazır — hoş geldiniz!'
      );
    }
    return error;
  }, [pushToUser]);

  // Rol değiştir (yönetim kurulu atama, üyeliğe geri çekme, onaya geri alma vb.)
  const setRole = useCallback(async (userId: string, role: MemberRole) => {
    const { error } = await sb.from('profiles').update({ role }).eq('id', userId);
    if (!error) {
      if (role === 'pending') {
        setMembers(prev => {
          const demoted = prev.find(p => p.id === userId);
          if (demoted) setPending(pd => [{ ...demoted, role }, ...pd]);
          return prev.filter(p => p.id !== userId);
        });
        setStats(prev => ({ ...prev, pending: prev.pending + 1, members: prev.members - 1 }));
      } else {
        setMembers(prev => prev.map(p => p.id === userId ? { ...p, role } : p));
      }
    }
    return error;
  }, []);

  // Kayıtlı tüm cihazlara push gönderir; gönderilen cihaz sayısını döner
  // Toplu bildirim. Tercih edilen yol: broadcast-push Edge Function —
  // token'lar istemciye hiç inmez, gönderim service_role ile sunucuda yapılır.
  // Fonksiyon henüz dağıtılmadıysa eski istemci-taraflı yola düşer, böylece
  // dağıtımdan önce de bildirim çalışmaya devam eder.
  const pushToAll = useCallback(async (title: string, body: string): Promise<number> => {
    try {
      const { data, error } = await supabase.functions.invoke('broadcast-push', {
        body: { title, body },
      });
      if (!error && data && typeof (data as { sent?: number }).sent === 'number') {
        return (data as { sent: number }).sent;
      }
    } catch {
      // fonksiyon dağıtılmamış veya ulaşılamıyor → geri düşüş
    }

    const { data: rows } = await supabase.from('push_tokens').select('token');
    const tokens = ((rows ?? []) as { token: string }[]).map(t => t.token);
    if (tokens.length === 0) return 0;
    return sendPushBatch(tokens, title, body);
  }, []);

  const publishAnnouncement = useCallback(async (input: { title: string; body: string; type: 'general' | 'event' | 'system' }) => {
    const { error } = await sb.from('announcements').insert(input);
    if (error) return { error, sent: 0 };
    setStats(prev => ({ ...prev, announcements: prev.announcements + 1 }));
    const sent = await pushToAll(input.title, input.body);
    return { error: null, sent };
  }, [pushToAll]);

  const createEvent = useCallback(async (input: {
    title: string;
    description?: string;
    location?: string;
    city?: string;
    starts_at: string;
    max_attendees?: number | null;
  }) => {
    const { error } = await sb.from('events').insert({ ...input, is_published: true });
    if (error) return { error, sent: 0 };
    setStats(prev => ({ ...prev, events: prev.events + 1 }));
    const when = new Date(input.starts_at);
    const dateStr = `${when.getDate()}.${when.getMonth() + 1}.${when.getFullYear()}`;
    const sent = await pushToAll(
      'Yeni Etkinlik 📅',
      `${input.title} — ${dateStr}${input.city ? ` · ${input.city}` : ''}. Takvimden yerinizi ayırtın.`
    );
    return { error: null, sent };
  }, [pushToAll]);

  // ── Yayınlananları geri alma ────────────────────────────────
  // Yanlış duyuru/etkinlik yayınlandığında yönetimin bunu uygulama
  // içinden kaldırabilmesi gerekir (RLS: *_manage_admin FOR ALL).

  const listAnnouncements = useCallback(async (): Promise<AdminAnnouncement[]> => {
    const { data } = await supabase
      .from('announcements')
      .select('id, title, body, published_at')
      .order('published_at', { ascending: false })
      .limit(30);
    return (data ?? []) as AdminAnnouncement[];
  }, []);

  const deleteAnnouncement = useCallback(async (id: string) => {
    const { error } = await sb.from('announcements').delete().eq('id', id);
    if (!error) setStats(prev => ({ ...prev, announcements: Math.max(0, prev.announcements - 1) }));
    return error;
  }, []);

  const listEvents = useCallback(async (): Promise<AdminEvent[]> => {
    const { data } = await supabase
      .from('events')
      .select('id, title, starts_at, city')
      .order('starts_at', { ascending: false })
      .limit(30);
    return (data ?? []) as AdminEvent[];
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    const { error } = await sb.from('events').delete().eq('id', id);
    if (!error) setStats(prev => ({ ...prev, events: Math.max(0, prev.events - 1) }));
    return error;
  }, []);

  return {
    pending, members, stats, loading, refetch, approve, setRole,
    publishAnnouncement, createEvent,
    listAnnouncements, deleteAnnouncement, listEvents, deleteEvent,
  };
}
