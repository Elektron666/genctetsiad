import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Article } from '@/types/database';

 
const sb = supabase as any;

// Yazar adlarını ayrı sorguyla alıyoruz: profiles üzerindeki RLS,
// gömülü join'lerde beklenmedik şekilde davranabiliyor. İki basit
// sorgu, tek karmaşık sorgudan daha öngörülebilir.
async function attachAuthors(rows: Article[]): Promise<Article[]> {
  if (rows.length === 0) return rows;
  const ids = [...new Set(rows.map(r => r.author_id))];
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, company')
    .in('id', ids);
   
  const map = new Map(((data ?? []) as any[]).map(p => [p.id, p]));
  return rows.map(r => ({
    ...r,
    author_name: map.get(r.author_id)?.full_name ?? 'Üye',
    author_company: map.get(r.author_id)?.company ?? null,
  }));
}

/** Yayınlanmış bülten yazıları (tüm onaylı üyeler) */
export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50);

    if (err) {
      setError('Bağlantı kurulamadı');
      setLoading(false);
      return;
    }
    setError(null);
    setArticles(await attachAuthors((data ?? []) as Article[]));
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);
  return { articles, loading, error, refetch };
}

/** Kullanıcının kendi gönderileri + gönderme/düzeltme/geri çekme */
export function useMyArticles(userId?: string) {
  const [mine, setMine] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  // Hata hiç tutulmuyordu: ağ kesintisinde kullanıcı gönderdiği
  // yazıların silindiğini sanıyordu.
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!userId) { setMine([]); setLoading(false); return; }
    setLoading(true);
    const { data, error: err } = await supabase
      .from('articles')
      .select('*')
      .eq('author_id', userId)
      .order('created_at', { ascending: false });
    if (err) { setError('Bağlantı kurulamadı'); setLoading(false); return; }
    setError(null);
    setMine((data ?? []) as Article[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { refetch(); }, [refetch]);

  // Durum daima 'pending' — üye kendi yazısını yayınlayamaz (RLS de zorlar)
  const submit = useCallback(async (input: { title: string; summary?: string; body: string }) => {
    if (!userId) return { error: new Error('No session') };
    const { error } = await sb.from('articles').insert({
      author_id: userId,
      title: input.title,
      summary: input.summary || null,
      body: input.body,
      status: 'pending',
    });
    if (!error) await refetch();
    return { error };
  }, [userId, refetch]);

  const update = useCallback(async (id: string, input: { title: string; summary?: string; body: string }) => {
    // author_id koşulu RLS'e ek savunma katmanı — tek bir politika
    // hatası tüm yazıları düzenlenebilir hâle getirmesin.
    const { error } = await sb.from('articles')
      .update({ ...input, summary: input.summary || null, status: 'pending' })
      .eq('id', id).eq('author_id', userId ?? '');
    if (!error) await refetch();
    return { error };
  }, [refetch, userId]);

  const withdraw = useCallback(async (id: string) => {
    const { error } = await sb.from('articles').delete().eq('id', id).eq('author_id', userId ?? '');
    if (!error) await refetch();
    return { error };
  }, [refetch, userId]);

  return { mine, loading, error, refetch, submit, update, withdraw };
}
