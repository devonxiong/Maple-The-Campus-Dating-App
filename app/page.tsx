'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import SpotPicker from './components/SpotPicker'

type Mode = 'signup' | 'login'
// Onboarding is a one-screen-at-a-time wizard.
type Step = 'email' | 'phone' | 'otp' | 'name' | 'gender' | 'year' | 'into' | 'geo' | 'password'

// Profile steps that show the progress dots (after verification).
const PROFILE_STEPS: Step[] = ['name', 'gender', 'year', 'into', 'geo', 'password']
const ORDER: Step[] = ['email', 'phone', 'otp', 'name', 'gender', 'year', 'into', 'geo', 'password']

// ─── i18n ─────────────────────────────────────────────────────────────────────
type Lang = 'en' | 'zh'

const T = {
  en: {
    tabNew: "I'm new here", tabBack: 'Welcome back',
    loginEmail: 'Email', loginPw: 'Password', loginBtn: 'let me in →',
    emailTitle: "What's your email?", emailSub: "You'll use this to log back in. Any email works.",
    emailPh: 'you@example.com', continue: 'continue →',
    errEmail: 'Enter a valid email address',
    signingAs: 'signing up as',
    phoneTitle: "What's your number?", phoneSub: "We text a quick code to confirm it's you. No spam, ever.",
    phoneSend: 'text me a code →', sending: 'Sending…',
    errPhone: 'Enter a valid phone number',
    errSend: 'Failed to send code. Check your number.', errNet: 'Network error. Try again.',
    otpTitle: 'Check your texts', otpSubPre: 'We texted a 6-digit code to',
    verify: 'verify →', verifying: 'Verifying…',
    errOtpLen: 'Enter the 6-digit code we texted you', errOtpWrong: 'Wrong code — try again',
    otpResent: 'New code sent ✓', errResend: 'Failed to resend. Try again.',
    otpDidnt: "didn't get it?", resend: 'resend',
    nameTitle: 'What do people call you?', nameSub: 'First name or nickname — whatever feels like you.', namePh: 'your name',
    genderTitle: 'I am…', gMan: 'Man', gWoman: 'Woman', gNb: 'Non-binary',
    yearTitle: 'What year are you?', y1: 'First-year', y2: 'Sophomore', y3: 'Junior', y4: 'Senior', y5: 'Grad',
    intoTitle: 'Who are you into?', intoSub: 'Pick all that apply.', iMen: 'Men', iWomen: 'Women', iNb: 'Non-binary',
    geoTitle: 'Where do you usually show up?', geoSub: 'Drop a pin on the spots you frequent. Maple matches you with people who move through campus the way you do.',
    skip: 'skip for now →',
    pwTitle: 'Set a password', pwSub: "You'll use your email + this password to log back in.",
    pwPh: 'password (8+ characters)', pwPh2: 'confirm password', pwCreate: 'create account →', creating: 'Creating your account…',
    errPwLen: 'Password must be at least 8 characters', errPwMatch: 'Passwords do not match',
    errLoginEmpty: 'Enter your email and password', errLogin: 'Login failed', errSignup: 'Sign up failed. Try again.',
    back: '← back', footer: 'mutual matches only 🤝', privacy: 'Privacy', terms: 'Terms', pleaseWait: 'Please wait…',
  },
  zh: {
    tabNew: '我是新用户', tabBack: '欢迎回来',
    loginEmail: '邮箱', loginPw: '密码', loginBtn: '登录 →',
    emailTitle: '你的邮箱是？', emailSub: '之后用它登录，任意邮箱都可以。',
    emailPh: 'you@example.com', continue: '继续 →',
    errEmail: '请输入有效的邮箱地址',
    signingAs: '正在注册',
    phoneTitle: '你的手机号？', phoneSub: '我们会发一条验证码确认是你本人，绝不发垃圾信息。',
    phoneSend: '给我发验证码 →', sending: '发送中…',
    errPhone: '请输入有效的手机号',
    errSend: '验证码发送失败，请检查号码。', errNet: '网络错误，请重试。',
    otpTitle: '查收短信验证码', otpSubPre: '验证码已发送至',
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
    back: '← 返回', footer: '双向喜欢才匹配 🤝', privacy: '隐私', terms: '条款', pleaseWait: '请稍候…',
  },
} as const

export default function HomePage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signup')
  const [step, setStep] = useState<Step>('email')

  const [email, setEmail] = useState('')

  const [form, setForm] = useState<{ name: string; gender: string; want_to_date: string[]; year: string }>({
    name: '', gender: '', want_to_date: [], year: '',
  })
  const [spots, setSpots] = useState<string[]>([])

  const [phone, setPhone] = useState('')
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
  const [showIntro, setShowIntro] = useState(false)
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

  function switchMode(m: Mode) {
    setMode(m)
    setError('')
    setStep('email')
    setEmail('')
  }

  const validEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())

  function submitEmail() {
    if (!validEmail) { setError(t.errEmail); return }
    setError('')
    setEmail(email.trim().toLowerCase())
    setStep('phone')
  }

  // ─── Phone verification ────────────────────────────────────────────────────
  function phoneDigits() { return phone.replace(/\D/g, '') }

  async function sendPhoneOtp() {
    setError(''); setOtpError('')
    if (phoneDigits().length !== 10) { setError(t.errPhone); return }
    setLoading(true)
    try {
      const res = await fetch('/api/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '+1' + phoneDigits() }),
      })
      if (!res.ok) { setError(t.errSend); return }
      setOtp('')
      setStep('otp')
    } catch { setError(t.errNet) }
    finally { setLoading(false) }
  }

  async function verifyOtp() {
    setOtpError('')
    if (otp.length !== 6) { setOtpError(t.errOtpLen); return }
    setLoading(true)
    try {
      const res = await fetch('/api/verify-phone', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '+1' + phoneDigits(), code: otp }),
      })
      if (!res.ok) { setOtpError(t.errOtpWrong); return }
      setStep('name')
    } catch { setOtpError(t.errNet) }
    finally { setLoading(false) }
  }

  async function resendOtp() {
    setOtpError('')
    const res = await fetch('/api/verify-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+1' + phoneDigits() }),
    })
    setOtpError(res.ok ? t.otpResent : t.errResend)
  }

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
          phone: '+1' + phoneDigits(),
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
  }
  const canContinue =
    step === 'name' ? !!form.name.trim()
    : step === 'gender' ? !!form.gender
    : step === 'year' ? !!form.year
    : step === 'into' ? form.want_to_date.length > 0
    : true

  function dismissSplash() {
    if (!showSplash) return
    setSplashLeaving(true)
    setTimeout(() => { setShowSplash(false); setShowIntro(true) }, 400)
  }

  // ─── Splash ────────────────────────────────────────────────────────────────
  if (showSplash) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center bg-[#f8f7f4] select-none cursor-pointer"
        onClick={dismissSplash}
        onTouchStart={(e) => { touchStartY.current = e.touches[0].clientY }}
        onTouchEnd={(e) => { if (touchStartY.current - e.changedTouches[0].clientY > 40) dismissSplash() }}
        onWheel={(e) => { if (e.deltaY > 20) dismissSplash() }}
      >
        <div className={`flex flex-col items-center gap-4 transition-all duration-400 ${splashLeaving ? '-translate-y-12 opacity-0' : 'opacity-100'}`}>
          <img src="/maple-logo.svg" alt="Maple" className="w-24 h-24 object-contain" />
          <h1 className="text-[32px] font-semibold tracking-tight text-[#111]">Maple</h1>
          <p className="text-sm text-[#9b9590]">For the one you&apos;ve seen a thousand times.</p>
        </div>
        <div className={`absolute bottom-14 flex flex-col items-center gap-1.5 transition-opacity duration-400 ${splashLeaving ? 'opacity-0' : 'opacity-100'}`}>
          <span className="text-[#c5c0bb] text-xs tracking-wide">swipe up</span>
          <span className="text-[#c5c0bb] animate-bounce text-sm">↑</span>
        </div>
      </main>
    )
  }

  // ─── Intro ─────────────────────────────────────────────────────────────────
  if (showIntro) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-[#f8f7f4] select-none">
        <div className="w-full max-w-[380px] animate-fade-up flex flex-col items-center text-center">
          <img src="/maple-logo.svg" alt="Maple" className="w-14 h-14 object-contain mb-6" />
          <h1 className="text-[22px] font-semibold tracking-tight text-[#111] mb-4 leading-snug">
            Dating built around<br />where you already are.
          </h1>
          <p className="text-[15px] text-[#6b6760] leading-relaxed mb-9">
            The hardest part of campus dating isn&apos;t wanting it — it&apos;s making a
            move on the person you keep crossing paths with. The lecture-hall crush.
            The one always at the gym when you are. Maple uses{' '}
            <span className="text-[#111] font-medium">geo-matching</span> to quietly
            connect you with the people already moving through campus the way you do —
            then helps you go from first hello to a real Friday-night date.
          </p>
          <div className="w-full space-y-3.5 mb-10 text-left">
            <IntroPoint icon="📍" title="Geo-matching" desc="Matched by the places you both keep showing up." />
            <IntroPoint icon="🔒" title="Real students only" desc="Verified school emails — your campus, no strangers." />
            <IntroPoint icon="✨" title="AI that helps you act" desc="From the icebreaker to a date that actually happens." />
          </div>
          <button
            onClick={() => setShowIntro(false)}
            className="w-full bg-[#111] text-white rounded-xl py-3.5 text-sm font-medium active:scale-[0.98] transition-transform"
          >
            Get started →
          </button>
        </div>
      </main>
    )
  }

  const profileIdx = PROFILE_STEPS.indexOf(step)
  const showHeader = mode === 'signup' && step !== 'email'

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-16 bg-[#f8f7f4]">
      <div className="w-full max-w-[360px] animate-fade-up">

        {/* Language + dark mode toggles */}
        <div className="flex justify-end items-center gap-2 mb-4">
          <button
            onClick={toggleLang}
            className="h-8 px-3 rounded-full flex items-center justify-center border border-[#e8e6e1] text-xs font-medium text-[#6b6760] hover:border-[#111] hover:text-[#111] transition-colors"
            title="Switch language"
          >
            {lang === 'en' ? '中文' : 'EN'}
          </button>
          <button
            onClick={toggleDark}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#eeeae4] transition-colors"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="text-base">{darkMode ? '☀️' : '🌙'}</span>
          </button>
        </div>

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 mb-3">
            <img src="/maple-logo.svg" alt="Maple" className="w-14 h-14 object-contain" />
          </div>
          <h1 className="text-[24px] font-semibold tracking-tight text-[#111]">Maple</h1>
          <p className="text-sm text-[#9b9590] mt-1">For the one you&apos;ve seen a thousand times.</p>
        </div>

        {/* Wizard header: back arrow + progress dots */}
        {showHeader && (
          <div className="flex items-center justify-between mb-6 h-5">
            <button onClick={goBack} className="text-sm text-[#9b9590] hover:text-[#111] transition-colors">{t.back}</button>
            {profileIdx >= 0 && (
              <div className="flex gap-1.5">
                {PROFILE_STEPS.map((s, i) => (
                  <span key={s} className={`h-1.5 rounded-full transition-all ${i === profileIdx ? 'w-5 bg-[#111]' : i < profileIdx ? 'w-1.5 bg-[#111]' : 'w-1.5 bg-[#d8d4ce]'}`} />
                ))}
              </div>
            )}
            <span className="w-9" />
          </div>
        )}

        {/* Mode tabs — only at the very entry */}
        {step === 'email' && (
          <div className="flex bg-[#eeeae4] rounded-xl p-1 mb-6">
            {(['signup', 'login'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${mode === m ? 'bg-white text-[#111] shadow-sm' : 'text-[#9b9590]'}`}
              >
                {m === 'signup' ? t.tabNew : t.tabBack}
              </button>
            ))}
          </div>
        )}

        {/* ─── LOGIN ─────────────────────────────────────────────── */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3 animate-fade-in">
            <Field label={t.loginEmail}>
              <input
                type="email" placeholder="your@email.com" value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)} autoFocus className={inputCls}
              />
            </Field>
            <Field label={t.loginPw}>
              <input
                type="password" placeholder="••••••••" value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)} className={inputCls}
              />
            </Field>
            {error && <ErrorMsg>{error}</ErrorMsg>}
            <Btn loading={loading} label={t.loginBtn} waiting={t.pleaseWait} />
          </form>
        )}

        {/* ─── SIGNUP WIZARD ─────────────────────────────────────── */}
        {mode === 'signup' && step === 'email' && (
          <div className="animate-fade-in">
            <StepTitle emoji="📧" title={t.emailTitle} sub={t.emailSub} />
            <input
              type="email" placeholder={t.emailPh} value={email} autoFocus
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitEmail() }}
              className={inputCls}
            />
            {error && <ErrorMsg>{error}</ErrorMsg>}
            <button
              onClick={submitEmail} disabled={!validEmail}
              className="w-full mt-4 bg-[#111] text-white rounded-xl py-3.5 text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-transform"
            >
              {t.continue}
            </button>
          </div>
        )}

        {/* Step: phone */}
        {mode === 'signup' && step === 'phone' && (
          <div className="animate-fade-in">
            <EmailChip email={email} label={t.signingAs} />
            <StepTitle emoji="📱" title={t.phoneTitle} sub={t.phoneSub} />
            <div className="flex items-center bg-white border border-[#e8e6e1] rounded-xl overflow-hidden focus-within:border-[#111] transition-colors">
              <div className="flex items-center gap-1.5 px-3 py-3 border-r border-[#e8e6e1] shrink-0 select-none">
                <span className="text-base leading-none">🇺🇸</span>
                <span className="text-sm text-[#6b6760] font-medium">+1</span>
              </div>
              <input
                type="tel" placeholder="(555) 000-0000" value={phone} autoFocus
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                  let f = digits
                  if (digits.length >= 7) f = `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
                  else if (digits.length >= 4) f = `(${digits.slice(0,3)}) ${digits.slice(3)}`
                  else if (digits.length >= 1) f = `(${digits}`
                  setPhone(f)
                }}
                onKeyDown={(e) => { if (e.key === 'Enter' && phoneDigits().length === 10) sendPhoneOtp() }}
                className="flex-1 px-3 py-3 text-sm text-[#111] placeholder:text-[#c5c0bb] focus:outline-none bg-transparent"
              />
            </div>
            {error && <ErrorMsg>{error}</ErrorMsg>}
            <button
              onClick={sendPhoneOtp} disabled={loading || phoneDigits().length !== 10}
              className="w-full mt-4 bg-[#111] text-white rounded-xl py-3.5 text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-transform"
            >
              {loading ? t.sending : t.phoneSend}
            </button>
          </div>
        )}

        {/* Step: otp */}
        {mode === 'signup' && step === 'otp' && (
          <div className="animate-fade-in">
            <StepTitle emoji="✉️" title={t.otpTitle} sub={`${t.otpSubPre} +1 ${phone}`} />
            <input
              type="text" inputMode="numeric" placeholder="_ _ _ _ _ _" maxLength={6} value={otp} autoFocus
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => { if (e.key === 'Enter' && otp.length === 6) verifyOtp() }}
              className="w-full bg-white border border-[#e8e6e1] rounded-xl px-4 py-4 text-2xl text-center font-semibold tracking-[0.4em] text-[#111] placeholder:text-[#ddd] focus:outline-none focus:border-[#111] transition-colors"
            />
            {otpError && <p className={`text-sm text-center py-1 ${otpError.includes('✓') ? 'text-emerald-500' : 'text-red-500'}`}>{otpError}</p>}
            <button
              onClick={verifyOtp} disabled={loading || otp.length !== 6}
              className="w-full mt-3 bg-[#111] text-white rounded-xl py-3.5 text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-transform"
            >
              {loading ? t.verifying : t.verify}
            </button>
            <p className="text-center text-xs text-[#c5c0bb] mt-4">
              {t.otpDidnt} <button onClick={resendOtp} className="underline hover:text-[#9b9590]">{t.resend}</button>
            </p>
          </div>
        )}

        {/* Step: name */}
        {mode === 'signup' && step === 'name' && (
          <div className="animate-fade-in">
            <StepTitle emoji="👋" title={t.nameTitle} sub={t.nameSub} />
            <input
              type="text" placeholder={t.namePh} value={form.name} autoFocus
              onChange={(e) => set('name', e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && canContinue) goNext() }}
              className={inputCls}
            />
            <ContinueBtn onClick={goNext} disabled={!canContinue} label={t.continue} />
          </div>
        )}

        {/* Step: gender */}
        {mode === 'signup' && step === 'gender' && (
          <div className="animate-fade-in">
            <StepTitle emoji="🧬" title={t.genderTitle} />
            <div className="space-y-2">
              {[{ v: 'Man', l: t.gMan }, { v: 'Woman', l: t.gWoman }, { v: 'Non-binary', l: t.gNb }].map(({ v, l }) => (
                <Choice key={v} active={form.gender === v} onClick={() => set('gender', v)} label={l} />
              ))}
            </div>
            <ContinueBtn onClick={goNext} disabled={!canContinue} label={t.continue} />
          </div>
        )}

        {/* Step: year */}
        {mode === 'signup' && step === 'year' && (
          <div className="animate-fade-in">
            <StepTitle emoji="🎓" title={t.yearTitle} />
            <div className="space-y-2">
              {[{ v: 'First-year', l: t.y1 }, { v: 'Sophomore', l: t.y2 }, { v: 'Junior', l: t.y3 }, { v: 'Senior', l: t.y4 }, { v: 'Grad', l: t.y5 }].map(({ v, l }) => (
                <Choice key={v} active={form.year === v} onClick={() => set('year', v)} label={l} />
              ))}
            </div>
            <ContinueBtn onClick={goNext} disabled={!canContinue} label={t.continue} />
          </div>
        )}

        {/* Step: into */}
        {mode === 'signup' && step === 'into' && (
          <div className="animate-fade-in">
            <StepTitle emoji="💘" title={t.intoTitle} sub={t.intoSub} />
            <div className="space-y-2">
              {[{ v: 'Men', l: t.iMen }, { v: 'Women', l: t.iWomen }, { v: 'Non-binary', l: t.iNb }].map(({ v, l }) => (
                <Choice
                  key={v}
                  active={form.want_to_date.includes(v)}
                  onClick={() => setForm(f => ({
                    ...f,
                    want_to_date: f.want_to_date.includes(v) ? f.want_to_date.filter(x => x !== v) : [...f.want_to_date, v],
                  }))}
                  label={l}
                  multi
                />
              ))}
            </div>
            <ContinueBtn onClick={goNext} disabled={!canContinue} label={t.continue} />
          </div>
        )}

        {/* Step: geo */}
        {mode === 'signup' && step === 'geo' && (
          <div className="animate-fade-in">
            <StepTitle emoji="📍" title={t.geoTitle} sub={t.geoSub} />
            <SpotPicker spots={spots} onAdd={addSpot} onRemove={removeSpot} lang={lang} />
            <ContinueBtn onClick={goNext} disabled={false} label={spots.length === 0 ? t.skip : t.continue} />
          </div>
        )}

        {/* Step: password */}
        {mode === 'signup' && step === 'password' && (
          <div className="animate-fade-in">
            <StepTitle emoji="🔐" title={t.pwTitle} sub={t.pwSub} />
            <div className="space-y-2">
              <input
                type="password" placeholder={t.pwPh} value={password} autoFocus
                onChange={(e) => setPassword(e.target.value)} className={inputCls}
              />
              <input
                type="password" placeholder={t.pwPh2} value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') finishSignup() }}
                className={inputCls}
              />
            </div>
            {error && <ErrorMsg>{error}</ErrorMsg>}
            <button
              onClick={finishSignup} disabled={loading || password.length < 8 || password !== password2}
              className="w-full mt-4 bg-[#111] text-white rounded-xl py-3.5 text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-transform"
            >
              {loading ? t.creating : t.pwCreate}
            </button>
          </div>
        )}

        <p className="text-center text-xs text-[#c5c0bb] mt-6 leading-relaxed">{t.footer}</p>
        <p className="text-center text-xs text-[#c5c0bb] mt-2">
          <a href="/privacy" className="underline hover:text-[#9b9590]">{t.privacy}</a>{' · '}
          <a href="/terms" className="underline hover:text-[#9b9590]">{t.terms}</a>
        </p>
      </div>
    </main>
  )
}

// ─── Shared components ────────────────────────────────────────────────────────

const inputCls = "w-full bg-white border border-[#e8e6e1] rounded-xl px-4 py-3 text-sm text-[#111] placeholder:text-[#c5c0bb] focus:outline-none focus:border-[#111] transition-colors"

function StepTitle({ emoji, title, sub }: { emoji: string; title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <div className="text-3xl mb-2">{emoji}</div>
      <h2 className="text-lg font-semibold text-[#111] leading-snug">{title}</h2>
      {sub && <p className="text-sm text-[#9b9590] mt-1 leading-relaxed">{sub}</p>}
    </div>
  )
}

function Choice({ active, onClick, label, multi }: { active: boolean; onClick: () => void; label: string; multi?: boolean }) {
  return (
    <button
      type="button" onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-sm font-medium transition-all ${active ? 'bg-[#111] text-white border-[#111]' : 'bg-white text-[#6b6760] border-[#e8e6e1] hover:border-[#111]'}`}
    >
      {label}
      {active && <span className="text-xs">{multi ? '✓' : '●'}</span>}
    </button>
  )
}

function ContinueBtn({ onClick, disabled, label = 'continue →' }: { onClick: () => void; disabled: boolean; label?: string }) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      className="w-full mt-6 bg-[#111] text-white rounded-xl py-3.5 text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-transform"
    >
      {label}
    </button>
  )
}

function EmailChip({ email, label }: { email: string; label: string }) {
  return (
    <div className="flex items-center gap-2 bg-white border border-[#e8e6e1] rounded-xl px-4 py-3 mb-5">
      <span className="text-base">📧</span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-[#6b6760]">{label}</p>
        <p className="text-xs text-[#111] truncate">{email}</p>
      </div>
    </div>
  )
}

function IntroPoint({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-white border border-[#e8e6e1] flex items-center justify-center text-base shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#111] leading-tight">{title}</p>
        <p className="text-xs text-[#9b9590] leading-snug mt-0.5">{desc}</p>
      </div>
    </div>
  )
}

function Field({ label, hint, required, children, className = '' }: {
  label: string; hint?: string; required?: boolean; children: React.ReactNode; className?: string
}) {
  return (
    <div className={className}>
      <div className="flex items-baseline gap-2 mb-1.5">
        <label className="text-xs font-medium text-[#6b6760]">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {hint && <span className="text-xs text-[#c5c0bb]">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function Btn({ loading, label, waiting = 'Please wait…' }: { loading: boolean; label: string; waiting?: string }) {
  return (
    <button
      type="submit" disabled={loading}
      className="w-full bg-[#111] text-white rounded-xl py-3.5 text-sm font-medium mt-1 disabled:opacity-40 active:scale-[0.98] transition-transform"
    >
      {loading ? waiting : label}
    </button>
  )
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return <p className="text-red-500 text-sm text-center py-1">{children}</p>
}
