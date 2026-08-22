import { authErrorTR } from '../errors';

// Supabase hataları İngilizce gelir ve doğrudan kullanıcıya gösteriliyordu.
// Türk bir üye şunu görüyordu:
//   "For security purposes, you can only request this after 54 seconds."

describe('authErrorTR (madde 141)', () => {
  it('gönderim sınırındaki saniyeyi mesaja taşır', () => {
    const msg = authErrorTR({
      message: 'For security purposes, you can only request this after 54 seconds.',
    });
    expect(msg).toContain('54 saniye');
    expect(msg).not.toMatch(/[a-z]{4,} purposes/i);   // İngilizce sızmamalı
  });

  it('429 durum kodunu gönderim sınırı sayar', () => {
    expect(authErrorTR({ status: 429 }).toLocaleLowerCase('tr-TR')).toContain('çok fazla deneme');
  });

  it('geçersiz kodu anlaşılır anlatır', () => {
    expect(authErrorTR({ message: 'Invalid token' }).toLocaleLowerCase('tr-TR')).toContain('kod hatalı');
  });

  it('süresi dolmuş kodu ayırt eder', () => {
    expect(authErrorTR({ message: 'Token has expired' }).toLocaleLowerCase('tr-TR')).toContain('süresi doldu');
  });

  it('ağ hatasını bağlantı sorunu olarak anlatır', () => {
    // JS'in /i bayrağı ASCII'ye göre katlar: 'İ' (U+0130) ile 'i' eşleşmez.
    // Projede kovaladığımız hatanın aynısı — testte de tuzağa düşülüyor.
    // Türkçe'ye duyarlı küçültmeyle karşılaştırıyoruz.
    const msg = authErrorTR({ message: 'Network request failed' }).toLocaleLowerCase('tr-TR');
    expect(msg).toContain('internet bağlantı');
  });

  it('kayıt kapalıysa dernekle iletişime yönlendirir', () => {
    expect(authErrorTR({ message: 'Signups not allowed for otp' }).toLocaleLowerCase('tr-TR')).toContain('kapalı');
  });

  it('tanımadığı hatada bile Türkçe ve anlaşılır kalır', () => {
    const msg = authErrorTR({ message: 'some unexpected backend failure xyz' });
    expect(msg.toLocaleLowerCase('tr-TR')).toContain('tamamlanamadı');
    expect(msg).not.toContain('xyz');     // ham sunucu metni sızmamalı
  });

  it('null/undefined hatada çökmez', () => {
    expect(typeof authErrorTR(null)).toBe('string');
    expect(typeof authErrorTR(undefined)).toBe('string');
    expect(typeof authErrorTR({})).toBe('string');
  });
});
