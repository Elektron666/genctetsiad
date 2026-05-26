import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Announcement } from '@/types/database';

export type { Announcement };

export function useAnnouncements(limit = 5) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const channelId = useRef(`announcements_${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('announcements')
      .select('id, title, body, type, published_at')
      .order('published_at', { ascending: false })
      .limit(limit)
      .then(({ data }: { data: Announcement[] | null }) => {
        setAnnouncements(data ?? []);
        setLoading(false);
      });

    const channel = supabase
      .channel(channelId.current)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'announcements' },
        (payload: { new: Announcement }) => {
          setAnnouncements(prev => [payload.new, ...prev].slice(0, limit));
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [limit]);

  return { announcements, loading };
}
