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
