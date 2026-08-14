import { normalizePhone, isValidTRMobile } from '../useAuth';

// Telefon doğrulaması hiç yoktu: boş girdi "+90" üretiyor,
// 15 haneli bir sayı da kabul ediliyordu (madde 144-145).

describe('normalizePhone', () => {
  it.each([
    ['0532 123 45 67',   '+905321234567'],
    ['5321234567',       '+905321234567'],
    ['+90 532 123 45 67','+905321234567'],
    ['90 532 123 45 67', '+905321234567'],
    ['0(532)123-45-67',  '+905321234567'],
  ])('%s → %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });
});

describe('isValidTRMobile', () => {
  it('geçerli cep numaralarını kabul eder', () => {
    ['0532 123 45 67', '+905321234567', '5051234567', '0543 000 00 00']
      .forEach(v => expect(isValidTRMobile(v)).toBe(true));
  });

  it('boş girdiyi reddeder — eskiden "+90" üretiliyordu', () => {
    expect(isValidTRMobile('')).toBe(false);
    expect(isValidTRMobile('   ')).toBe(false);
  });

  it('kısa numarayı reddeder', () => {
    expect(isValidTRMobile('532123')).toBe(false);
  });

  it('15 haneli numarayı reddeder — eskiden geçiyordu', () => {
    expect(isValidTRMobile('532123456789012')).toBe(false);
  });

  it('5 ile başlamayanı reddeder (sabit hat cep değildir)', () => {
    expect(isValidTRMobile('2122920404')).toBe(false);
    expect(isValidTRMobile('0212 292 04 04')).toBe(false);
  });

  it('harf içeren girdiyi reddeder', () => {
    expect(isValidTRMobile('telefon yok')).toBe(false);
  });
});
