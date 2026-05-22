/* screen-news.jsx — Haberler & Gündem */

function InstagramFeed() {
  const [loaded, setLoaded] = React.useState({});

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Feed header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 24px 18px',
        borderBottom: '0.5px solid var(--gold-line)',
        marginBottom: 0,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="white" strokeWidth="2"/>
            <circle cx="12" cy="12" r="5" stroke="white" strokeWidth="2"/>
            <circle cx="17.5" cy="6.5" r="1.5" fill="white"/>
          </svg>
        </div>
        <div>
          <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 11, fontWeight: 600, color: 'var(--ivory)', letterSpacing: 0.5 }}>
            @genctetsiad · @tetsiad
          </div>
          <div className="byline" style={{ fontSize: 8, marginTop: 1 }}>Canlı Instagram akışı · {INSTAGRAM_POSTS.length} gönderi</div>
        </div>
      </div>

      {INSTAGRAM_POSTS.map((post, i) => (
        <div key={post.id} style={{ borderBottom: '0.5px solid var(--gold-line)' }}>
          {/* Post header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 24px 10px',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: post.account === 'genctetsiad'
                ? 'linear-gradient(135deg,var(--green-dark),var(--green))'
                : 'linear-gradient(135deg,var(--navy-mid),var(--green))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1.5px solid var(--gold)',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono', color: 'var(--gold)', fontWeight: 500 }}>
                {post.account === 'genctetsiad' ? 'GT' : 'T'}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 11, fontWeight: 600, color: 'var(--ivory)' }}>
                @{post.account}
              </div>
              <div className="byline" style={{ fontSize: 8, marginTop: 1 }}>
                {post.type === 'reel' ? '▶ REEL' : '◼ GÖNDERI'}
              </div>
            </div>
            <a href={`https://www.instagram.com/${post.type === 'reel' ? 'reel' : 'p'}/${post.id}/`}
              target="_blank" rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
              onClick={e => e.stopPropagation()}>
              <span className="byline" style={{ color: 'var(--gold)', fontSize: 9 }}>AÇ ↗</span>
            </a>
          </div>

          {/* Caption */}
          <div style={{
            padding: '0 24px 12px',
            fontFamily: 'Plus Jakarta Sans', fontSize: 11, color: 'var(--text-muted)',
            lineHeight: 1.55,
          }}>{post.caption}</div>

          {/* Embedded iframe */}
          <div style={{ position: 'relative', background: 'var(--navy-mid)', minHeight: 120 }}>
            {!loaded[post.id] && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 10, zIndex: 2,
                background: 'var(--navy-mid)',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  border: '2px solid var(--gold-line)', borderTopColor: 'var(--gold)',
                  animation: 'spin 1s linear infinite',
                }} />
                <div className="byline" style={{ fontSize: 8, color: 'var(--text-muted)' }}>YÜKLENIYOR</div>
              </div>
            )}
            <iframe
              src={`https://www.instagram.com/${post.type === 'reel' ? 'reel' : 'p'}/${post.id}/embed/captioned/`}
              width="100%"
              height={post.type === 'reel' ? 540 : 480}
              frameBorder="0"
              scrolling="no"
              allowTransparency="true"
              style={{ display: 'block', border: 0 }}
              onLoad={() => setLoaded(s => ({ ...s, [post.id]: true }))}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

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
      <ImageSlot id={`gt-art-${item.id}`} height={220} label={item.photoLabel} src={item.src} />

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
  const [source, setSource] = React.useState('haberler');
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

      {/* Source selector */}
      <div style={{ display: 'flex', padding: '0 24px 16px', gap: 8 }}>
        {[['haberler', 'HABERLER'], ['instagram', 'INSTAGRAM']].map(([k, lbl]) => (
          <button key={k}
            onClick={() => setSource(k)}
            style={{
              flex: 1, padding: '9px 0',
              background: source === k ? 'var(--gold)' : 'transparent',
              border: `0.5px solid ${source === k ? 'var(--gold)' : 'var(--gold-line)'}`,
              color: source === k ? 'var(--navy-deep)' : 'var(--text-muted)',
              fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600,
              fontSize: 9, letterSpacing: 1.5,
              cursor: 'pointer', transition: 'all 150ms',
            }}>{lbl}</button>
        ))}
      </div>

      {/* Instagram feed */}
      {source === 'instagram' && <InstagramFeed />}

      {/* Haberler content */}
      {source === 'haberler' && <>

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
          <ImageSlot id={`gt-news-feat-${featured.id}`} height={200} label={featured.photoLabel} src={featured.src} />
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
          <ImageSlot id={`gt-news-th-${n.id}`} height={72} label={n.photoLabel} src={n.src} />
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

      </>}
    </div>
  );
}

window.NewsScreen = NewsScreen;
