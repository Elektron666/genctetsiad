/* screen-academy.jsx — Education + mentors */

function AcademyScreen({ onBellClick }) {
  const [tab, setTab] = React.useState('COURSES');
  const [expandedCourse, setExpandedCourse] = React.useState(null); // course id
  const [mentorModal, setMentorModal] = React.useState(null);
  const [message, setMessage] = React.useState('');
  const [applied, setApplied] = React.useState(new Set());
  const { toasts, show: showToast, remove: removeToast } = useToast();

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
        <div className="fade-in" style={{ padding: 0 }}>
          {COURSES.map((c) => {
            const status = c.progress >= 100 ? 'TAMAMLANDI' : c.progress > 0 ? 'DEVAM EDİYOR' : 'BAŞLAMADI';
            const barColor = c.progress >= 100 ? 'var(--gold-bright)' : 'var(--gold)';
            const isExpanded = expandedCourse === c.id;
            const modules = c.modules || [];
            const doneCount = modules.filter(m => m.done).length;

            return (
              <div key={c.id} style={{ borderBottom: '0.5px solid var(--gold-line)' }}>
                {/* Course header row */}
                <div
                  onClick={() => setExpandedCourse(isExpanded ? null : c.id)}
                  style={{ padding: '22px 24px', cursor: 'pointer' }}>
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
                            {modules.length > 0 && (
                              <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>
                                {doneCount}/{modules.length} DERS
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Expand toggle */}
                      {modules.length > 0 && (
                        <div style={{
                          marginTop: 10, display: 'flex', alignItems: 'center', gap: 6,
                          fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 8, letterSpacing: 2,
                          color: isExpanded ? 'var(--gold)' : 'var(--text-muted)',
                        }}>
                          <span>{isExpanded ? '▲ GİZLE' : '▼ MODÜLLER'}</span>
                          <span style={{ opacity: 0.6 }}>({modules.length} DERS)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Module list */}
                {isExpanded && modules.length > 0 && (
                  <div className="fade-in" style={{
                    background: 'rgba(15, 107, 69, 0.05)',
                    borderTop: '0.5px solid var(--gold-line)',
                  }}>
                    {modules.map((mod, idx) => (
                      <div key={mod.id} style={{
                        padding: '14px 24px 14px 38px',
                        borderBottom: idx < modules.length - 1 ? '0.5px solid rgba(196,162,101,0.12)' : 'none',
                        display: 'grid',
                        gridTemplateColumns: '20px 1fr auto',
                        gap: 12,
                        alignItems: 'flex-start',
                      }}>
                        {/* Done/pending indicator */}
                        <div style={{ paddingTop: 2, textAlign: 'center' }}>
                          {mod.done ? (
                            <div style={{
                              width: 16, height: 16, borderRadius: 999,
                              background: 'var(--gold)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 9, color: 'var(--navy)',
                            }}>✓</div>
                          ) : (
                            <div style={{
                              width: 16, height: 16, borderRadius: 999,
                              border: '1px solid var(--gold-line)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: 'var(--text-muted)',
                            }}>{String(idx + 1).padStart(2, '0')}</div>
                          )}
                        </div>

                        {/* Module info */}
                        <div>
                          <div style={{
                            fontFamily: 'Cormorant Garamond, serif', fontSize: 15,
                            color: mod.done ? 'var(--ivory)' : 'var(--text-warm)',
                            fontWeight: 500, lineHeight: 1.25,
                          }}>{mod.title}</div>
                          <div className="byline" style={{ marginTop: 4, color: 'var(--text-muted)' }}>
                            <span style={{ color: mod.done ? 'var(--gold)' : 'var(--text-muted)' }}>{mod.speaker}</span>
                            {mod.duration && <> · {mod.duration}</>}
                          </div>
                        </div>

                        {/* Action button */}
                        <div style={{ paddingTop: 2 }}>
                          {mod.done ? (
                            <span className="byline" style={{ color: 'var(--gold)', fontSize: 7 }}>TEKRAR</span>
                          ) : (
                            <span className="byline" style={{ color: 'var(--text-muted)', fontSize: 7 }}>BAŞLA</span>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Module footer */}
                    <div style={{
                      padding: '12px 24px', borderTop: '0.5px solid var(--gold-line)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span className="byline" style={{ color: 'var(--text-muted)' }}>
                        {doneCount === modules.length ? (
                          <span style={{ color: 'var(--gold)' }}>TÜM MODÜLLER TAMAMLANDI ✓</span>
                        ) : (
                          <>{modules.length - doneCount} MODÜL KALDI</>
                        )}
                      </span>
                      {c.progress === 0 ? (
                        <button className="btn btn-ghost" style={{ fontSize: 8, letterSpacing: 2, padding: '8px 14px' }}>
                          BAŞLA →
                        </button>
                      ) : c.progress < 100 ? (
                        <button className="btn btn-ghost" style={{ fontSize: 8, letterSpacing: 2, padding: '8px 14px' }}>
                          DEVAM ET →
                        </button>
                      ) : (
                        <button className="btn btn-ghost" style={{ fontSize: 8, letterSpacing: 2, padding: '8px 14px' }}>
                          SERTİFİKA →
                        </button>
                      )}
                    </div>
                  </div>
                )}
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
                      <div className="byline" style={{ marginTop: 4, color: 'var(--gold)' }}>{m.title}</div>
                      <div className="byline" style={{ marginTop: 2 }}>{m.firm} · {m.city}</div>
                    </div>
                  </div>

                  <div style={{
                    marginTop: 14, fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                    fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.55, fontWeight: 300,
                  }}>{m.bio || m.expertise}</div>

                  {/* Expertise tags */}
                  <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(m.expertise || '').split('·').map((tag, i) => (
                      <span key={i} style={{
                        fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 7.5, letterSpacing: 1.2,
                        padding: '4px 8px', border: '0.5px solid var(--gold-line)', color: 'var(--text-muted)',
                      }}>{tag.trim()}</span>
                    ))}
                  </div>

                  {/* Availability badge */}
                  <div style={{ marginTop: 12 }}>
                    <span style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 7.5, letterSpacing: 1.5,
                      color: m.available ? 'var(--gold)' : 'var(--text-muted)',
                    }}>
                      {m.available ? '● BAŞVURUYA AÇIK' : '○ DOLU'}
                    </span>
                  </div>

                  <button
                    className={`btn ${isApplied ? 'btn-outline btn-disabled' : m.available ? 'btn-outline' : 'btn-outline btn-disabled'}`}
                    style={{ width: '100%', marginTop: 16 }}
                    onClick={() => !isApplied && m.available && setMentorModal(m)}>
                    {isApplied ? '⏳ BAŞVURU DEĞERLENDİRİLİYOR' : m.available ? 'MENTORLUK BAŞVURUSU' : 'BAŞVURU KAPALI'}
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
          <div style={{ marginBottom: 16 }}>
            <div className="byline" style={{ color: 'var(--gold)', marginBottom: 2 }}>{mentorModal.title}</div>
            <div className="byline" style={{ marginBottom: 12 }}>{mentorModal.firm} · {mentorModal.city}</div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
              fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5,
            }}>{mentorModal.bio || mentorModal.expertise}</div>
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

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

window.AcademyScreen = AcademyScreen;
