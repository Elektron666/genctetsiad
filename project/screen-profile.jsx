/* screen-profile.jsx — Membership card */

function ProfileScreen({ onSignOut, onBellClick }) {
  const menu = [
    { num: 1, label: 'Üyelik Bilgileri', sub: 'Kişisel ve firma bilgileri' },
    { num: 2, label: 'Bildirim Ayarları', sub: 'Push, e-posta, hatırlatma' },
    { num: 3, label: 'Katılım Geçmişi', sub: '08 etkinlik · 02 sertifika' },
    { num: 4, label: 'Belgelerim', sub: 'Üyelik belgesi, faturalar, KVKK' },
    { num: 5, label: 'Destek', sub: 'TETSİAD ekibine yaz' },
  ];

  return (
    <div className="screen phone-scroll no-scrollbar" style={{ paddingBottom: 100 }}>
      <AppHeader section="KART" title={<>Üyelik <em style={{ fontStyle: 'italic' }}>kartınız.</em></>} count={ANNOUNCEMENTS.length} onBellClick={onBellClick} />

      {/* Membership card */}
      <div style={{ padding: '0 24px 24px' }}>
        <div className="weave corner-brackets" style={{
          background: 'linear-gradient(180deg, var(--navy-mid), var(--navy-deep))',
          border: '0.5px solid var(--gold)',
          padding: '24px 22px 20px',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="byline" style={{ fontSize: 7.5, marginBottom: 4 }}>GENÇ TETSİAD</div>
              <div style={{
                fontFamily: 'Cormorant Garamond, serif', fontSize: 11, fontStyle: 'italic',
                color: 'var(--text-muted)',
              }}>1991'den beri ev tekstilinde</div>
            </div>
            <TetsiadLogo size={18} color="rgba(245,240,230,0.7)" />
          </div>

          {/* Name + monogram */}
          <div style={{ marginTop: 32, display: 'flex', alignItems: 'flex-end', gap: 16 }}>
            <div style={{
              width: 64, height: 64, background: 'var(--gold)', color: 'var(--navy)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontWeight: 500,
              fontSize: 30, letterSpacing: 1,
            }}>FÖ</div>
            <div style={{ flex: 1 }}>
              <div className="byline" style={{ marginBottom: 4 }}>ÜYE ADI</div>
              <div style={{
                fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                fontWeight: 300, fontSize: 28, color: 'var(--ivory)', lineHeight: 1,
              }}>Fatih Özdemir</div>
            </div>
          </div>

          {/* Details grid */}
          <div style={{
            marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 12px',
            paddingTop: 20, borderTop: '0.5px solid var(--gold-line)',
          }}>
            {[
              ['FİRMA', 'ORMEN TEKSTİL'],
              ['ŞEHİR', 'Ankara'],
              ['SEKTÖR', 'Döşemelik'],
              ['POZİSYON', 'Yönetici / 2. Kuşak'],
            ].map(([l, v], i) => (
              <div key={i}>
                <div className="byline" style={{ marginBottom: 4 }}>{l}</div>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif', fontSize: 15,
                  color: 'var(--ivory)', lineHeight: 1.2,
                }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Footer of card */}
          <div style={{
            marginTop: 22, paddingTop: 16, borderTop: '0.5px solid var(--gold-line)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div className="byline">
              GENÇ TETSİAD · <span style={{ color: 'var(--gold)' }}>AKTİF ÜYE</span>
            </div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2, color: 'var(--gold)',
            }}>№ GT-2026-0342</div>
          </div>
        </div>

        {/* Concept architect marker */}
        <div style={{
          marginTop: 12, padding: '10px 12px',
          background: 'rgba(196,162,101,0.10)', border: '0.5px solid var(--gold-line)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div className="byline" style={{ fontSize: 8 }}>BU UYGULAMANIN KONSEPT MİMARI</div>
          <div className="signature" style={{ fontSize: 18, lineHeight: 1 }}>Fatih Özdemir</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        margin: '0 24px', padding: '20px 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        borderTop: '0.5px solid var(--gold-line)', borderBottom: '0.5px solid var(--gold-line)',
      }}>
        {[
          ['08', 'ETKİNLİK'],
          ['02', 'SERTİFİKA'],
          ['34', 'BAĞLANTI'],
        ].map(([n, l], i) => (
          <div key={i} style={{ textAlign: 'center', borderRight: i < 2 ? '0.5px solid var(--gold-line)' : '' }}>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
              fontSize: 30, color: 'var(--ivory)', fontWeight: 300, lineHeight: 1,
            }}>{n}</div>
            <div className="byline" style={{ marginTop: 8 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Menu */}
      <div style={{ padding: '12px 24px 0' }}>
        {menu.map((m, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '36px 1fr auto', alignItems: 'center', gap: 12,
            padding: '18px 0', borderBottom: '0.5px solid var(--gold-line)', cursor: 'pointer',
          }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
              color: 'var(--gold)', letterSpacing: 1,
            }}>{String(m.num).padStart(2, '0')}</div>
            <div>
              <div style={{
                fontFamily: 'Cormorant Garamond, serif', fontSize: 18,
                color: 'var(--ivory)', lineHeight: 1.1,
              }}>{m.label}</div>
              <div className="byline" style={{ marginTop: 4 }}>{m.sub}</div>
            </div>
            <ChevronRight />
          </div>
        ))}
      </div>

      {/* Logout */}
      <div style={{ padding: '28px 24px 12px' }}>
        <button className="btn btn-outline" style={{ width: '100%' }} onClick={onSignOut}>
          ÇIKIŞ YAP
        </button>
      </div>

      {/* Künye */}
      <div style={{
        marginTop: 24, padding: '20px 24px 12px',
        borderTop: '0.5px solid var(--gold-line)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      }}>
        <div className="byline">
          v0.9 · BETA · YALNIZCA <span style={{ color: 'var(--gold)' }}>DAVETLİ</span> ÜYELER
        </div>
        <div className="byline">
          KONSEPT <span style={{ color: 'var(--gold)' }}>FATİH ÖZDEMİR</span> · ORMEN TEKSTİL · ANKARA
        </div>
      </div>
    </div>
  );
}

window.ProfileScreen = ProfileScreen;
