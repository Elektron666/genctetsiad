/* screen-login.jsx — login screen, navy full bleed */

function LoginScreen({ onSignIn, onRegister }) {
  const [mode, setMode] = React.useState('phone'); // phone | email
  const [phone, setPhone] = React.useState('312 442 18 90');
  const [otpStage, setOtpStage] = React.useState(false);
  const [otp, setOtp] = React.useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = React.useState(58);
  const [email, setEmail] = React.useState('fatih@ormentekstil.com');
  const [password, setPassword] = React.useState('••••••••');
  const [remember, setRemember] = React.useState(true);

  React.useEffect(() => {
    if (!otpStage) return;
    const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [otpStage]);

  const handleOtpType = (i, v) => {
    const next = [...otp];
    next[i] = v.slice(-1);
    setOtp(next);
  };

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0 32px 28px' }}>
      {/* Subtle weave behind */}
      <div className="weave" style={{ position: 'absolute', inset: 0, opacity: 0.6 }} />

      {/* Top */}
      <div style={{ paddingTop: 76, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
        <TetsiadLogo size={32} color="#F5F0E6" subtitle={true} />
      </div>

      {/* Title block */}
      <div style={{ marginTop: 56, textAlign: 'center' }}>
        <div className="lbl" style={{ marginBottom: 14, opacity: 0.85 }}>GENÇ TETSİAD · ÜYE GİRİŞİ</div>
        <div style={{
          fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontWeight: 300,
          fontSize: 40, color: 'var(--ivory)', lineHeight: 1.05,
        }}>
          Hoş <em style={{ color: 'var(--gold)' }}>geldiniz.</em>
        </div>
        <div style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, fontWeight: 300,
          color: 'var(--text-muted)', marginTop: 16, lineHeight: 1.6, maxWidth: 280, marginLeft: 'auto', marginRight: 'auto',
        }}>
          Üyelik kodunuzla giriş yapın. Henüz başvurmadıysanız aşağıdan ilerleyebilirsiniz.
        </div>
      </div>

      {/* Toggle */}
      <div style={{
        marginTop: 38, display: 'flex', justifyContent: 'center',
        borderBottom: '0.5px solid var(--gold-line)', position: 'relative', zIndex: 2,
      }}>
        {[
          { k: 'phone', label: 'TELEFON · OTP' },
          { k: 'email', label: 'E‑POSTA · ŞİFRE' },
        ].map(o => (
          <div key={o.k}
            onClick={() => { setMode(o.k); setOtpStage(false); }}
            style={{
              flex: 1, textAlign: 'center', padding: '14px 8px',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 9, letterSpacing: 2.5, fontWeight: 600,
              color: mode === o.k ? 'var(--gold)' : 'var(--text-muted)',
              borderBottom: mode === o.k ? '1px solid var(--gold)' : '1px solid transparent',
              marginBottom: -0.5,
              cursor: 'pointer',
            }}>
            {o.label}
          </div>
        ))}
      </div>

      {/* Form */}
      <div style={{ marginTop: 28, position: 'relative', zIndex: 2 }}>
        {mode === 'phone' && !otpStage && (
          <div className="fade-in">
            <div className="lbl" style={{ color: 'var(--text-muted)', marginBottom: 12 }}>TELEFON</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: 'var(--gold)' }}>+90</span>
              <input className="uline-input" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <button className="btn btn-fill" style={{ width: '100%', marginTop: 36 }}
              onClick={() => setOtpStage(true)}>KOD GÖNDER</button>
          </div>
        )}

        {mode === 'phone' && otpStage && (
          <div className="fade-in">
            <div className="lbl" style={{ color: 'var(--text-muted)', marginBottom: 18, textAlign: 'center' }}>
              SMS DOĞRULAMA KODU
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {otp.map((v, i) => (
                <input key={i} className={`otp-cell ${v ? 'filled' : ''}`}
                  value={v} onChange={e => handleOtpType(i, e.target.value)} maxLength={1} />
              ))}
            </div>
            <div style={{
              marginTop: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10, color: 'var(--text-muted)',
            }}>
              <span>00:{String(countdown).padStart(2, '0')} kala</span>
              <span className="lbl" style={{ color: 'var(--gold)', cursor: 'pointer' }}>TEKRAR GÖNDER</span>
            </div>
            <button className="btn btn-fill" style={{ width: '100%', marginTop: 24 }}
              onClick={onSignIn}>DOĞRULA &amp; GİRİŞ YAP</button>
          </div>
        )}

        {mode === 'email' && (
          <div className="fade-in">
            <div className="lbl" style={{ color: 'var(--text-muted)', marginBottom: 12 }}>E‑POSTA</div>
            <input className="uline-input" value={email} onChange={e => setEmail(e.target.value)} />
            <div className="lbl" style={{ color: 'var(--text-muted)', marginTop: 22, marginBottom: 12 }}>ŞİFRE</div>
            <input className="uline-input" type="password" value={password} onChange={e => setPassword(e.target.value)} />

            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <span style={{
                  width: 14, height: 14, border: '0.5px solid var(--gold)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: remember ? 'var(--gold)' : 'transparent',
                }} onClick={() => setRemember(r => !r)}>
                  {remember && <span style={{ color: 'var(--navy)', fontSize: 10, lineHeight: 1 }}>✓</span>}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>Beni hatırla</span>
              </label>
              <span className="lbl" style={{ cursor: 'pointer' }}>UNUTTUM</span>
            </div>

            <button className="btn btn-fill" style={{ width: '100%', marginTop: 32 }}
              onClick={onSignIn}>GİRİŞ YAP</button>
          </div>
        )}
      </div>

      {/* OR + faceid */}
      <div style={{ marginTop: 30, position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'var(--text-muted)' }}>
          <div style={{ flex: 1, height: '0.5px', background: 'var(--gold-line)' }} />
          <span className="lbl" style={{ color: 'var(--text-muted)' }}>VEYA</span>
          <div style={{ flex: 1, height: '0.5px', background: 'var(--gold-line)' }} />
        </div>
        <button className="btn btn-outline" style={{ width: '100%', marginTop: 18 }}
          onClick={onSignIn}>
          {/* face id glyph */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" stroke="#C4A265" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M9 10v1M15 10v1M9 16s1 1.5 3 1.5S15 16 15 16M12 9v4" stroke="#C4A265" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          FACE ID İLE GİRİŞ
        </button>
      </div>

      <div style={{ flex: 1 }} />

      {/* Bottom links */}
      <div style={{ textAlign: 'center', marginTop: 30, position: 'relative', zIndex: 2 }}>
        <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, color: 'var(--text-muted)' }}>
          Henüz üye değil misiniz?{' '}
          <span style={{ color: 'var(--gold)', cursor: 'pointer' }}
            onClick={onRegister}>Üyelik başvurusu yap →</span>
        </div>
      </div>

      {/* Concept signature */}
      <div style={{
        marginTop: 30, paddingTop: 18, borderTop: '0.5px solid var(--gold-line)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative', zIndex: 2,
      }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, letterSpacing: 2, color: 'var(--text-muted)' }}>
          KONSEPT · <span style={{ color: 'var(--gold)' }}>FATİH ÖZDEMİR</span>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, letterSpacing: 2, color: 'var(--text-muted)' }}>
          ORMEN TEKSTİL · ANKARA
        </div>
      </div>
    </div>
  );
}

window.LoginScreen = LoginScreen;
