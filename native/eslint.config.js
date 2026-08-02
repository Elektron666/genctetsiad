// Depoda ESLint yapılandırması HİÇ YOKTU. On beş dosyadaki
// `eslint-disable-next-line` yorumları, çalışmayan bir aracı
// susturuyordu — yani hiçbir kural uygulanmıyordu.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'android/*', 'ios/*', '.expo/*', 'node_modules/*'],
  },
  {
    // Supabase istemcisi üretilmiş tiplerle tam eşleşmediği için birkaç
    // yerde bilinçli `as any` var; bunlar satır satır gerekçelendirilmiş.
    // Uyarı seviyesinde tutuluyor ki CI kırılmasın ama görünür olsun.
    rules: {
      'react-hooks/exhaustive-deps': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': 'off',
      // React Compiler kaynaklı deneysel kurallar: gerçek uyarılar ama
      // hepsini kapatmak geniş bir yeniden yazım gerektirir. CI'yi
      // kırmasınlar diye uyarı, gözden kaçmasınlar diye açık.
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/use-memo': 'warn',
      // Türkçe metinlerde kesme işareti ve tırnak doğal olarak geçer.
      'react/no-unescaped-entities': 'off',
    },
  },
  {
    // Yapılandırma dosyaları Node ortamında çalışır.
    files: ['*.config.js', 'gradle-config-plugin.js', 'eslint.config.js'],
    languageOptions: { globals: { __dirname: 'readonly', module: 'writable', require: 'readonly', process: 'readonly' } },
  },
]);
