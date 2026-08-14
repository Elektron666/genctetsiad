// Saf biçimlendirme yardımcıları.
//
// Bunlar daha önce ekran dosyalarının içinde, üç ayrı yerde birbirinin
// kopyası olarak duruyordu (`initials` dört dosyada). Ekran bileşeninin
// içinde oldukları için de test edilemiyorlardı — oysa buradaki
// hataların çoğu tam olarak bu tür saf fonksiyonlarda çıktı:
// Türkçe küçültme, tarih taşması, vCard kaçışı.

const MONTHS_TR = [
  'OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN',
  'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK',
];

/**
 * Türkçe'ye duyarlı küçültme.
 * `'I'.toLowerCase()` → `'i'` verir; Türkçe'de doğrusu `'ı'`dır.
 * Bu yüzden "İSTANBUL" araması locale'siz küçültmeyle "İstanbul"u bulamaz.
 */
export function trLower(text: string): string {
  return (text ?? '').toLocaleLowerCase('tr-TR');
}

/** Ad soyaddan baş harfler. Boş, tek kelimeli ve çift boşluklu adlara dayanıklı. */
export function initials(name: string): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toLocaleUpperCase('tr-TR');
  return (parts[0][0] + parts[parts.length - 1][0]).toLocaleUpperCase('tr-TR');
}

/** "15 HAZİRAN" biçimi. Geçersiz tarihte boş döner, "NaN undefined" yazmaz. */
export function fmtDateTR(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.getDate()} ${MONTHS_TR[d.getMonth()]}`;
}

/**
 * vCard alan kaçışı. `;` `,` `\` ve satır sonu kaçırılmazsa kart bozulur:
 * "ORMEN, TEKSTİL" gibi bir firma adı kaydı ikiye böler.
 */
export function vcEsc(value: string): string {
  return (value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export type VCardInput = {
  name: string;
  role: string;
  firm?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  memberNo: string;
};

/**
 * vCard üretir. Bilinmeyen alanlar HİÇ yazılmaz — eskiden telefonu
 * olmayan üyenin kartına `TEL:—` ve derneğin genel adresi kişinin
 * e-postasıymış gibi gömülüyordu.
 */
export function buildVCard(m: VCardInput): string {
  const has = (v?: string | null) => !!v && v !== '—';
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${vcEsc(m.name)}`,
    ...(has(m.firm) ? [`ORG:${vcEsc(m.firm!)}`] : []),
    `TITLE:${vcEsc(`Genç TETSİAD ${m.role}`)}`,
    ...(has(m.phone) ? [`TEL;TYPE=CELL:${vcEsc(m.phone!)}`] : []),
    ...(has(m.email) ? [`EMAIL:${vcEsc(m.email!)}`] : []),
    ...(has(m.city) ? [`ADR:;;${vcEsc(m.city!)};;;Türkiye`] : []),
    `NOTE:${vcEsc(`GENÇ TETSİAD · ${m.memberNo}`)}`,
    'END:VCARD',
  ].join('\n');
}

/**
 * "GG.AA.YYYY" + "SS:DD" ayrıştırır.
 *
 * `new Date(2026, 12, 31)` HATA VERMEZ — sessizce 2027 Ocak'a taşar.
 * Yönetici "24.13.2026" yazdığında etkinlik bir yıl sonraya kayıyordu.
 * Aralıklar açıkça denetlenir ve sonuç geri okunarak taşma yakalanır.
 *
 * @returns geçerliyse Date, değilse null
 */
export function parseTRDate(dateStr: string, timeStr = ''): Date | null {
  const m = (dateStr ?? '').trim().match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (!m) return null;

  const dd = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const yy = parseInt(m[3], 10);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || yy < 2000 || yy > 2100) return null;

  const t = (timeStr ?? '').trim();
  const tm = t === '' ? null : t.match(/^(\d{1,2})[:.](\d{2})$/);
  if (t !== '' && !tm) return null;
  const hh = tm ? parseInt(tm[1], 10) : 10;
  const mi = tm ? parseInt(tm[2], 10) : 0;
  if (hh > 23 || mi > 59) return null;

  const d = new Date(yy, mm - 1, dd, hh, mi);
  if (isNaN(d.getTime())) return null;
  // 31.02 → 3 Mart'a taşar; geri okuyup yakalıyoruz
  if (d.getDate() !== dd || d.getMonth() !== mm - 1 || d.getFullYear() !== yy) return null;
  return d;
}

/** Kontenjan girdisi. "0" boş sayılmamalı — `parseInt(x) || null` bunu kaçırıyordu. */
export function parseQuota(input: string): { value: number | null; valid: boolean } {
  const t = (input ?? '').trim();
  if (t === '') return { value: null, valid: true };          // sınırsız
  if (!/^\d+$/.test(t)) return { value: null, valid: false };
  const n = parseInt(t, 10);
  if (!Number.isFinite(n) || n < 1) return { value: null, valid: false };
  return { value: n, valid: true };
}
