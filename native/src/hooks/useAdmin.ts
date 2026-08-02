import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { sendPushBatch } from '@/lib/notifications';
import type { Profile, MemberRole } from '@/types/database';

 
const sb = supabase as any;

export type AdminStats = {
  pending: number;
  members: number;
  events: number;
  announcements: number;
};

export type AdminAnnouncement = {
  id: string; title: string; body: string;
  type: 'general' | 'event' | 'system'; published_at: string;
};
export type AdminEvent = {
  id: string; title: string; description: string | null;
  location: string | null; city: string | null;
  starts_at: string; max_attendees: number | null;
};
export type AdminCourse = {
  id: string; title: string; description: string | null;
  instructor: string | null; duration_hours: number | null;
  level: 'beginner' | 'intermediate' | 'advanced' | null;
};
export type PendingArticle = {
  id: string; title: string; summary: string | null; body: string;
  author_id: string; author_name: string; created_at: string;
};

export type AuditRow = {
  id: string; actor_name: string | null; action: string;
  target_type: string | null; target_name: string | null;
  details: Record<string, unknown> | null; created_at: string;
};

export type Attendee = {
  user_id: string; full_name: string; company: string | null;
  phone: string | null; registered_at: string;
};

export function useAdmin() {
  const [pending, setPending] = useState<Profile[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [stats, setStats] = useState<AdminStats>({ pending: 0, members: 0, events: 0, announcements: 0 });
  const [loading, setLoading] = useState(true);
  // Sorgu hataları tamamen yutuluyordu: ağ kesintisinde veya RLS reddinde
  // panel "Bekleyen başvuru yok" gösteriyordu ve yönetici kuyruğun boş
  // olduğunu sanıyordu.
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);

    const [pendingRes, membersRes, eventsRes, annRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'pending').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').neq('role', 'pending').order('full_name', { ascending: true }),
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('announcements').select('id', { count: 'exact', head: true }),
    ]);

    if (pendingRes.error || membersRes.error) {
      setError('Bağlantı kurulamadı');
      setLoading(false);
      return;
    }
    setError(null);

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

  // Silinmiş uygulamaların token'ları kayıtta kalıyor ve her duyuruda
  // boşuna gönderiliyordu. Expo 'DeviceNotRegistered' biletini döndürünce
  // kaydı temizliyoruz. (RLS yalnızca kendi satırını silmeye izin verirse
  // sessizce başarısız olur — zararsız.)
  const pruneDeadTokens = useCallback(async (dead: string[]) => {
    if (dead.length === 0) return;
    try { await sb.from('push_tokens').delete().in('token', dead); } catch { /* yok say */ }
  }, []);

  // Tek kullanıcının cihazına push gönderir (token yoksa sessizce geçer)
  const pushToUser = useCallback(async (userId: string, title: string, body: string, screen?: string) => {
    const { data } = await supabase.from('push_tokens').select('token').eq('user_id', userId);
    const tokens = ((data ?? []) as { token: string }[]).map(t => t.token);
    if (tokens.length === 0) return;
    const { dead } = await sendPushBatch(tokens, title, body, screen);
    await pruneDeadTokens(dead);
  }, [pruneDeadTokens]);

  // Başvuruyu onayla — rol değişince DB trigger'ı GT-YYYY-XXXXX üye kodunu atar,
  // kullanıcının telefonuna hoş geldin bildirimi gider
  const approve = useCallback(async (userId: string, role: Extract<MemberRole, 'member' | 'student'>) => {
    // .select() olmadan RLS'in engellediği güncelleme "hatasız" döner ve
    // panel onaylandı gösterirdi; dönen satır sayısını kontrol ediyoruz.
    const { data, error: err } = await sb.from('profiles').update({ role }).eq('id', userId).select('id');
    const error = err ?? ((data as unknown[] | null)?.length ? null : new Error('Güncelleme yetkisi yok'));
    if (!error) {
      setPending(prev => {
        const approved = prev.find(p => p.id === userId);
        if (approved) setMembers(m => [...m, { ...approved, role }].sort((a, b) => a.full_name.localeCompare(b.full_name, 'tr')));
        return prev.filter(p => p.id !== userId);
      });
      setStats(prev => ({ ...prev, pending: prev.pending - 1, members: prev.members + 1 }));
      // Bildirim "elinden geldiğince" gönderilir; reddedilirse onay akışı
      // etkilenmemeli (eskiden yakalanmayan promise reddi oluşuyordu).
      pushToUser(
        userId,
        'Üyeliğiniz Onaylandı 🎉',
        'Genç TETSİAD üyeliğiniz aktif edildi. Üye kodunuz profilinizde hazır — hoş geldiniz!',
        '/(tabs)/profile',
      ).catch(() => {});
    }
    return error;
  }, [pushToUser]);

  // Rol değiştir (yönetim kurulu atama, üyeliğe geri çekme, onaya geri alma vb.)
  const setRole = useCallback(async (userId: string, role: MemberRole) => {
    const { data, error: err } = await sb.from('profiles').update({ role }).eq('id', userId).select('id');
    const error = err ?? ((data as unknown[] | null)?.length ? null : new Error('Rol değiştirme yetkiniz yok'));
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
  const pushToAll = useCallback(async (title: string, body: string, screen?: string): Promise<number> => {
    try {
      const { data, error } = await supabase.functions.invoke('broadcast-push', {
        body: { title, body, screen },
      });
      if (!error && data && typeof (data as { sent?: number }).sent === 'number') {
        return (data as { sent: number }).sent;
      }
    } catch {
      // fonksiyon dağıtılmamış veya ulaşılamıyor → geri düşüş
    }

    // Edge Function henüz dağıtılmadıysa istemci-taraflı yola düşülür.
    // Bu yol da başarısız olabilir (migration 008 token okumayı kapatır);
    // duyurunun kendisi zaten kaydedildiği için hatayı yutuyoruz.
    try {
      const { data: rows } = await supabase.from('push_tokens').select('token');
      const tokens = ((rows ?? []) as { token: string }[]).map(t => t.token);
      if (tokens.length === 0) return 0;
      const { sent, dead } = await sendPushBatch(tokens, title, body, screen);
      await pruneDeadTokens(dead);
      return sent;
    } catch {
      return 0;
    }
  }, [pruneDeadTokens]);

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
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${pad(when.getDate())}.${pad(when.getMonth() + 1)}.${when.getFullYear()}`;
    const sent = await pushToAll(
      'Yeni Etkinlik 📅',
      `${input.title} — ${dateStr}${input.city ? ` · ${input.city}` : ''}. Takvimden yerinizi ayırtın.`,
      '/(tabs)/calendar',
    );
    return { error: null, sent };
  }, [pushToAll]);

  // ── Yayınlananları geri alma ────────────────────────────────
  // Yanlış duyuru/etkinlik yayınlandığında yönetimin bunu uygulama
  // içinden kaldırabilmesi gerekir (RLS: *_manage_admin FOR ALL).

  const listAnnouncements = useCallback(async (): Promise<AdminAnnouncement[]> => {
    const { data } = await supabase
      .from('announcements')
      .select('id, title, body, type, published_at')
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
      .select('id, title, description, location, city, starts_at, max_attendees')
      .order('starts_at', { ascending: false })
      .limit(30);
    return (data ?? []) as AdminEvent[];
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    const { error } = await sb.from('events').delete().eq('id', id);
    if (!error) setStats(prev => ({ ...prev, events: Math.max(0, prev.events - 1) }));
    return error;
  }, []);

  // ── Düzenleme ───────────────────────────────────────────────
  // Yayınlanan içerikte yazım hatası olduğunda silip yeniden yazmak
  // gerekiyordu — bu, üyelere ikinci kez bildirim gitmesine yol açıyordu.
  // Düzenlemede bildirim GÖNDERİLMEZ.

  const updateAnnouncement = useCallback(async (
    id: string,
    input: { title: string; body: string; type: 'general' | 'event' | 'system' },
  ) => {
    const { error } = await sb.from('announcements').update(input).eq('id', id);
    return error;
  }, []);

  const updateEvent = useCallback(async (
    id: string,
    input: {
      title: string; description?: string; location?: string;
      city?: string; starts_at: string; max_attendees?: number | null;
    },
  ) => {
    const { error } = await sb.from('events').update(input).eq('id', id);
    return error;
  }, []);

  // ── Kurs yönetimi ───────────────────────────────────────────
  // Kurslar yalnızca seed verisiyle geliyordu; yönetimin uygulama
  // içinden kurs ekleyip kaldırabilmesi gerekir.

  const listCourses = useCallback(async (): Promise<AdminCourse[]> => {
    const { data } = await supabase
      .from('courses')
      .select('id, title, description, instructor, duration_hours, level')
      .order('created_at', { ascending: false })
      .limit(50);
    return (data ?? []) as AdminCourse[];
  }, []);

  const createCourse = useCallback(async (input: {
    title: string; description?: string; instructor?: string;
    duration_hours?: number | null;
    level?: 'beginner' | 'intermediate' | 'advanced';
  }) => {
    const { error } = await sb.from('courses').insert({ ...input, is_published: true });
    return error;
  }, []);

  const updateCourse = useCallback(async (id: string, input: {
    title: string; description?: string; instructor?: string;
    duration_hours?: number | null;
    level?: 'beginner' | 'intermediate' | 'advanced';
  }) => {
    const { error } = await sb.from('courses').update(input).eq('id', id);
    return error;
  }, []);

  const deleteCourse = useCallback(async (id: string) => {
    const { error } = await sb.from('courses').delete().eq('id', id);
    return error;
  }, []);

  // ── Etkinlik katılımcı listesi ──────────────────────────────
  // Yönetim yalnızca katılımcı SAYISINI görüyordu; etkinliği organize
  // etmek için kimlerin geldiğini bilmek şart (yaka kartı, yoklama,
  // ulaşım, ikram planlaması).

  // ── Bülten inceleme kuyruğu ─────────────────────────────────
  const listPendingArticles = useCallback(async (): Promise<PendingArticle[]> => {
    const { data } = await supabase
      .from('articles')
      .select('id, title, summary, body, author_id, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

     
    const rows = (data ?? []) as any[];
    if (rows.length === 0) return [];

    const { data: profs } = await supabase
      .from('profiles').select('id, full_name')
      .in('id', [...new Set(rows.map(r => r.author_id))]);
     
    const map = new Map(((profs ?? []) as any[]).map(p => [p.id, p.full_name]));

    return rows.map(r => ({ ...r, author_name: map.get(r.author_id) ?? 'Üye' }));
  }, []);

  // Yayınlarken tüm üyelere bildirim gider; reddederken gitmez.
  const reviewArticle = useCallback(async (
    id: string,
    decision: 'published' | 'rejected',
    note?: string,
    title?: string,
  ) => {
    const { error } = await sb.from('articles')
      .update({ status: decision, review_note: note ?? null })
      .eq('id', id);
    if (error) return { error, sent: 0 };

    if (decision === 'published') {
      const sent = await pushToAll(
        'Bültende yeni yazı 📄',
        title ? `${title} — Akademi > Bülten'den okuyabilirsiniz.` : 'Yeni bir üye yazısı yayımlandı.',
        '/(tabs)/academy',
      );
      return { error: null, sent };
    }
    return { error: null, sent: 0 };
  }, [pushToAll]);

  // Başvuru reddi (migration 011): kayıt audit_log'a yazılır,
  // kişisel veri silinir. Yönetimin elinde eskiden yalnızca ONAYLA vardı.
  const rejectApplication = useCallback(async (userId: string, reason?: string) => {
    const { error } = await sb.rpc('reject_application', { target: userId, reason: reason ?? null });
    if (!error) {
      setPending(prev => prev.filter(p => p.id !== userId));
      setStats(prev => ({ ...prev, pending: Math.max(0, prev.pending - 1) }));
    }
    return error;
  }, []);

  // Denetim kaydı tutuluyordu ama uygulamada GÖRÜNTÜLENEMİYORDU;
  // yalnızca Supabase SQL Editor'den okunabiliyordu. Resmî bir talep
  // geldiğinde yönetimin kaydı kendi görebilmesi gerekir.
  const listAudit = useCallback(async (): Promise<AuditRow[]> => {
    const { data } = await sb
      .from('audit_log')
      .select('id, actor_name, action, target_type, target_name, details, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    return (data ?? []) as AuditRow[];
  }, []);

  const listAttendees = useCallback(async (eventId: string): Promise<Attendee[]> => {
    const { data: rows } = await supabase
      .from('event_attendees')
      .select('user_id, registered_at')
      .eq('event_id', eventId)
      .order('registered_at', { ascending: true });

    const list = (rows ?? []) as { user_id: string; registered_at: string }[];
    if (list.length === 0) return [];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, company, phone')
      .in('id', list.map(r => r.user_id));

     
    const pMap = new Map(((profiles ?? []) as any[]).map(p => [p.id, p]));
    return list.map(r => ({
      user_id: r.user_id,
      full_name: pMap.get(r.user_id)?.full_name ?? 'Üye',
      company: pMap.get(r.user_id)?.company ?? null,
      phone: pMap.get(r.user_id)?.phone ?? null,
      registered_at: r.registered_at,
    }));
  }, []);

  return {
    pending, members, stats, loading, error, refetch, approve, rejectApplication, setRole,
    publishAnnouncement, createEvent,
    listAnnouncements, deleteAnnouncement, updateAnnouncement,
    listEvents, deleteEvent, updateEvent,
    listCourses, createCourse, updateCourse, deleteCourse,
    listAttendees,
    listPendingArticles, reviewArticle, listAudit,
  };
}
