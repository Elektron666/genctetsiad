const fs = require('fs');
const path = require('path');

// Firebase (FCM) yapılandırması — push bildirimleri için gerekli.
// Dosya varsa build'e bağlanır, yoksa build yine başarılı olur ve push
// sessizce devre dışı kalır. Böylece google-services.json eklendiği an
// hiçbir kod değişikliği olmadan push aktifleşir.
//
// Yerel: native/google-services.json (git'e girmez)
// EAS:   GOOGLE_SERVICES_JSON dosya secret'ı → yolu env ile gelir
function resolveGoogleServices() {
  const fromEnv = process.env.GOOGLE_SERVICES_JSON;
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;

  const local = path.join(__dirname, 'google-services.json');
  if (fs.existsSync(local)) return './google-services.json';

  return undefined;
}

module.exports = () => {
  const googleServicesFile = resolveGoogleServices();

  return {
    expo: {
      name: 'Genç TETSİAD',
      slug: 'genctetsiad',
      owner: 'elektron666',
      version: '1.0.0',
      orientation: 'portrait',
      icon: './assets/icon.png',
      userInterfaceStyle: 'dark',
      ios: {
        supportsTablet: false,
        bundleIdentifier: 'org.tetsiad.genc',
        buildNumber: '1',
        infoPlist: {
          // Bu olmadan HER TestFlight/App Store yüklemesi "ihracat
          // uyumluluğu" sorusunda takılır ve elle cevaplanana kadar
          // dağıtım başlamaz. Uygulama yalnızca standart HTTPS kullanıyor.
          ITSAppUsesNonExemptEncryption: false,
        },
      },
      android: {
        adaptiveIcon: {
          foregroundImage: './assets/adaptive-icon.png',
          backgroundColor: '#051C11',
        },
        package: 'org.tetsiad.genc',
        versionCode: 1,
        // Yalnızca gerçekten kullanılan izinler.
        // POST_NOTIFICATIONS Android 13+ (API 33) için ZORUNLU — bu izin
        // olmadan bildirim izni isteği sessizce başarısız olur ve hiçbir
        // bildirim görünmez.
        permissions: [
          'android.permission.INTERNET',
          'android.permission.VIBRATE',
          'android.permission.POST_NOTIFICATIONS',
        ],
        // Kütüphanelerin otomatik eklediği, bizim kullanmadığımız izinler.
        // SYSTEM_ALERT_WINDOW ('diğer uygulamaların üstüne çiz') React
        // Native'in geliştirme hata ekranı için gelir; Play Store bunu
        // hassas izin olarak ayrıca sorgular. Depolama izinlerine de
        // ihtiyaç yok — uygulama dosya okumuyor/yazmıyor.
        blockedPermissions: [
          'android.permission.SYSTEM_ALERT_WINDOW',
          'android.permission.READ_EXTERNAL_STORAGE',
          'android.permission.WRITE_EXTERNAL_STORAGE',
        ],
        // yalnızca dosya mevcutsa eklenir
        ...(googleServicesFile ? { googleServicesFile } : {}),
      },
      scheme: 'genctetsiad',
      plugins: [
        'expo-router',
        './gradle-config-plugin',
        // Kaynak haritası yükleme: çökme raporlarında okunabilir satır
        // numarası görünmesi için. SENTRY_AUTH_TOKEN yoksa yükleme
        // atlanır, build yine başarılı olur.
        [
          '@sentry/react-native/expo',
          {
            organization: 'elektron666',
            project: 'react-native',
          },
        ],
        [
          'expo-notifications',
          {
            color: '#D9C896',
            defaultChannel: 'default',
          },
        ],
        [
          'expo-splash-screen',
          {
            image: './assets/splash.png',
            resizeMode: 'contain',
            backgroundColor: '#051C11',
          },
        ],
        [
          'expo-build-properties',
          {
            android: {
              compileSdkVersion: 36,
              targetSdkVersion: 36,
              minSdkVersion: 24,
            },
          },
        ],
      ],
      experiments: {
        typedRoutes: true,
      },
      extra: {
        eas: {
          projectId: '83011c32-8359-4c20-8b34-8b5597ecb968',
        },
      },
      updates: {
        url: 'https://u.expo.dev/83011c32-8359-4c20-8b34-8b5597ecb968',
      },
      // Mağaza sürümü için appVersion. 'sdkVersion' olsaydı SDK 56 ile
      // derlenmiş TÜM sürümler aynı çalışma zamanını paylaşırdı: 1.0.0
      // için yayınlanan bir OTA güncellemesi 1.1.0'a da düşer ve orada
      // bulunmayan bir yerel modülü çağırıp uygulamayı çökertirdi.
      runtimeVersion: {
        policy: 'appVersion',
      },
    },
  };
};
