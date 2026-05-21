/* screen-directory.jsx — Member directory */

function DirectoryScreen({ onBellClick }) {
  const [q, setQ] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('TÜMÜ');
  const [openId, setOpenId] = React.useState(1); // FÖ open by default

  const ROLE_FILTERS = ['TÜMÜ', 'YÖNETİM', 'ÜYE', 'ÖĞRENCİ'];

  const roleMap = {
    'YÖNETİM': m => m.role === 'YÖNETİM' || m.role === 'GENÇ TETSİAD BAŞKANI' || m.role === 'KONSEPT MİMARI',
    'ÜYE':     m => m.role === 'ÜYE',
    'ÖĞRENCİ': m => m.student === true,
    'TÜMÜ':    () => true,
  };

  const filtered = MEMBERS.filter(m => {
    const matchesRole = (roleMap[roleFilter] || (() => true))(m);
    const matchesQ = !q || [m.name, m.firm, m.city, m.sector].some(
      s => s.toLowerCase().includes(q.toLowerCase())
    );
    return matchesRole && matchesQ;
  });

  return (
    <div className="screen phone-scroll no-scrollbar" style={{ paddingBottom: 100 }}>
      <AppHeader section="REHBER" title={<>Dokuyu <em style={{ fontStyle: 'italic' }}>oluşturanlar.</em></>}
        count={ANNOUNCEMENTS.length} onBellClick={onBellClick} />

      {/* Search */}
      <div style={{ padding: '0 24px 18px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          borderBottom: '0.5px solid var(--gold-line)', paddingBottom: 10,
        }}>
          <SearchIcon size={14} color="var(--gold)" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="İsim, firma, şehir veya sektör"
            style={{
              flex: 1, background: 'transparent', border: 0, outline: 'none',
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
              fontSize: 17, color: 'var(--ivory)',
            }}
          />
          <span className="byline">{filtered.length} / {MEMBERS.length}</span>
        </div>
      </div>

      {/* Filter chips */}
      <div className="no-scrollbar" style={{
        display: 'flex', gap: 8, overflowX: 'auto', padding: '0 24px 18px',
      }}>
        {ROLE_FILTERS.map(t => (
          <button key={t}
            className={`pill ${roleFilter === t ? 'active' : ''}`}
            onClick={() => setRoleFilter(t)}>
            {t}
            {t !== 'TÜMÜ' && (
              <span style={{ marginLeft: 4, opacity: 0.7 }}>
                ({t === 'YÖNETİM' ? MEMBERS.filter(roleMap['YÖNETİM']).length
                  : t === 'ÜYE' ? MEMBERS.filter(roleMap['ÜYE']).length
                  : MEMBERS.filter(roleMap['ÖĞRENCİ']).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Members */}
      <div>
        {filtered.length === 0 && (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div className="byline" style={{ color: 'var(--text-muted)' }}>SONUÇ BULUNAMADI</div>
          </div>
        )}
        {filtered.map((m) => {
          const isOpen = openId === m.id;
          return (
            <div key={m.id}
              onClick={() => setOpenId(isOpen ? null : m.id)}
              style={{
                padding: '20px 24px',
                borderTop: '0.5px solid var(--gold-line)',
                background: isOpen ? 'var(--navy-mid)' : 'transparent',
                cursor: 'pointer',
                transition: 'background 200ms',
              }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <Monogram initials={m.initials} gold={m.gold} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{
                      fontFamily: 'Cormorant Garamond, serif', fontSize: 18,
                      color: 'var(--ivory)', lineHeight: 1.1, fontWeight: 500,
                    }}>{m.name}</div>
                    {m.role !== 'ÜYE' && (
                      <div style={{
                        fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 7.5,
                        letterSpacing: 1.5, fontWeight: 600,
                        color: (m.role === 'KONSEPT MİMARI' || m.role === 'YÖNETİM' || m.role === 'GENÇ TETSİAD BAŞKANI')
                          ? 'var(--gold)' : 'var(--text-muted)',
                        padding: (m.role === 'KONSEPT MİMARI' || m.role === 'GENÇ TETSİAD BAŞKANI')
                          ? '3px 6px' : 0,
                        background: (m.role === 'KONSEPT MİMARI' || m.role === 'GENÇ TETSİAD BAŞKANI')
                          ? 'rgba(196,162,101,0.15)' : 'transparent',
                        border: (m.role === 'KONSEPT MİMARI' || m.role === 'GENÇ TETSİAD BAŞKANI')
                          ? '0.5px solid var(--gold)' : 'none',
                      }}>{m.student ? 'ÖĞRENCİ' : m.role}</div>
                    )}
                  </div>
                  <div className="byline" style={{ marginTop: 4 }}>
                    <span style={{ color: 'var(--gold)' }}>{m.firm}</span> · {m.city}
                  </div>
                  <div className="byline" style={{ marginTop: 2, color: 'var(--text-warm)' }}>{m.sector}</div>
                  <div style={{
                    marginTop: 10,
                    fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                    fontSize: 13, color: 'var(--ivory)', lineHeight: 1.4, fontWeight: 300,
                    opacity: 0.85,
                  }}>"{m.bio}"</div>

                  {isOpen && (
                    <div className="fade-in" style={{ marginTop: 16 }}>
                      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                        {[
                          [String(m.events).padStart(2,'0'), 'ETKİNLİK'],
                          [String(m.certs).padStart(2,'0'),  'SERTİFİKA'],
                          [String(m.connections).padStart(2,'0'), 'BAĞLANTI'],
                        ].map(([n, l], i) => (
                          <div key={i} style={{
                            flex: 1, textAlign: 'center', padding: '10px 6px',
                            border: '0.5px solid var(--gold-line)',
                          }}>
                            <div style={{
                              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                              fontSize: 20, color: 'var(--gold)', fontWeight: 300,
                            }}>{n}</div>
                            <div className="byline" style={{ marginTop: 4, fontSize: 7 }}>{l}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn btn-fill" style={{ flex: 1, padding: '12px 16px' }}>MESAJ</button>
                        <button className="btn btn-outline" style={{ flex: 1, padding: '12px 16px' }}>PROFİL</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: '36px 24px 24px', textAlign: 'center', borderTop: '0.5px solid var(--gold-line)' }}>
        <div className="byline">
          REHBERE <span style={{ color: 'var(--gold)' }}>{filtered.length}</span> ÜYE KAYITLI
          {roleFilter !== 'TÜMÜ' && <> · <span style={{ color: 'var(--gold)' }}>{roleFilter}</span> FİLTRESİ AKTİF</>}
        </div>
      </div>
    </div>
  );
}

window.DirectoryScreen = DirectoryScreen;
