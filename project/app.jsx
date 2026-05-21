/* app.jsx — root. Stage of 6 interactive phones. */

const SCREENS = [
  { k: 'login',    label: 'GİRİŞ',   num: '00', sub: 'Login · OTP' },
  { k: 'home',     label: 'KAPAK',   num: '01', sub: 'Manifesto & Haberler' },
  { k: 'calendar', label: 'TAKVİM',  num: '02', sub: 'Etkinlikler · Katılım' },
  { k: 'directory',label: 'REHBER',  num: '03', sub: 'Üye dizini' },
  { k: 'academy',  label: 'AKADEMİ', num: '04', sub: 'Eğitim · Mentorluk' },
  { k: 'profile',  label: 'KART',    num: '05', sub: 'Üyelik & Ayarlar' },
];

const TABS = SCREENS.slice(1); // 5 tabs (no login)

function ScreenRouter({ active, setActive, onBellClick, registeredEvents, onToggleRegistration }) {
  switch (active) {
    case 'login':     return <LoginScreen onSignIn={() => setActive('home')} onRegister={() => setActive('register')} />;
    case 'register':  return <RegisterScreen onComplete={() => setActive('login')} onBack={() => setActive('login')} />;
    case 'home':      return <HomeScreen onBellClick={onBellClick} registeredEvents={registeredEvents} />;
    case 'calendar':  return <CalendarScreen onBellClick={onBellClick} registeredEvents={registeredEvents} onToggleRegistration={onToggleRegistration} />;
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

/* Demo auto-tour: cycles through all tab screens every 7s */
function useDemoTour(enabled, setActive) {
  const tourScreens = ['home', 'calendar', 'directory', 'academy', 'profile'];
  const idxRef = React.useRef(0);
  React.useEffect(() => {
    if (!enabled) return;
    const t = setInterval(() => {
      idxRef.current = (idxRef.current + 1) % tourScreens.length;
      setActive(tourScreens[idxRef.current]);
    }, 7000);
    return () => clearInterval(t);
  }, [enabled]);
}

function Phone({ initial, label, num, sub, tweaks, demoMode }) {
  const [active, setActive] = React.useState(initial);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [registeredEvents, setRegisteredEvents] = React.useState(new Set([2, 5]));
  const isLogin = active === 'login' || active === 'register';

  useDemoTour(demoMode, setActive);

  const toggleRegistration = React.useCallback((id) => {
    setRegisteredEvents(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="phone-cell">
      <div className="phone-cell-label">
        <span className="phone-cell-num">{num} / {label}</span>
        <span className="phone-cell-title">{sub}</span>
      </div>

      <div style={{ position: 'relative' }}>
        <IOSDevice width={tweaks.phoneWidth} height={tweaks.phoneHeight} dark={true}>
          <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
            <ScreenRouter
              active={active}
              setActive={setActive}
              onBellClick={() => setDrawerOpen(true)}
              registeredEvents={registeredEvents}
              onToggleRegistration={toggleRegistration}
            />
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
    "goldHue": "#D9C896",
    "demoMode": false,
    "presentationMode": false
  }/*EDITMODE-END*/);

  React.useEffect(() => {
    document.documentElement.style.setProperty('--gold', t.goldHue);
  }, [t.goldHue]);

  React.useEffect(() => {
    document.body.classList.toggle('stage-presentation', t.presentationMode);
  }, [t.presentationMode]);

  return (
    <div className="stage">
      {!t.presentationMode && (
        <div className="stage-header">
          <div>
            <div className="stage-eyebrow">PROTOTİP · 1.0 · YALNIZCA DAVETLİ</div>
            <h1 className="stage-title">
              Genç <em>TETSİAD.</em>
            </h1>
            <div style={{
              marginTop: 12, fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 13, color: 'var(--text-muted)', maxWidth: 540, lineHeight: 1.55,
            }}>
              Türkiye ev tekstilinin genç iş insanları için sürdürülebilir, sessiz lüks bir
              mobil deneyim — her ekran tam etkileşimli; tab bar üzerinden sekmeler arasında geçiş yapabilirsiniz.
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
      )}

      {t.showAllScreens ? (
        <div className="phones">
          {SCREENS.map(s => (
            <Phone key={s.k} initial={s.k} label={s.label} num={s.num} sub={s.sub}
              tweaks={t} demoMode={t.demoMode} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Phone
            initial={t.primaryScreen}
            label={(SCREENS.find(s => s.k === t.primaryScreen) || SCREENS[0]).label}
            num={(SCREENS.find(s => s.k === t.primaryScreen) || SCREENS[0]).num}
            sub={(SCREENS.find(s => s.k === t.primaryScreen) || SCREENS[0]).sub}
            tweaks={{ ...t, phoneWidth: 420, phoneHeight: 900 }}
            demoMode={t.demoMode}
          />
        </div>
      )}

      {/* Tweaks panel */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Sunum">
          <TweakToggle label="Sunum modu (başlık gizle)" value={t.presentationMode}
            onChange={v => setT('presentationMode', v)} />
          <TweakToggle label="Demo turu (otomatik geçiş)" value={t.demoMode}
            onChange={v => setT('demoMode', v)} />
        </TweakSection>

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
            options={['#D9C896', '#E8DCAE', '#C8B47A', '#B89048', '#F0E0B0']}
            onChange={v => setT('goldHue', v)} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
