import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type BroadcastResult = { sent: number; failed: number } | null;

export function useAdmin() {
  const [pendingMembers, setPendingMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    const { data } = await db
      .from('profiles')
      .select('*')
      .eq('role', 'pending')
      .order('created_at', { ascending: true });
    setPendingMembers((data as Profile[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPending();

    // Yeni pending üye başvurusu veya rol değişimi: otomatik güncelle
    const channel = supabase
      .channel('admin_pending')
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        (payload: { new: Profile }) => {
          if (payload.new.role === 'pending') {
            setPendingMembers(prev => [...prev, payload.new]);
          }
        },
      )
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload: { new: Profile; old: { role?: string } }) => {
          if (payload.new.role !== 'pending') {
            // Başka bir admin onayladı veya reddetti — listeden çıkar
            setPendingMembers(prev => prev.filter(m => m.id !== payload.new.id));
          } else {
            // Hâlâ pending ama bilgileri güncellenmiş
            setPendingMembers(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
          }
        },
      )
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        { event: 'DELETE', schema: 'public', table: 'profiles' },
        (payload: { old: { id?: string } }) => {
          if (payload.old.id) {
            setPendingMembers(prev => prev.filter(m => m.id !== payload.old.id));
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPending]);

  const approveMember = useCallback(async (userId: string): Promise<{ error: unknown }> => {
    const { error } = await db
      .from('profiles')
      .update({ role: 'member' })
      .eq('id', userId);
    if (!error) {
      setPendingMembers(prev => prev.filter(m => m.id !== userId));
      db.from('notifications').insert({
        user_id: userId,
        title: 'Üyeliğiniz Onaylandı',
        body: 'Genç TETSİAD üyesi olarak kabul edildiniz. Platformun tüm özelliklerine erişebilirsiniz.',
        type: 'system',
      }).then(() => {});
    }
    return { error };
  }, []);

  const rejectMember = useCallback(async (userId: string): Promise<{ error: unknown }> => {
    const { error } = await db
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (!error) setPendingMembers(prev => prev.filter(m => m.id !== userId));
    return { error };
  }, []);

  const sendBroadcast = useCallback(async (
    title: string,
    body: string,
    urgent: boolean,
  ): Promise<{ data: BroadcastResult; error: unknown }> => {
    const { data, error } = await supabase.functions.invoke('send-broadcast', {
      body: { title, body, urgent, target_roles: null },
    });
    return { data: data as BroadcastResult, error };
  }, []);

  return { pendingMembers, loading, fetchPending, approveMember, rejectMember, sendBroadcast };
}
