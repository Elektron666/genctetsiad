import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Event } from '@/types/database';

export function useEvents(userId?: string) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*, event_attendees(count)')
      .eq('is_published', true)
      .order('starts_at', { ascending: true });

    if (error || !data) {
      setLoading(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = data as any[];
    const enriched: Event[] = rows.map((row) => ({
      ...row,
      attendee_count: Number(row.event_attendees?.[0]?.count ?? 0),
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

  useEffect(() => {
    fetchEvents();

    // Refresh when admin creates or updates an event
    const channel = supabase
      .channel('events_live')
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'events' },
        () => { fetchEvents(); },
      )
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        { event: 'UPDATE', schema: 'public', table: 'events' },
        () => { fetchEvents(); },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchEvents]);

  const toggleAttendance = useCallback(async (eventId: string) => {
    if (!userId) return;

    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    if (event.is_attending) {
      await sb.from('event_attendees').delete().eq('event_id', eventId).eq('user_id', userId);
    } else {
      await sb.from('event_attendees').insert({ event_id: eventId, user_id: userId });
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
  }, [events, userId]);

  return { events, loading, refetch: fetchEvents, toggleAttendance };
}
