import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile, MemberRole } from '@/types/database';

// Rehber `select('*')` yapıyordu: her üyenin e-postası, rıza damgaları,
// mentor notu — ekranda hiç kullanılmayan her şey istemciye iniyordu.
// Yalnızca gösterilen alanlar çekiliyor.
const DIRECTORY_COLUMNS =
  'id, full_name, email, phone, phone_visible, company, city, sector, position, role, member_code, is_mentor, mentor_bio, created_at, updated_at';

const PAGE_SIZE = 200;
const MAX_PAGES = 50;   // 10.000 üyeye kadar; güvenlik sınırı

export function useMembers(roles?: MemberRole[]) {
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  // Ağ hatası sessizce yutulursa kullanıcı 'kayıt yok' sanır — oysa
  // istek başarısız olmuştur. Ekranlar bu ikisini ayırt edebilmeli.
  const [error, setError] = useState<string | null>(null);
  // Arka planda kalan sayfalar çekilirken true. Arama bu sırada
  // eksik sonuç verebileceği için ekran kullanıcıyı uyarır.
  const [loadingAll, setLoadingAll] = useState(false);
  const [total, setTotal] = useState(0);

  const roleKey = roles?.join(',') ?? '';

  const page = useCallback((from: number) => {
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

  // Önce ilk sayfa gelir ve liste ANINDA çizilir; kalan sayfalar arka
  // planda akar.
  //
  // Neden sonsuz kaydırma (onEndReached) DEĞİL: arama istemcide ve
  // Türkçe'ye duyarlı yapılıyor. Yalnızca görünen sayfa yüklüyken
  // arama yapılırsa, listede var olan bir üye "bulunamadı" görünür —
  // sayfalamayı eklerken tam da bu gerilemeye yol açılmıştı.
  // Tüm kayıtlar indiğinde arama yeniden eksiksiz olur.
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const { data, error: err, count } = await page(0);
    if (err) {
      setError('Bağlantı kurulamadı');
      setLoading(false);
      return;
    }
    setError(null);
    const first = (data ?? []) as unknown as Profile[];
    const toplam = count ?? first.length;
    setMembers(first);
    setTotal(toplam);
    setLoading(false);

    if (first.length >= toplam) return;

    setLoadingAll(true);
    const acc = [...first];
    // Üst sınır: beklenmedik bir sayım hatasında sonsuz döngüye girmesin.
    for (let i = 0; i < MAX_PAGES && acc.length < toplam; i++) {
      const { data: more } = await page(acc.length);
      const rows = (more ?? []) as unknown as Profile[];
      if (rows.length === 0) break;
      acc.push(...rows);
      setMembers([...acc]);
    }
    setLoadingAll(false);
  }, [page]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  return { members, loading, loadingAll, error, total, refetch: fetchMembers };
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
