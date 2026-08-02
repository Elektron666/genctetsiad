// Supabase hata mesajları İNGİLİZCE gelir ve doğrudan kullanıcıya
// gösteriliyordu. Türk bir üye şunu görüyordu:
//
//   "For security purposes, you can only request this after 54 seconds."
//
// Sunucu metnine değil, hata koduna/kalıbına bakıp kendi metnimizi
// gösteriyoruz. Tanımadığımız hatalarda genel ama anlaşılır bir mesaj.

type SupabaseLikeError = { message?: string; code?: string; status?: number } | null | undefined;

export function authErrorTR(error: SupabaseLikeError): string {
  const msg = (error?.message ?? '').toLowerCase();
  const status = error?.status;

  // Gönderim sınırı — en sık görülen. Süreyi mesajdan çıkarıp gösteriyoruz.
  if (status === 429 || msg.includes('rate limit') || msg.includes('for security purposes')) {
    const secs = /after (\d+) seconds?/.exec(msg)?.[1];
    return secs
      ? `Çok fazla deneme yapıldı. ${secs} saniye sonra tekrar deneyin.`
      : 'Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar deneyin.';
  }

  if (msg.includes('email rate limit') || msg.includes('over_email_send_rate_limit')) {
    return 'E-posta gönderim sınırına ulaşıldı. Lütfen biraz sonra tekrar deneyin.';
  }
  if (msg.includes('invalid') && (msg.includes('token') || msg.includes('otp') || msg.includes('code'))) {
    return 'Kod hatalı veya süresi dolmuş. Yeni kod isteyin.';
  }
  if (msg.includes('expired')) {
    return 'Kodun süresi doldu. Yeni kod isteyin.';
  }
  if (msg.includes('invalid') && msg.includes('email')) {
    return 'E-posta adresi geçersiz görünüyor. Kontrol edip tekrar deneyin.';
  }
  if (msg.includes('signups not allowed') || msg.includes('signup is disabled')) {
    return 'Yeni kayıtlar şu anda kapalı. Dernekle iletişime geçin.';
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout')) {
    return 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.';
  }

  return 'İşlem tamamlanamadı. Lütfen biraz sonra tekrar deneyin.';
}
