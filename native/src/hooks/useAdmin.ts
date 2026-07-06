import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile, MemberRole } from '@/types/database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export type AdminStats = {
  pending: number;
  members: number;
  events: number;
  announcements: number;
};

export function useAdmin() {
  const [pending, setPending] = useState<Profile[]>([]);
  const [stats, setStats] = useState<AdminStats>({ pending: 0, members: 0, events: 0, announcements: 0 });
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);

    const [pendingRes, membersRes, eventsRes, annRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'pending').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).neq('role', 'pending'),
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('announcements').select('id', { count: 'exact', head: true }),
    ]);

    const rows = (pendingRes.data ?? []) as Profile[];
    setPending(rows);
    setStats({
      pending: rows.length,
      members: membersRes.count ?? 0,
      events: eventsRes.count ?? 0,
      announcements: annRes.count ?? 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  // Başvuruyu onayla — rol değişince DB trigger'ı GT-YYYY-XXXXX üye kodunu atar
  const approve = useCallback(async (userId: string, role: Extract<MemberRole, 'member' | 'student'>) => {
    const { error } = await sb.from('profiles').update({ role }).eq('id', userId);
    if (!error) {
      setPending(prev => prev.filter(p => p.id !== userId));
      setStats(prev => ({ ...prev, pending: prev.pending - 1, members: prev.members + 1 }));
    }
    return error;
  }, []);

  const publishAnnouncement = useCallback(async (input: { title: string; body: string; type: 'general' | 'event' | 'system' }) => {
    const { error } = await sb.from('announcements').insert(input);
    if (!error) setStats(prev => ({ ...prev, announcements: prev.announcements + 1 }));
    return error;
  }, []);

  const createEvent = useCallback(async (input: {
    title: string;
    description?: string;
    location?: string;
    city?: string;
    starts_at: string;
    max_attendees?: number | null;
  }) => {
    const { error } = await sb.from('events').insert({ ...input, is_published: true });
    if (!error) setStats(prev => ({ ...prev, events: prev.events + 1 }));
    return error;
  }, []);

  return { pending, stats, loading, refetch, approve, publishAnnouncement, createEvent };
}
