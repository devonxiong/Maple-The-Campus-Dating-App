'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import SpotPicker from './components/SpotPicker'
import MapleEyes, { MapleDoodles } from './components/MapleEyes'
import HandIcon from './components/HandIcon'

type Mode = 'signup' | 'login'
type View = 'cta' | 'login' | 'wizard'
type Lang = 'en' | 'zh'

// The Claremont Colleges (matches lib/score → schoolFromEmail).
const COLLEGES = [
  { name: 'Pomona', label: 'Pomona', domain: 'pomona.edu' },
  { name: 'CMC', label: 'Claremont McKenna', domain: 'cmc.edu' },
  { name: 'HMC', label: 'Harvey Mudd', domain: 'hmc.edu' },
  { name: 'Scripps', label: 'Scripps', domain: 'scrippscollege.edu' },
  { name: 'Pitzer', label: 'Pitzer', domain: 'pitzer.edu' },
] as const

// ─── i18n ─────────────────────────────────────────────────────────────────────
const T = {
  en: {
    ctaTagline: 'For the one you’ve seen a thousand times.',
    signUp: 'Sign up', logIn: 'Log in', newHere: 'New here?',
    welcomeBack: 'Welcome back',
    loginEmail: 'Email', loginPw: 'Password', loginBtn: 'Log in →',
    back: '← back', continue: 'Continue →', pleaseWait: 'Please wait…',
    stepOf: (a: number, b: number) => `Step ${a} of ${b}`,
    swipeUp: 'swipe up', footer: 'mutual matches only',
    privacy: 'Privacy', terms: 'Terms',
    errNet: 'Network error. Try again.',
    errLoginEmpty: 'Enter your email and password', errLogin: 'Login failed',

    // step 1 — verify campus
    campusTitle: 'Verify your campus',
    campusSub: 'Maple is only for the Claremont Colleges. Pick yours, then verify with your school email.',
    schoolEmail: 'School email',
    errPickCollege: 'Pick your college first',
    errEmail: 'Enter a valid email address',
    errEmailTaken: 'This email is already registered. Log in instead.',
    errSend: 'Failed to send code. Try again.',
    sendCode: 'Send code →', sending: 'Sending…',
    otpTitle: 'Check your email', otpSubPre: 'We emailed a 6-digit code to',
    verify: 'Verify →', verifying: 'Verifying…',
    errOtpLen: 'Enter the 6-digit code', errOtpWrong: 'Wrong code — try again',
    otpResent: 'New code sent ✓', errResend: 'Failed to resend. Try again.',
    otpDidnt: "didn't get it?", resend: 'resend',

    // step 2 — profile
    profileTitle: 'Your profile', profileSub: 'This is what people see. Keep it real.',
    myCampus: 'My campus', change: 'change ›',
    myName: 'My name', firstName: 'First name', lastName: 'Last (optional)',
    nameHint: 'We suggest your real name so people can find you.',
    myAge: 'My age', myYear: 'My year',
    y1: 'First-year', y2: 'Sophomore', y3: 'Junior', y4: 'Senior', y5: 'Grad',
    myGender: 'My gender', gMan: 'Man', gWoman: 'Woman', gNb: 'Non-binary',
    myPref: 'My preference', iMen: 'Men', iWomen: 'Women', iNb: 'Non-binary',
    topSpots: 'My top 3 spots on campus',
    onePhoto: 'One photo', photoHint: 'One photo to show who you are.',
    errName: 'Add your first name', errGender: 'Pick your gender',
    errPref: 'Pick who you’re into', errPhoto: 'Add one photo to continue',

    // step 3 — rules
    rulesTitle: 'A few ground rules', rulesSub: 'The short version. The full text is always in Settings.',
    r1t: 'Real students only', r1b: 'Maple is for verified Claremont Colleges students. One account per person, your real self.',
    r2t: 'Be kind, be safe', r2b: 'No harassment, hate, or nudity. Mutual matches only — no one sees your like unless they like you back.',
    r3t: 'Your data', r3b: 'We use your spots to match you. Location isn’t stored between sessions. Delete your account anytime.',
    r4t: 'Meeting up', r4b: 'Meet in public, tell a friend, trust your gut. Maple gives you safety tools, but you’re in charge.',
    setPassword: 'Set a password', pwPh: 'Password (8+ characters)',
    pwHint: 'You’ll log in with your school email + this password.',
    agreePre: 'I’ve read and agree to the ', agreeTerms: 'Terms', agreeAnd: ' & ', agreePrivacy: 'Privacy Policy', agreeEnd: '.',
    createAccount: 'Create account →', creating: 'Creating your account…',
    errPwLen: 'Password must be at least 8 characters', errAgree: 'Please agree to the terms',
    errSignup: 'Sign up failed. Try again.',
  },
  zh: {
    ctaTagline: '写给那个你已经见过千百次的人。',
    signUp: '注册', logIn: '登录', newHere: '还没账号？',
    welcomeBack: '欢迎回来',
    loginEmail: '邮箱', loginPw: '密码', loginBtn: '登录 →',
    back: '← 返回', continue: '继续 →', pleaseWait: '请稍候…',
    stepOf: (a: number, b: number) => `第 ${a} / ${b} 步`,
    swipeUp: '上滑', footer: '双向喜欢才匹配',
    privacy: '隐私', terms: '条款',
    errNet: '网络错误，请重试。',
    errLoginEmpty: '请输入邮箱和密码', errLogin: '登录失败',

    campusTitle: '验证你的学校',
    campusSub: 'Maple 仅限克莱蒙特联盟院校。先选择你的学校，再用校园邮箱验证。',
    schoolEmail: '校园邮箱',
    errPickCollege: '请先选择你的学校',
    errEmail: '请输入有效的邮箱地址',
    errEmailTaken: '此邮箱已被注册，请直接登录。',
    errSend: '验证码发送失败，请重试。',
    sendCode: '发送验证码 →', sending: '发送中…',
    otpTitle: '查收邮箱验证码', otpSubPre: '验证码已发送至',
    verify: '验证 →', verifying: '验证中…',
    errOtpLen: '请输入 6 位验证码', errOtpWrong: '验证码错误，请重试',
    otpResent: '已重新发送 ✓', errResend: '重发失败，请重试。',
    otpDidnt: '没收到？', resend: '重新发送',

    profileTitle: '你的资料', profileSub: '这是别人看到的你，真实一点。',
    myCampus: '我的学校', change: '更改 ›',
    myName: '我的名字', firstName: '名', lastName: '姓（可选）',
    nameHint: '建议用真实姓名，方便别人找到你。',
    myAge: '年龄', myYear: '年级',
    y1: '大一', y2: '大二', y3: '大三', y4: '大四', y5: '研究生',
    myGender: '性别', gMan: '男生', gWoman: '女生', gNb: '非二元',
    myPref: '想认识', iMen: '男生', iWomen: '女生', iNb: '非二元',
    topSpots: '我在校园最常去的 3 个地方',
    onePhoto: '一张照片', photoHint: '一张能代表你的照片。',
    errName: '请填写你的名字', errGender: '请选择性别',
    errPref: '请选择想认识的人', errPhoto: '请上传一张照片再继续',

    rulesTitle: '几条基本规则', rulesSub: '简版。完整条款随时可在设置里查看。',
    r1t: '只限真实学生', r1b: 'Maple 仅限已验证的克莱蒙特联盟学生。一人一号，做真实的自己。',
    r2t: '友善、安全', r2b: '禁止骚扰、仇恨与裸露。只有双向喜欢才匹配——除非对方也喜欢你，否则没人看得到你的喜欢。',
    r3t: '你的数据', r3b: '我们用你的常去地点来匹配。位置不会跨会话保存。你可以随时删除账号。',
    r4t: '见面', r4b: '在公共场合见面、告诉朋友、相信直觉。Maple 提供安全工具，但主动权在你手里。',
    setPassword: '设置密码', pwPh: '密码（至少 8 位）',
    pwHint: '之后用 校园邮箱 + 这个密码 登录。',
    agreePre: '我已阅读并同意', agreeTerms: '条款', agreeAnd: ' 和 ', agreePrivacy: '隐私政策', agreeEnd: '。',
    createAccount: '创建账号 →', creating: '正在创建账号…',
    errPwLen: '密码至少需要 8 位', errAgree: '请先同意条款',
    errSignup: '注册失败，请重试。',
  },
} as const

export default function HomePage() {
  const router = useRouter()
  const [view, setView] = useState<View>('cta')
  const [wizStep, setWizStep] = useState(0) // 0 campus · 1 profile · 2 rules

  // step 1 — campus + email verification
  const [college, setCollege] = useState('')
  const [email, setEmail] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')

  // step 2 — profile
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [age, setAge] = useState('')
  const [year, setYear] = useState('')
  const [gender, setGender] = useState('')
  const [into, setInto] = useState<string[]>([])
  const [spots, setSpots] = useState<string[]>([])
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const photoInput = useRef<HTMLInputElement>(null)

  // step 3 — rules + password
  const [password, setPassword] = useState('')
  const [agree, setAgree] = useState(false)

  // login
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
    if (saved === 'true') { document.documentElement.classList.add('dark'); setDarkMode(true) }
    const savedLang = localStorage.getItem('maple_lang')
    if (savedLang === 'zh' || savedLang === 'en') setLang(savedLang)
  }, [])

  const t = T[lang]
  const toggleLang = useCallback(() => {
    setLang(prev => { const next = prev === 'en' ? 'zh' : 'en'; localStorage.setItem('maple_lang', next); return next })
  }, [])
  const toggleDark = useCallback(() => {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('maple_dark', String(next))
  }, [darkMode])

  const collegeMeta = COLLEGES.find(c => c.name === college)
  const validEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())

  // ─── step 1: send + verify the email code ───────────────────────────────────
  async function sendCode() {
    if (!college) { setError(t.errPickCollege); return }
    if (!validEmail) { setError(t.errEmail); return }
    const normalized = email.trim().toLowerCase()
    setError(''); setLoading(true)
    try {
      const chk = await fetch(`/api/check-email?email=${encodeURIComponent(normalized)}`)
      const cj = await chk.json()
      if (cj.exists) { setError(t.errEmailTaken); return }
      const res = await fetch('/api/send-email-code', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalized }),
      })
      if (!res.ok) { setError(t.errSend); return }
      setEmail(normalized); setOtp(''); setOtpSent(true)
    } catch { setError(t.errNet) } finally { setLoading(false) }
  }

  async function verifyOtp() {
    setOtpError('')
    if (otp.length !== 6) { setOtpError(t.errOtpLen); return }
    setLoading(true)
    try {
      const res = await fetch('/api/verify-email-code', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp }),
      })
      if (!res.ok) { setOtpError(t.errOtpWrong); return }
      setWizStep(1)
    } catch { setOtpError(t.errNet) } finally { setLoading(false) }
  }

  async function resendOtp() {
    setOtpError('')
    const res = await fetch('/api/send-email-code', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
    })
    setOtpError(res.ok ? t.otpResent : t.errResend)
  }

  // ─── step 2: photo + spots ──────────────────────────────────────────────────
  function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setPhotoFile(f)
    setPhotoPreview(URL.createObjectURL(f))
  }
  function addSpot(raw: string) {
    const s = raw.trim()
    if (!s) return
    setSpots(prev => (prev.length >= 3 || prev.some(x => x.toLowerCase() === s.toLowerCase())) ? prev : [...prev, s])
  }
  function removeSpot(s: string) { setSpots(prev => prev.filter(x => x !== s)) }

  function nextFromProfile() {
    if (!firstName.trim()) { setError(t.errName); return }
    if (!gender) { setError(t.errGender); return }
    if (into.length === 0) { setError(t.errPref); return }
    if (!photoFile) { setError(t.errPhoto); return }
    setError(''); setWizStep(2)
  }

  // ─── step 3: create the account ─────────────────────────────────────────────
  async function finishSignup() {
    setError('')
    if (password.length < 8) { setError(t.errPwLen); return }
    if (!agree) { setError(t.errAgree); return }
    setLoading(true)
    try {
      const name = `${firstName.trim()}${lastName.trim() ? ' ' + lastName.trim() : ''}`
      const res = await fetch('/api/signup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, name, gender, want_to_date: into, year,
          age: age ? Number(age) : undefined, top_spots: spots, password, campus: college,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || t.errSignup); return }
      localStorage.setItem('anlan_user_id', json.id)
      localStorage.setItem('anlan_user_name', json.name)
      // Upload the required photo now that we have a user id (best-effort).
      if (photoFile) {
        try {
          const fd = new FormData()
          fd.append('file', photoFile)
          fd.append('userId', json.id)
          await fetch('/api/upload-avatar', { method: 'POST', body: fd })
        } catch { /* photo can be re-added in profile */ }
      }
      router.push('/profile?setup=1')
    } catch { setError(t.errNet) } finally { setLoading(false) }
  }

  // ─── login ──────────────────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!loginEmail || !loginPassword) { setError(t.errLoginEmpty); return }
    setLoading(true)
    try {
      const res = await fetch('/api/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || t.errLogin); return }
      localStorage.setItem('anlan_user_id', json.id)
      localStorage.setItem('anlan_user_name', json.name)
      router.push('/feed')
    } catch { setError(t.errNet) } finally { setLoading(false) }
  }

  function startSignup() { setView('wizard'); setWizStep(0); setError('') }
  function startLogin() { setView('login'); setError('') }
  function wizBack() {
    setError(''); setOtpError('')
    if (wizStep > 0) setWizStep(wizStep - 1)
    else setView('cta')
  }

  function dismissSplash() {
    if (!showSplash) return
    setSplashLeaving(true)
    setTimeout(() => { setShowSplash(false); setView('cta') }, 400)
  }

  const Controls = (
    <div className="controls">
      <button className="ctrl" onClick={toggleLang} title="Switch language">
        <HandIcon name="globe" size={15} />{lang === 'en' ? '中文' : 'EN'}
      </button>
      <button className="ctrl" onClick={toggleDark} title={darkMode ? 'Light mode' : 'Dark mode'}>
        <HandIcon name={darkMode ? 'sun' : 'moon'} size={15} />
      </button>
    </div>
  )

  // ─── Splash ────────────────────────────────────────────────────────────────
  if (showSplash) {
    return (
      <div className={`app${splashLeaving ? ' leaving' : ''}`}>
        <section className="screen splash"
          onClick={dismissSplash}
          onTouchStart={(e) => { touchStartY.current = e.touches[0].clientY }}
          onTouchEnd={(e) => { if (touchStartY.current - e.changedTouches[0].clientY > 40) dismissSplash() }}
          onWheel={(e) => { if (e.deltaY > 20) dismissSplash() }}>
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

  // ─── Signup wizard (3 steps) ─────────────────────────────────────────────────
  return (
    <div className="app">
      {Controls}
      <section className="screen wizard">
        <div className="wiz">
          <div className="wiz-top">
            <button className="back" onClick={wizBack}>{t.back}</button>
            <span className="count">{t.stepOf(wizStep + 1, 3)}</span>
            <MapleEyes width={46} strokeWidth={6} className="wiz-eyes" />
          </div>

          <div className="progress">
            {[0, 1, 2].map(i => <span key={i} className={`seg${i <= wizStep ? ' on' : ''}`} />)}
          </div>

          {/* ── Step 1: verify campus ── */}
          {wizStep === 0 && (
            <div className="wiz-body">
              <div className="step-emoji"><HandIcon name="gradcap" size={30} /></div>
              <h2 className="step-title">{t.campusTitle}</h2>
              <p className="step-sub">{t.campusSub}</p>

              <div className="stack">
                {COLLEGES.map(c => (
                  <button key={c.name} className={`choice${college === c.name ? ' active' : ''}`}
                    onClick={() => { setCollege(c.name); if (otpSent) { setOtpSent(false); setOtp('') } }}>
                    {c.label} <span className="edu">@{c.domain}</span>
                  </button>
                ))}
              </div>

              <div style={{ marginTop: '.9rem' }}>
                <label className="label">{t.schoolEmail}</label>
                <input className="input" type="email" autoComplete="off"
                  placeholder={collegeMeta ? `you@${collegeMeta.domain}` : 'you@school.edu'}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (otpSent) { setOtpSent(false); setOtp('') } }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !otpSent) sendCode() }} />
              </div>

              {otpSent && (
                <div className="fade-up" style={{ marginTop: '1rem' }}>
                  <div className="step-emoji" style={{ fontSize: 0 }}><HandIcon name="envelope" size={24} /></div>
                  <p className="step-sub" style={{ margin: '.5rem 0 .75rem' }}>{t.otpSubPre} <b>{email}</b></p>
                  <input className="otp-input" type="text" inputMode="numeric" placeholder="______" maxLength={6}
                    value={otp} autoFocus
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyDown={(e) => { if (e.key === 'Enter' && otp.length === 6) verifyOtp() }} />
                  {otpError && <p className={otpError.includes('✓') ? 'ok-msg' : 'err-msg'}>{otpError}</p>}
                  <p className="pro-note" style={{ textAlign: 'center', marginTop: '.75rem' }}>
                    {t.otpDidnt} <a onClick={resendOtp} style={{ color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer' }}>{t.resend}</a>
                  </p>
                </div>
              )}

              {error && <p className="err-msg">{error}</p>}
              <div className="wiz-foot">
                {otpSent
                  ? <button className="btn btn-primary" onClick={verifyOtp} disabled={loading || otp.length !== 6}>{loading ? t.verifying : t.verify}</button>
                  : <button className="btn btn-primary" onClick={sendCode} disabled={loading || !college || !validEmail}>{loading ? t.sending : t.sendCode}</button>}
              </div>
            </div>
          )}

          {/* ── Step 2: profile ── */}
          {wizStep === 1 && (
            <div className="wiz-body">
              <div className="step-emoji"><HandIcon name="person" size={30} /></div>
              <h2 className="step-title">{t.profileTitle}</h2>
              <p className="step-sub">{t.profileSub}</p>

              <label className="label">{t.myCampus}</label>
              <button className="campus-chip" onClick={() => setWizStep(0)}>
                <span>{collegeMeta?.label ?? college ?? '—'}</span>
                <span className="change">{t.change}</span>
              </button>

              <div className="stack" style={{ gap: '.9rem' }}>
                <div>
                  <label className="label">{t.myName}</label>
                  <div className="row">
                    <input className="input" placeholder={t.firstName} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    <input className="input" placeholder={t.lastName} value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                  <p className="hint">{t.nameHint}</p>
                </div>

                <div className="row">
                  <div style={{ flex: '0 0 90px' }}>
                    <label className="label">{t.myAge}</label>
                    <input className="input" inputMode="numeric" placeholder="20" value={age}
                      onChange={(e) => setAge(e.target.value.replace(/\D/g, '').slice(0, 2))} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">{t.myYear}</label>
                    <div className="chips">
                      {[{ v: 'First-year', l: t.y1 }, { v: 'Sophomore', l: t.y2 }, { v: 'Junior', l: t.y3 }, { v: 'Senior', l: t.y4 }, { v: 'Grad', l: t.y5 }].map(({ v, l }) => (
                        <button key={v} className={`chip${year === v ? ' active' : ''}`} onClick={() => setYear(v)}>{l}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label">{t.myGender}</label>
                  <div className="chips">
                    {[{ v: 'Man', l: t.gMan }, { v: 'Woman', l: t.gWoman }, { v: 'Non-binary', l: t.gNb }].map(({ v, l }) => (
                      <button key={v} className={`chip${gender === v ? ' active' : ''}`} onClick={() => setGender(v)}>{l}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">{t.myPref}</label>
                  <div className="chips">
                    {[{ v: 'Men', l: t.iMen }, { v: 'Women', l: t.iWomen }, { v: 'Non-binary', l: t.iNb }].map(({ v, l }) => (
                      <button key={v} className={`chip${into.includes(v) ? ' active' : ''}`}
                        onClick={() => setInto(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])}>{l}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                    {t.topSpots} <HandIcon name="pin" size={13} />
                  </label>
                  <SpotPicker spots={spots} onAdd={addSpot} onRemove={removeSpot} lang={lang} />
                </div>

                <div>
                  <label className="label">{t.onePhoto}</label>
                  <div className={`photo${photoPreview ? ' filled' : ''}`} onClick={() => photoInput.current?.click()}>
                    {photoPreview
                      ? <img src={photoPreview} alt="you" />
                      : <HandIcon name="plus" size={30} />}
                  </div>
                  <input ref={photoInput} type="file" accept="image/*" hidden onChange={pickPhoto} />
                  <p className="hint">{t.photoHint}</p>
                </div>
              </div>

              {error && <p className="err-msg">{error}</p>}
              <div className="wiz-foot">
                <button className="btn btn-primary" onClick={nextFromProfile}>{t.continue}</button>
              </div>
            </div>
          )}

          {/* ── Step 3: rules + password ── */}
          {wizStep === 2 && (
            <div className="wiz-body">
              <div className="step-emoji"><HandIcon name="scroll" size={30} /></div>
              <h2 className="step-title">{t.rulesTitle}</h2>
              <p className="step-sub">{t.rulesSub}</p>

              <div className="terms-box">
                <h4>{t.r1t}</h4><p>{t.r1b}</p>
                <h4>{t.r2t}</h4><p>{t.r2b}</p>
                <h4>{t.r3t}</h4><p>{t.r3b}</p>
                <h4>{t.r4t}</h4><p>{t.r4b}</p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="label">{t.setPassword}</label>
                <input className="input" type="password" placeholder={t.pwPh} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') finishSignup() }} />
                <p className="hint">{t.pwHint}</p>
              </div>

              <label className={`agree${agree ? ' on' : ''}`} onClick={() => setAgree(a => !a)}>
                <span className="box"><HandIcon name="check" size={13} /></span>
                <span>{t.agreePre}<a href="/terms" onClick={(e) => e.stopPropagation()}>{t.agreeTerms}</a>{t.agreeAnd}<a href="/privacy" onClick={(e) => e.stopPropagation()}>{t.agreePrivacy}</a>{t.agreeEnd}</span>
              </label>

              {error && <p className="err-msg">{error}</p>}
              <div className="wiz-foot">
                <button className="btn btn-primary" onClick={finishSignup} disabled={loading || password.length < 8 || !agree}>
                  {loading ? t.creating : t.createAccount}
                </button>
              </div>
            </div>
          )}

          <p className="pro-note" style={{ textAlign: 'center', marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.35rem' }}>
            {t.footer} <HandIcon name="heart" size={14} />
          </p>
          <p className="pro-note" style={{ textAlign: 'center', marginTop: '.4rem' }}>
            <a href="/privacy" style={{ textDecoration: 'underline' }}>{t.privacy}</a>{' · '}
            <a href="/terms" style={{ textDecoration: 'underline' }}>{t.terms}</a>
          </p>
        </div>
      </section>
    </div>
  )
}
