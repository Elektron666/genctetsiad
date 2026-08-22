import {
  trLower, initials, fmtDateTR, vcEsc, buildVCard, parseTRDate, parseQuota,
  istanbulParts, fmtDateTimeTR,
} from '../format';

// Buradaki her testin arkasında gerçekten yaşanmış bir hata var.
// Denetim raporundaki madde numaraları parantez içinde.

describe('trLower — Türkçe küçültme (madde: rehber araması)', () => {
  it("'İSTANBUL' araması 'İstanbul'u bulabilmeli", () => {
    expect(trLower('İSTANBUL')).toBe('istanbul');
    expect(trLower('İstanbul')).toBe('istanbul');
  });

  it("noktasız I küçülünce 'ı' olmalı — 'i' DEĞİL", () => {
    expect(trLower('IŞIK')).toBe('ışık');
    // Kırılan davranış buydu:
    expect('IŞIK'.toLowerCase()).not.toBe('ışık');
  });

  it('boş ve null girdide patlamamalı', () => {
    expect(trLower('')).toBe('');
    expect(trLower(undefined as unknown as string)).toBe('');
  });
});

describe('initials', () => {
  it('ad soyaddan iki harf üretir', () => {
    expect(initials('Fatih Özdemir')).toBe('FÖ');
  });

  it('üç kelimede ilk ve SON kelimeyi alır', () => {
    expect(initials('Ahmet Mehmet Yılmaz')).toBe('AY');
  });

  it('tek kelimede ilk iki harfi alır', () => {
    expect(initials('Resul')).toBe('RE');
  });

  it('çift boşlukta çökmemeli', () => {
    expect(initials('Ali  Veli')).toBe('AV');
  });

  it('boş adda tire döner', () => {
    expect(initials('')).toBe('—');
    expect(initials('   ')).toBe('—');
  });

  it('Türkçe harfleri doğru büyütür', () => {
    expect(initials('irem şahin')).toBe('İŞ');
  });
});

describe('fmtDateTR', () => {
  it('Türkçe ay adıyla biçimlendirir', () => {
    expect(fmtDateTR('2026-06-15T10:00:00Z')).toMatch(/HAZİRAN/);
  });

  it('geçersiz tarihte "NaN undefined" yazmaz', () => {
    expect(fmtDateTR('bozuk')).toBe('');
    expect(fmtDateTR('')).toBe('');
  });
});

describe('vcEsc + buildVCard (madde 53: kartvizit bozulması)', () => {
  it('virgüllü firma adı kartı ikiye bölmemeli', () => {
    expect(vcEsc('ORMEN, TEKSTİL')).toBe('ORMEN\\, TEKSTİL');
  });

  it('noktalı virgül ve ters bölü kaçırılır', () => {
    expect(vcEsc('A;B')).toBe('A\\;B');
    expect(vcEsc('A\\B')).toBe('A\\\\B');
  });

  it('satır sonu kaçırılır', () => {
    expect(vcEsc('A\nB')).toBe('A\\nB');
  });

  it('telefonu olmayan üyede TEL satırı HİÇ yazılmaz', () => {
    const v = buildVCard({ name: 'Ayşe Kaya', role: 'Üye', phone: '—', memberNo: 'GT-2026-1' });
    expect(v).not.toContain('TEL');
    expect(v).not.toContain('—');
  });

  it('e-postası olmayan üyeye derneğin adresi gömülmez', () => {
    const v = buildVCard({ name: 'Ayşe Kaya', role: 'Üye', memberNo: 'GT-2026-1' });
    expect(v).not.toContain('EMAIL');
    expect(v).not.toContain('tetsiad.org');
  });

  it('dolu kart geçerli yapıda üretilir', () => {
    const v = buildVCard({
      name: 'Fatih Özdemir', role: 'Yönetim Kurulu', firm: 'ORMEN TEKSTİL',
      phone: '+90 542 000 00 00', email: 'f@ormen.com', city: 'Ankara', memberNo: 'GT-2026-00002',
    });
    expect(v.startsWith('BEGIN:VCARD')).toBe(true);
    expect(v.endsWith('END:VCARD')).toBe(true);
    expect(v).toContain('FN:Fatih Özdemir');
    expect(v).toContain('ORG:ORMEN TEKSTİL');
  });
});

describe('parseTRDate (madde 62-64: yönetici tarih taşması)', () => {
  it('geçerli tarihi ayrıştırır', () => {
    const d = parseTRDate('24.07.2026', '14:30')!;
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6);      // Temmuz
    expect(d.getDate()).toBe(24);
    expect(d.getHours()).toBe(14);
  });

  it('13. ay REDDEDİLİR — sessizce sonraki yıla kaymaz', () => {
    // new Date(2026, 12, 24) hata vermez, 2027 Ocak'a taşar
    expect(parseTRDate('24.13.2026')).toBeNull();
  });

  it('31 Şubat REDDEDİLİR — 3 Mart\'a kaymaz', () => {
    expect(parseTRDate('31.02.2026')).toBeNull();
  });

  it('artık yıl 29 Şubat kabul edilir', () => {
    expect(parseTRDate('29.02.2028')).not.toBeNull();
  });

  it('artık olmayan yılda 29 Şubat reddedilir', () => {
    expect(parseTRDate('29.02.2027')).toBeNull();
  });

  it('geçersiz saat REDDEDİLİR — sessizce 10:00 olmaz', () => {
    expect(parseTRDate('24.07.2026', '99:99')).toBeNull();
    expect(parseTRDate('24.07.2026', 'abc')).toBeNull();
  });

  it('saat boş bırakılırsa 10:00 varsayılır', () => {
    expect(parseTRDate('24.07.2026')!.getHours()).toBe(10);
  });

  it('bozuk biçimler reddedilir', () => {
    ['', '24-07-2026', '2026.07.24', '24.07.26', 'abc', '..'].forEach(v =>
      expect(parseTRDate(v)).toBeNull());
  });
});

describe('parseQuota (madde 66: "0" sınırsız oluyordu)', () => {
  it('boş girdi sınırsız demektir', () => {
    expect(parseQuota('')).toEqual({ value: null, valid: true });
  });

  it('"0" GEÇERSİZ — sınırsıza dönüşmemeli', () => {
    // Kırılan davranış: parseInt('0') || null → null → sınırsız
    expect(parseQuota('0').valid).toBe(false);
  });

  it('normal sayıyı kabul eder', () => {
    expect(parseQuota('50')).toEqual({ value: 50, valid: true });
  });

  it('sayı olmayan girdiyi reddeder', () => {
    expect(parseQuota('elli').valid).toBe(false);
    expect(parseQuota('-5').valid).toBe(false);
    expect(parseQuota('1.5').valid).toBe(false);
  });
});

describe('istanbulParts / fmtDateTimeTR — saat dilimi (madde 18)', () => {
  it('UTC saatini Türkiye saatine (+3) çevirir', () => {
    // 2026-07-24T11:00:00Z → Türkiye'de 14:00
    const p = istanbulParts('2026-07-24T11:00:00Z')!;
    expect(p.gun).toBe(24);
    expect(p.ay).toBe(7);
    expect(p.saat).toBe('14');
    expect(p.dakika).toBe('00');
  });

  it('gün sınırını doğru aşar', () => {
    // 2026-07-24T22:30:00Z → Türkiye'de 25 Temmuz 01:30
    const p = istanbulParts('2026-07-24T22:30:00Z')!;
    expect(p.gun).toBe(25);
    expect(p.saat).toBe('01');
  });

  it('yıl sınırını doğru aşar', () => {
    const p = istanbulParts('2026-12-31T22:00:00Z')!;
    expect(p.yil).toBe(2027);
    expect(p.ay).toBe(1);
    expect(p.gun).toBe(1);
  });

  it('kışın da +3 kalır — Türkiye yaz saati uygulamıyor', () => {
    const yaz = istanbulParts('2026-07-15T09:00:00Z')!;
    const kis = istanbulParts('2026-01-15T09:00:00Z')!;
    expect(yaz.saat).toBe('12');
    expect(kis.saat).toBe('12');   // DST olsaydı biri 13 olurdu
  });

  it('cihazın saat diliminden ETKİLENMEZ', () => {
    // Test ortamının TZ'si ne olursa olsun sonuç aynı olmalı
    const once = process.env.TZ;
    process.env.TZ = 'America/New_York';
    const a = istanbulParts('2026-07-24T11:00:00Z')!;
    process.env.TZ = 'Asia/Tokyo';
    const b = istanbulParts('2026-07-24T11:00:00Z')!;
    process.env.TZ = once;
    expect(a.saat).toBe(b.saat);
    expect(a.saat).toBe('14');
  });

  it('fmtDateTimeTR okunabilir biçim üretir', () => {
    expect(fmtDateTimeTR('2026-07-24T11:00:00Z')).toBe('24 TEMMUZ · 14:00');
  });

  it('geçersiz tarihte boş döner', () => {
    expect(istanbulParts('bozuk')).toBeNull();
    expect(fmtDateTimeTR('bozuk')).toBe('');
  });
});
