/* screen-calendar.jsx — Events list + full-page event detail */

function EventDetail({ event, registered, onToggle, onBack }) {
  const isReg = registered.has(event.id);
  const speakers = event.speakers || [];

  return (
    <div className="screen phone-scroll no-scrollbar" style={{ paddingBottom: 80 }}>
      {/* Back bar */}
      <div style={{
        padding: '54px 24px 14px', borderBottom: '0.5px solid var(--gold-line)',
        background: 'var(--navy-deep)', position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span onClick={onBack} style={{
          cursor: 'pointer', color: 'var(--gold)',
          fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 8, letterSpacing: 2,
        }}>← TAKVİME DÖN</span>
        <span className="lbl" style={{ fontSize: 7 }}>{event.tag}</span>
      </div>

      {/* Cover photo */}
      <ImageSlot id={`gt-ev-det-${event.id}`} height={220} label={event.photoLabel} src={event.src} />

      {/* Header */}
      <div style={{ padding: '22px 24px 20px', borderBottom: '0.5px solid var(--gold-line)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 52 }}>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
              fontSize: 44, color: 'var(--gold)', fontWeight: 300, lineHeight: 1,
            }}>{event.day}</div>
            <div className="byline" style={{ marginTop: 4 }}>{event.month}</div>
          </div>
          <div style={{ width: '0.5px', alignSelf: 'stretch', background: 'var(--gold-line)' }} />
          <div style={{ flex: 1 }}>
            <div className="lbl" style={{ marginBottom: 8 }}>{event.tag}</div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: 24,
              color: 'var(--ivory)', lineHeight: 1.15, fontWeight: 500,
            }}>{event.title}</div>
            <div className="byline" style={{ marginTop: 10 }}>{event.place}</div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div style={{ padding: '22px 24px', borderBottom: '0.5px solid var(--gold-line)' }}>
        <div className="lbl" style={{ marginBottom: 14 }}>ETKİNLİK DETAYI</div>
        <div style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13,
          color: 'var(--text-muted)', lineHeight: 1.7, fontWeight: 300,
        }}>{event.desc}</div>
      </div>

      {/* Speakers */}
      {speakers.length > 0 && (
        <div style={{ padding: '22px 24px', borderBottom: '0.5px solid var(--gold-line)' }}>
          <div className="lbl" style={{ marginBottom: 16 }}>KONUŞMACILAR</div>
          {speakers.map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '10px 0',
              borderTop: i > 0 ? '0.5px solid var(--gold-line)' : 'none',
            }}>
              <Monogram initials={s.initials} size="sm" />
              <div>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif', fontSize: 17,
                  color: 'var(--ivory)', fontWeight: 500,
                }}>{s.name}</div>
                <div className="byline" style={{ marginTop: 3, color: 'var(--gold)' }}>{s.role}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attendees count */}
      {event.count > 0 && (
        <div style={{ padding: '20px 24px', borderBottom: '0.5px solid var(--gold-line)' }}>
          <div className="lbl" style={{ marginBottom: 12 }}>KATILIMCILAR</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
              fontSize: 40, color: 'var(--gold)', fontWeight: 300, lineHeight: 1,
            }}>{event.count}</div>
            <div className="byline">KAYITLI KATILIMCI</div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: -8, flexWrap: 'wrap', gap: 4 }}>
            {MEMBERS.slice(0, 8).map(m => (
              <div key={m.id} style={{
                width: 28, height: 28, borderRadius: 999,
                background: 'var(--navy-mid)', border: '1px solid var(--gold-line)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Cormorant Garamond, serif', fontSize: 9, color: 'var(--gold)',
              }}>{m.initials}</div>
            ))}
            {event.count > 8 && (
              <div style={{
                width: 28, height: 28, borderRadius: 999,
                background: 'rgba(196,162,101,0.15)', border: '1px solid var(--gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: 'var(--gold)',
              }}>+{event.count - 8}</div>
            )}
          </div>
        </div>
      )}

      {/* Register CTA */}
      <div style={{ padding: '24px 24px 32px' }}>
        {isReg ? (
          <div>
            <div style={{
              padding: '14px', marginBottom: 14,
              background: 'rgba(196,162,101,0.10)', border: '0.5px solid var(--gold)',
              textAlign: 'center',
            }}>
              <div className="byline" style={{ color: 'var(--gold)' }}>✓ KATILIM ONAYLANDI</div>
            </div>
            <button className="btn btn-outline" style={{ width: '100%' }}
              onClick={() => onToggle(event.id)}>
              KATILIMI İPTAL ET
            </button>
          </div>
        ) : (
          <button className="btn btn-fill" style={{ width: '100%' }}
            onClick={() => onToggle(event.id)}>
            KATIL → ÜCRETSİZ
          </button>
        )}
      </div>
    </div>
  );
}

function CalendarScreen({ onBellClick, registeredEvents: externalReg, onToggleRegistration: externalToggle }) {
  const [filter, setFilter] = React.useState('TÜMÜ');
  const [localReg, setLocalReg] = React.useState(new Set([2, 5]));
  const [selectedEvent, setSelectedEvent] = React.useState(null);
  const [flashId, setFlashId] = React.useState(null);

  const registered = externalReg || localReg;

  const toggleReg = (id) => {
    if (externalToggle) { externalToggle(id); }
    else {
      setLocalReg(s => {
        const next = new Set(s); next.has(id) ? next.delete(id) : next.add(id); return next;
      });
    }
    setFlashId(id);
    setTimeout(() => setFlashId(null), 600);
  };

  const filtered = filter === 'TÜMÜ' ? EVENTS : EVENTS.filter(e => e.tag === filter);

  const getCount = (e) => {
    const wasReg = new Set([2, 5]).has(e.id);
    const isReg = registered.has(e.id);
    if (isReg && !wasReg) return e.count + 1;
    if (!isReg && wasReg) return e.count - 1;
    return e.count;
  };

  if (selectedEvent) {
    return (
      <EventDetail
        event={selectedEvent}
        registered={registered}
        onToggle={toggleReg}
        onBack={() => setSelectedEvent(null)}
      />
    );
  }

  return (
    <div className="screen phone-scroll no-scrollbar" style={{ paddingBottom: 100 }}>
      <AppHeader section="TAKVİM"
        title={<>Yaklaşan <em style={{ fontStyle: 'italic' }}>etkinlikler.</em></>}
        count={ANNOUNCEMENTS.length} onBellClick={onBellClick} />

      {/* Year + count */}
      <div style={{ padding: '0 24px 16px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{
          fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
          fontSize: 38, color: 'var(--gold)', fontWeight: 300, lineHeight: 1,
        }}>2026</div>
        <div className="byline">
          <span style={{ color: 'var(--gold)' }}>{filtered.length}</span> / {EVENTS.length} ETKİNLİK
          {registered.size > 0 && <> · <span style={{ color: 'var(--gold)' }}>{registered.size}</span> KATILIM</>}
        </div>
      </div>

      {/* Filter pills */}
      <div className="no-scrollbar" style={{
        display: 'flex', gap: 8, overflowX: 'auto', padding: '8px 24px 24px',
        borderBottom: '0.5px solid var(--gold-line)',
      }}>
        {EVENT_FILTERS.map(f => (
          <button key={f} className={`pill ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      {/* Event list */}
      <div style={{ padding: '8px 0 0' }}>
        {filtered.map((e) => {
          const isReg = registered.has(e.id);
          const liveCount = getCount(e);
          const isFlashing = flashId === e.id;

          return (
            <div key={e.id}
              onClick={() => setSelectedEvent(e)}
              style={{
                padding: '20px 24px', borderBottom: '0.5px solid var(--gold-line)',
                cursor: 'pointer', transition: 'background 200ms',
              }}>
              <div style={{ display: 'grid', gridTemplateColumns: '64px 0.5px 1fr auto', gap: 16, alignItems: 'flex-start' }}>
                {/* Date */}
                <div style={{ paddingTop: 4 }}>
                  <div style={{
                    fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                    fontWeight: 300, fontSize: 38, color: 'var(--ivory)', lineHeight: 1,
                  }}>{e.day}</div>
                  <div className="byline" style={{ marginTop: 6 }}>{e.month}</div>
                </div>
                <div style={{ width: '0.5px', alignSelf: 'stretch', background: 'var(--gold-line)' }} />
                {/* Content */}
                <div>
                  <div className="lbl" style={{ marginBottom: 6 }}>{e.tag}</div>
                  <div style={{
                    fontFamily: 'Cormorant Garamond, serif', fontSize: 19,
                    color: 'var(--ivory)', lineHeight: 1.2, fontWeight: 500,
                  }}>{e.title}</div>
                  <div className="byline" style={{ marginTop: 8 }}>
                    {e.place}
                    {liveCount > 0 && (
                      <> · <span style={{
                        color: 'var(--gold)', fontWeight: isFlashing ? 700 : 400,
                        transition: 'font-weight 300ms',
                      }}>{liveCount}</span> KATILIMCI</>
                    )}
                  </div>
                  {/* Speaker preview */}
                  {e.speakers && e.speakers.length > 0 && (
                    <div className="byline" style={{ marginTop: 5, color: 'var(--text-muted)' }}>
                      {e.speakers.map(s => s.name).join(' · ')}
                    </div>
                  )}
                </div>
                {/* Badge */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  {isReg && (
                    <div style={{
                      padding: '4px 8px', background: 'var(--gold)', color: 'var(--navy)',
                      fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 7, letterSpacing: 1.5, fontWeight: 700,
                    }}>KATILDIM</div>
                  )}
                  <span style={{ color: 'var(--gold)', fontSize: 11 }}>→</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: '36px 24px 24px', textAlign: 'center', borderTop: '0.5px solid var(--gold-line)' }}>
        <div className="byline">
          12 AYDA <span style={{ color: 'var(--gold)' }}>10 ETKİNLİK</span> · GENÇ TETSİAD 2026
        </div>
      </div>
    </div>
  );
}

window.CalendarScreen = CalendarScreen;
