/* primitives.jsx — small shared bits */

// TETSİAD logo (simplified mono mark — original drawn from spec, ivory or gold)
function TetsiadLogo({ size = 34, color = '#F5F0E6', subtitle = false, badgeText = '#0F6B45' }) {
  // House peak with "1991" badge + TETSIAD wordmark
  return (
    <div className="logo-wrap" style={{ flexDirection: 'column', gap: subtitle ? 4 : 0 }}>
      <svg width={size * 2.6} height={size} viewBox="0 0 260 100" fill="none">
        {/* roof outline (double peak) */}
        <path d="M 20 70 L 130 14 L 240 70" stroke={color} strokeWidth="3.5" strokeLinejoin="miter" fill="none" />
        <path d="M 50 70 L 130 30 L 210 70" stroke={color} strokeWidth="2" strokeLinejoin="miter" fill="none" />
        {/* 1991 badge */}
        <circle cx="195" cy="30" r="12" fill={color} />
        <text x="195" y="33" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="9" fontWeight="700" textAnchor="middle" fill={badgeText}>1991</text>
        {/* wordmark */}
        <text x="130" y="92" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="32" fontWeight="700" letterSpacing="3" textAnchor="middle" fill={color}>TETSIAD</text>
      </svg>
      {subtitle && (
        <div style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: 6.5, letterSpacing: 2.2, color, opacity: 0.85,
        }}>
          TÜRKİYE EV TEKSTİLİ SANAYİCİLERİ VE İŞ İNSANLARI DERNEĞİ
        </div>
      )}
    </div>
  );
}

// Small monogram circle
function Monogram({ initials, gold = false, size = 'md' }) {
  const cls = `monogram ${gold ? 'monogram-gold' : ''} ${size === 'lg' ? 'monogram-large' : size === 'sm' ? 'monogram-sm' : ''}`;
  return <div className={cls}>{initials}</div>;
}

// Section label with chevron-style marker
function SectionLabel({ children, num }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {num !== undefined && (
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'var(--gold)', letterSpacing: 2 }}>
          {String(num).padStart(2, '0')}
        </span>
      )}
      <span style={{ width: 18, height: '0.5px', background: 'var(--gold)' }} />
      <span className="lbl">{children}</span>
    </div>
  );
}

// Bell with optional dot badge
function BellIcon({ count = 0, color = '#C4A265' }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8z" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M10 20a2 2 0 0 0 4 0" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      {count > 0 && (
        <span style={{
          position: 'absolute', top: -3, right: -3,
          minWidth: 14, height: 14, padding: '0 4px',
          background: 'var(--gold)', color: 'var(--navy)',
          borderRadius: 999,
          fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 8.5, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          letterSpacing: 0,
        }}>{count}</span>
      )}
    </div>
  );
}

// User-fillable image slot — falls back to striped placeholder when empty.
// The <image-slot> custom element handles drag/drop persistence.
function ImageSlot({ id, height = 180, label = 'GÖRSEL', shape = 'rect', radius = 0 }) {
  return (
    <image-slot
      id={id}
      shape={shape}
      radius={radius}
      placeholder={`↳ ${label.toUpperCase()}  ·  görseli buraya bırakın`}
      style={{
        display: 'block', width: '100%', height,
        background: 'repeating-linear-gradient(135deg, rgba(217,200,150,0.10) 0 1px, transparent 1px 9px), #1B7A4F',
        '--isl-empty-fg': 'var(--text-muted)',
        '--isl-empty-bg': 'transparent',
        '--isl-empty-border': 'transparent',
      }} />
  );
}

// Search icon (line)
function SearchIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="6.5" stroke={color} strokeWidth="1.2" />
      <path d="m20 20-4-4" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// Tiny chevron right
function ChevronRight({ size = 10, color = 'var(--gold)' }) {
  return (
    <svg width={size} height={size * 1.6} viewBox="0 0 10 16" fill="none">
      <path d="M2 2l6 6-6 6" stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// App header bar — sits at top of each tab screen (below iOS status bar area)
function AppHeader({ section, title, count = 0, dark = true, onBellClick }) {
  return (
    <div style={{
      paddingTop: 56, // leave space for iOS status bar / dynamic island
      paddingLeft: 24, paddingRight: 24, paddingBottom: 16,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      background: dark ? 'var(--navy)' : 'var(--ivory)',
    }}>
      <div>
        <div className={`lbl ${!dark ? 'lbl-navy' : ''}`} style={{ marginBottom: 6, opacity: dark ? 0.9 : 0.7 }}>
          GENÇ TETSİAD · {section}
        </div>
        <div style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: 28,
          lineHeight: 1.05,
          color: dark ? 'var(--ivory)' : 'var(--navy)',
        }}>
          {title}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 4 }}>
        <div onClick={onBellClick} style={{ cursor: onBellClick ? 'pointer' : 'default', padding: 4, margin: -4 }}>
          <BellIcon count={count} color={dark ? '#D9C896' : '#0F6B45'} />
        </div>
        <TetsiadLogo size={22} color={dark ? '#F5F0E6' : '#0F6B45'} />
      </div>
    </div>
  );
}

// Diagonal weave background SVG (for hero blocks)
function WeavePattern({ opacity = 0.06 }) {
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity }}>
      <defs>
        <pattern id="weave" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
          <path d="M0 14L14 0M7 14L14 7M0 7L7 0" stroke="#C4A265" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#weave)" />
    </svg>
  );
}

// Caret (chev) up/down for app
function Chev({ dir = 'down', size = 8, color = 'var(--gold)' }) {
  const rot = { down: 0, up: 180, left: 90, right: -90 }[dir];
  return (
    <svg width={size * 1.6} height={size} viewBox="0 0 16 10" fill="none" style={{ transform: `rotate(${rot}deg)` }}>
      <path d="M2 2l6 6 6-6" stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// Reusable striped photo placeholder
function PhotoPH({ height = 140, label = 'PHOTO', tone = 'navy' }) {
  return (
    <div className="photo-ph" style={{
      width: '100%', height,
      background: tone === 'navy'
        ? 'repeating-linear-gradient(135deg, rgba(217,200,150,0.12) 0 1px, transparent 1px 9px), linear-gradient(180deg, rgba(7,51,35,0.4), rgba(7,51,35,0)), #1B7A4F'
        : 'repeating-linear-gradient(135deg, rgba(7,51,35,0.10) 0 1px, transparent 1px 9px), #ECE6D2',
      color: tone === 'navy' ? 'var(--text-muted)' : 'var(--navy)',
    }}>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8.5, letterSpacing: 2 }}>↳ {label}</span>
    </div>
  );
}

/* Modal bottom sheet */
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24,
        }}>
          <div>
            <div className="lbl" style={{ marginBottom: 8 }}>GENÇ TETSİAD</div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
              fontWeight: 300, fontSize: 26, color: 'var(--ivory)', lineHeight: 1,
            }}>{title}</div>
          </div>
          <span onClick={onClose} className="byline" style={{ cursor: 'pointer', color: 'var(--gold)', paddingTop: 4 }}>✕</span>
        </div>
        {children}
      </div>
    </div>
  );
}

/* Toast notification — auto-dismiss after 3s */
function Toast({ message, type = 'success', onDone }) {
  React.useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className={`toast toast-${type}`}>
      <span style={{ color: type === 'success' ? 'var(--gold)' : type === 'error' ? '#e05050' : 'var(--text-muted)' }}>
        {type === 'success' ? '✓' : type === 'error' ? '✕' : '·'}
      </span>
      {message}
    </div>
  );
}

/* ToastContainer — place inside the phone screen wrapper */
function ToastContainer({ toasts, onRemove }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <Toast key={t.id} message={t.message} type={t.type} onDone={() => onRemove(t.id)} />
      ))}
    </div>
  );
}

/* useToast hook */
function useToast() {
  const [toasts, setToasts] = React.useState([]);
  const show = React.useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(ts => [...ts, { id, message, type }]);
  }, []);
  const remove = React.useCallback((id) => {
    setToasts(ts => ts.filter(t => t.id !== id));
  }, []);
  return { toasts, show, remove };
}

/* Skeleton loader lines */
function SkeletonLine({ width = '100%' }) {
  return <div className="skeleton skeleton-line" style={{ width }} />;
}
function SkeletonCard() {
  return (
    <div style={{ padding: '20px 24px', borderBottom: '0.5px solid var(--gold-line)' }}>
      <div style={{ display: 'flex', gap: 14 }}>
        <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 999, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <SkeletonLine width="70%" />
          <SkeletonLine width="45%" />
          <div className="skeleton skeleton-sm" />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  TetsiadLogo, Monogram, SectionLabel, BellIcon, SearchIcon,
  ChevronRight, AppHeader, WeavePattern, Chev, PhotoPH, ImageSlot,
  Modal, Toast, ToastContainer, useToast, SkeletonLine, SkeletonCard,
});
