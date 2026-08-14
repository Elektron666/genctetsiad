import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile, MemberRole } from '@/types/database';

// Rehber `select('*')` yapıyordu: her üyenin e-postası, rıza damgaları,
// mentor notu — ekranda hiç kullanılmayan her şey istemciye iniyordu.
// Yalnızca gösterilen alanlar çekiliyor.
const DIRECTORY_COLUMNS =
  'id, full_name, email, phone, phone_visible, company, city, sector, position, role, member_code, is_mentor, mentor_bio, created_at, updated_at';

const PAGE_SIZE = 100;

export function useMembers(roles?: MemberRole[]) {
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  // Ağ hatası sessizce yutulursa kullanıcı 'kayıt yok' sanır — oysa
  // istek başarısız olmuştur. Ekranlar bu ikisini ayırt edebilmeli.
  const [error, setError] = useState<string | null>(null);
  // 1.500 üye tek istekte iniyordu. Sayfa sayfa alınıyor.
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const roleKey = roles?.join(',') ?? '';

  const buildQuery = useCallback((from: number) => {
    let q = supabase
      .from('profiles')
      .select(DIRECTORY_COLUMNS, { count: 'exact' })
      .neq('role', 'pending')
      .order('full_name', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (roleKey) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      q = (q as any).in('role', roleKey.split(','));
    }
    return q;
  }, [roleKey]);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const { data, error: err, count } = await buildQuery(0);
    if (err) {
      setError('Bağlantı kurulamadı');
    } else {
      setError(null);
      const rows = (data ?? []) as unknown as Profile[];
      setMembers(rows);
      setTotal(count ?? rows.length);
      setHasMore(rows.length < (count ?? 0));
    }
    setLoading(false);
  }, [buildQuery]);

  const loadMore = useCallback(async () => {
    const from = members.length;
    const { data, count } = await buildQuery(from);
    const rows = (data ?? []) as unknown as Profile[];
    if (rows.length === 0) { setHasMore(false); return; }
    setMembers(prev => [...prev, ...rows]);
    setHasMore(from + rows.length < (count ?? 0));
  }, [members.length, buildQuery]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const mentors = members.filter((m) => m.is_mentor);

  return { members, mentors, loading, error, hasMore, total, loadMore, refetch: fetchMembers };
}

/**
 * Yalnızca mentorları çeker. Mentör sekmesi eskiden useMembers() ile
 * TÜM üyeleri (telefon, e-posta dahil) indirip istemcide süzüyordu —
 * dört kişi göstermek için binlerce kişisel kayıt.
 */
export function useMentors() {
  const [mentors, setMentors] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('profiles')
      .select('id, full_name, company, position, sector, role, is_mentor, mentor_bio')
      .eq('is_mentor', true)
      .neq('role', 'pending')
      .order('full_name', { ascending: true });

    if (err) setError('Bağlantı kurulamadı');
    else { setError(null); setMentors((data ?? []) as unknown as Profile[]); }
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);
  return { mentors, loading, error, refetch };
}
