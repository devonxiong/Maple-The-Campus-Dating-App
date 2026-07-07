'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import SpotPicker from './components/SpotPicker'
import MapleEyes, { MapleDoodles } from './components/MapleEyes'

type Mode = 'signup' | 'login'
// Onboarding is a one-screen-at-a-time wizard.
type Step = 'email' | 'phone' | 'otp' | 'name' | 'gender' | 'year' | 'into' | 'geo' | 'password'
// Which top-level screen we're on after the splash.
type View = 'cta' | 'login' | 'wizard'

// Profile steps that show the progress segments (after verification).
const PROFILE_STEPS: Step[] = ['name', 'gender', 'year', 'into', 'geo', 'password']
const ORDER: Step[] = ['email', 'otp', 'phone', 'name', 'gender', 'year', 'into', 'geo', 'password']

// ─── i18n ─────────────────────────────────────────────────────────────────────
type Lang = 'en' | 'zh'

const T = {
  en: {
    ctaTagline: 'For the one you’ve seen a thousand times.',
    signUp: 'Sign up', logIn: 'Log in', newHere: 'New here?',
    welcomeBack: 'Welcome back',
    loginEmail: 'Email', loginPw: 'Password', loginBtn: 'Log in →',
    emailTitle: "What's your email?", emailSub: "You'll use this to log back in. Any email works.",
    emailPh: 'you@example.com', continue: 'Continue →',
    errEmail: 'Enter a valid email address',
    errEmailTaken: 'This email is already registered. Log in instead.',
    signingAs: 'signing up as',
    phoneTitle: "What's your number?", phoneSub: "We'll only use it to reach you after a match — no spam.",
    phoneSend: 'Continue →', sending: 'Sending…',
    errPhone: 'Enter a valid phone number',
    errSend: 'Failed to send code. Try again.', errNet: 'Network error. Try again.',
    otpTitle: 'Check your email', otpSubPre: 'We emailed a 6-digit code to',
    verify: 'Verify →', verifying: 'Verifying…',
    errOtpLen: 'Enter the 6-digit code we texted you', errOtpWrong: 'Wrong code — try again',
    otpResent: 'New code sent ✓', errResend: 'Failed to resend. Try again.',
    otpDidnt: "didn't get it?", resend: 'resend',
    nameTitle: 'What do people call you?', nameSub: 'First name or nickname — whatever feels like you.', namePh: 'your name',
    genderTitle: 'I am…', gMan: 'Man', gWoman: 'Woman', gNb: 'Non-binary',
    yearTitle: 'What year are you?', y1: 'First-year', y2: 'Sophomore', y3: 'Junior', y4: 'Senior', y5: 'Grad',
    intoTitle: 'Who are you into?', intoSub: 'Pick all that apply.', iMen: 'Men', iWomen: 'Women', iNb: 'Non-binary',
    geoTitle: 'Where do you usually show up?', geoSub: 'Drop a pin on the spots you frequent. Maple matches you with people who move through campus the way you do.',
    skip: 'Skip for now →',
    pwTitle: 'Set a password', pwSub: "You'll use your email + this password to log back in.",
    pwPh: 'password (8+ characters)', pwPh2: 'confirm password', pwCreate: 'Create account →', creating: 'Creating your account…',
    errPwLen: 'Password must be at least 8 characters', errPwMatch: 'Passwords do not match',
    errLoginEmpty: 'Enter your email and password', errLogin: 'Login failed', errSignup: 'Sign up failed. Try again.',
    back: '← back', backToStart: '← back', footer: 'mutual matches only 🤝', privacy: 'Privacy', terms: 'Terms', pleaseWait: 'Please wait…',
    swipeUp: 'swipe up', stepOf: (a: number, b: number) => `Step ${a} of ${b}`,
  },
  zh: {
    ctaTagline: '写给那个你已经见过千百次的人。',
    signUp: '注册', logIn: '登录', newHere: '还没账号？',
    welcomeBack: '欢迎回来',
    loginEmail: '邮箱', loginPw: '密码', loginBtn: '登录 →',
    emailTitle: '你的邮箱是？', emailSub: '之后用它登录，任意邮箱都可以。',
    emailPh: 'you@example.com', continue: '继续 →',
    errEmail: '请输入有效的邮箱地址',
    errEmailTaken: '此邮箱已被注册，请直接登录。',
    signingAs: '正在注册',
    phoneTitle: '你的手机号？', phoneSub: '仅用于匹配成功后联系你，不会发短信、不发垃圾信息。',
    phoneSend: '继续 →', sending: '发送中…',
    errPhone: '请输入有效的手机号',
    errSend: '验证码发送失败，请重试。', errNet: '网络错误，请重试。',
    otpTitle: '查收邮箱验证码', otpSubPre: '验证码已发送至',
    verify: '验证 →', verifying: '验证中…',
    errOtpLen: '请输入收到的 6 位验证码', errOtpWrong: '验证码错误，请重试',
    otpResent: '已重新发送 ✓', errResend: '重发失败，请重试。',
    otpDidnt: '没收到？', resend: '重新发送',
    nameTitle: '大家怎么称呼你？', nameSub: '名字或昵称都行，怎么舒服怎么来。', namePh: '你的名字',
    genderTitle: '我是…', gMan: '男生', gWoman: '女生', gNb: '非二元',
    yearTitle: '你是哪一届？', y1: '大一', y2: '大二', y3: '大三', y4: '大四', y5: '研究生',
    intoTitle: '你想认识？', intoSub: '可多选。', iMen: '男生', iWomen: '女生', iNb: '非二元',
    geoTitle: '你常出现在哪？', geoSub: '在地图上标出你常去的地点。Maple 会把你和经常出现在同样地方的人匹配起来。',
    skip: '暂时跳过 →',
    pwTitle: '设置密码', pwSub: '之后用 邮箱 + 这个密码 登录。',
    pwPh: '密码（至少 8 位）', pwPh2: '确认密码', pwCreate: '创建账号 →', creating: '正在创建账号…',
    errPwLen: '密码至少需要 8 位', errPwMatch: '两次密码不一致',
    errLoginEmpty: '请输入邮箱和密码', errLogin: '登录失败', errSignup: '注册失败，请重试。',
    back: '← 返回', backToStart: '← 返回', footer: '双向喜欢才匹配 🤝', privacy: '隐私', terms: '条款', pleaseWait: '请稍候…',
    swipeUp: '上滑', stepOf: (a: number, b: number) => `第 ${a} / ${b} 步`,
  },
} as const

export default function HomePage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signup')
  const [step, setStep] = useState<Step>('email')
  const [view, setView] = useState<View>('cta')

  const [email, setEmail] = useState('')

  const [form, setForm] = useState<{ name: string; gender: string; want_to_date: string[]; year: string }>({
    name: '', gender: '', want_to_date: [], year: '',
  })
  const [spots, setSpots] = useState<string[]>([])

  const [phone, setPhone] = useState('')
  const [phoneCC, setPhoneCC] = useState<'86' | '1'>('86')
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')

  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lang, setLang] = useState<Lang>('en')
  const [darkMode, setDarkMode] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const [splashLeaving, setSplashLeaving] = useState(false)
  const touchStartY = useRef(0)

  useEffect(() => {
    const saved = localStorage.getItem('maple_dark')
    if (saved === 'true') {
      document.documentElement.classList.add('dark')
      setDarkMode(true)
    }
    const savedLang = localStorage.getItem('maple_lang')
    if (savedLang === 'zh' || savedLang === 'en') setLang(savedLang)
  }, [])

  const t = T[lang]
  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next = prev === 'en' ? 'zh' : 'en'
      localStorage.setItem('maple_lang', next)
      return next
    })
  }, [])

  const toggleDark = useCallback(() => {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('maple_dark', String(next))
  }, [darkMode])

  function set(key: 'name' | 'gender' | 'year', value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const validEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())

  async function submitEmail() {
    if (!validEmail) { setError(t.errEmail); return }
    const normalized = email.trim().toLowerCase()
    setError('')
    setLoading(true)
    try {
      const chk = await fetch(`/api/check-email?email=${encodeURIComponent(normalized)}`)
      const cj = await chk.json()
      if (cj.exists) { setError(t.errEmailTaken); return }
      const res = await fetch('/api/send-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalized }),
      })
      if (!res.ok) { setError(t.errSend); return }
      setEmail(normalized)
      setOtp('')
      setStep('otp')
    } catch {
      setError(t.errNet)
    } finally {
      setLoading(false)
    }
  }

  // ─── Email code verification ────────────────────────────────────────────────
  async function verifyOtp() {
    setOtpError('')
    if (otp.length !== 6) { setOtpError(t.errOtpLen); return }
    setLoading(true)
    try {
      const res = await fetch('/api/verify-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp }),
      })
      if (!res.ok) { setOtpError(t.errOtpWrong); return }
      setStep('phone')
    } catch { setOtpError(t.errNet) }
    finally { setLoading(false) }
  }

  async function resendOtp() {
    setOtpError('')
    const res = await fetch('/api/send-email-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setOtpError(res.ok ? t.otpResent : t.errResend)
  }

  // ─── Phone (collected, not verified) ────────────────────────────────────────
  function phoneDigits() { return phone.replace(/\D/g, '') }
  const phoneValid = phoneCC === '86' ? phoneDigits().length === 11 : phoneDigits().length === 10

  // ─── Spots (geolocation) ───────────────────────────────────────────────────
  function addSpot(raw: string) {
    const s = raw.trim()
    if (!s) return
    setSpots(prev => (prev.length >= 5 || prev.some(x => x.toLowerCase() === s.toLowerCase())) ? prev : [...prev, s])
  }
  function removeSpot(s: string) { setSpots(prev => prev.filter(x => x !== s)) }

  // ─── Final account creation ────────────────────────────────────────────────
  async function finishSignup() {
    setError('')
    if (password.length < 8) { setError(t.errPwLen); return }
    if (password !== password2) { setError(t.errPwMatch); return }
    setLoading(true)
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          phone: '+' + phoneCC + phoneDigits(),
          name: form.name,
          gender: form.gender,
          want_to_date: form.want_to_date,
          year: form.year,
          top_spots: spots,
          password,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || t.errSignup); return }
      localStorage.setItem('anlan_user_id', json.id)
      localStorage.setItem('anlan_user_name', json.name)
      router.push('/profile?setup=1')
    } catch { setError(t.errNet) }
    finally { setLoading(false) }
  }

  // ─── Login (Welcome back) ──────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!loginEmail || !loginPassword) { setError(t.errLoginEmpty); return }
    setLoading(true)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || t.errLogin); return }
      localStorage.setItem('anlan_user_id', json.id)
      localStorage.setItem('anlan_user_name', json.name)
      router.push('/feed')
    } catch { setError(t.errNet) }
    finally { setLoading(false) }
  }

  // ─── Wizard navigation ─────────────────────────────────────────────────────
  function goNext() {
    const i = ORDER.indexOf(step)
    if (i < ORDER.length - 1) setStep(ORDER[i + 1])
  }
  function goBack() {
    setError(''); setOtpError('')
    const i = ORDER.indexOf(step)
    if (i > 0) setStep(ORDER[i - 1])
    else setView('cta')
  }
  const canContinue =
    step === 'name' ? !!form.name.trim()
    : step === 'gender' ? !!form.gender
    : step === 'year' ? !!form.year
    : step === 'into' ? form.want_to_date.length > 0
    : step === 'phone' ? phoneValid
    : true

  function startSignup() { setMode('signup'); setStep('email'); setError(''); setView('wizard') }
  function startLogin() { setMode('login'); setError(''); setView('login') }

  function dismissSplash() {
    if (!showSplash) return
    setSplashLeaving(true)
    setTimeout(() => { setShowSplash(false); setView('cta') }, 400)
  }

  // Top-right language + theme controls (shared across non-splash screens).
  const Controls = (
    <div className="controls">
      <button className="ctrl" onClick={toggleLang} title="Switch language">
        <span>🌐</span>{lang === 'en' ? '中文' : 'EN'}
      </button>
      <button className="ctrl" onClick={toggleDark} title={darkMode ? 'Light mode' : 'Dark mode'}>
        {darkMode ? '☀️' : '🌙'}
      </button>
    </div>
  )

  // ─── Splash ────────────────────────────────────────────────────────────────
  if (showSplash) {
    return (
      <div className={`app${splashLeaving ? ' leaving' : ''}`}>
        <section
          className="screen splash"
          onClick={dismissSplash}
          onTouchStart={(e) => { touchStartY.current = e.touches[0].clientY }}
          onTouchEnd={(e) => { if (touchStartY.current - e.changedTouches[0].clientY > 40) dismissSplash() }}
          onWheel={(e) => { if (e.deltaY > 20) dismissSplash() }}
        >
          <div className="splash-core">
            <MapleEyes width={182} strokeWidth={4} tap={false} />
            <h1 className="maple-title">Maple</h1>
            <p className="maple-sub">{t.ctaTagline}</p>
          </div>
          <div className="doodle-wrap"><MapleDoodles /></div>
          <div className="swipe"><span>{t.swipeUp}</span><span className="arr">↑</span></div>
        </section>
      </div>
    )
  }

  // ─── CTA ───────────────────────────────────────────────────────────────────
  if (view === 'cta') {
    return (
      <div className="app">
        {Controls}
        <section className="screen cta">
          <div className="cta-core fade-up">
            <MapleEyes width={160} strokeWidth={4} />
            <p className="cta-tagline">{t.ctaTagline}</p>
          </div>
          <div className="cta-actions fade-up">
            <button className="btn btn-primary" onClick={startSignup}>{t.signUp}</button>
            <button className="btn btn-secondary" onClick={startLogin}>{t.logIn}</button>
          </div>
        </section>
      </div>
    )
  }

  // ─── Login ─────────────────────────────────────────────────────────────────
  if (view === 'login') {
    return (
      <div className="app">
        {Controls}
        <section className="screen login">
          <div className="login-core">
            <MapleEyes width={150} strokeWidth={4} />
            <h2 className="login-title">{t.welcomeBack}</h2>
            <form className="login-form" onSubmit={handleLogin}>
              <div>
                <label className="label">{t.loginEmail}</label>
                <input className="input" type="email" placeholder="you@school.edu" autoComplete="off"
                  value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="label">{t.loginPw}</label>
                <input className="input" type="password" placeholder="••••••••"
                  value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
              </div>
              {error && <p className="err-msg">{error}</p>}
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: '.35rem' }}>
                {loading ? t.pleaseWait : t.loginBtn}
              </button>
              <p className="login-alt">
                {t.newHere} <a onClick={startSignup}>{t.signUp}</a> &nbsp;·&nbsp; <a onClick={() => setView('cta')}>back</a>
              </p>
            </form>
          </div>
        </section>
      </div>
    )
  }

  // ─── Signup wizard ─────────────────────────────────────────────────────────
  const profileIdx = PROFILE_STEPS.indexOf(step)

  return (
    <div className="app">
      {Controls}
      <section className="screen wizard">
        <div className="wiz">
          <div className="wiz-top">
            <button className="back" onClick={goBack}>{t.back}</button>
            <span className="count">{profileIdx >= 0 ? t.stepOf(profileIdx + 1, PROFILE_STEPS.length) : ''}</span>
            <MapleEyes width={46} strokeWidth={6} className="wiz-eyes" />
          </div>

          {profileIdx >= 0 && (
            <div className="progress">
              {PROFILE_STEPS.map((s, i) => (
                <span key={s} className={`seg${i <= profileIdx ? ' on' : ''}`} />
              ))}
            </div>
          )}

          {/* Step: email */}
          {step === 'email' && (
            <div className="wiz-body">
              <div className="step-emoji">📧</div>
              <h2 className="step-title">{t.emailTitle}</h2>
              <p className="step-sub">{t.emailSub}</p>
              <input className="input" type="email" placeholder={t.emailPh} value={email} autoFocus
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitEmail() }} />
              {error && <p className="err-msg">{error}</p>}
              <div className="wiz-foot">
                <button className="btn btn-primary" onClick={submitEmail} disabled={!validEmail || loading}>
                  {loading ? t.pleaseWait : t.continue}
                </button>
              </div>
            </div>
          )}

          {/* Step: otp */}
          {step === 'otp' && (
            <div className="wiz-body">
              <div className="step-emoji">✉️</div>
              <h2 className="step-title">{t.otpTitle}</h2>
              <p className="step-sub">{t.otpSubPre} {email}</p>
              <input className="otp-input" type="text" inputMode="numeric" placeholder="______" maxLength={6} value={otp} autoFocus
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={(e) => { if (e.key === 'Enter' && otp.length === 6) verifyOtp() }} />
              {otpError && <p className={otpError.includes('✓') ? 'ok-msg' : 'err-msg'}>{otpError}</p>}
              <div className="wiz-foot">
                <button className="btn btn-primary" onClick={verifyOtp} disabled={loading || otp.length !== 6}>
                  {loading ? t.verifying : t.verify}
                </button>
              </div>
              <p className="pro-note" style={{ textAlign: 'center', marginTop: '1rem' }}>
                {t.otpDidnt} <a onClick={resendOtp} style={{ color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer' }}>{t.resend}</a>
              </p>
            </div>
          )}

          {/* Step: phone */}
          {step === 'phone' && (
            <div className="wiz-body">
              <div className="step-emoji">📱</div>
              <h2 className="step-title">{t.phoneTitle}</h2>
              <p className="step-sub">{t.phoneSub}</p>
              <div className="row" style={{ alignItems: 'stretch' }}>
                <button type="button" className="choice" style={{ width: 'auto', flex: '0 0 auto', gap: '.4rem' }}
                  onClick={() => { setPhoneCC(c => c === '86' ? '1' : '86'); setPhone('') }}>
                  <span>{phoneCC === '86' ? '🇨🇳' : '🇺🇸'}</span>
                  <span>+{phoneCC}</span>
                  <span style={{ fontSize: 10, opacity: .6 }}>▾</span>
                </button>
                <input className="input" type="tel" inputMode="numeric" autoFocus value={phone}
                  placeholder={phoneCC === '86' ? '138 0000 0000' : '(555) 000-0000'}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, phoneCC === '86' ? 11 : 10))}
                  onKeyDown={(e) => { if (e.key === 'Enter' && phoneValid) goNext() }} />
              </div>
              <div className="wiz-foot">
                <button className="btn btn-primary" onClick={goNext} disabled={!phoneValid}>{t.continue}</button>
              </div>
            </div>
          )}

          {/* Step: name */}
          {step === 'name' && (
            <div className="wiz-body">
              <div className="step-emoji">👋</div>
              <h2 className="step-title">{t.nameTitle}</h2>
              <p className="step-sub">{t.nameSub}</p>
              <input className="input" type="text" placeholder={t.namePh} value={form.name} autoFocus
                onChange={(e) => set('name', e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && canContinue) goNext() }} />
              <div className="wiz-foot">
                <button className="btn btn-primary" onClick={goNext} disabled={!canContinue}>{t.continue}</button>
              </div>
            </div>
          )}

          {/* Step: gender */}
          {step === 'gender' && (
            <div className="wiz-body">
              <div className="step-emoji">🧬</div>
              <h2 className="step-title">{t.genderTitle}</h2>
              <div className="stack">
                {[{ v: 'Man', l: t.gMan }, { v: 'Woman', l: t.gWoman }, { v: 'Non-binary', l: t.gNb }].map(({ v, l }) => (
                  <button key={v} className={`choice${form.gender === v ? ' active' : ''}`} onClick={() => set('gender', v)}>
                    {l}{form.gender === v && <span>●</span>}
                  </button>
                ))}
              </div>
              <div className="wiz-foot">
                <button className="btn btn-primary" onClick={goNext} disabled={!canContinue}>{t.continue}</button>
              </div>
            </div>
          )}

          {/* Step: year */}
          {step === 'year' && (
            <div className="wiz-body">
              <div className="step-emoji">🎓</div>
              <h2 className="step-title">{t.yearTitle}</h2>
              <div className="chips">
                {[{ v: 'First-year', l: t.y1 }, { v: 'Sophomore', l: t.y2 }, { v: 'Junior', l: t.y3 }, { v: 'Senior', l: t.y4 }, { v: 'Grad', l: t.y5 }].map(({ v, l }) => (
                  <button key={v} className={`chip${form.year === v ? ' active' : ''}`} onClick={() => set('year', v)}>{l}</button>
                ))}
              </div>
              <div className="wiz-foot">
                <button className="btn btn-primary" onClick={goNext} disabled={!canContinue}>{t.continue}</button>
              </div>
            </div>
          )}

          {/* Step: into */}
          {step === 'into' && (
            <div className="wiz-body">
              <div className="step-emoji">💘</div>
              <h2 className="step-title">{t.intoTitle}</h2>
              <p className="step-sub">{t.intoSub}</p>
              <div className="chips">
                {[{ v: 'Men', l: t.iMen }, { v: 'Women', l: t.iWomen }, { v: 'Non-binary', l: t.iNb }].map(({ v, l }) => (
                  <button key={v}
                    className={`chip${form.want_to_date.includes(v) ? ' active' : ''}`}
                    onClick={() => setForm(f => ({
                      ...f,
                      want_to_date: f.want_to_date.includes(v) ? f.want_to_date.filter(x => x !== v) : [...f.want_to_date, v],
                    }))}>
                    {l}
                  </button>
                ))}
              </div>
              <div className="wiz-foot">
                <button className="btn btn-primary" onClick={goNext} disabled={!canContinue}>{t.continue}</button>
              </div>
            </div>
          )}

          {/* Step: geo */}
          {step === 'geo' && (
            <div className="wiz-body">
              <div className="step-emoji">📍</div>
              <h2 className="step-title">{t.geoTitle}</h2>
              <p className="step-sub">{t.geoSub}</p>
              <SpotPicker spots={spots} onAdd={addSpot} onRemove={removeSpot} lang={lang} />
              <div className="wiz-foot">
                <button className="btn btn-primary" onClick={goNext}>{spots.length === 0 ? t.skip : t.continue}</button>
              </div>
            </div>
          )}

          {/* Step: password */}
          {step === 'password' && (
            <div className="wiz-body">
              <div className="step-emoji">🔐</div>
              <h2 className="step-title">{t.pwTitle}</h2>
              <p className="step-sub">{t.pwSub}</p>
              <div className="stack">
                <input className="input" type="password" placeholder={t.pwPh} value={password} autoFocus
                  onChange={(e) => setPassword(e.target.value)} />
                <input className="input" type="password" placeholder={t.pwPh2} value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') finishSignup() }} />
              </div>
              {error && <p className="err-msg">{error}</p>}
              <div className="wiz-foot">
                <button className="btn btn-primary" onClick={finishSignup} disabled={loading || password.length < 8 || password !== password2}>
                  {loading ? t.creating : t.pwCreate}
                </button>
              </div>
            </div>
          )}

          <p className="pro-note" style={{ textAlign: 'center', marginTop: '1.5rem' }}>{t.footer}</p>
          <p className="pro-note" style={{ textAlign: 'center', marginTop: '.4rem' }}>
            <a href="/privacy" style={{ textDecoration: 'underline' }}>{t.privacy}</a>{' · '}
            <a href="/terms" style={{ textDecoration: 'underline' }}>{t.terms}</a>
          </p>
        </div>
      </section>
    </div>
  )
}
