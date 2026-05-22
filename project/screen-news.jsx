/* screen-news.jsx — Haberler & Gündem */

function ArticleView({ item, onBack }) {
  return (
    <div className="screen phone-scroll no-scrollbar" style={{ paddingBottom: 60 }}>
      {/* Back bar */}
      <div style={{
        padding: '54px 24px 14px',
        borderBottom: '0.5px solid var(--gold-line)',
        background: 'var(--navy-deep)',
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <span onClick={onBack} style={{
          cursor: 'pointer', color: 'var(--gold)',
          fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 8, letterSpacing: 2,
        }}>← GERİ</span>
        <span className="lbl" style={{ fontSize: 7 }}>{item.tag}</span>
      </div>

      {/* Cover */}
      <ImageSlot id={`gt-art-${item.id}`} height={220} label={item.photoLabel} />

      {/* Article body */}
      <div style={{ padding: '24px 24px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
          <div className="lbl" style={{ color: 'var(--gold)', fontSize: 8 }}>{item.tag}</div>
          <div className="byline">{item.date}</div>
        </div>

        <div style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: 26,
          color: 'var(--ivory)', lineHeight: 1.18, fontWeight: 500, marginBottom: 22,
        }}>{item.title}</div>

        <div style={{ height: '0.5px', background: 'var(--gold-line)', marginBottom: 22 }} />

        {(item.body || [item.excerpt]).map((para, i) => (
          <div key={i} style={{
            fontFamily: i === 0 ? 'Cormorant Garamond, serif' : 'Plus Jakarta Sans, sans-serif',
            fontStyle: i === 0 ? 'italic' : 'normal',
            fontSize: i === 0 ? 17 : 12,
            color: i === 0 ? 'var(--ivory)' : 'var(--text-muted)',
            lineHeight: i === 0 ? 1.55 : 1.72,
            fontWeight: i === 0 ? 400 : 300,
            marginBottom: 18,
          }}>{para}</div>
        ))}

        {/* Footer */}
        <div style={{
          marginTop: 28, paddingTop: 18, borderTop: '0.5px solid var(--gold-line)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div className="byline" style={{ marginBottom: 2 }}>GENÇ TETSİAD · {item.date}</div>
            <div className="byline" style={{ color: 'var(--gold)' }}>genctetsiad@tetsiad.org</div>
          </div>
          <span className="byline" style={{ color: 'var(--gold)', cursor: 'pointer', fontSize: 9 }}>PAYLAŞ ↗</span>
        </div>
      </div>
    </div>
  );
}

function NewsScreen({ onBellClick }) {
  const [tagFilter, setTagFilter] = React.useState('TÜMÜ');
  const [article, setArticle] = React.useState(null);

  if (article) return <ArticleView item={article} onBack={() => setArticle(null)} />;

  const allTags = ['TÜMÜ', ...Array.from(new Set(NEWS.map(n => n.tag)))];
  const filtered = tagFilter === 'TÜMÜ' ? NEWS : NEWS.filter(n => n.tag === tagFilter);
  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="screen phone-scroll no-scrollbar" style={{ paddingBottom: 100 }}>
      <AppHeader section="GÜNDEM"
        title={<>Sektörden <em style={{ fontStyle: 'italic' }}>haberler.</em></>}
        count={ANNOUNCEMENTS.length} onBellClick={onBellClick} />

      {/* Tag filters */}
      <div className="no-scrollbar" style={{
        display: 'flex', gap: 8, overflowX: 'auto', padding: '0 24px 18px',
      }}>
        {allTags.map(t => (
          <button key={t} className={`pill ${tagFilter === t ? 'active' : ''}`}
            onClick={() => setTagFilter(t)}>{t}</button>
        ))}
      </div>

      {/* Featured */}
      {featured && (
        <div onClick={() => setArticle(featured)} style={{
          cursor: 'pointer', borderBottom: '0.5px solid var(--gold-line)',
        }}>
          <ImageSlot id={`gt-news-feat-${featured.id}`} height={200} label={featured.photoLabel} />
          <div style={{ padding: '18px 24px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div className="lbl" style={{ fontSize: 8, color: 'var(--gold)' }}>{featured.tag} · ÖNE ÇIKAN</div>
              <div className="byline">{featured.date}</div>
            </div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: 22,
              color: 'var(--ivory)', lineHeight: 1.2, fontWeight: 500,
            }}>{featured.title}</div>
            <div style={{
              marginTop: 10, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12,
              color: 'var(--text-muted)', lineHeight: 1.55,
            }}>{featured.excerpt}</div>
            <div style={{ marginTop: 14 }}>
              <span className="byline" style={{ color: 'var(--gold)' }}>DEVAMINI OKU →</span>
            </div>
          </div>
        </div>
      )}

      {/* Rest of list */}
      {rest.map(n => (
        <div key={n.id} onClick={() => setArticle(n)} style={{
          padding: '16px 24px',
          borderBottom: '0.5px solid var(--gold-line)',
          display: 'grid', gridTemplateColumns: '88px 1fr', gap: 14,
          cursor: 'pointer', alignItems: 'flex-start',
          transition: 'background 150ms',
        }}>
          <ImageSlot id={`gt-news-th-${n.id}`} height={72} label={n.photoLabel} />
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <div className="lbl" style={{ fontSize: 7.5 }}>{n.tag}</div>
              <div className="byline" style={{ fontSize: 7 }}>{n.date}</div>
            </div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: 15.5,
              color: 'var(--ivory)', lineHeight: 1.2, fontWeight: 500,
            }}>{n.title}</div>
            <div style={{
              marginTop: 6, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10,
              color: 'var(--text-muted)', lineHeight: 1.4,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>{n.excerpt}</div>
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div className="byline" style={{ color: 'var(--text-muted)' }}>SONUÇ BULUNAMADI</div>
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: '28px 24px', textAlign: 'center', borderTop: '0.5px solid var(--gold-line)' }}>
        <div className="byline">
          {filtered.length} HABER · <span style={{ color: 'var(--gold)' }}>@genctetsiad</span>
        </div>
      </div>
    </div>
  );
}

window.NewsScreen = NewsScreen;
