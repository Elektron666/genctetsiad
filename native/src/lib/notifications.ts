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
 * Expo Push API üzerinden toplu bildirim gönderir (100'lük parçalar halinde).
 * Gönderilen mesaj sayısını döner.
 */
export async function sendPushBatch(tokens: string[], title: string, body: string): Promise<number> {
  const messages = tokens
    .filter(t => typeof t === 'string' && t.startsWith('ExponentPushToken'))
    .map(to => ({ to, sound: 'default' as const, title, body, priority: 'high' as const }));

  for (let i = 0; i < messages.length; i += 100) {
    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(messages.slice(i, i + 100)),
      });
    } catch {
      // tek parça başarısız olsa da kalanları göndermeye devam et
    }
  }

  return messages.length;
}
