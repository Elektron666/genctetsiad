/* screen-home.jsx — Main cover screen */

/* Animated counter hook — counts from 0 to target */
function useCounter(target, duration = 1200, delay = 0) {
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    let startTime = null;
    let raf;
    const tick = (now) => {
      if (!startTime) startTime = now + delay;
      const elapsed = now - startTime;
      if (elapsed < 0) { raf = requestAnimationFrame(tick); return; }
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setVal(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, delay]);
  return val;
}

function HomeScreen({ onBellClick, openDrawer, registeredEvents, onNavigate }) {
  const banner = ANNOUNCEMENTS.find(a => a.pinned) || ANNOUNCEMENTS[0];
  return (
    <div className="screen phone-scroll no-scrollbar" style={{ paddingBottom: 100 }}>

      {/* ── FULL-SCREEN MAGAZINE COVER ─────────────────────── */}
      <div style={{ position: 'relative', height: 580, flexShrink: 0 }}>
        <ImageSlot id="gt-president-hero" height={580} label="Kapak · Resul Öden Kürsüde"
          src="https://picsum.photos/seed/gt-president-stage/800/1000" />

        {/* gradient — heavy at top + bottom, open in middle */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(5,28,17,0.88) 0%, rgba(5,28,17,0.08) 38%, rgba(5,28,17,0.12) 55%, rgba(5,28,17,0.94) 100%)',
        }} />

        {/* Top bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: '52px 24px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div className="lbl" style={{ fontSize: 7, letterSpacing: 2 }}>GENÇ TETSİAD · SAYI 01 · MAYIS 2026</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div onClick={onBellClick} style={{ cursor: 'pointer', padding: 4, margin: -4 }}>
              <BellIcon count={ANNOUNCEMENTS.length} color="#D9C896" />
            </div>
            <TetsiadLogo size={20} color="#F5F0E6" />
          </div>
        </div>

        {/* Main title block */}
        <div style={{ position: 'absolute', bottom: 128, left: 24, right: 24 }}>
          <div style={{
            fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontWeight: 300,
            fontSize: 54, color: '#F5F0E6', lineHeight: 0.9, letterSpacing: '-1px',
          }}>
            Değişim<br/>
            gençlerle<br/>
            <span style={{ color: 'var(--gold)' }}>olacak.</span>
          </div>
          <div style={{
            marginTop: 14, fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 11, color: 'rgba(245,240,230,0.65)', lineHeight: 1.5, maxWidth: 260,
          }}>
            Türkiye ev tekstilinin genç iş insanları platformu.
          </div>
        </div>

        {/* CTA row + scroll hint */}
        <div style={{ position: 'absolute', bottom: 28, left: 24, right: 24 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <button className="btn btn-fill" style={{ flex: 1 }}>BAŞVUR</button>
            <button className="btn btn-outline" style={{ flex: 1 }}>MANİFESTO</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.45 }}>
            <div style={{ flex: 1, height: '0.5px', background: 'rgba(217,200,150,0.6)' }} />
            <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 7, letterSpacing: 2.5, color: 'var(--gold)' }}>AŞAĞI KAYDIRIN</span>
            <div style={{ flex: 1, height: '0.5px', background: 'rgba(217,200,150,0.6)' }} />
          </div>
        </div>
      </div>

      {/* Live announcement banner (below cover) */}
      <div style={{ marginTop: 0 }}>
        <AnnouncementBanner ann={banner} onOpen={onBellClick} />
      </div>

      {/* Quick access 3 cards */}
      <div style={{ padding: '0 24px 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: -4, marginBottom: 0 }}>
        {[
          { icon: '◈', label: 'Üyelere\nUlaş', sub: 'Rehber', screen: 'directory' },
          { icon: '◆', label: 'Sektörel\nGelişim', sub: 'Akademi', screen: 'academy' },
          { icon: '◉', label: 'Trendleri\nKeşfet', sub: 'Gündem', screen: 'news' },
        ].map(card => (
          <div key={card.screen} onClick={() => onNavigate && onNavigate(card.screen)}
            className="weave" style={{
              padding: '16px 12px 14px', cursor: 'pointer',
              background: 'rgba(217,200,150,0.06)', border: '0.5px solid var(--gold-line)',
              textAlign: 'center',
            }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 24, color: 'var(--gold)', lineHeight: 1, marginBottom: 8 }}>{card.icon}</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 13, color: 'var(--ivory)', lineHeight: 1.2, fontWeight: 500, whiteSpace: 'pre-line', marginBottom: 6 }}>{card.label}</div>
            <div className="byline" style={{ fontSize: 7 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Sustainability pillars */}
      <section style={{ padding: '36px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
          <SectionLabel num={1}>SÜRDÜRÜLEBİLİR TEKSTİL · 4 SÜTUN</SectionLabel>
          <span className="byline" style={{ color: 'var(--gold)', cursor: 'pointer' }}
            onClick={() => onNavigate && onNavigate('sustainability')}>DETAY ↗</span>
        </div>
        <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {PILLARS.map(p => (
            <div key={p.id} style={{
              padding: '14px 14px 16px',
              border: '0.5px solid var(--gold-line)',
              background: 'rgba(217,200,150,0.04)',
            }}>
              <div className="lbl" style={{ fontSize: 8, marginBottom: 8 }}>
                {String(p.id).padStart(2, '0')}
              </div>
              <div style={{
                fontFamily: 'Cormorant Garamond, serif', fontSize: 15,
                color: 'var(--ivory)', lineHeight: 1.15, fontWeight: 500, marginBottom: 6,
              }}>{p.title}</div>
              <div style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10,
                color: 'var(--text-muted)', lineHeight: 1.45, fontWeight: 300,
              }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Sürdürülebilirlik dashboard */}
      <section style={{ padding: '36px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
          <SectionLabel num={2}>SÜRDÜRÜLEBİLİRLİK · 2030</SectionLabel>
          <span className="byline" style={{ color: 'var(--gold)' }}>{SUSTAINABILITY.headline.toUpperCase()}</span>
        </div>
        <div style={{
          background: 'rgba(217,200,150,0.05)', border: '0.5px solid var(--gold-line)',
          padding: '18px 18px 16px',
        }}>
          {SUSTAINABILITY.metrics.map((m, i) => (
            <div key={m.id} style={{
              padding: i === 0 ? '0 0 14px' : '14px 0',
              borderTop: i === 0 ? 'none' : '0.5px solid var(--gold-line)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif', fontSize: 13,
                  color: 'var(--ivory)', lineHeight: 1, fontWeight: 500,
                }}>{m.label}</div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                  color: 'var(--gold)', letterSpacing: 1,
                }}>{m.value} / {m.target} {m.unit}</div>
              </div>
              <div className="bar" style={{ height: 3 }}>
                <div style={{ width: `${(m.value / m.target) * 100}%` }} />
              </div>
              <div className="byline" style={{ marginTop: 6, fontSize: 7.5 }}>
                <span style={{ color: 'var(--gold)' }}>HEDEFE</span> {m.delta} · ÜYE ŞİRKET ORTALAMASI
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* İhracat snapshot */}
      <section style={{ padding: '36px 24px 0' }}>
        <SectionLabel num={3}>İHRACAT · {EXPORTS.period}</SectionLabel>
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ padding: '18px 14px', background: 'var(--navy-mid)', border: '0.5px solid var(--gold-line)' }}>
            <div className="byline" style={{ marginBottom: 8 }}>TOPLAM</div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
              fontSize: 34, color: 'var(--ivory)', lineHeight: 1, fontWeight: 300,
            }}>{EXPORTS.total}</div>
            <div className="byline" style={{ marginTop: 8, color: 'var(--gold)' }}>YOY {EXPORTS.growth}</div>
          </div>
          <div style={{ padding: '18px 14px', background: 'var(--navy-mid)', border: '0.5px solid var(--gold-line)' }}>
            <div className="byline" style={{ marginBottom: 8 }}>EN BÜYÜK PAZAR</div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
              fontSize: 22, color: 'var(--ivory)', lineHeight: 1, fontWeight: 400,
            }}>ABD</div>
            <div className="byline" style={{ marginTop: 8, color: 'var(--gold)' }}>%22 PAY</div>
          </div>
        </div>

        {/* Country shares */}
        <div style={{ marginTop: 16 }}>
          {EXPORTS.topMarkets.map((c, i) => (
            <div key={c.country} style={{
              display: 'grid', gridTemplateColumns: '80px 1fr 40px', alignItems: 'center', gap: 12,
              padding: '10px 0', borderTop: i === 0 ? '0.5px solid var(--gold-line)' : 'none',
              borderBottom: '0.5px solid var(--gold-line)',
            }}>
              <div style={{
                fontFamily: 'Cormorant Garamond, serif', fontSize: 14,
                color: 'var(--ivory)', lineHeight: 1,
              }}>{c.country}</div>
              <div className="bar"><div style={{ width: `${c.share * 3.2}%` }} /></div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--gold)',
                textAlign: 'right', letterSpacing: 1,
              }}>%{c.share}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Vision & Mission */}
      <section style={{ padding: '40px 24px 0' }}>
        <SectionLabel num={4}>VİZYON · MİSYON</SectionLabel>
        <div style={{
          marginTop: 22, display: 'grid', gridTemplateColumns: '1fr', gap: 24,
        }}>
          <div>
            <div className="byline" style={{ marginBottom: 8 }}>VİZYON</div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
              fontSize: 22, color: 'var(--ivory)', lineHeight: 1.25, fontWeight: 300,
            }}>
              Ev tekstilinde genç, öncü, yenilikçi ve <span style={{ color: 'var(--gold)' }}>sürdürülebilir</span> bir ekip olmak.
            </div>
          </div>
          <div className="rule" />
          <div>
            <div className="byline" style={{ marginBottom: 8 }}>MİSYON</div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
              fontSize: 22, color: 'var(--ivory)', lineHeight: 1.25, fontWeight: 300,
            }}>
              Genç temsilcileri bir araya getirerek bilgi paylaşımı, eğitim ve mentorluk yoluyla sektörün geleceğini güçlendirmek.
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip — animated counters */}
      <StatsStrip registeredEvents={registeredEvents} />

      {/* Haberler — Instagram feed */}
      <section style={{ padding: '40px 0 0' }}>
        <div style={{ padding: '0 24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <SectionLabel num={5}>HABERLER · @tetsiad.dernek</SectionLabel>
          <span className="byline" style={{ color: 'var(--gold)', cursor: 'pointer' }}
            onClick={() => onNavigate && onNavigate('news')}>TÜMÜ ↗</span>
        </div>
        <div className="no-scrollbar" style={{
          marginTop: 18, display: 'flex', gap: 12, overflowX: 'auto', padding: '4px 24px 0',
        }}>
          {NEWS.map(n => (
            <div key={n.id} style={{
              flex: '0 0 240px', background: 'var(--navy-mid)',
              border: '0.5px solid var(--gold-line)', position: 'relative',
            }} className="weave">
              <ImageSlot id={`gt-news-${n.id}`} height={120} label={n.photoLabel} src={n.src} />
              <div style={{ padding: '12px 14px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <div className="lbl" style={{ fontSize: 8 }}>{n.tag}</div>
                  <div className="byline" style={{ fontSize: 7.5, color: 'var(--gold)' }}>{n.date}</div>
                </div>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif', fontSize: 15,
                  color: 'var(--ivory)', lineHeight: 1.2, fontWeight: 500, minHeight: 36,
                }}>{n.title}</div>
                <div style={{
                  marginTop: 8, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10,
                  color: 'var(--text-muted)', lineHeight: 1.45, fontWeight: 300,
                }}>{n.excerpt}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── BAŞKAN'DAN ─────────────────────────────────────────── */}
      <section style={{ margin: '40px 0 0' }}>

        {/* Section divider */}
        <div style={{ padding: '0 24px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ height: '0.5px', flex: 1, background: 'var(--gold-line)' }} />
          <div className="lbl" style={{ fontSize: 7, letterSpacing: 3, color: 'var(--gold)' }}>BAŞKAN'DAN</div>
          <div style={{ height: '0.5px', flex: 1, background: 'var(--gold-line)' }} />
        </div>

        {/* Full-width portrait with gradient overlay */}
        <div style={{ position: 'relative' }}>
          <ImageSlot id="gt-baskandan-portrait" height={340} label="Resul Öden · Başkan"
            src="https://picsum.photos/seed/gt-ro-podium/800/700" />
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(180deg, rgba(5,28,17,0.25) 0%, rgba(5,28,17,0.12) 45%, rgba(5,28,17,0.96) 100%)',
          }} />
          {/* Name + title over photo bottom */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 24px 24px' }}>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontWeight: 300,
              fontSize: 38, color: 'var(--ivory)', lineHeight: 1, letterSpacing: '-0.5px',
            }}>Resul Öden</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <div style={{ width: 28, height: '0.5px', background: 'var(--gold)' }} />
              <div className="byline" style={{ color: 'var(--gold)', letterSpacing: 2 }}>{PRESIDENT.title}</div>
            </div>
          </div>
        </div>

        {/* Message body */}
        <div style={{ background: 'var(--navy-deep)', padding: '28px 24px 32px', borderBottom: '0.5px solid var(--gold-line)' }}>

          {/* Pull quote with gold left border */}
          <div style={{
            marginBottom: 24, paddingLeft: 16,
            borderLeft: '2px solid var(--gold)',
          }}>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontWeight: 300,
              fontSize: 19, color: 'var(--ivory)', lineHeight: 1.5,
            }}>"{PRESIDENT.quote}"</div>
          </div>

          {/* Paragraphs */}
          {(PRESIDENT.message || [PRESIDENT.long]).map((para, i) => (
            <div key={i} style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12.5,
              color: 'var(--text-muted)', lineHeight: 1.75, fontWeight: 300,
              marginBottom: i < (PRESIDENT.message || []).length - 1 ? 16 : 0,
            }}>{para}</div>
          ))}

          {/* Signature block */}
          <div style={{
            marginTop: 28, paddingTop: 22,
            borderTop: '0.5px solid var(--gold-line)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          }}>
            <div>
              <div className="signature" style={{ fontSize: 28, lineHeight: 1, color: 'var(--gold)' }}>Resul Öden</div>
              <div className="byline" style={{ marginTop: 8 }}>{PRESIDENT.title}</div>
              <div className="byline" style={{ marginTop: 3, color: 'var(--gold)' }}>{PRESIDENT.firm}</div>
            </div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
              color: 'var(--text-muted)', letterSpacing: 1.5, textAlign: 'right',
            }}>GENÇ<br/>TETSİAD<br/>2026</div>
          </div>
        </div>
      </section>

      {/* Stats divider gap — already had stats above; events follow next */}

      {/* Upcoming events — horizontal */}
      <section style={{ padding: '40px 0 0' }}>
        <div style={{ padding: '0 24px' }}>
          <SectionLabel num={6}>YAKLAŞAN ETKİNLİKLER</SectionLabel>
        </div>
        <div className="no-scrollbar" style={{
          marginTop: 20, display: 'flex', gap: 16, overflowX: 'auto', padding: '0 24px',
        }}>
          {EVENTS.slice(0, 4).map(e => {
            const isReg = registeredEvents && registeredEvents.has(e.id);
            return (
              <div key={e.id} style={{
                flex: '0 0 230px', background: 'var(--navy-mid)', position: 'relative',
              }} className="weave">
                {isReg && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8, zIndex: 2,
                    padding: '4px 8px', background: 'var(--gold)', color: 'var(--navy)',
                    fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 7, letterSpacing: 1.5, fontWeight: 700,
                  }}>KATILDIM</div>
                )}
                <ImageSlot id={`gt-event-${e.id}`} height={110} label={e.photoLabel} src={e.src} />
                <div style={{ padding: '14px 16px 16px' }}>
                  <div className="lbl" style={{ fontSize: 8.5 }}>{e.tag}</div>
                  <div style={{
                    marginTop: 8, fontFamily: 'Cormorant Garamond, serif',
                    fontSize: 17, color: 'var(--ivory)', lineHeight: 1.15, minHeight: 40,
                  }}>{e.title}</div>
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span style={{
                      fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                      fontSize: 22, color: 'var(--gold)', fontWeight: 300, lineHeight: 1,
                    }}>{e.day}</span>
                    <span className="byline">{e.month}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4 Activity areas */}
      <section style={{ padding: '40px 24px 0' }}>
        <SectionLabel num={7}>FAALİYET ALANLARI</SectionLabel>
        <div style={{ marginTop: 18 }}>
          {ACTIVITIES.map((a, i) => (
            <div key={a.num} style={{
              display: 'grid', gridTemplateColumns: '28px 1fr', gap: 14,
              padding: '18px 0', borderTop: i === 0 ? 'none' : '0.5px solid var(--gold-line)',
            }}>
              <div style={{
                fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                fontSize: 28, color: 'var(--gold)', lineHeight: 0.9, fontWeight: 300,
              }}>{toRoman(a.num)}</div>
              <div>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif', fontSize: 18,
                  color: 'var(--ivory)', lineHeight: 1.2, marginBottom: 6, fontWeight: 500,
                }}>{a.title}</div>
                <div style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11,
                  color: 'var(--text-muted)', lineHeight: 1.55,
                }}>{a.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Six goals */}
      <section style={{ padding: '40px 24px 0' }}>
        <SectionLabel num={8}>HEDEFLER</SectionLabel>
        <div style={{ marginTop: 18 }}>
          {GOALS.map((g, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '36px 1fr', gap: 12,
              padding: '14px 0', borderTop: i === 0 ? 'none' : '0.5px solid var(--gold-line)',
            }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                color: 'var(--gold)', letterSpacing: 1, paddingTop: 2,
              }}>{String(i + 1).padStart(2, '0')}</div>
              <div style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12,
                color: 'var(--ivory)', lineHeight: 1.55, fontWeight: 300,
              }}>{g}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Commissions */}
      <section style={{ padding: '40px 24px 0' }}>
        <SectionLabel num={9}>ALT KOMİSYONLAR</SectionLabel>
        <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {COMMISSIONS.map(c => (
            <div key={c} style={{
              padding: '8px 12px', background: 'var(--navy-mid)',
              fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10,
              color: 'var(--ivory)', letterSpacing: 0.5,
              border: '0.5px solid var(--gold-line)',
            }}>{c}</div>
          ))}
        </div>
      </section>

      {/* Universities */}
      <section style={{ padding: '40px 24px 0' }}>
        <SectionLabel num={10}>İŞBİRLİKLERİ</SectionLabel>
        <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {UNIS.map(u => (
            <div key={u} style={{
              padding: '8px 14px',
              fontFamily: 'Cormorant Garamond, serif', fontSize: 14, fontStyle: 'italic',
              color: 'var(--gold)', letterSpacing: 0.5,
              border: '0.5px solid var(--gold)',
            }}>{u}</div>
          ))}
        </div>
      </section>

      {/* Pull quote */}
      <section style={{ padding: '50px 24px 40px' }}>
        <div style={{ height: '0.5px', background: 'var(--gold)', width: 40, marginBottom: 20 }} />
        <div style={{
          fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
          fontSize: 28, color: 'var(--ivory)', lineHeight: 1.2, fontWeight: 300,
        }}>
          "Sektörün geleceğini <span style={{ color: 'var(--gold)' }}>gençlerle</span> inşa etmek istiyoruz."
        </div>
        <div className="byline" style={{ marginTop: 18 }}>
          GENÇ TETSİAD KOMİSYONU · 2026
        </div>
      </section>

      {/* Künye */}
      <section className="weave" style={{ background: 'var(--navy-deep)', padding: '36px 24px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TetsiadLogo size={32} color="rgba(245,240,230,0.5)" subtitle={true} />
        </div>
        <div className="rule" style={{ margin: '28px 0 22px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
          <div>
            <div className="byline" style={{ marginBottom: 6 }}>KONSEPT</div>
            <div className="signature" style={{ fontSize: 22, lineHeight: 1 }}>Fatih Özdemir</div>
            <div className="byline" style={{ marginTop: 6 }}>ORMEN TEKSTİL</div>
            <div className="byline">ANKARA · 2026</div>
          </div>
          <div>
            <div className="byline" style={{ marginBottom: 6 }}>YAYINLAYAN</div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: 14,
              color: 'var(--ivory)', lineHeight: 1.35, fontStyle: 'italic',
            }}>Genç TETSİAD<br/>Komisyonu</div>
            <div className="byline" style={{ marginTop: 6 }}>TETSİAD ALT YAPILANMA</div>
          </div>
        </div>

        <div className="rule" style={{ margin: '24px 0 16px' }} />
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 8,
          letterSpacing: 1.5, color: 'var(--text-muted)', textAlign: 'center',
        }}>
          info@tetsiad.org &nbsp;·&nbsp; +90 212 292 04 04
        </div>
      </section>
    </div>
  );
}

function toRoman(n) {
  return ['', 'I', 'II', 'III', 'IV', 'V', 'VI'][n] || String(n);
}

function StatsStrip({ registeredEvents }) {
  const c1 = useCounter(1500, 1400, 0);
  const c2 = useCounter(55,   1000, 200);
  const c3 = useCounter(40,   900,  400);
  const c4 = useCounter(10,   700,  600);
  const vals = [
    { n: c1 >= 1500 ? '1.500' : c1.toLocaleString('tr-TR'), s: '+', l: 'ÜYE' },
    { n: c2, s: '', l: 'İL' },
    { n: c3, s: '', l: 'ÜLKE' },
    { n: c4, s: '', l: 'ETKİNLİK' },
  ];
  return (
    <section style={{
      marginTop: 36, padding: '24px 16px', background: 'var(--navy-deep)',
      borderTop: '0.5px solid var(--gold-line)', borderBottom: '0.5px solid var(--gold-line)',
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    }}>
      {vals.map((x, i) => (
        <div key={i} style={{
          textAlign: 'center',
          borderRight: i < 3 ? '0.5px solid var(--gold-line)' : '',
        }}>
          <div style={{
            fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontWeight: 300,
            fontSize: 30, color: 'var(--gold)', lineHeight: 1,
          }}>{x.n}<span style={{ fontSize: 16 }}>{x.s}</span></div>
          <div className="byline" style={{ marginTop: 8 }}>{x.l}</div>
        </div>
      ))}
    </section>
  );
}

window.HomeScreen = HomeScreen;
