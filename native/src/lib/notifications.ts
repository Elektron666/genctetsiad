import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

const EXPO_PROJECT_ID = '83011c32-8359-4c20-8b34-8b5597ecb968';

// Expo Go'da uzaktan push desteklenmez (SDK 53+). Uygulama orada da
// sorunsuz açılsın diye bildirim kurulumunu tamamen atlıyoruz.
const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Uygulama ön plandayken de bildirimi göster
if (!IS_EXPO_GO) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    // bildirim modülü yoksa sessizce geç
  }
}

/**
 * Cihazdan Expo push token'ı alır (izin ister, Android kanalını kurar).
 * Expo Go'da, emülatörde, izin reddedilirse veya FCM yapılandırması yoksa
 * null döner — app asla bu yüzden çökmez, push sessizce devre dışı kalır.
 */
export async function registerPushToken(): Promise<string | null> {
  if (IS_EXPO_GO || !Device.isDevice) return null;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Genç TETSİAD',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#D9C896',
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return null;

    const token = await Notifications.getExpoPushTokenAsync({ projectId: EXPO_PROJECT_ID });
    return token.data;
  } catch {
    // İzin akışı veya FCM credential'ları hazır değilse buraya düşer —
    // push sessizce devre dışı kalır, uygulama normal çalışmaya devam eder.
    return null;
  }
}

/**
 * Bildirime dokunulduğunda ilgili ekrana götürür. Daha önce bildirime
 * dokunmak hiçbir şey yapmıyordu — kullanıcı ana ekranda kalıyor ve
 * bildirimin konusunu kendisi aramak zorunda kalıyordu.
 */
function routeFor(content: { title?: string | null; data?: Record<string, unknown> }): string {
  // Öncelik `data.screen`: başlık metnine bakmak kırılgandı — yönetici
  // "Yeni Etkinlik" yerine "Etkinlik Duyurusu" yazınca yönlendirme
  // sessizce bozuluyordu.
  const screen = content.data?.screen;
  if (typeof screen === 'string' && screen.startsWith('/')) return screen;

  const title = String(content.title ?? '');
  if (title.includes('Etkinlik')) return '/(tabs)/calendar';
  if (title.includes('Bülten')) return '/(tabs)/academy';
  if (title.includes('Onayland')) return '/(tabs)/profile';
  return '/(tabs)';
}

export function attachNotificationTapHandler(navigate: (path: string) => void) {
  if (IS_EXPO_GO) return () => {};
  try {
    // Uygulama KAPALIYKEN bildirime dokunulursa dinleyici henüz
    // bağlanmamış olur ve yönlendirme tamamen kaybolurdu.
    Notifications.getLastNotificationResponseAsync()
      .then(res => { if (res) navigate(routeFor(res.notification.request.content)); })
      .catch(() => {});

    const sub = Notifications.addNotificationResponseReceivedListener(res => {
      navigate(routeFor(res.notification.request.content));
    });
    return () => sub.remove();
  } catch {
    return () => {};
  }
}

/**
 * Expo Push API üzerinden toplu bildirim gönderir (100'lük parçalar halinde).
 * Gönderilen mesaj sayısını döner.
 */
export async function sendPushBatch(
  tokens: string[],
  title: string,
  body: string,
  screen?: string,
): Promise<{ sent: number; dead: string[] }> {
  const valid = tokens.filter(t => typeof t === 'string' && t.startsWith('ExponentPushToken'));
  const messages = valid.map(to => ({
    to, sound: 'default' as const, title, body, priority: 'high' as const,
    ...(screen ? { data: { screen } } : {}),
  }));

  let sent = 0;
  const dead: string[] = [];

  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(chunk),
      });
      // Yanıt hiç okunmuyordu: her istek "gönderildi" sayılıyor,
      // silinmiş uygulamaların token'ları da başarılı görünüyordu.
      // Expo her mesaj için ayrı bir bilet döner.
      const json = await res.json().catch(() => null) as { data?: { status: string; details?: { error?: string } }[] } | null;
      const tickets = json?.data ?? [];
      chunk.forEach((m, k) => {
        const t = tickets[k];
        if (!t) { sent += 1; return; }                  // bilet yoksa iyimser say
        if (t.status === 'ok') { sent += 1; return; }
        if (t.details?.error === 'DeviceNotRegistered') dead.push(m.to);
      });
    } catch {
      // tek parça başarısız olsa da kalanları göndermeye devam et
    }
  }

  return { sent, dead };
}
