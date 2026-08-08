import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile, MemberRole } from '@/types/database';

export function useMembers(roles?: MemberRole[]) {
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  // Ağ hatası sessizce yutulursa kullanıcı 'kayıt yok' sanır — oysa
  // istek başarısız olmuştur. Ekranlar bu ikisini ayırt edebilmeli.
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from('profiles')
      .select('*')
      .neq('role', 'pending')
      .order('full_name', { ascending: true });

    if (roles && roles.length > 0) {
       
      query = (query as any).in('role', roles);
    }

    const { data, error: err } = await query;
    if (err) {
      setError('Bağlantı kurulamadı');
    } else {
      setError(null);
      setMembers((data as Profile[]) ?? []);
    }
    setLoading(false);
  }, [roles?.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const mentors = members.filter((m) => m.is_mentor);

  return { members, mentors, loading, error, refetch: fetchMembers };
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
