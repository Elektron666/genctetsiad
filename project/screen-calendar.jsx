/* screen-calendar.jsx — Events list */

function CalendarScreen({ onBellClick, registeredEvents: externalReg, onToggleRegistration: externalToggle }) {
  const [filter, setFilter] = React.useState('TÜMÜ');
  /* fall back to local state if no global state provided */
  const [localReg, setLocalReg] = React.useState(new Set([2, 5]));
  const registered = externalReg || localReg;

  const toggleReg = (id) => {
    if (externalToggle) {
      externalToggle(id);
    } else {
      setLocalReg(s => {
        const next = new Set(s);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    }
  };

  const [openId, setOpenId] = React.useState(null);
  /* animated counts — track per-event delta */
  const [flashId, setFlashId] = React.useState(null);

  const handleToggle = (ev, id) => {
    ev.stopPropagation();
    toggleReg(id);
    setFlashId(id);
    setTimeout(() => setFlashId(null), 600);
  };

  const filtered = filter === 'TÜMÜ' ? EVENTS : EVENTS.filter(e => e.tag === filter);

  /* live count = base count ± user registration */
  const getCount = (e) => {
    const base   = e.count;
    const wasReg = new Set([2, 5]).has(e.id); // pre-seeded
    const isReg  = registered.has(e.id);
    if (isReg && !wasReg) return base + 1;
    if (!isReg && wasReg) return base - 1;
    return base;
  };

  return (
    <div className="screen phone-scroll no-scrollbar" style={{ paddingBottom: 100 }}>
      <AppHeader section="TAKVİM" title={<>Yaklaşan <em style={{ fontStyle: 'italic' }}>etkinlikler.</em></>}
        count={ANNOUNCEMENTS.length} onBellClick={onBellClick} />

      {/* Year + count */}
      <div style={{ padding: '0 24px 16px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{
          fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
          fontSize: 38, color: 'var(--gold)', fontWeight: 300, lineHeight: 1,
        }}>2026</div>
        <div className="byline">
          <span style={{ color: 'var(--gold)' }}>{filtered.length}</span> / {EVENTS.length} ETKİNLİK
          {registered.size > 0 && (
            <> · <span style={{ color: 'var(--gold)' }}>{registered.size}</span> KATILIM</>
          )}
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
          const isOpen = openId === e.id;
          const isReg  = registered.has(e.id);
          const liveCount = getCount(e);
          const isFlashing = flashId === e.id;

          return (
            <div key={e.id} style={{
              padding: '22px 24px',
              borderBottom: '0.5px solid var(--gold-line)',
              cursor: 'pointer',
              transition: 'background 200ms',
              background: isOpen ? 'var(--navy-mid)' : 'transparent',
            }}
              onClick={() => setOpenId(isOpen ? null : e.id)}>

              <div style={{ display: 'grid', gridTemplateColumns: '64px 0.5px 1fr auto', gap: 16, alignItems: 'flex-start' }}>
                {/* Date */}
                <div style={{ paddingTop: 4 }}>
                  <div style={{
                    fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                    fontWeight: 300, fontSize: 38, color: 'var(--ivory)', lineHeight: 1,
                  }}>{e.day}</div>
                  <div className="byline" style={{ marginTop: 6 }}>{e.month}</div>
                </div>
                {/* Vertical rule */}
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
                      <>
                        &nbsp;·&nbsp;
                        <span style={{
                          color: 'var(--gold)',
                          transition: 'color 300ms',
                          fontWeight: isFlashing ? 700 : 400,
                        }}>{liveCount}</span> KATILIMCI
                      </>
                    )}
                  </div>
                </div>
                {/* Badge + chevron */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                  {isReg && (
                    <div style={{
                      padding: '4px 8px', background: 'var(--gold)', color: 'var(--navy)',
                      fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 7.5, letterSpacing: 1.5, fontWeight: 700,
                    }}>KATILDIM</div>
                  )}
                  <Chev dir={isOpen ? 'up' : 'down'} size={9} />
                </div>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div className="fade-in" style={{ marginTop: 18, paddingLeft: 80 }}>
                  <PhotoPH height={150} label={e.photoLabel} tone="navy" />
                  <div style={{
                    marginTop: 14, fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6,
                  }}>{e.desc}</div>
                  <button
                    onClick={(ev) => handleToggle(ev, e.id)}
                    className={isReg ? 'btn btn-outline' : 'btn btn-fill'}
                    style={{ width: '100%', marginTop: 16 }}>
                    {isReg ? '✓ KATILIMI İPTAL ET' : 'KATIL →'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: '36px 24px 24px', textAlign: 'center', borderTop: '0.5px solid var(--gold-line)' }}>
        <div className="byline">
          12 AYDA <span style={{ color: 'var(--gold)' }}>10 ETKİNLİK</span> · GENÇ TETSİAD 2026 PROGRAMI
        </div>
      </div>
    </div>
  );
}

window.CalendarScreen = CalendarScreen;
