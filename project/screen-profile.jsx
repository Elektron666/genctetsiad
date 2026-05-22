/* screen-profile.jsx — Membership card + QR */

function QRModal({ member, onClose }) {
  /* SVG-based QR pattern — visual only, for demo */
  const cells = React.useMemo(() => {
    const grid = [];
    const seed = member.id * 37 + member.memberNo.charCodeAt(3);
    for (let r = 0; r < 13; r++) {
      for (let c = 0; c < 13; c++) {
        /* always-on finder patterns */
        const finder = (r < 3 && c < 3) || (r < 3 && c > 9) || (r > 9 && c < 3);
        const edge = (r === 0 || r === 12 || c === 0 || c === 12) && !finder;
        const data = !finder && !edge && ((seed * (r + 1) * (c + 1) + r * 7 + c * 11) % 3 !== 0);
        grid.push({ r, c, on: finder || data });
      }
    }
    return grid;
  }, [member.id]);

  return (
    <Modal open={true} onClose={onClose} title="Dijital Kartvizit">
      <div style={{ textAlign: 'center' }}>
        {/* QR visual */}
        <div style={{
          display: 'inline-block', padding: 16,
          background: 'var(--ivory)', borderRadius: 2, marginBottom: 20,
        }}>
          <svg width={104} height={104} viewBox="0 0 13 13">
            {cells.map(({ r, c, on }) =>
              on ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#073323" /> : null
            )}
          </svg>
        </div>

        {/* Member info */}
        <div style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: 22,
          color: 'var(--ivory)', fontWeight: 500, marginBottom: 6,
        }}>{member.name}</div>
        <div className="byline" style={{ color: 'var(--gold)', marginBottom: 4 }}>{member.position || member.role}</div>
        <div className="byline" style={{ marginBottom: 4 }}>{member.firm} · {member.city}</div>
        <div className="byline" style={{ marginBottom: 16 }}>{member.sector}</div>

        <div style={{ height: '0.5px', background: 'var(--gold-line)', marginBottom: 16 }} />

        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
          color: 'var(--gold)', letterSpacing: 2,
        }}>№ {member.memberNo}</div>

        <div className="byline" style={{ marginTop: 8, color: 'var(--text-muted)' }}>
          GENÇ TETSİAD · AKTİF ÜYE · 2026
        </div>

        <button className="btn btn-outline" style={{ width: '100%', marginTop: 20 }} onClick={onClose}>
          KAPAT
        </button>
      </div>
    </Modal>
  );
}

function ProfileScreen({ onSignOut, onBellClick, onNavigate }) {
  const [memberIdx, setMemberIdx] = React.useState(1);
  const [showSwitcher, setShowSwitcher] = React.useState(false);
  const [showQR, setShowQR] = React.useState(false);
  const member = MEMBERS[memberIdx];

  const menu = [
    { num: 1, label: 'Üyelik Bilgileri',   sub: 'Kişisel ve firma bilgileri' },
    { num: 2, label: 'Bildirim Ayarları',  sub: 'Push, e-posta, hatırlatma' },
    { num: 3, label: 'Katılım Geçmişi',    sub: `${String(member.events).padStart(2,'0')} etkinlik · ${String(member.certs).padStart(2,'0')} sertifika` },
    { num: 4, label: 'Belgelerim',         sub: 'Üyelik belgesi, faturalar, KVKK' },
    { num: 5, label: 'Destek',             sub: 'TETSİAD ekibine yaz' },
  ];

  return (
    <div className="screen phone-scroll no-scrollbar" style={{ paddingBottom: 100 }}>
      <AppHeader section="KART" title={<>Üyelik <em style={{ fontStyle: 'italic' }}>kartınız.</em></>}
        count={ANNOUNCEMENTS.length} onBellClick={onBellClick} />

      {/* Member switcher */}
      <div style={{ padding: '0 24px 16px' }}>
        <div onClick={() => setShowSwitcher(s => !s)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'rgba(217,200,150,0.06)', border: '0.5px solid var(--gold-line)',
          cursor: 'pointer',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Monogram initials={member.initials} gold={member.gold} size="sm" />
            <div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 14, color: 'var(--ivory)', lineHeight: 1 }}>{member.name}</div>
              <div className="byline" style={{ marginTop: 3 }}>{member.role}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="lbl" style={{ fontSize: 7, color: 'var(--text-muted)' }}>DEMO MODU</div>
            <Chev dir={showSwitcher ? 'up' : 'down'} size={8} />
          </div>
        </div>

        {showSwitcher && (
          <div className="fade-in" style={{ border: '0.5px solid var(--gold-line)', borderTop: 'none' }}>
            {MEMBERS.map((m, i) => (
              <div key={m.id} onClick={() => { setMemberIdx(i); setShowSwitcher(false); }} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderTop: '0.5px solid rgba(217,200,150,0.10)', cursor: 'pointer',
                background: i === memberIdx ? 'rgba(217,200,150,0.10)' : 'transparent',
              }}>
                <Monogram initials={m.initials} gold={m.gold} size="sm" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 14, color: 'var(--ivory)', lineHeight: 1 }}>{m.name}</div>
                  <div className="byline" style={{ marginTop: 2 }}>
                    <span style={{ color: 'var(--gold)' }}>{m.firm}</span> · {m.sector}
                  </div>
                </div>
                {i === memberIdx && <span style={{ color: 'var(--gold)', fontSize: 11 }}>✓</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Membership card */}
      <div style={{ padding: '0 24px 24px' }}>
        <div className="weave corner-brackets" style={{
          background: 'linear-gradient(180deg, var(--navy-mid), var(--navy-deep))',
          border: '0.5px solid var(--gold)', padding: '24px 22px 20px', position: 'relative',
          transition: 'all 300ms ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="byline" style={{ fontSize: 7.5, marginBottom: 4 }}>GENÇ TETSİAD</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 11, fontStyle: 'italic', color: 'var(--text-muted)' }}>1991\'den beri ev tekstilinde</div>
            </div>
            <TetsiadLogo size={18} color="rgba(245,240,230,0.7)" />
          </div>

          <div style={{ marginTop: 32, display: 'flex', alignItems: 'flex-end', gap: 16 }}>
            <div style={{
              width: 64, height: 64,
              background: member.gold ? 'var(--gold)' : 'transparent',
              border: member.gold ? 'none' : '0.5px solid var(--gold)',
              color: member.gold ? 'var(--navy)' : 'var(--gold)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontWeight: 500,
              fontSize: 30, letterSpacing: 1, transition: 'all 300ms ease',
            }}>{member.initials}</div>
            <div style={{ flex: 1 }}>
              <div className="byline" style={{ marginBottom: 4 }}>ÜYE ADI</div>
              <div style={{
                fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                fontWeight: 300, fontSize: 26, color: 'var(--ivory)', lineHeight: 1, transition: 'all 200ms ease',
              }}>{member.name}</div>
            </div>
          </div>

          <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 12px', paddingTop: 20, borderTop: '0.5px solid var(--gold-line)' }}>
            {[['FİRMA', member.firm], ['ŞEHİR', member.city], ['SEKTÖR', member.sector], ['POZİSYON', member.position || member.role]].map(([l, v]) => (
              <div key={l}>
                <div className="byline" style={{ marginBottom: 4 }}>{l}</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 14, color: 'var(--ivory)', lineHeight: 1.2, transition: 'all 200ms ease' }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 22, paddingTop: 16, borderTop: '0.5px solid var(--gold-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="byline">GENÇ TETSİAD · <span style={{ color: 'var(--gold)' }}>AKTİF ÜYE</span></div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2, color: 'var(--gold)' }}>№ {member.memberNo}</div>
          </div>
        </div>

        {member.id === 1 && (
          <div className="fade-in" style={{
            marginTop: 12, padding: '10px 12px',
            background: 'rgba(196,162,101,0.10)', border: '0.5px solid var(--gold-line)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div className="byline" style={{ fontSize: 8 }}>BU UYGULAMANIN KONSEPT MİMARI</div>
            <div className="signature" style={{ fontSize: 18, lineHeight: 1 }}>Fatih Özdemir</div>
          </div>
        )}

        {/* QR Kartvizit button */}
        <button className="btn btn-outline" style={{ width: '100%', marginTop: 14 }}
          onClick={() => setShowQR(true)}>
          📇 KARTVİZİT PAYLAŞ / QR
        </button>
      </div>

      {/* Stats */}
      <div style={{
        margin: '0 24px', padding: '20px 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        borderTop: '0.5px solid var(--gold-line)', borderBottom: '0.5px solid var(--gold-line)',
      }}>
        {[[String(member.events).padStart(2,'0'), 'ETKİNLİK'], [String(member.certs).padStart(2,'0'), 'SERTİFİKA'], [String(member.connections).padStart(2,'0'), 'BAĞLANTI']].map(([n, l], i) => (
          <div key={i} style={{ textAlign: 'center', borderRight: i < 2 ? '0.5px solid var(--gold-line)' : '' }}>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
              fontSize: 30, color: 'var(--ivory)', fontWeight: 300, lineHeight: 1, transition: 'all 200ms ease',
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
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--gold)', letterSpacing: 1 }}>
              {String(m.num).padStart(2,'0')}
            </div>
            <div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, color: 'var(--ivory)', lineHeight: 1.1 }}>{m.label}</div>
              <div className="byline" style={{ marginTop: 4 }}>{m.sub}</div>
            </div>
            <ChevronRight />
          </div>
        ))}
      </div>

      {/* Footer links */}
      <div style={{ padding: '20px 24px 12px', display: 'flex', gap: 12 }}>
        <button className="btn btn-outline" style={{ flex: 1 }} onClick={onSignOut}>ÇIKIŞ YAP</button>
        {onNavigate && (
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => onNavigate('about')}>
            HAKKIMIZDA
          </button>
        )}
      </div>

      <div style={{
        padding: '8px 24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        borderTop: '0.5px solid var(--gold-line)',
      }}>
        <div className="byline">v1.0 · BETA · YALNIZCA <span style={{ color: 'var(--gold)' }}>DAVETLİ</span> ÜYELER</div>
        <div className="byline">KONSEPT <span style={{ color: 'var(--gold)' }}>FATİH ÖZDEMİR</span> · ORMEN TEKSTİL · ANKARA</div>
      </div>

      {showQR && <QRModal member={member} onClose={() => setShowQR(false)} />}
    </div>
  );
}

window.ProfileScreen = ProfileScreen;
