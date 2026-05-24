import React, { createContext, useContext, useState, useCallback } from 'react';

type Notification = {
  id: number;
  category: 'DUYURU' | 'ETKİNLİK' | 'SİSTEM';
  title: string;
  body: string;
  date: string;
  read: boolean;
};

type AppState = {
  // Events
  registeredEvents: Set<number>;
  toggleEvent: (eventId: number) => void;
  isRegistered: (eventId: number) => boolean;

  // Courses
  enrolledCourses: Set<number>;
  toggleCourse: (courseId: number) => void;

  // Mentorship
  mentorRequests: Set<number>;
  addMentorRequest: (mentorId: number) => void;

  // Notifications
  notifications: Notification[];
  markRead: (id: number) => void;
  markAllRead: () => void;
  unreadCount: number;
};

const DEFAULT_NOTIFICATIONS: Notification[] = [
  { id: 1, category: 'SİSTEM',    title: 'Üyeliğiniz onaylandı',                  body: 'Genç TETSİAD üyeliğiniz aktif edildi. Hoş geldiniz!',         date: '18 MAYIS', read: false },
  { id: 2, category: 'ETKİNLİK', title: 'HOMETEX 2026 yaklaşıyor',                body: "Kayıtlı olduğunuz HOMETEX etkinliği 14 Mayıs'ta başlıyor.",   date: '12 MAYIS', read: false },
  { id: 3, category: 'DUYURU',   title: 'Yeni kurs eklendi',                      body: 'AB Direktifleri & Uyum kursu eğitim kataloğuna eklendi.',     date: '10 MAYIS', read: true },
  { id: 4, category: 'SİSTEM',   title: 'Bağlantı isteği',                        body: 'Fatih Özdemir bağlantı isteği gönderdi.',                     date: '8 MAYIS',  read: false },
  { id: 5, category: 'ETKİNLİK', title: 'Yönetim Kurulu Toplantısı hatırlatıcı', body: '18 Haziran toplantısına 10 gün kaldı.',                       date: '8 HAZİRAN', read: true },
  { id: 6, category: 'DUYURU',   title: '3T Programı başvuruları açıldı',         body: "Türkiye Tekstil Temsilcileri programına başvurular 30 Mayıs'a kadar.", date: '1 MAYIS', read: true },
];

const AppCtx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [registeredEvents, setRegisteredEvents] = useState<Set<number>>(() => new Set([2, 5]));
  const [enrolledCourses, setEnrolledCourses] = useState<Set<number>>(() => new Set([1, 2, 4, 6]));
  const [mentorRequests, setMentorRequests] = useState<Set<number>>(new Set());
  const [notifications, setNotifications] = useState<Notification[]>(DEFAULT_NOTIFICATIONS);

  const toggleEvent = useCallback((id: number) => {
    setRegisteredEvents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const isRegistered = useCallback(
    (id: number) => registeredEvents.has(id),
    [registeredEvents]
  );

  const toggleCourse = useCallback((id: number) => {
    setEnrolledCourses(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const addMentorRequest = useCallback((mentorId: number) => {
    setMentorRequests(prev => new Set([...prev, mentorId]));
  }, []);

  const markRead = useCallback((id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

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
