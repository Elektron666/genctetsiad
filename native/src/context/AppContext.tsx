import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/context/AuthContext';
import { registerPushToken } from '@/lib/notifications';

type Notification = {
  id: number | string;   // number: demo verisi, string ("sb-<uuid>"): Supabase duyurusu
  category: 'DUYURU' | 'ETKİNLİK' | 'SİSTEM';
  title: string;
  body: string;
  date: string;
  read: boolean;
};

type Banner = { label: string; text: string };

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
  markRead: (id: number | string) => void;
  markAllRead: () => void;
  unreadCount: number;

  // Announcements (Supabase'den; yoksa null → ekran fallback kullanır)
  announcementBanner: Banner | null;
};

// Demo bildirimleri YAYINDA GÖSTERİLMEZ. Daha önce Supabase'den kayıt
// gelmediğinde (derneğin henüz duyuru yayınlamadığı ilk gün) her üye
// bu uydurma listeyi görüyordu — "Üyeliğiniz onaylandı", "Fatih Özdemir
// bağlantı isteği gönderdi" gibi hiç yaşanmamış olaylar dahil.
const DEMO_NOTIFICATIONS: Notification[] = [
  { id: 1, category: 'ETKİNLİK', title: 'Fabrika ziyareti kayıtları açıldı',      body: '24 Temmuz İstanbul Fabrika Ziyareti için kontenjan sınırlı, takvimden yerinizi ayırtın.', date: '15 HAZİRAN', read: false },
  { id: 2, category: 'DUYURU',   title: '3T Programı başvuruları açıldı',         body: "Türkiye Tekstil Temsilcileri programına başvurular 15 Eylül'e kadar.", date: '12 HAZİRAN', read: false },
  { id: 3, category: 'DUYURU',   title: 'Yeni kurs eklendi',                      body: 'AB Direktifleri & Uyum kursu eğitim kataloğuna eklendi.',     date: '10 HAZİRAN', read: true },
  { id: 4, category: 'SİSTEM',   title: 'Bağlantı isteği',                        body: 'Fatih Özdemir bağlantı isteği gönderdi.',                     date: '8 HAZİRAN',  read: false },
  { id: 5, category: 'ETKİNLİK', title: 'HOMETEX 2026 fotoğrafları yayında',      body: 'Mayıs ayındaki fuar çalışmasının kareleri paylaşıldı.',       date: '2 HAZİRAN', read: true },
  { id: 6, category: 'SİSTEM',   title: 'Üyeliğiniz onaylandı',                   body: 'Genç TETSİAD üyeliğiniz aktif edildi. Hoş geldiniz!',         date: '18 MAYIS', read: true },
];

const DEFAULT_NOTIFICATIONS: Notification[] = __DEV__ ? DEMO_NOTIFICATIONS : [];

const MONTHS_TR = ['OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN', 'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'];

function fmtDateTR(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_TR[d.getMonth()] ?? ''}`;
}

const AppCtx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { status, session } = useAuthContext();
  // Demo kayıtları yalnızca geliştirme/sunumda; yayında kullanıcı
  // hiç yapmadığı kayıtları kendi geçmişi gibi görmemeli.
  const [registeredEvents, setRegisteredEvents] = useState<Set<number>>(() => __DEV__ ? new Set([2, 5]) : new Set());
  const [enrolledCourses, setEnrolledCourses] = useState<Set<number>>(() => __DEV__ ? new Set([1, 2, 4, 6]) : new Set());
  const [mentorRequests, setMentorRequests] = useState<Set<number>>(new Set());
  const [notifications, setNotifications] = useState<Notification[]>(DEFAULT_NOTIFICATIONS);
  const [announcementBanner, setAnnouncementBanner] = useState<Banner | null>(null);

  // Oturum açılınca cihazın push token'ını al ve DB'ye kaydet —
  // admin duyuru yayınladığında bu token'lara bildirim gider.
  useEffect(() => {
    if (status !== 'authenticated' && status !== 'pending') return;
    if (!session?.user) return;
    (async () => {
      const token = await registerPushToken();
      if (!token) return;
      // Token kaydı "elinden geldiğince" bir işlemdir: başarısız olursa
      // yalnızca push bildirimi çalışmaz, kullanıcı akışı etkilenmez.
      // Bu yüzden hata bilinçli olarak sessiz geçilir.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('push_tokens')
        .upsert({ user_id: session.user.id, token, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    })();
  }, [status, session?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Oturum açılınca gerçek duyuruları çek; demo bildirimlerin yerini alır.
  // RLS gereği anonim (demo mod) kullanıcı duyuru okuyamaz → fallback devrede kalır.
  useEffect(() => {
    if (status !== 'authenticated' && status !== 'pending') return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(20);
      if (cancelled) return;
      // Ağ hatasında elimizdeki listeyi koru; başarılı ama boş yanıtta
      // listeyi GERÇEKTEN boşalt (yayında demo verisi asılı kalmasın).
      if (error) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = (data ?? []) as any[];
      if (rows.length === 0) {
        setNotifications(DEFAULT_NOTIFICATIONS);
        setAnnouncementBanner(null);
        return;
      }

      const catOf = (t: string): Notification['category'] =>
        t === 'event' ? 'ETKİNLİK' : t === 'system' ? 'SİSTEM' : 'DUYURU';

      setNotifications(rows.map((a) => ({
        id: `sb-${a.id}`,
        category: catOf(a.type),
        title: a.title,
        body: a.body,
        date: fmtDateTR(a.published_at),
        read: false,
      })));
      setAnnouncementBanner({ label: 'DUYURU', text: rows[0].body });
    })();
    return () => { cancelled = true; };
  }, [status]);

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

  const markRead = useCallback((id: number | string) => {
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
      announcementBanner,
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
