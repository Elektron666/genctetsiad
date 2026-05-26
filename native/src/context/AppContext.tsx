import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/context/AuthContext';
import type { Notification as DBNotif } from '@/types/database';

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotifCategory = 'DUYURU' | 'ETKİNLİK' | 'SİSTEM' | 'MENTORLUK';

export type AppNotification = {
  id: string;
  category: NotifCategory;
  title: string;
  body: string;
  date: string;
  read: boolean;
};

type AppState = {
  registeredEvents: Set<number>;
  toggleEvent: (eventId: number) => void;
  isRegistered: (eventId: number) => boolean;

  enrolledCourses: Set<number>;
  toggleCourse: (courseId: number) => void;

  mentorRequests: Set<number>;
  addMentorRequest: (mentorId: number) => void;

  notifications: AppNotification[];
  markRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const NOTIF_CATEGORY: Record<string, NotifCategory> = {
  announcement: 'DUYURU',
  event: 'ETKİNLİK',
  system: 'SİSTEM',
  mentorship: 'MENTORLUK',
};

const TR_MONTHS = ['OCA','ŞUB','MAR','NİS','MAY','HAZ','TEM','AĞU','EYL','EKİ','KAS','ARA'];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]}`;
}

function dbToNotif(n: DBNotif): AppNotification {
  return {
    id:       n.id,
    category: NOTIF_CATEGORY[n.type] ?? 'SİSTEM',
    title:    n.title,
    body:     n.body ?? '',
    date:     formatDate(n.created_at),
    read:     n.read,
  };
}

// ── Context ───────────────────────────────────────────────────────────────────

const AppCtx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuthContext();
  const userId = session?.user?.id;

  const [registeredEvents, setRegisteredEvents] = useState<Set<number>>(() => new Set([2, 5]));
  const [enrolledCourses, setEnrolledCourses]   = useState<Set<number>>(() => new Set([1, 2, 4, 6]));
  const [mentorRequests, setMentorRequests]     = useState<Set<number>>(new Set());
  const [notifications, setNotifications]       = useState<AppNotification[]>([]);

  // ── Notifications from DB ─────────────────────────────────────────────────

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }: { data: DBNotif[] | null }) => {
        setNotifications((data ?? []).map(dbToNotif));
      });

    const channel = supabase
      .channel(`notif_${userId}`)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload: { new: DBNotif }) => {
          setNotifications(prev => [dbToNotif(payload.new), ...prev]);
        }
      )
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload: { new: DBNotif }) => {
          setNotifications(prev => prev.map(n => n.id === payload.new.id ? dbToNotif(payload.new) : n));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // ── Notification actions ──────────────────────────────────────────────────

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (userId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('notifications').update({ read: true }).eq('id', id).eq('user_id', userId);
    }
  }, [userId]);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (userId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
    }
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Events ────────────────────────────────────────────────────────────────

  const toggleEvent = useCallback((id: number) => {
    setRegisteredEvents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const isRegistered = useCallback((id: number) => registeredEvents.has(id), [registeredEvents]);

  // ── Courses ───────────────────────────────────────────────────────────────

  const toggleCourse = useCallback((id: number) => {
    setEnrolledCourses(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // ── Mentorship ────────────────────────────────────────────────────────────

  const addMentorRequest = useCallback((mentorId: number) => {
    setMentorRequests(prev => new Set([...prev, mentorId]));
  }, []);

  return (
    <AppCtx.Provider value={{
      registeredEvents, toggleEvent, isRegistered,
      enrolledCourses, toggleCourse,
      mentorRequests, addMentorRequest,
      notifications, markRead, markAllRead, unreadCount,
    }}>
      {children}
    </AppCtx.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider');
  return ctx;
}
