/* screen-academy.jsx — Education + mentors */

function AcademyScreen({ onBellClick }) {
  const [tab, setTab] = React.useState('COURSES');
  const [mentorModal, setMentorModal] = React.useState(null); // mentor object or null
  const [message, setMessage] = React.useState('');
  const [applied, setApplied] = React.useState(new Set()); // mentor ids applied to
  const { toasts, show: showToast, remove: removeToast } = useToast();

  /* Animated progress — fill bars on mount */
  const [animated, setAnimated] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 120);
    return () => clearTimeout(t);
  }, []);
  React.useEffect(() => {
    if (tab === 'COURSES') {
      setAnimated(false);
      const t = setTimeout(() => setAnimated(true), 80);
      return () => clearTimeout(t);
    }
  }, [tab]);

  const handleApply = () => {
    if (!mentorModal) return;
    setApplied(s => new Set([...s, mentorModal.id]));
    setMentorModal(null);
    setMessage('');
    showToast(`${mentorModal.name} için başvuru gönderildi.`, 'success');
  };

  return (
    <div className="screen phone-scroll no-scrollbar" style={{ paddingBottom: 100 }}>
      <AppHeader section="AKADEMİ" title={<>Ustadan <em style={{ fontStyle: 'italic' }}>çırağa.</em></>}
        count={ANNOUNCEMENTS.length} onBellClick={onBellClick} />

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
      <div style={{ display: 'flex', borderTop: '0.5px solid var(--gold-line)', borderBottom: '0.5px solid var(--gold-line)' }}>
        {[{ k: 'COURSES', label: 'EĞİTİMLER' }, { k: 'MENTORS', label: 'MENTÖRLER' }].map(o => (
          <div key={o.k} onClick={() => setTab(o.k)} style={{
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
          {COURSES.map((c) => {
            const status = c.progress >= 100 ? 'TAMAMLANDI' : c.progress > 0 ? 'DEVAM EDİYOR' : 'BAŞLAMADI';
            const barColor = c.progress >= 100 ? 'var(--gold-bright)' : 'var(--gold)';
            return (
              <div key={c.id} style={{ padding: '22px 24px', borderBottom: '0.5px solid var(--gold-line)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{
                    fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                    fontSize: 28, color: 'var(--gold)', fontWeight: 300, lineHeight: 1, minWidth: 30,
                  }}>{String(c.num).padStart(2, '0')}</div>
                  <div style={{ flex: 1 }}>
                    <div className="lbl" style={{ marginBottom: 6 }}>{c.cat}</div>
                    <div style={{
                      fontFamily: 'Cormorant Garamond, serif', fontSize: 19,
                      color: 'var(--ivory)', lineHeight: 1.2, fontWeight: 500,
                    }}>{c.title}</div>
                    <div className="byline" style={{ marginTop: 6 }}>{c.sub}</div>

                    <div style={{ marginTop: 14 }}>
                      <div className="bar">
                        <div style={{
                          width: animated ? `${c.progress}%` : '0%',
                          height: '100%',
                          background: barColor,
                          transition: 'width 0.8s cubic-bezier(.4,0,.2,1)',
                          transitionDelay: `${c.num * 80}ms`,
                        }} />
                      </div>
                      <div style={{
                        marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 1,
                      }}>
                        <span style={{ color: 'var(--text-muted)' }}>{status}</span>
                        <span style={{ color: 'var(--gold)' }}>
                          {animated ? `${c.progress}%` : '0%'}
                        </span>
                      </div>
                    </div>

                    {c.progress > 0 && c.progress < 100 && (
                      <button className="btn btn-ghost" style={{ marginTop: 8, fontSize: 8, letterSpacing: 2 }}>
                        DEVAM ET →
                      </button>
                    )}
                    {c.progress === 0 && (
                      <button className="btn btn-ghost" style={{ marginTop: 8, fontSize: 8, letterSpacing: 2 }}>
                        BAŞLA →
                      </button>
                    )}
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
            {MENTORS.map(m => {
              const isApplied = applied.has(m.id);
              return (
                <div key={m.id} className="weave" style={{
                  background: 'var(--navy-mid)', padding: 20, position: 'relative',
                  border: `0.5px solid ${isApplied ? 'var(--gold)' : 'var(--gold-line)'}`,
                }}>
                  {isApplied && (
                    <div style={{
                      position: 'absolute', top: 12, right: 12,
                      padding: '4px 8px', background: 'var(--gold)', color: 'var(--navy)',
                      fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 7.5, letterSpacing: 1.5, fontWeight: 700,
                    }}>BAŞVURULDU</div>
                  )}
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
                        marginTop: 12, fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                        fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.4, fontWeight: 300,
                      }}>{m.expertise}</div>
                    </div>
                  </div>
                  <button
                    className={`btn ${isApplied ? 'btn-outline btn-disabled' : 'btn-outline'}`}
                    style={{ width: '100%', marginTop: 18 }}
                    onClick={() => !isApplied && setMentorModal(m)}>
                    {isApplied ? '⏳ BAŞVURU DEĞERLENDİRİLİYOR' : 'MENTORLUK BAŞVURUSU'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: '36px 24px 24px', textAlign: 'center', borderTop: '0.5px solid var(--gold-line)' }}>
        <div className="byline">
          {tab === 'COURSES'
            ? <>06 KATEGORİ · TÜM ÜYELERE <span style={{ color: 'var(--gold)' }}>ÜCRETSİZ</span></>
            : <>BAŞVURU SONRASI KOMİSYON <span style={{ color: 'var(--gold)' }}>EŞLEŞTİRME</span> YAPAR</>}
        </div>
      </div>

      {/* Mentor application modal */}
      {mentorModal && (
        <Modal open={true} onClose={() => { setMentorModal(null); setMessage(''); }}
          title={`${mentorModal.name} ile mentorluk`}>
          <div style={{ marginBottom: 20 }}>
            <div className="byline" style={{ marginBottom: 4 }}>{mentorModal.title}</div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
              fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4,
            }}>{mentorModal.expertise}</div>
          </div>
          <div style={{ height: '0.5px', background: 'var(--gold-line)', marginBottom: 20 }} />
          <div className="lbl" style={{ marginBottom: 10, color: 'var(--text-muted)' }}>MESAJINIZ</div>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value.slice(0, 300))}
            placeholder="Neden bu mentorluk programına başvuruyorsunuz? Hedeflerinizi kısaca anlatın..."
            style={{
              width: '100%', background: 'transparent',
              border: '0.5px solid var(--gold-line)', borderRadius: 0,
              padding: '12px 14px',
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
              fontSize: 15, color: 'var(--ivory)', lineHeight: 1.5,
              resize: 'none', outline: 'none', minHeight: 100,
              boxSizing: 'border-box',
            }}
          />
          <div className="byline" style={{ marginTop: 6, textAlign: 'right' }}>
            <span style={{ color: message.length >= 280 ? 'var(--gold)' : 'var(--text-muted)' }}>
              {message.length}
            </span> / 300
          </div>
          <button
            className={`btn btn-fill ${!message.trim() ? 'btn-disabled' : ''}`}
            style={{ width: '100%', marginTop: 20 }}
            onClick={handleApply}>
            BAŞVURUYU GÖNDER
          </button>
        </Modal>
      )}

      {/* Toasts */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

window.AcademyScreen = AcademyScreen;
