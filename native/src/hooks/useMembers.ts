import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile, MemberRole } from '@/types/database';

export function useMembers(roles?: MemberRole[]) {
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from('profiles')
      .select('*')
      .neq('role', 'pending')
      .order('full_name', { ascending: true });

    if (roles && roles.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query = (query as any).in('role', roles);
    }

    const { data } = await query;
    setMembers((data as Profile[]) ?? []);
    setLoading(false);
  }, [roles?.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const mentors = members.filter((m) => m.is_mentor);

  return { members, mentors, loading, refetch: fetchMembers };
}
