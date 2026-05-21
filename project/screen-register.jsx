/* screen-register.jsx — 6-adım üyelik başvurusu */

function RegisterScreen({ onComplete, onBack }) {
  const [step, setStep] = React.useState(1);
  const TOTAL_STEPS = 5;

  /* form state */
  const [phone, setPhone] = React.useState('');
  const [otp, setOtp] = React.useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = React.useState(false);
  const [countdown, setCountdown] = React.useState(58);
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName]   = React.useState('');
  const [emailVal, setEmailVal]   = React.useState('');
  const [firm, setFirm]           = React.useState('');
  const [city, setCity]           = React.useState('');
  const [sector, setSector]       = React.useState('');
  const [position, setPosition]   = React.useState('');
  const [isStudent, setIsStudent] = React.useState(false);
  const [university, setUniversity] = React.useState('');
  const [kvkk, setKvkk]           = React.useState(false);
  const [memberCode, setMemberCode] = React.useState('');
  const [typedCode, setTypedCode]   = React.useState('');

  /* OTP countdown */
  React.useEffect(() => {
    if (!otpSent) return;
    const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [otpSent]);

  /* Member code typing animation on step 6 */
  React.useEffect(() => {
    if (step !== 6) return;
    const year = 2026;
    const num  = String(Math.floor(400 + Math.random() * 500)).padStart(5, '0');
    const full = `GT-${year}-${num}`;
    setMemberCode(full);
    setTypedCode('');
    let i = 0;
    const t = setInterval(() => {
      i++;
      setTypedCode(full.slice(0, i));
      if (i >= full.length) clearInterval(t);
    }, 80);
    return () => clearInterval(t);
  }, [step]);

  const handleOtpType = (i, v) => {
    const next = [...otp];
    next[i] = v.slice(-1);
    setOtp(next);
  };

  const canNext = () => {
    if (step === 1) return otpSent ? otp.every(c => c !== '') : phone.length >= 10;
    if (step === 2) return firstName.trim() && lastName.trim() && emailVal.includes('@');
    if (step === 3) return firm.trim() && city && sector;
    if (step === 4) return isStudent ? university.trim() : true;
    if (step === 5) return kvkk;
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !otpSent) { setOtpSent(true); return; }
    if (step < 5) { setStep(s => s + 1); return; }
    /* step 5 → 6 = pending screen */
    setStep(6);
  };

  const progressPct = Math.min(100, ((step - 1) / TOTAL_STEPS) * 100);

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="weave" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />

      {/* Step 6: Onay Beklemede */}
      {step === 6 && (
        <div className="reg-step fade-in" style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '40px 32px', position: 'relative', zIndex: 2, textAlign: 'center',
        }}>
          <TetsiadLogo size={28} color="#F7F4EC" subtitle={false} />

          <div style={{ marginTop: 40 }}>
            <div className="lbl" style={{ marginBottom: 16 }}>BAŞVURUNUZ ALINDI</div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontWeight: 300,
              fontSize: 34, color: 'var(--ivory)', lineHeight: 1.1,
            }}>
              Onay<br/><span style={{ color: 'var(--gold)' }}>beklemede.</span>
            </div>
          </div>

          {/* Animated member code */}
          <div style={{
            marginTop: 44,
            padding: '22px 28px',
            background: 'rgba(217,200,150,0.08)',
            border: '0.5px solid var(--gold)',
            width: '100%',
          }}>
            <div className="byline" style={{ marginBottom: 10 }}>ÖN ÜYELİK KODUNUZ</div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 22,
              color: 'var(--gold)', letterSpacing: 3,
            }}>
              {typedCode}
              {typedCode.length < memberCode.length && (
                <span className="type-cursor" />
              )}
            </div>
          </div>

          <div style={{
            marginTop: 28, fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.65, maxWidth: 270,
          }}>
            Yönetim kurulu başvurunuzu değerlendirdikten sonra
            SMS ve e-posta ile bilgilendirileceksiniz.
            Ortalama süre: <span style={{ color: 'var(--gold)' }}>3–5 iş günü.</span>
          </div>

          <button className="btn btn-fill" style={{ marginTop: 36, width: '100%' }}
            onClick={onComplete}>
            GİRİŞ SAYFASINA DÖN
          </button>

          <div className="byline" style={{ marginTop: 20 }}>
            KONSEPT <span style={{ color: 'var(--gold)' }}>FATİH ÖZDEMİR</span> · ORMEN TEKSTİL
          </div>
        </div>
      )}

      {/* Steps 1-5 */}
      {step <= 5 && (
        <>
          {/* Header */}
          <div style={{
            paddingTop: 56, padding: '56px 24px 0',
            position: 'relative', zIndex: 2,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <button onClick={onBack} className="btn btn-ghost" style={{ padding: '6px 0', fontSize: 9 }}>
                ← GERİ
              </button>
              <div className="byline">
                <span style={{ color: 'var(--gold)' }}>{step}</span> / {TOTAL_STEPS}
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 2, background: 'rgba(217,200,150,0.15)', marginBottom: 28 }}>
              <div style={{
                height: '100%', background: 'var(--gold)',
                width: `${progressPct}%`,
                transition: 'width 400ms ease',
              }} />
            </div>
          </div>

          {/* Form body */}
          <div className="phone-scroll no-scrollbar" style={{
            flex: 1, padding: '0 32px 32px', position: 'relative', zIndex: 2,
          }}>

            {/* STEP 1: Telefon */}
            {step === 1 && (
              <div className="reg-step">
                <div className="lbl" style={{ marginBottom: 14 }}>ADIM 01 · KİMLİK DOĞRULAMA</div>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontWeight: 300,
                  fontSize: 32, color: 'var(--ivory)', lineHeight: 1.1, marginBottom: 32,
                }}>
                  Telefon<br/><span style={{ color: 'var(--gold)' }}>numaranız.</span>
                </div>

                {!otpSent ? (
                  <>
                    <div className="lbl" style={{ color: 'var(--text-muted)', marginBottom: 10 }}>TELEFON</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                      <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: 'var(--gold)' }}>+90</span>
                      <input className="uline-input" placeholder="5xx xxx xx xx" value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} />
                    </div>
                    <div style={{
                      marginTop: 18, fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.6,
                    }}>
                      Tek kullanımlık doğrulama kodu gönderilecektir.
                    </div>
                  </>
                ) : (
                  <div className="fade-in">
                    <div className="lbl" style={{ color: 'var(--text-muted)', marginBottom: 18, textAlign: 'center' }}>
                      +90 {phone} NUMARASINA KOD GÖNDERİLDİ
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {otp.map((v, i) => (
                        <input key={i} className={`otp-cell ${v ? 'filled' : ''}`}
                          value={v} onChange={e => handleOtpType(i, e.target.value)} maxLength={1} />
                      ))}
                    </div>
                    <div style={{
                      marginTop: 18, display: 'flex', justifyContent: 'space-between',
                      fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10, color: 'var(--text-muted)',
                    }}>
                      <span>00:{String(countdown).padStart(2, '0')} kala</span>
                      <span className="lbl" style={{ color: 'var(--gold)', cursor: 'pointer' }}
                        onClick={() => { setCountdown(58); }}>TEKRAR GÖNDER</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Ad/Soyad/Email */}
            {step === 2 && (
              <div className="reg-step">
                <div className="lbl" style={{ marginBottom: 14 }}>ADIM 02 · KİŞİSEL BİLGİLER</div>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontWeight: 300,
                  fontSize: 32, color: 'var(--ivory)', lineHeight: 1.1, marginBottom: 32,
                }}>
                  Sizi<br/><span style={{ color: 'var(--gold)' }}>tanıyalım.</span>
                </div>

                {[
                  { label: 'AD', val: firstName, set: setFirstName, ph: 'Fatih' },
                  { label: 'SOYAD', val: lastName, set: setLastName, ph: 'Özdemir' },
                  { label: 'E-POSTA', val: emailVal, set: setEmailVal, ph: 'fatih@firma.com' },
                ].map(f => (
                  <div key={f.label} style={{ marginBottom: 22 }}>
                    <div className="lbl" style={{ color: 'var(--text-muted)', marginBottom: 10 }}>{f.label}</div>
                    <input className="uline-input" placeholder={f.ph} value={f.val}
                      onChange={e => f.set(e.target.value)} />
                  </div>
                ))}
              </div>
            )}

            {/* STEP 3: Firma */}
            {step === 3 && (
              <div className="reg-step">
                <div className="lbl" style={{ marginBottom: 14 }}>ADIM 03 · FİRMA BİLGİLERİ</div>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontWeight: 300,
                  fontSize: 32, color: 'var(--ivory)', lineHeight: 1.1, marginBottom: 32,
                }}>
                  Firmanızı<br/><span style={{ color: 'var(--gold)' }}>anlatın.</span>
                </div>

                <div style={{ marginBottom: 22 }}>
                  <div className="lbl" style={{ color: 'var(--text-muted)', marginBottom: 10 }}>FİRMA ADI</div>
                  <input className="uline-input" placeholder="Firma Adı A.Ş." value={firm}
                    onChange={e => setFirm(e.target.value)} />
                </div>

                <div style={{ marginBottom: 22 }}>
                  <div className="lbl" style={{ color: 'var(--text-muted)', marginBottom: 12 }}>ŞEHİR</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {CITIES.map(c => (
                      <button key={c} onClick={() => setCity(c)}
                        className={`pill ${city === c ? 'active' : ''}`} style={{ padding: '7px 12px', fontSize: 8 }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="lbl" style={{ color: 'var(--text-muted)', marginBottom: 12 }}>SEKTÖR</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {SECTORS.map(s => (
                      <button key={s} onClick={() => setSector(s)}
                        className={`pill ${sector === s ? 'active' : ''}`} style={{ padding: '7px 12px', fontSize: 8 }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Öğrenci / Çalışan */}
            {step === 4 && (
              <div className="reg-step">
                <div className="lbl" style={{ marginBottom: 14 }}>ADIM 04 · PROFİL TÜRÜ</div>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontWeight: 300,
                  fontSize: 32, color: 'var(--ivory)', lineHeight: 1.1, marginBottom: 32,
                }}>
                  Üniversitede<br/><span style={{ color: 'var(--gold)' }}>misiniz?</span>
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
                  {[
                    { val: false, label: 'SEKTÖR PROFESYONELİ', sub: 'Firma çalışanı veya sahibi' },
                    { val: true, label: 'ÜNİVERSİTE ÖĞRENCİSİ', sub: 'Lisans veya yüksek lisans' },
                  ].map(o => (
                    <div key={String(o.val)} onClick={() => setIsStudent(o.val)}
                      style={{
                        flex: 1, padding: '18px 14px', cursor: 'pointer',
                        border: `0.5px solid ${isStudent === o.val ? 'var(--gold)' : 'var(--gold-line)'}`,
                        background: isStudent === o.val ? 'rgba(217,200,150,0.10)' : 'transparent',
                        transition: 'all 200ms',
                      }}>
                      <div className="lbl" style={{ fontSize: 8, marginBottom: 8, color: isStudent === o.val ? 'var(--gold)' : 'var(--text-muted)' }}>
                        {isStudent === o.val ? '✓ ' : ''}{o.label}
                      </div>
                      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.3 }}>
                        {o.sub}
                      </div>
                    </div>
                  ))}
                </div>

                {isStudent && (
                  <div className="fade-in">
                    <div className="lbl" style={{ color: 'var(--text-muted)', marginBottom: 10 }}>ÜNİVERSİTE</div>
                    <input className="uline-input" placeholder="İstanbul Teknik Üniversitesi" value={university}
                      onChange={e => setUniversity(e.target.value)} />
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: KVKK */}
            {step === 5 && (
              <div className="reg-step">
                <div className="lbl" style={{ marginBottom: 14 }}>ADIM 05 · GİZLİLİK</div>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontWeight: 300,
                  fontSize: 32, color: 'var(--ivory)', lineHeight: 1.1, marginBottom: 28,
                }}>
                  KVKK<br/><span style={{ color: 'var(--gold)' }}>onayı.</span>
                </div>

                <div style={{
                  padding: '16px', background: 'rgba(217,200,150,0.06)',
                  border: '0.5px solid var(--gold-line)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10,
                  color: 'var(--text-muted)', lineHeight: 1.7,
                  maxHeight: 200, overflowY: 'auto',
                }} className="no-scrollbar">
                  <div style={{ color: 'var(--ivory)', marginBottom: 8, fontWeight: 600, fontSize: 9, letterSpacing: 1 }}>
                    KİŞİSEL VERİLERİN KORUNMASI HAKKINDA AYDINLATMA METNİ
                  </div>
                  TETSİAD olarak 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla aşağıdaki kişisel verilerinizi işlemekteyiz: Ad, soyad, e-posta, telefon numarası, firma bilgileri, şehir, sektör. Verileriniz; üyelik yönetimi, etkinlik bildirimleri ve mentorluk eşleştirme amacıyla kullanılmakta, üçüncü taraflarla paylaşılmamaktadır. Verileriniz Frankfurt'ta (Supabase EU-West-1) saklanmakta olup AB GDPR gerekliliklerine uygundur. İstediğiniz zaman veri silme ve taşınabilirlik haklarınızı kullanabilirsiniz.
                </div>

                <div style={{ marginTop: 22, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div onClick={() => setKvkk(v => !v)}
                    style={{
                      width: 22, height: 22, flexShrink: 0,
                      border: `0.5px solid ${kvkk ? 'var(--gold)' : 'var(--gold-line)'}`,
                      background: kvkk ? 'var(--gold)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', marginTop: 2,
                      transition: 'all 200ms',
                    }}>
                    {kvkk && <span style={{ color: 'var(--navy)', fontSize: 12, lineHeight: 1 }}>✓</span>}
                  </div>
                  <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, color: 'var(--ivory)', lineHeight: 1.55 }}>
                    Aydınlatma metnini okudum ve kişisel verilerimin işlenmesine{' '}
                    <span style={{ color: 'var(--gold)' }}>açık rızam</span> ile onay veriyorum.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          <div style={{ padding: '12px 32px 36px', position: 'relative', zIndex: 2 }}>
            <button
              className={`btn btn-fill ${!canNext() ? 'btn-disabled' : ''}`}
              style={{ width: '100%' }}
              onClick={handleNext}>
              {step === 1 && !otpSent ? 'KOD GÖNDER' :
               step === 1 ? 'DOĞRULA & İLERLE' :
               step === 5 ? 'BAŞVURUYU GÖNDER' : 'İLERLE →'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

window.RegisterScreen = RegisterScreen;
