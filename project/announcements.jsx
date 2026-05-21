/* announcements.jsx — duyurular banner + drawer */

// Pinned/urgent banner — top of home screen
function AnnouncementBanner({ ann, onOpen }) {
  if (!ann) return null;
  return (
    <div
      onClick={onOpen}
      className="weave"
      style={{
        margin: '0 16px 16px',
        padding: '12px 14px',
        background: 'linear-gradient(180deg, rgba(217,200,150,0.18), rgba(217,200,150,0.08))',
        border: '0.5px solid var(--gold)',
        position: 'relative',
        cursor: 'pointer',
        display: 'grid',
        gridTemplateColumns: '8px 1fr auto',
        gap: 12,
        alignItems: 'center',
      }}>
      {/* live dot */}
      <div style={{
        width: 8, height: 8, borderRadius: 999, background: 'var(--gold)',
        boxShadow: '0 0 0 4px rgba(217,200,150,0.20)',
        animation: 'pulseGold 2.4s infinite',
      }} />
      <div style={{ minWidth: 0 }}>
        <div className="byline" style={{ fontSize: 7.5, marginBottom: 4 }}>
          ANLIK DUYURU · {ann.author.toUpperCase()} · {ann.time.toUpperCase()}
        </div>
        <div style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: 14,
          color: 'var(--ivory)', lineHeight: 1.2, fontWeight: 500,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{ann.title}</div>
      </div>
      <span className="byline" style={{ color: 'var(--gold)', fontSize: 8 }}>OKU →</span>
    </div>
  );
}

// Drawer: overlays the phone screen from the top.
function NotificationDrawer({ open, onClose }) {
  // Local "read" state — clicking dismisses unread treatment
  const [readIds, setReadIds] = React.useState(new Set());

  if (!open) return null;
  const markRead = (id) => setReadIds(s => { const n = new Set(s); n.add(id); return n; });

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 200,
      display: 'flex', flexDirection: 'column',
      background: 'rgba(6,29,18,0.55)',
      backdropFilter: 'blur(10px) saturate(140%)',
      WebkitBackdropFilter: 'blur(10px) saturate(140%)',
      animation: 'fadein 200ms ease both',
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--navy-deep)',
          borderBottom: '0.5px solid var(--gold-line)',
          paddingTop: 56,
          maxHeight: 'calc(100% - 80px)',
          display: 'flex', flexDirection: 'column',
          transformOrigin: 'top',
          animation: 'slideDown 280ms cubic-bezier(.2,.7,.2,1) both',
        }}
        className="weave">
        {/* Header */}
        <div style={{
          padding: '0 24px 18px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          borderBottom: '0.5px solid var(--gold-line)',
        }}>
          <div>
            <div className="lbl" style={{ marginBottom: 6 }}>GENÇ TETSİAD · BİLDİRİMLER</div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
              fontSize: 28, color: 'var(--ivory)', fontWeight: 300, lineHeight: 1,
            }}>Duyurular.</div>
          </div>
          <span onClick={onClose} className="byline" style={{ cursor: 'pointer', color: 'var(--gold)' }}>KAPAT ✕</span>
        </div>

        {/* List */}
        <div className="no-scrollbar" style={{ overflowY: 'auto', flex: 1 }}>
          {ANNOUNCEMENTS.map(a => {
            const isRead = readIds.has(a.id);
            const tone = a.priority === 'urgent' ? 'var(--gold-bright)'
              : a.priority === 'high' ? 'var(--gold)'
              : 'var(--text-muted)';
            return (
              <div key={a.id} onClick={() => markRead(a.id)}
                style={{
                  padding: '20px 24px',
                  borderBottom: '0.5px solid var(--gold-line)',
                  display: 'grid', gridTemplateColumns: '44px 1fr', gap: 14,
                  background: isRead ? 'transparent' : 'rgba(217,200,150,0.04)',
                  cursor: 'pointer',
                  position: 'relative',
                }}>
                {/* priority strip */}
                {a.priority !== 'normal' && !isRead && (
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: tone,
                  }} />
                )}
                <Monogram initials={a.initials} gold={a.priority === 'urgent'} />
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <div className="byline" style={{ fontSize: 7.5, color: tone }}>
                      {a.priority === 'urgent' ? '● ACİL · ' : a.priority === 'high' ? '◆ ÖNEMLİ · ' : ''}
                      {a.authorRole}
                    </div>
                    <div className="byline" style={{ fontSize: 7.5 }}>{a.time}</div>
                  </div>
                  <div style={{
                    marginTop: 6,
                    fontFamily: 'Cormorant Garamond, serif', fontSize: 16,
                    color: 'var(--ivory)', lineHeight: 1.2, fontWeight: 500,
                  }}>{a.title}</div>
                  <div style={{
                    marginTop: 6, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10.5,
                    color: 'var(--text-muted)', lineHeight: 1.55, fontWeight: 300,
                  }}>{a.body}</div>
                  <div className="byline" style={{ marginTop: 8 }}>
                    <span style={{ color: 'var(--gold)' }}>{a.author}</span> · {a.date}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px 18px', borderTop: '0.5px solid var(--gold-line)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span className="byline">{ANNOUNCEMENTS.length} DUYURU · SON 7 GÜN</span>
          <span className="byline" style={{ color: 'var(--gold)', cursor: 'pointer' }}>AYARLAR ↗</span>
        </div>
      </div>
    </div>
  );
}

// Keyframes injection (once per page)
(function injectKeyframes() {
  if (document.getElementById('gtetsiad-keyframes')) return;
  const s = document.createElement('style');
  s.id = 'gtetsiad-keyframes';
  s.textContent = `
    @keyframes pulseGold {
      0%, 100% { box-shadow: 0 0 0 0 rgba(217,200,150,0.45); }
      70% { box-shadow: 0 0 0 8px rgba(217,200,150,0); }
    }
    @keyframes slideDown {
      from { transform: translateY(-10%); opacity: 0; }
      to   { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(s);
})();

window.AnnouncementBanner = AnnouncementBanner;
window.NotificationDrawer = NotificationDrawer;
