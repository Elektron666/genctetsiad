// ============================================================
// Supabase sorgu → şema doğrulaması
// ============================================================
// Supabase istemcisinde tablo ve sütun adları DÜZ METİNDİR:
//
//     supabase.from('profiles').select('id, full_name, company')
//
// Bu dizeleri ne TypeScript ne ESLint denetler. Bir sütunu yanlış
// yazarsanız uygulama derlenir, testler geçer, mağazaya çıkar — ve
// kullanıcı yalnızca "Bağlantı kurulamadı" görür. Hata çalışma
// zamanında, tek bir ekranda ortaya çıkar.
//
// Bu betik, kaynaktaki her sorgunun tablo ve sütunlarını migration'lardan
// üretilen gerçek şemaya karşı doğrular.
//
// Kullanım:
//   node scripts/check-schema.mjs <schema.json>
//
// schema.json, db-test iş akışında canlı veritabanından üretilir:
//   SELECT table_name, column_name FROM information_schema.columns
//   WHERE table_schema='public'
// ============================================================

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const schemaPath = process.argv[2];
if (!schemaPath) {
  console.error('Kullanım: node scripts/check-schema.mjs <schema.json>');
  process.exit(2);
}

/** @type {Record<string, string[]>} */
const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));

// Sorgularda kullanılabilen ama tabloya ait olmayan ifadeler
const SANAL = new Set(['*', 'count']);

function kaynakDosyalari(dir, out = []) {
  for (const ad of readdirSync(dir)) {
    if (ad === 'node_modules' || ad === 'dist' || ad === '__tests__' || ad === 'scripts') continue;
    const p = join(dir, ad);
    if (statSync(p).isDirectory()) kaynakDosyalari(p, out);
    else if (['.ts', '.tsx'].includes(extname(ad))) out.push(p);
  }
  return out;
}

/**
 * `.from('x')` ile AYNI zincirdeki `.select('...')` eşleştirilir.
 *
 * Arama penceresi bir SONRAKİ `.from(` çağrısında kesilmeli. İlk hâlinde
 * sabit 400 karakterlik pencere kullanılıyordu ve `.from('announcements')
 * .delete()` çağrısı, hemen ardından gelen `.from('events').select(...)`
 * ifadesini kendine ait sanıyordu — betiğin ilk çalıştırmasında beş
 * yanlış alarm bu yüzden çıktı.
 */
/**
 * Modül düzeyindeki dize sabitlerini toplar:
 *     const DIRECTORY_COLUMNS = 'id, full_name, ...';
 *
 * Bu şart: uygulamanın EN BÜYÜK sütun listesi böyle bir sabitte
 * tutuluyor ve betiğin ilk hâli yalnızca düz metin `.select('...')`
 * eşlediği için o sorguyu HİÇ denetlemiyordu. Kasten bozup denendiğinde
 * tablo hatası yakalandı ama sütun hatası sessizce geçti — en önemli
 * durumu atlayan bir denetleyici, yokluğundan daha kötüdür çünkü
 * yanlış güven verir.
 */
function sabitleriTopla(kod) {
  const harita = {};
  const re = /const\s+([A-Z][A-Z0-9_]*)\s*=\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(kod)) !== null) harita[m[1]] = m[2];
  return harita;
}

function sorgulariCikar(kod, sabitler) {
  const bulgular = [];
  const re = /\.from\(\s*'([a-z_]+)'\s*\)/g;
  const baslangiclar = [];
  let m;
  while ((m = re.exec(kod)) !== null) baslangiclar.push({ tablo: m[1], idx: m.index });

  baslangiclar.forEach(({ tablo, idx }, i) => {
    const son = i + 1 < baslangiclar.length ? baslangiclar[i + 1].idx : kod.length;
    const zincir = kod.slice(idx, son);
    const satir = kod.slice(0, idx).split('\n').length;

    const duzMetin = /\.select\(\s*'([^']*)'/.exec(zincir);
    if (duzMetin) {
      bulgular.push({ tablo, sutunlar: duzMetin[1], satir });
      return;
    }
    // .select(SABIT) — sabiti çöz
    const degisken = /\.select\(\s*([A-Z][A-Z0-9_]*)\s*[,)]/.exec(zincir);
    if (degisken) {
      const deger = sabitler[degisken[1]];
      if (deger === undefined) {
        bulgular.push({ tablo, sutunlar: null, satir, cozulemedi: degisken[1] });
      } else {
        bulgular.push({ tablo, sutunlar: deger, satir });
      }
      return;
    }
    bulgular.push({ tablo, sutunlar: null, satir });
  });
  return bulgular;
}

/** "id, full_name, event_attendees(count)" → ['id','full_name','event_attendees'] */
function sutunlariAyristir(ifade) {
  return ifade
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => {
      const gomulu = /^([a-z_]+)\s*\(/.exec(s);   // gömülü ilişki: tablo(alan)
      return gomulu ? gomulu[1] : s.replace(/\s*:.*$/, '').trim();
    })
    .filter(Boolean);
}

const hatalar = [];
let denetlenen = 0;

for (const dosya of kaynakDosyalari('src').concat(kaynakDosyalari('app'))) {
  const kod = readFileSync(dosya, 'utf8');
  const sabitler = sabitleriTopla(kod);
  for (const { tablo, sutunlar, satir, cozulemedi } of sorgulariCikar(kod, sabitler)) {
    const yer = `${dosya}:${satir}`;

    if (!schema[tablo]) {
      hatalar.push(`${yer}  bilinmeyen TABLO: '${tablo}'`);
      continue;
    }
    // Çözülemeyen bir sütun sabiti SESSİZCE atlanmamalı — denetimin
    // kör noktası tam olarak buydu.
    if (cozulemedi) {
      hatalar.push(`${yer}  sütun sabiti çözülemedi: '${cozulemedi}' — denetlenemiyor`);
      continue;
    }
    if (!sutunlar) continue;   // insert/update/delete — select yok

    for (const sutun of sutunlariAyristir(sutunlar)) {
      denetlenen++;
      if (SANAL.has(sutun)) continue;
      // Gömülü ilişki adı başka bir tablo olabilir
      if (schema[sutun]) continue;
      if (!schema[tablo].includes(sutun)) {
        hatalar.push(`${yer}  '${tablo}' tablosunda sütun yok: '${sutun}'`);
      }
    }
  }
}

if (hatalar.length > 0) {
  console.error('\n❌ Şema uyuşmazlığı — bu sorgular çalışma zamanında BAŞARISIZ olur:\n');
  for (const h of hatalar) console.error('   ' + h);
  console.error(`\n${hatalar.length} sorun bulundu.\n`);
  process.exit(1);
}

console.log(`✓ Tüm Supabase sorguları şemayla uyumlu (${denetlenen} sütun referansı denetlendi)`);
