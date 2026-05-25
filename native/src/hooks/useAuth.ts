import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { registerForPushNotificationsAsync } from '@/lib/notifications';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseRow = any;

export type AuthStatus = 'loading' | 'unauthenticated' | 'pending' | 'authenticated';

async function syncPushToken(userId: string) {
  const token = await registerForPushNotificationsAsync();
  if (!token) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('profiles')
    .update({ expo_push_token: token })
    .eq('id', userId);
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    const row = data as SupabaseRow;
    if (row) {
      setProfile(row as Profile);
      setStatus(row.role === 'pending' ? 'pending' : 'authenticated');
      // Push token'ı arka planda kaydet (UI'yi bloklamasın)
      syncPushToken(userId).catch(() => {});
    } else {
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setStatus('unauthenticated');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setStatus('unauthenticated');
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const sendOtp = useCallback(async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone: `+90${phone.replace(/\D/g, '')}`,
    });
    return error;
  }, []);

  const verifyOtp = useCallback(async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      phone: `+90${phone.replace(/\D/g, '')}`,
      token,
      type: 'sms',
    });
    return error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!session?.user) return { error: new Error('No session') };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('profiles')
      .update(updates)
      .eq('id', session.user.id);
    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }
    return { error };
  }, [session]);

  return { session, profile, status, sendOtp, verifyOtp, signOut, updateProfile };
}
