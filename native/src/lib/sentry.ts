import * as Sentry from '@sentry/react-native';

// ============================================================
// Çökme takibi — KVKK'ya dikkat ederek yapılandırıldı
// ============================================================
// Sentry raporları AB (Almanya) sunucularına gider — DSN 'ingest.de'
// bölgesine işaret ediyor. Yine de kişisel veri göndermeyecek şekilde
// kısıtlandı:
//   • sendDefaultPii: false  → IP adresi, cihaz kimliği gönderilmez
//   • Sentry.setUser hiç çağrılmaz → kullanıcı kimliği eşlenmez
//   • beforeBreadcrumb → kullanıcının yazdığı metinler (arama, form,
//     mesaj) izlerden temizlenir
//
// Gönderilen: hata mesajı, kod satırı, telefon modeli, Android sürümü,
// uygulama sürümü. Yani "kim" değil, "ne kırıldı" bilgisi.
//
// DSN yoksa Sentry hiç başlatılmaz — uygulama normal çalışır.
// DSN gizli değildir (istemciye gömülür), yalnızca rapor gönderme adresidir.

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

export const isSentryEnabled = DSN.length > 0;

export function initSentry() {
  if (!isSentryEnabled) return;

  Sentry.init({
    dsn: DSN,

    // KVKK: kişisel veri gönderme
    sendDefaultPii: false,

    // Yayın sürümünde performans örneklemesi kapalı (gereksiz veri trafiği)
    tracesSampleRate: 0,

    // Geliştirme sırasında konsola da yaz, sunucuya gönderme
    enabled: !__DEV__,

    beforeBreadcrumb(breadcrumb) {
      // Kullanıcının yazdığı metinleri izlerden çıkar
      if (breadcrumb.category === 'ui.input' || breadcrumb.category === 'console') {
        return null;
      }
      return breadcrumb;
    },

    beforeSend(event) {
      // Ek güvence: kullanıcı bloğu varsa temizle
      if (event.user) delete event.user;
      if (event.request?.headers) delete event.request.headers;
      return event;
    },
  });
}
