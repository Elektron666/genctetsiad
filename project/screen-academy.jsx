/* screen-academy.jsx — Education + mentors */

function AcademyScreen({ onBellClick }) {
  const [tab, setTab] = React.useState('COURSES'); // COURSES | MENTORS

  return (
    <div className="screen phone-scroll no-scrollbar" style={{ paddingBottom: 100 }}>
      <AppHeader section="AKADEMİ" title={<>Ustadan <em style={{ fontStyle: 'italic' }}>çırağa.</em></>} count={ANNOUNCEMENTS.length} onBellClick={onBellClick} />

      {/* Subhead */}
      <div style={{ padding: '0 24px 24px' }}>
        <div style={{
          fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontWeight: 300,
          fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5,
        }}>
          Üyelerimize özel kurslar, atölyeler ve birebir mentorluk.
          Sektörün deneyimli isimleri, genç meslektaşlarına bilgi aktarıyor.
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', borderTop: '0.5px solid var(--gold-line)', borderBottom: '0.5px solid var(--gold-line)',
      }}>
        {[
          { k: 'COURSES', label: 'EĞİTİMLER' },
          { k: 'MENTORS', label: 'MENTÖRLER' },
        ].map(o => (
          <div key={o.k} onClick={() => setTab(o.k)}
            style={{
              flex: 1, textAlign: 'center', padding: '16px 0',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 9, letterSpacing: 2.5, fontWeight: 600,
              color: tab === o.k ? 'var(--gold)' : 'var(--text-muted)',
              cursor: 'pointer',
              borderBottom: tab === o.k ? '1px solid var(--gold)' : '1px solid transparent',
              marginBottom: -0.5,
            }}>{o.label}</div>
        ))}
      </div>

      {tab === 'COURSES' && (
        <div className="fade-in" style={{ padding: '0' }}>
          {COURSES.map((c, i) => {
            const status = c.progress >= 100 ? 'TAMAMLANDI' : c.progress > 0 ? 'DEVAM EDİYOR' : 'BAŞLAMADI';
            return (
              <div key={c.id} style={{
                padding: '22px 24px',
                borderBottom: '0.5px solid var(--gold-line)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{
                    fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                    fontSize: 28, color: 'var(--gold)', fontWeight: 300, lineHeight: 1,
                    minWidth: 30,
                  }}>{String(c.num).padStart(2, '0')}</div>
                  <div style={{ flex: 1 }}>
                    <div className="lbl" style={{ marginBottom: 6 }}>{c.cat}</div>
                    <div style={{
                      fontFamily: 'Cormorant Garamond, serif', fontSize: 19,
                      color: 'var(--ivory)', lineHeight: 1.2, fontWeight: 500,
                    }}>{c.title}</div>
                    <div className="byline" style={{ marginTop: 6 }}>{c.sub}</div>

                    <div style={{ marginTop: 14 }}>
                      <div className="bar"><div style={{ width: `${c.progress}%` }} /></div>
                      <div style={{
                        marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1,
                      }}>
                        <span style={{ color: 'var(--text-muted)' }}>{status}</span>
                        <span style={{ color: 'var(--gold)' }}>{c.progress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'MENTORS' && (
        <div className="fade-in" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18 }}>
            {MENTORS.map(m => (
              <div key={m.id} className="weave" style={{
                background: 'var(--navy-mid)', padding: 20, position: 'relative',
                border: '0.5px solid var(--gold-line)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <Monogram initials={m.initials} size="lg" />
                  <div style={{ flex: 1 }}>
                    <div className="lbl" style={{ marginBottom: 6 }}>MENTÖR</div>
                    <div style={{
                      fontFamily: 'Cormorant Garamond, serif', fontSize: 22,
                      color: 'var(--ivory)', lineHeight: 1.1, fontWeight: 500,
                    }}>{m.name}</div>
                    <div className="byline" style={{ marginTop: 6, color: 'var(--gold)' }}>{m.title}</div>
                    <div style={{
                      marginTop: 12,
                      fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                      fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.4, fontWeight: 300,
                    }}>{m.expertise}</div>
                  </div>
                </div>
                <button className="btn btn-outline" style={{ width: '100%', marginTop: 18 }}>
                  MENTORLUK BAŞVURUSU
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: '36px 24px 24px', textAlign: 'center', borderTop: '0.5px solid var(--gold-line)' }}>
        <div className="byline">
          {tab === 'COURSES' ? <>06 KATEGORİ · TÜM ÜYELERE <span style={{ color: 'var(--gold)' }}>ÜCRETSİZ</span></>
            : <>BAŞVURU SONRASI KOMİSYON <span style={{ color: 'var(--gold)' }}>EŞLEŞTİRME</span> YAPAR</>}
        </div>
      </div>
    </div>
  );
}

window.AcademyScreen = AcademyScreen;
