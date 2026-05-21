/* app.jsx — root. Stage of 6 interactive phones. */

const SCREENS = [
  { k: 'login', label: 'GİRİŞ', num: '00', sub: 'Login · OTP' },
  { k: 'home', label: 'KAPAK', num: '01', sub: 'Manifesto & Haberler' },
  { k: 'calendar', label: 'TAKVİM', num: '02', sub: 'Etkinlikler · Katılım' },
  { k: 'directory', label: 'REHBER', num: '03', sub: 'Üye dizini' },
  { k: 'academy', label: 'AKADEMİ', num: '04', sub: 'Eğitim · Mentorluk' },
  { k: 'profile', label: 'KART', num: '05', sub: 'Üyelik & Ayarlar' },
];

const TABS = SCREENS.slice(1); // 5 tabs (no login)

function ScreenRouter({ active, setActive, onBellClick }) {
  switch (active) {
    case 'login':     return <LoginScreen onSignIn={() => setActive('home')} />;
    case 'home':      return <HomeScreen onBellClick={onBellClick} />;
    case 'calendar':  return <CalendarScreen onBellClick={onBellClick} />;
    case 'directory': return <DirectoryScreen onBellClick={onBellClick} />;
    case 'academy':   return <AcademyScreen onBellClick={onBellClick} />;
    case 'profile':   return <ProfileScreen onSignOut={() => setActive('login')} onBellClick={onBellClick} />;
    default:          return null;
  }
}

function TabBar({ active, setActive }) {
  return (
    <div className="tabbar">
      {TABS.map(t => (
        <div key={t.k}
          className={`tabbar-item ${active === t.k ? 'active' : ''}`}
          onClick={() => setActive(t.k)}>
          {t.label}
        </div>
      ))}
    </div>
  );
}

function Phone({ initial, label, num, sub, tweaks }) {
  const [active, setActive] = React.useState(initial);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const isLogin = active === 'login';

  return (
    <div className="phone-cell">
      <div className="phone-cell-label">
        <span className="phone-cell-num">{num} / {label}</span>
        <span className="phone-cell-title">{sub}</span>
      </div>

      <div style={{ position: 'relative' }}>
        <IOSDevice width={tweaks.phoneWidth} height={tweaks.phoneHeight} dark={true}>
          <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
            <ScreenRouter active={active} setActive={setActive}
              onBellClick={() => setDrawerOpen(true)} />
            {!isLogin && <TabBar active={active} setActive={setActive} />}
            <NotificationDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
          </div>
        </IOSDevice>
      </div>
    </div>
  );
}

function App() {
  const [t, setT] = useTweaks(/*EDITMODE-BEGIN*/{
    "phoneWidth": 380,
    "phoneHeight": 824,
    "showAllScreens": true,
    "primaryScreen": "home",
    "goldHue": "#C4A265"
  }/*EDITMODE-END*/);

  // Override gold dynamically
  React.useEffect(() => {
    document.documentElement.style.setProperty('--gold', t.goldHue);
  }, [t.goldHue]);

  return (
    <div className="stage">
      <div className="stage-header">
        <div>
          <div className="stage-eyebrow">PROTOTİP · 0.9 · YALNIZCA DAVETLİ</div>
          <h1 className="stage-title">
            Genç <em>TETSİAD.</em>
          </h1>
          <div style={{
            marginTop: 12, fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 13, color: 'var(--text-muted)', maxWidth: 540, lineHeight: 1.55,
          }}>
            Türkiye ev tekstilinin genç iş insanları için sürdürülebilir, sessiz lüks bir
            mobil deneyim — TETSİAD yeşili &amp; krem, Cormorant Garamond &amp; Plus Jakarta.
            Her ekran bağımsız etkileşimli; tab bar üzerinden sekmeler arasında geçiş yapabilirsiniz.
          </div>
        </div>
        <div className="stage-meta">
          <div>İSTEMCİ <strong>TETSİAD</strong></div>
          <div>KOMİSYON <strong>GENÇ TETSİAD</strong></div>
          <div>KONSEPT <strong>FATİH ÖZDEMİR</strong></div>
          <div>STÜDYO <strong>ORMEN TEKSTİL · ANKARA</strong></div>
          <div>HEDEF <strong>iOS · Android</strong></div>
        </div>
      </div>

      {t.showAllScreens ? (
        <div className="phones">
          {SCREENS.map(s => (
            <Phone key={s.k} initial={s.k} label={s.label} num={s.num} sub={s.sub} tweaks={t} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Phone initial={t.primaryScreen} label={(SCREENS.find(s => s.k === t.primaryScreen) || SCREENS[0]).label}
            num={(SCREENS.find(s => s.k === t.primaryScreen) || SCREENS[0]).num}
            sub={(SCREENS.find(s => s.k === t.primaryScreen) || SCREENS[0]).sub}
            tweaks={{ ...t, phoneWidth: 440, phoneHeight: 920 }} />
        </div>
      )}

      {/* Tweaks panel */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Layout">
          <TweakToggle label="Tüm ekranları göster" value={t.showAllScreens}
            onChange={v => setT('showAllScreens', v)} />
          {!t.showAllScreens && (
            <TweakSelect label="Ana ekran" value={t.primaryScreen}
              onChange={v => setT('primaryScreen', v)}
              options={SCREENS.map(s => ({ value: s.k, label: `${s.num} · ${s.label}` }))} />
          )}
          <TweakSlider label="Telefon genişliği" value={t.phoneWidth}
            min={340} max={460} step={4}
            onChange={v => setT('phoneWidth', v)} />
          <TweakSlider label="Telefon yüksekliği" value={t.phoneHeight}
            min={720} max={920} step={4}
            onChange={v => setT('phoneHeight', v)} />
        </TweakSection>

        <TweakSection label="Aksan rengi">
          <TweakColor label="Altın tonu" value={t.goldHue}
            options={['#C4A265', '#D6B978', '#B89048', '#A67C2F', '#E0C896']}
            onChange={v => setT('goldHue', v)} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
