/* screen-calendar.jsx — Events list */

function CalendarScreen({ onBellClick }) {
  const [filter, setFilter] = React.useState('TÜMÜ');
  const [registered, setRegistered] = React.useState(new Set([2, 5])); // pre-attended 14 May, 18 Jul
  const [openId, setOpenId] = React.useState(null);

  const filtered = filter === 'TÜMÜ' ? EVENTS : EVENTS.filter(e => e.tag === filter);

  const toggleReg = (id) => {
    setRegistered(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="screen phone-scroll no-scrollbar" style={{ paddingBottom: 100 }}>
      <AppHeader section="TAKVİM" title={<>Yaklaşan <em style={{ fontStyle: 'italic' }}>etkinlikler.</em></>} count={ANNOUNCEMENTS.length} onBellClick={onBellClick} />

      {/* Year + count */}
      <div style={{ padding: '0 24px 16px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{
          fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
          fontSize: 38, color: 'var(--gold)', fontWeight: 300, lineHeight: 1,
        }}>2026</div>
        <div className="byline">
          <span style={{ color: 'var(--gold)' }}>{filtered.length}</span> / {EVENTS.length} ETKİNLİK
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
        {filtered.map((e, i) => {
          const isOpen = openId === e.id;
          const isReg = registered.has(e.id);
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
                {/* Date column */}
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
                    {e.place}{e.count > 0 && <> &nbsp;·&nbsp; <span style={{ color: 'var(--gold)' }}>{e.count}</span> KATILIMCI</>}
                  </div>
                </div>
                {/* Chevron + badge */}
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
                    onClick={(ev) => { ev.stopPropagation(); toggleReg(e.id); }}
                    className={isReg ? 'btn btn-outline' : 'btn btn-fill'}
                    style={{ width: '100%', marginTop: 16 }}>
                    {isReg ? 'KATILIMI İPTAL ET' : 'KATIL'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer signature */}
      <div style={{
        padding: '36px 24px 24px', textAlign: 'center', borderTop: '0.5px solid var(--gold-line)',
      }}>
        <div className="byline">
          12 AYDA <span style={{ color: 'var(--gold)' }}>10 ETKİNLİK</span> · GENÇ TETSİAD 2026 PROGRAMI
        </div>
      </div>
    </div>
  );
}

window.CalendarScreen = CalendarScreen;
