import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Event } from '@/types/database';

export function useEvents(userId?: string) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*, event_attendees(count)')
      .eq('is_published', true)
      .order('starts_at', { ascending: true });

    if (error || !data) {
      setError('Bağlantı kurulamadı');
      setLoading(false);
      return;
    }
    setError(null);

     
    const rows = data as any[];
    const enriched: Event[] = rows.map((row) => ({
      ...row,
      attendee_count: row.event_attendees?.[0]?.count ?? 0,
    }));

    if (userId) {
      const { data: myAttendances } = await supabase
        .from('event_attendees')
        .select('event_id')
        .eq('user_id', userId);

      const mySet = new Set((myAttendances ?? []).map((a: { event_id: string }) => a.event_id));
      enriched.forEach((e) => { e.is_attending = mySet.has(e.id); });
    }

    setEvents(enriched);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const toggleAttendance = useCallback(async (eventId: string): Promise<{ full?: boolean; denied?: boolean; failed?: boolean }> => {
    if (!userId) return {};

    const event = events.find((e) => e.id === eventId);
    if (!event) return {};

    // Kontenjan dolu ise yeni katılım kabul edilmez (iptal her zaman serbest)
    if (!event.is_attending && event.max_attendees != null
        && (event.attendee_count ?? 0) >= event.max_attendees) {
      return { full: true };
    }

     
    const sb = supabase as any;
    const { error } = event.is_attending
      ? await sb.from('event_attendees').delete().eq('event_id', eventId).eq('user_id', userId)
      : await sb.from('event_attendees').insert({ event_id: eventId, user_id: userId });

    // Sunucu reddettiyse arayüzü değiştirmiyoruz — aksi hâlde kullanıcı
    // katıldığını sanır ama kayıt oluşmamış olur.
    //
    // Hata TÜRÜNÜ ayırt etmek şart: eskiden her hata "kontenjan doldu"
    // olarak gösteriliyordu, bu yüzden onay bekleyen bir üye KATIL'a
    // bastığında kontenjanın dolduğu söyleniyordu. Kontenjan tetikleyicisi
    // (migration 006) check_violation, RLS reddi ise 42501 döner.
    if (error) {
      await fetchEvents();
       
      const code = String((error as any).code ?? '');
      const msg  = String((error as any).message ?? '');
      if (code === '42501' || /row-level security/i.test(msg)) return { denied: true };
      if (code === '23514' || /kontenjan/i.test(msg))          return { full: true };
      return { failed: true };
    }

    setEvents((prev) =>
      prev.map((e) =>
        e.id !== eventId ? e : {
          ...e,
          is_attending: !e.is_attending,
          attendee_count: (e.attendee_count ?? 0) + (e.is_attending ? -1 : 1),
        }
      )
    );
    return {};
  }, [events, userId, fetchEvents]);

  return { events, loading, error, refetch: fetchEvents, toggleAttendance };
}
