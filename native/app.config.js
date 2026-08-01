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
      },
      android: {
        adaptiveIcon: {
          foregroundImage: './assets/adaptive-icon.png',
          backgroundColor: '#051C11',
        },
        package: 'org.tetsiad.genc',
        versionCode: 1,
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
      // Expo Go ile test için sdkVersion; mağaza sürümünden önce
      // appVersion'a çevrilecek (docs/YAYIN-YOL-HARITASI.md)
      runtimeVersion: {
        policy: 'sdkVersion',
      },
    },
  };
};
