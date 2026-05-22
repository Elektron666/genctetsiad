/* screen-sustainability.jsx — Sürdürülebilirlik & AB Fırsatları */

function SustainabilityScreen({ onBellClick }) {

  const euRegs = [
    {
      code: 'AB-01',
      title: 'CBAM',
      subtitle: 'Karbon Sınır Vergisi',
      desc: '2026\'dan itibaren yüksek karbonlu tekstil ithalatına AB sınırında ek vergi.',
    },
    {
      code: 'AB-02',
      title: 'AB Tekstil Stratejisi 2030',
      subtitle: 'Üretici Sorumluluğu',
      desc: 'Üretici sorumluluğu, geri dönüşüm zorunluluğu, çevresel beyan standartları.',
    },
    {
      code: 'AB-03',
      title: 'EUDR',
      subtitle: 'Orman Koruma Yasası',
      desc: 'Orman koruma yasası — tedarik zinciri izlenebilirliği zorunlu, 2025 yürürlükte.',
    },
    {
      code: 'AB-04',
      title: 'Ecodesign Yönetmeliği',
      subtitle: 'Çevresel Tasarım',
      desc: 'Çevresel tasarım şartları — dayanıklılık, tamir edilebilirlik, dijital pasaport.',
    },
  ];

  const chinaRisks = [
    'Yüksek lojistik karbon ayakizi (30+ gün deniz taşımacılığı)',
    'CBAM\'dan en yüksek etkilenecek kaynak ülke',
    'Zorla çalıştırma riskleri (AB ithalat yasağı)',
    'Tedarik zinciri kırılganlığı (COVID sonrası)',
    '%8,5 tekstil kota sınırlamaları',
  ];

  const turkeyAdvantages = [
    '3–4 günlük nakliye (Avrupa\'ya)',
    'GOTS / Oeko-Tex / REACH uyum kapasitesi',
    'AB Gümrük Birliği avantajı',
    'Düşük lojistik karbon ayakizi',
    'Kültürel ve kalite uyumu',
  ];

  const opportunityStats = [
    { code: 'ST-01', value: '%8–10', label: 'Çin\'in beklenen pazar kaybı', sub: '2025–2030 dönemi tahmini' },
    { code: 'ST-02', value: '4,2 Mr €', label: 'Yıllık boşalacak değer', sub: 'Yıllık AB ithalat hacmi farkı' },
    { code: 'ST-03', value: '%2,5', label: 'Türkiye\'nin hedef payı', sub: 'Yaklaşık 1 milyar € ek ihracat' },
    { code: 'ST-04', value: '+%12', label: 'AB sürdürülebilir tekstil büyümesi', sub: 'Yıllık harcama artış oranı' },
  ];

  const actionSteps = [
    {
      num: '01',
      title: 'Sertifikasyon',
      desc: 'GOTS ve Oeko-Tex sertifikalarını 2027\'ye kadar 200 üye firmada zorunlu hale getirmek.',
    },
    {
      num: '02',
      title: 'Tedarik Zinciri İzlenebilirliği',
      desc: 'Dijital pasaport altyapısı için pilot proje — 2026 TBA programında hayata geçirilecek.',
    },
    {
      num: '03',
      title: 'Karbon Ölçümü',
      desc: 'Üye firmalar için ücretsiz karbon ayakizi hesaplama aracı geliştirmek ve yaymak.',
    },
    {
      num: '04',
      title: 'AB Alıcı Bağlantıları',
      desc: 'Avrupa tekstil alıcılarıyla Türkiye sürdürülebilirlik şovrumuzu düzenlemek.',
    },
    {
      num: '05',
      title: 'Standart Geliştirme',
      desc: 'Türk ev tekstili için "Genç TETSİAD Yeşil Standartları" belgesi hazırlamak.',
    },
  ];

  return (
    <div className="screen phone-scroll no-scrollbar" style={{ paddingBottom: 100 }}>

      {/* ── SECTION 1: HERO ─────────────────────────────────── */}
      <AppHeader
        section="YEŞİL"
        title={<>Sürdürülebilir <em style={{ fontStyle: 'italic' }}>tekstil.</em></>}
        count={ANNOUNCEMENTS.length}
        onBellClick={onBellClick}
      />

      <div style={{ position: 'relative' }}>
        <ImageSlot
          id="gt-sust-hero"
          height={220}
          label="Yeşil Tekstil — Fabrika"
          src="https://picsum.photos/seed/gt-green-factory/800/600"
        />
        {/* Gradient overlay with label */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, transparent 40%, rgba(7,51,35,0.88))',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: '0 24px 18px', pointerEvents: 'none',
        }}>
          <div className="lbl" style={{ fontSize: 8, color: 'var(--gold)' }}>
            YEŞİL DÖNÜŞÜM · 2026
          </div>
        </div>
      </div>

      {/* ── SECTION 2: LEAD TEXT ────────────────────────────── */}
      <section style={{ padding: '36px 24px 0' }}>
        <div style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 18,
          lineHeight: 1.6,
          color: 'var(--ivory)',
        }}>
          "Avrupa'nın yeşil kuralları artık birer seçenek değil, pazar erişim şartı. Türkiye ev tekstili sektörü için bu dönüşüm büyük bir tehdit değil — doğru oynandığında tarihin en büyük fırsatı."
        </div>
        <div style={{
          marginTop: 14,
          height: '0.5px',
          background: 'var(--gold-line)',
        }} />
      </section>

      {/* ── SECTION 3: NEDEN ŞİMDİ — AB DÜZENLEMELERİ ─────── */}
      <section style={{ borderTop: '0.5px solid var(--gold-line)', padding: '36px 24px 0' }}>
        <SectionLabel num={1}>NEDEN ŞİMDİ? · AB DÜZENLEMELERİ</SectionLabel>
        <div style={{
          marginTop: 18,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
        }}>
          {euRegs.map(reg => (
            <div key={reg.code} style={{
              border: '0.5px solid var(--gold-line)',
              padding: '14px',
              background: 'rgba(217,200,150,0.04)',
            }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 8,
                color: 'var(--gold)',
                letterSpacing: 1.5,
                marginBottom: 8,
              }}>{reg.code}</div>
              <div style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--ivory)',
                lineHeight: 1.15,
                marginBottom: 3,
              }}>{reg.title}</div>
              <div style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontStyle: 'italic',
                fontSize: 12,
                color: 'var(--gold)',
                lineHeight: 1.2,
                marginBottom: 8,
              }}>{reg.subtitle}</div>
              <div style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 10,
                color: 'var(--text-muted)',
                lineHeight: 1.5,
                fontWeight: 300,
              }}>{reg.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 4: TÜRKİYE vs ÇİN ─────────────────────── */}
      <section style={{ borderTop: '0.5px solid var(--gold-line)', padding: '36px 24px 0' }}>
        <SectionLabel num={2}>TÜRKİYE vs ÇİN · REKABETÇİ ANALİZ</SectionLabel>
        <div style={{
          marginTop: 18,
          display: 'grid',
          gridTemplateColumns: '1fr 0px 1fr',
          gap: 0,
          border: '0.5px solid var(--gold-line)',
          background: 'rgba(217,200,150,0.03)',
        }}>
          {/* China column */}
          <div style={{ padding: '18px 16px' }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 8,
              color: 'var(--text-muted)',
              letterSpacing: 1.5,
              marginBottom: 10,
            }}>ÇİN · RİSKLER</div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontStyle: 'italic',
              fontSize: 20,
              color: 'var(--ivory)',
              lineHeight: 1,
              marginBottom: 14,
              opacity: 0.7,
            }}>Çin</div>
            {chinaRisks.map((r, i) => (
              <div key={i} style={{
                display: 'flex', gap: 8, alignItems: 'flex-start',
                marginBottom: 10,
              }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 8,
                  color: 'rgba(217,200,150,0.4)',
                  letterSpacing: 1,
                  paddingTop: 2,
                  flexShrink: 0,
                }}>✕</span>
                <div style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  lineHeight: 1.45,
                  fontWeight: 300,
                }}>{r}</div>
              </div>
            ))}
          </div>

          {/* Gold divider */}
          <div style={{ width: '0.5px', background: 'var(--gold)', margin: '16px 0' }} />

          {/* Turkey column */}
          <div style={{ padding: '18px 16px' }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 8,
              color: 'var(--gold)',
              letterSpacing: 1.5,
              marginBottom: 10,
            }}>TÜRKİYE · AVANTAJLAR</div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontStyle: 'italic',
              fontSize: 20,
              color: 'var(--gold)',
              lineHeight: 1,
              marginBottom: 14,
            }}>Türkiye</div>
            {turkeyAdvantages.map((a, i) => (
              <div key={i} style={{
                display: 'flex', gap: 8, alignItems: 'flex-start',
                marginBottom: 10,
              }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 8,
                  color: 'var(--gold)',
                  letterSpacing: 1,
                  paddingTop: 2,
                  flexShrink: 0,
                }}>✓</span>
                <div style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: 10,
                  color: 'var(--ivory)',
                  lineHeight: 1.45,
                  fontWeight: 300,
                }}>{a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: FIRSAT HARİTASI ──────────────────────── */}
      <section style={{ borderTop: '0.5px solid var(--gold-line)', padding: '36px 24px 0' }}>
        <SectionLabel num={3}>FIRSAT HARİTASI · 2030 PROJEKSİYONU</SectionLabel>
        <div style={{
          marginTop: 18,
          background: 'var(--navy-deep)',
          border: '0.5px solid var(--gold-line)',
          padding: '0',
        }}>
          {opportunityStats.map((s, i) => (
            <div key={s.code} style={{
              padding: '18px 18px',
              borderTop: i === 0 ? 'none' : '0.5px solid var(--gold-line)',
              display: 'grid',
              gridTemplateColumns: '40px 1fr auto',
              gap: 14,
              alignItems: 'center',
            }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 8,
                color: 'var(--text-muted)',
                letterSpacing: 1.5,
              }}>{s.code}</div>
              <div>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: 13,
                  color: 'var(--ivory)',
                  lineHeight: 1.2,
                  fontWeight: 500,
                  marginBottom: 4,
                }}>{s.label}</div>
                <div style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: 9,
                  color: 'var(--text-muted)',
                  lineHeight: 1.3,
                  fontWeight: 300,
                }}>{s.sub}</div>
              </div>
              <div style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontStyle: 'italic',
                fontSize: 24,
                color: 'var(--gold)',
                fontWeight: 300,
                lineHeight: 1,
                whiteSpace: 'nowrap',
                textAlign: 'right',
              }}>{s.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 6: EYLEM PLANI ──────────────────────────── */}
      <section style={{ borderTop: '0.5px solid var(--gold-line)', padding: '36px 24px 0' }}>
        <SectionLabel num={4}>NASIL YAPACAĞIZ? · EYLEM PLANI</SectionLabel>
        <div style={{ marginTop: 18 }}>
          {actionSteps.map((step, i) => (
            <div key={step.num} style={{
              display: 'grid',
              gridTemplateColumns: '36px 1fr',
              gap: 16,
              padding: '18px 0',
              borderTop: i === 0 ? 'none' : '0.5px solid var(--gold-line)',
            }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                color: 'var(--gold)',
                letterSpacing: 1,
                paddingTop: 2,
                flexShrink: 0,
              }}>{step.num}</div>
              <div>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: 17,
                  color: 'var(--ivory)',
                  lineHeight: 1.2,
                  fontWeight: 500,
                  marginBottom: 6,
                }}>{step.title}</div>
                <div style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  lineHeight: 1.55,
                  fontWeight: 300,
                }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 7: PULL QUOTE ───────────────────────────── */}
      <section style={{ borderTop: '0.5px solid var(--gold-line)', padding: '48px 24px 0' }}>
        <div style={{
          width: 40,
          height: '0.5px',
          background: 'var(--gold)',
          marginBottom: 20,
        }} />
        <div style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: 26,
          color: 'var(--ivory)',
          lineHeight: 1.25,
        }}>
          "Çin'in yarattığı boşluğu doldurmak için Türkiye'nin elinde{' '}
          <span style={{ color: 'var(--gold)' }}>her şey var.</span>{' '}
          Eksik olan: hız ve koordinasyon."
        </div>
        <div className="byline" style={{ marginTop: 18 }}>
          GENÇ TETSİAD SÜRDÜRÜLEBİLİRLİK KOMİSYONU · 2026
        </div>
      </section>

      {/* ── SECTION 8: KAYNAKLAR & EYLEM ───────────────────── */}
      <section style={{ borderTop: '0.5px solid var(--gold-line)', padding: '36px 24px 40px' }}>
        <SectionLabel num={5}>KAYNAKLAR & EYLEM</SectionLabel>
        <div style={{ marginTop: 22 }}>
          <div style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 11,
            color: 'var(--text-muted)',
            lineHeight: 1.65,
            fontWeight: 300,
            marginBottom: 24,
          }}>
            Sertifikasyon süreçleri, AB düzenlemeleri hakkında rehberi indirin veya Genç TETSİAD'ın sürdürülebilirlik imza kampanyasına katılın.
          </div>
          <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
            <button className="btn btn-outline" style={{ width: '100%', textAlign: 'center' }}>
              SERTİFİKASYON REHBERİ →
            </button>
            <button className="btn btn-fill" style={{ width: '100%', textAlign: 'center' }}>
              İMZA KAMPANYASIna KATIL
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}

window.SustainabilityScreen = SustainabilityScreen;
