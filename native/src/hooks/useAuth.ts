import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseRow = any;

export type AuthStatus = 'loading' | 'unauthenticated' | 'pending' | 'authenticated';

// "0532...", "90 532...", "+90 532...", "532..." → hepsi "+90532..." olur
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('90') && digits.length > 10) digits = digits.slice(2);
  digits = digits.replace(/^0+/, '');
  return `+90${digits}`;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    const row = data as SupabaseRow;
    if (row) {
      setProfile(row as Profile);
      setStatus(row.role === 'pending' ? 'pending' : 'authenticated');
    } else if (error && error.code !== 'PGRST116') {
      // Geçici hata (ağ vb.). Elimizde daha önce yüklenmiş bir profil
      // varsa ONU KORU — eskiden onaylı bir üye, tek bir ağ kesintisinde
      // "onay bekleniyor" ekranına düşüyor ve uygulamadan atılıyordu.
      setStatus(prev => (prev === 'authenticated' ? 'authenticated' : 'pending'));
    } else {
      // Profil satırı gerçekten yok (trigger gecikmesi olabilir) — pending kabul et
      setStatus('pending');
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Oturum süresi dolduğunda veya yenileme başarısız olduğunda kullanıcı
      // hata ekranlarıyla karşılaşmasın; temiz şekilde çıkışa düşsün.
      if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
        setSession(null);
        setProfile(null);
        setStatus('unauthenticated');
        return;
      }
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

  // ── E-posta ile doğrulama (birincil yöntem) ────────────────
  // SMS parayla, e-posta bedava. Kimlik doğrulamanın asıl kapısı zaten
  // yönetim onayı; e-posta yalnızca "bu adres gerçekten senin mi" sorusunu
  // cevaplıyor. Telefon numarası profil alanı olarak toplanmaya devam eder.
  const sendEmailOtp = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    return error;
  }, []);

  const verifyEmailOtp = useCallback(async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token,
      type: 'email',
    });
    return error;
  }, []);

  // ── SMS ile doğrulama (Twilio bağlandığında devreye alınacak) ──
  const sendOtp = useCallback(async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone: normalizePhone(phone),
    });
    return error;
  }, []);

  const verifyOtp = useCallback(async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      phone: normalizePhone(phone),
      token,
      type: 'sms',
    });
    return error;
  }, []);

  const signOut = useCallback(async () => {
    // Cihaz kaydını çıkarmadan çıkılırsa, telefon dernek duyurularını
    // almaya DEVAM ediyordu — ortak kullanılan bir cihazda başkasının
    // bildirimlerini görmek demek.
    if (session?.user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      try {
        await (supabase as any).from('push_tokens').delete().eq('user_id', session.user.id);
      } catch { /* token silinemezse çıkış yine de yapılmalı */ }
    }
    await supabase.auth.signOut();
  }, [session]);

  // Mağaza zorunluluğu: kullanıcı kendi hesabını kalıcı olarak silebilmeli.
  // RPC auth.users kaydını siler; tüm veriler CASCADE ile temizlenir.
  const deleteAccount = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc('delete_own_account');
    if (!error) {
      await supabase.auth.signOut().catch(() => {});
      setProfile(null);
      setSession(null);
      setStatus('unauthenticated');
    }
    return { error };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id);
  }, [session, loadProfile]);

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

  return { session, profile, status, sendEmailOtp, verifyEmailOtp, sendOtp, verifyOtp, signOut, deleteAccount, updateProfile, refreshProfile };
}
