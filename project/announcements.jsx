/* announcements.jsx — duyurular banner + drawer */

function AnnouncementBanner({ ann, onOpen }) {
  if (!ann) return null;
  return (
    <div onClick={onOpen} className="weave" style={{
      margin: '0 16px 16px', padding: '12px 14px',
      background: 'linear-gradient(180deg, rgba(217,200,150,0.18), rgba(217,200,150,0.08))',
      border: '0.5px solid var(--gold)',
      position: 'relative', cursor: 'pointer',
      display: 'grid', gridTemplateColumns: '8px 1fr auto', gap: 12, alignItems: 'center',
    }}>
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

function NotificationDrawer({ open, onClose }) {
  const [readIds, setReadIds] = React.useState(new Set());
  const [activeTab, setActiveTab] = React.useState('DUYURULAR');

  const TABS_DEF = [
    { k: 'DUYURULAR', label: 'DUYURULAR', items: ANNOUNCEMENTS, unread: ANNOUNCEMENTS.length },
    { k: 'ETKİNLİKLER', label: 'ETKİNLİKLER', items: typeof EVENT_NOTIFICATIONS !== 'undefined' ? EVENT_NOTIFICATIONS : [], unread: 2 },
    { k: 'SİSTEM', label: 'SİSTEM', items: typeof SYSTEM_NOTIFICATIONS !== 'undefined' ? SYSTEM_NOTIFICATIONS : [], unread: 1 },
  ];

  if (!open) return null;

  const markRead = (id) => setReadIds(s => { const n = new Set(s); n.add(id); return n; });

  const currentItems = (TABS_DEF.find(t => t.k === activeTab) || TABS_DEF[0]).items;
  const totalUnread  = TABS_DEF.reduce((acc, t) => acc + (readIds.size < t.items.length ? t.unread : 0), 0);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 200,
      display: 'flex', flexDirection: 'column',
      background: 'rgba(6,29,18,0.55)',
      backdropFilter: 'blur(10px) saturate(140%)',
      WebkitBackdropFilter: 'blur(10px) saturate(140%)',
      animation: 'fadein 200ms ease both',
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--navy-deep)',
        borderBottom: '0.5px solid var(--gold-line)',
        paddingTop: 56,
        maxHeight: 'calc(100% - 80px)',
        display: 'flex', flexDirection: 'column',
        transformOrigin: 'top',
        animation: 'slideDown 280ms cubic-bezier(.2,.7,.2,1) both',
      }} className="weave">

        {/* Header */}
        <div style={{
          padding: '0 24px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          borderBottom: '0.5px solid var(--gold-line)',
        }}>
          <div>
            <div className="lbl" style={{ marginBottom: 6 }}>GENÇ TETSİAD · BİLDİRİMLER</div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
              fontSize: 26, color: 'var(--ivory)', fontWeight: 300, lineHeight: 1,
            }}>
              Bildirimler.
              {totalUnread > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 20, height: 20, borderRadius: 999,
                  background: 'var(--gold)', color: 'var(--navy)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 9, fontWeight: 700,
                  marginLeft: 10, verticalAlign: 'middle',
                }}>{totalUnread}</span>
              )}
            </div>
          </div>
          <span onClick={onClose} className="byline" style={{ cursor: 'pointer', color: 'var(--gold)' }}>KAPAT ✕</span>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '0.5px solid var(--gold-line)',
          flexShrink: 0,
        }}>
          {TABS_DEF.map(t => (
            <div key={t.k} onClick={() => setActiveTab(t.k)} style={{
              flex: 1, textAlign: 'center', padding: '12px 4px',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 8, letterSpacing: 2, fontWeight: 600,
              color: activeTab === t.k ? 'var(--gold)' : 'var(--text-muted)',
              cursor: 'pointer',
              borderBottom: activeTab === t.k ? '1px solid var(--gold)' : '1px solid transparent',
              marginBottom: -0.5,
              position: 'relative',
            }}>
              {t.label}
              {t.unread > 0 && activeTab !== t.k && (
                <span style={{
                  position: 'absolute', top: 8, right: 6,
                  width: 5, height: 5, borderRadius: 999, background: 'var(--gold)',
                }} />
              )}
            </div>
          ))}
        </div>

        {/* List */}
        <div className="no-scrollbar fade-in" style={{ overflowY: 'auto', flex: 1 }}>
          {currentItems.length === 0 && (
            <div style={{ padding: '36px 24px', textAlign: 'center' }}>
              <div className="byline" style={{ color: 'var(--text-muted)' }}>BİLDİRİM YOK</div>
            </div>
          )}
          {currentItems.map(a => {
            const isRead = readIds.has(a.id);
            const tone = a.priority === 'urgent' ? 'var(--gold-bright)'
              : a.priority === 'high' ? 'var(--gold)'
              : 'var(--text-muted)';
            return (
              <div key={a.id} onClick={() => markRead(a.id)} style={{
                padding: '18px 24px',
                borderBottom: '0.5px solid var(--gold-line)',
                display: 'grid', gridTemplateColumns: '40px 1fr', gap: 14,
                background: isRead ? 'transparent' : 'rgba(217,200,150,0.04)',
                cursor: 'pointer', position: 'relative',
              }}>
                {a.priority !== 'normal' && !isRead && (
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: tone,
                  }} />
                )}
                <Monogram initials={a.initials} gold={a.priority === 'urgent'} size="sm" />
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <div className="byline" style={{ fontSize: 7, color: tone }}>
                      {a.priority === 'urgent' ? '● ACİL · ' : a.priority === 'high' ? '◆ ÖNEMLİ · ' : ''}
                      {a.authorRole}
                    </div>
                    <div className="byline" style={{ fontSize: 7 }}>{a.time}</div>
                  </div>
                  <div style={{
                    marginTop: 5,
                    fontFamily: 'Cormorant Garamond, serif', fontSize: 15,
                    color: 'var(--ivory)', lineHeight: 1.2, fontWeight: 500,
                  }}>{a.title}</div>
                  <div style={{
                    marginTop: 5, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10,
                    color: 'var(--text-muted)', lineHeight: 1.55, fontWeight: 300,
                  }}>{a.body}</div>
                  <div className="byline" style={{ marginTop: 7 }}>
                    <span style={{ color: 'var(--gold)' }}>{a.author || 'SİSTEM'}</span> · {a.date}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 24px 18px', borderTop: '0.5px solid var(--gold-line)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <span className="byline">{currentItems.length} BİLDİRİM</span>
          <span className="byline" style={{ color: 'var(--gold)', cursor: 'pointer' }}>
            TÜMÜNÜ OKUNDU İŞARETLE
          </span>
        </div>
      </div>
    </div>
  );
}

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
