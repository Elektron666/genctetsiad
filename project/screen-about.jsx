/* screen-about.jsx — Hakkımızda & İletişim */

function AboutScreen({ onBellClick }) {
  const commissionLeads = [
    { initials: 'EY', name: 'Elif Yıldız',  role: 'İhracat & Sürdürülebilirlik' },
    { initials: 'CO', name: 'Can Oktay',    role: 'Eğitim & Mentorluk' },
    { initials: 'BÇ', name: 'Berk Çelik',  role: 'Ar-Ge & İnovasyon' },
    { initials: 'ZA', name: 'Zeynep Aydın', role: 'Tasarım & Moda' },
    { initials: 'LA', name: 'Leyla Arslan', role: 'Dijital Dönüşüm' },
    { initials: 'MK', name: 'Mert Kaya',   role: 'Fuar & Etkinlik' },
  ];

  const socials = [
    { label: 'INSTAGRAM',  handle: ABOUT.social.instagram },
    { label: 'TWITTER / X', handle: ABOUT.social.twitter },
    { label: 'LİNKEDİN',  handle: ABOUT.social.linkedin },
    { label: 'FACEBOOK',   handle: ABOUT.social.facebook },
  ];

  const contacts = [
    { label: 'TELEFON', value: ABOUT.phone },
    { label: 'E-POSTA', value: ABOUT.email },
    { label: 'ADRES',   value: ABOUT.address },
    { label: 'WEB',     value: ABOUT.website },
  ];

  return (
    <div className="screen phone-scroll no-scrollbar" style={{ paddingBottom: 100 }}>
      <AppHeader section="HAKKIMIZDA"
        title={<>Genç <em style={{ fontStyle: 'italic' }}>TETSİAD.</em></>}
        count={ANNOUNCEMENTS.length} onBellClick={onBellClick} />

      {/* Hero card */}
      <div className="weave" style={{
        padding: '28px 24px 32px',
        background: 'linear-gradient(180deg, var(--navy), var(--navy-deep))',
        borderBottom: '0.5px solid var(--gold-line)',
        textAlign: 'center',
      }}>
        <TetsiadLogo size={52} color="var(--gold)" subtitle={true} />
        <div style={{
          marginTop: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12,
          color: 'var(--text-muted)', lineHeight: 1.7, fontWeight: 300,
        }}>{ABOUT.desc}</div>

        {/* Stats */}
        <div style={{
          marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 0, borderTop: '0.5px solid var(--gold-line)', paddingTop: 20,
        }}>
          {[
            [ABOUT.members.toLocaleString('tr-TR') + '+', 'ÜYE'],
            [ABOUT.cities, 'İL'],
            [ABOUT.countries, 'ÜLKE'],
          ].map(([n, l], i) => (
            <div key={i} style={{ textAlign: 'center', borderRight: i < 2 ? '0.5px solid var(--gold-line)' : '' }}>
              <div style={{
                fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                fontSize: 30, color: 'var(--gold)', fontWeight: 300, lineHeight: 1,
              }}>{n}</div>
              <div className="byline" style={{ marginTop: 6 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Vision & Mission */}
      <section style={{ padding: '24px 24px 28px', borderBottom: '0.5px solid var(--gold-line)' }}>
        <div className="lbl" style={{ marginBottom: 18 }}>VİZYON & MİSYON</div>
        <div style={{ marginBottom: 18 }}>
          <div className="byline" style={{ marginBottom: 8, color: 'var(--gold)' }}>VİZYON</div>
          <div style={{
            fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
            fontSize: 16, color: 'var(--ivory)', lineHeight: 1.5, fontWeight: 300,
          }}>{ABOUT.vision}</div>
        </div>
        <div style={{ height: '0.5px', background: 'var(--gold-line)', margin: '18px 0' }} />
        <div>
          <div className="byline" style={{ marginBottom: 8, color: 'var(--gold)' }}>MİSYON</div>
          <div style={{
            fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
            fontSize: 16, color: 'var(--ivory)', lineHeight: 1.5, fontWeight: 300,
          }}>{ABOUT.mission}</div>
        </div>
      </section>

      {/* Contact */}
      <section style={{ padding: '24px 24px 0', borderBottom: '0.5px solid var(--gold-line)' }}>
        <div className="lbl" style={{ marginBottom: 16 }}>İLETİŞİM</div>
        {contacts.map((c, i) => (
          <div key={c.label} style={{
            padding: '12px 0',
            borderTop: i > 0 ? '0.5px solid var(--gold-line)' : 'none',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div className="byline" style={{ fontSize: 7.5, color: 'var(--text-muted)' }}>{c.label}</div>
            <div style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12,
              color: 'var(--ivory)', textAlign: 'right', maxWidth: 200,
            }}>{c.value}</div>
          </div>
        ))}
        <div style={{ paddingBottom: 24 }} />
      </section>

      {/* Social media */}
      <section style={{ padding: '24px 24px 0', borderBottom: '0.5px solid var(--gold-line)' }}>
        <div className="lbl" style={{ marginBottom: 16 }}>SOSYAL MEDYA</div>
        {socials.map((s, i) => (
          <div key={s.label} style={{
            padding: '14px 0',
            borderTop: i > 0 ? '0.5px solid var(--gold-line)' : 'none',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div className="byline" style={{ fontSize: 7.5 }}>{s.label}</div>
            <div style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13,
              color: 'var(--gold)', fontWeight: 600,
            }}>{s.handle}</div>
          </div>
        ))}
        <div style={{ paddingBottom: 24 }} />
      </section>

      {/* Commission leads */}
      <section style={{ padding: '24px 24px 0', borderBottom: '0.5px solid var(--gold-line)' }}>
        <div className="lbl" style={{ marginBottom: 16 }}>KOMİSYON LİDERLERİ</div>
        {commissionLeads.map((c, i) => (
          <div key={i} style={{
            padding: '12px 0',
            borderTop: i > 0 ? '0.5px solid var(--gold-line)' : 'none',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <Monogram initials={c.initials} size="sm" />
            <div>
              <div style={{
                fontFamily: 'Cormorant Garamond, serif', fontSize: 17,
                color: 'var(--ivory)', fontWeight: 500,
              }}>{c.name}</div>
              <div className="byline" style={{ marginTop: 3, color: 'var(--gold)' }}>{c.role}</div>
            </div>
          </div>
        ))}
        <div style={{ paddingBottom: 24 }} />
      </section>

      {/* Parent org */}
      <section style={{ padding: '24px 24px 32px' }}>
        <div className="lbl" style={{ marginBottom: 14 }}>ÜST KURULUŞ</div>
        <div style={{
          padding: '18px', background: 'var(--navy-mid)',
          border: '0.5px solid var(--gold-line)',
        }}>
          <div style={{
            fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
            fontSize: 22, color: 'var(--ivory)', lineHeight: 1.1,
          }}>{ABOUT.parent}</div>
          <div style={{
            marginTop: 8, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11,
            color: 'var(--text-muted)', lineHeight: 1.5,
          }}>{ABOUT.parentFull}</div>
          <div className="byline" style={{ marginTop: 8 }}>{ABOUT.parentFounded}\'den beri</div>
        </div>
      </section>
    </div>
  );
}

window.AboutScreen = AboutScreen;
