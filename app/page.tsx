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
    if (!validEmail) { setError('Enter a valid email address'); return }
    setError('')
    setEmail(email.trim().toLowerCase())
    setStep('phone')
  }

  // ─── Phone verification ────────────────────────────────────────────────────
  function phoneDigits() { return phone.replace(/\D/g, '') }

  async function sendPhoneOtp() {
    setError(''); setOtpError('')
    if (phoneDigits().length !== 10) { setError('Enter a valid 10-digit US phone number'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '+1' + phoneDigits() }),
      })
      if (!res.ok) { setError('Failed to send code. Check your number.'); return }
      setOtp('')
      setStep('otp')
    } catch { setError('Network error. Try again.') }
    finally { setLoading(false) }
  }

  async function verifyOtp() {
    setOtpError('')
    if (otp.length !== 6) { setOtpError('Enter the 6-digit code we texted you'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/verify-phone', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '+1' + phoneDigits(), code: otp }),
      })
      if (!res.ok) { setOtpError('Wrong code — try again'); return }
      setStep('name')
    } catch { setOtpError('Network error. Try again.') }
    finally { setLoading(false) }
  }

  async function resendOtp() {
    setOtpError('')
    const res = await fetch('/api/verify-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+1' + phoneDigits() }),
    })
    setOtpError(res.ok ? 'New code sent ✓' : 'Failed to resend. Try again.')
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
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== password2) { setError('Passwords do not match'); return }
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
      if (!res.ok) { setError(json.error || 'Sign up failed. Try again.'); return }
      localStorage.setItem('anlan_user_id', json.id)
      localStorage.setItem('anlan_user_name', json.name)
      router.push('/profile?setup=1')
    } catch { setError('Network error. Try again.') }
    finally { setLoading(false) }
  }

  // ─── Login (Welcome back) ──────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!loginEmail || !loginPassword) { setError('Enter your email and password'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Login failed'); return }
      localStorage.setItem('anlan_user_id', json.id)
      localStorage.setItem('anlan_user_name', json.name)
      router.push('/feed')
    } catch { setError('Network error. Try again.') }
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

        {/* Dark mode toggle */}
        <div className="flex justify-end mb-4">
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
            <button onClick={goBack} className="text-sm text-[#9b9590] hover:text-[#111] transition-colors">← back</button>
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
                {m === 'signup' ? "I'm new here" : 'Welcome back'}
              </button>
            ))}
          </div>
        )}

        {/* ─── LOGIN ─────────────────────────────────────────────── */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3 animate-fade-in">
            <Field label="Email">
              <input
                type="email" placeholder="your@email.com" value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)} autoFocus className={inputCls}
              />
            </Field>
            <Field label="Password">
              <input
                type="password" placeholder="••••••••" value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)} className={inputCls}
              />
            </Field>
            {error && <ErrorMsg>{error}</ErrorMsg>}
            <Btn loading={loading} label="let me in →" />
          </form>
        )}

        {/* ─── SIGNUP WIZARD ─────────────────────────────────────── */}
        {mode === 'signup' && step === 'email' && (
          <div className="animate-fade-in">
            <StepTitle emoji="📧" title="What's your email?" sub="You'll use this to log back in. Any email works." />
            <input
              type="email" placeholder="you@example.com" value={email} autoFocus
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitEmail() }}
              className={inputCls}
            />
            {error && <ErrorMsg>{error}</ErrorMsg>}
            <button
              onClick={submitEmail} disabled={!validEmail}
              className="w-full mt-4 bg-[#111] text-white rounded-xl py-3.5 text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-transform"
            >
              continue →
            </button>
          </div>
        )}

        {/* Step: phone */}
        {mode === 'signup' && step === 'phone' && (
          <div className="animate-fade-in">
            <EmailChip email={email} />
            <StepTitle emoji="📱" title="What's your number?" sub="We text a quick code to confirm it's you. No spam, ever." />
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
              {loading ? 'Sending...' : 'text me a code →'}
            </button>
          </div>
        )}

        {/* Step: otp */}
        {mode === 'signup' && step === 'otp' && (
          <div className="animate-fade-in">
            <StepTitle emoji="✉️" title="Check your texts" sub={`We texted a 6-digit code to +1 ${phone}`} />
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
              {loading ? 'Verifying...' : 'verify →'}
            </button>
            <p className="text-center text-xs text-[#c5c0bb] mt-4">
              didn&apos;t get it? <button onClick={resendOtp} className="underline hover:text-[#9b9590]">resend</button>
            </p>
          </div>
        )}

        {/* Step: name */}
        {mode === 'signup' && step === 'name' && (
          <div className="animate-fade-in">
            <StepTitle emoji="👋" title="What do people call you?" sub="First name or nickname — whatever feels like you." />
            <input
              type="text" placeholder="your name" value={form.name} autoFocus
              onChange={(e) => set('name', e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && canContinue) goNext() }}
              className={inputCls}
            />
            <ContinueBtn onClick={goNext} disabled={!canContinue} />
          </div>
        )}

        {/* Step: gender */}
        {mode === 'signup' && step === 'gender' && (
          <div className="animate-fade-in">
            <StepTitle emoji="🧬" title="I am…" />
            <div className="space-y-2">
              {['Man', 'Woman', 'Non-binary'].map((g) => (
                <Choice key={g} active={form.gender === g} onClick={() => set('gender', g)} label={g} />
              ))}
            </div>
            <ContinueBtn onClick={goNext} disabled={!canContinue} />
          </div>
        )}

        {/* Step: year */}
        {mode === 'signup' && step === 'year' && (
          <div className="animate-fade-in">
            <StepTitle emoji="🎓" title="What year are you?" />
            <div className="space-y-2">
              {['First-year', 'Sophomore', 'Junior', 'Senior', 'Grad'].map((y) => (
                <Choice key={y} active={form.year === y} onClick={() => set('year', y)} label={y} />
              ))}
            </div>
            <ContinueBtn onClick={goNext} disabled={!canContinue} />
          </div>
        )}

        {/* Step: into */}
        {mode === 'signup' && step === 'into' && (
          <div className="animate-fade-in">
            <StepTitle emoji="💘" title="Who are you into?" sub="Pick all that apply." />
            <div className="space-y-2">
              {['Men', 'Women', 'Non-binary'].map((g) => (
                <Choice
                  key={g}
                  active={form.want_to_date.includes(g)}
                  onClick={() => setForm(f => ({
                    ...f,
                    want_to_date: f.want_to_date.includes(g) ? f.want_to_date.filter(x => x !== g) : [...f.want_to_date, g],
                  }))}
                  label={g}
                  multi
                />
              ))}
            </div>
            <ContinueBtn onClick={goNext} disabled={!canContinue} />
          </div>
        )}

        {/* Step: geo */}
        {mode === 'signup' && step === 'geo' && (
          <div className="animate-fade-in">
            <StepTitle emoji="📍" title="Where do you usually show up?" sub="Drop a pin on the spots you frequent. Maple matches you with people who move through campus the way you do." />
            <SpotPicker spots={spots} onAdd={addSpot} onRemove={removeSpot} />
            <ContinueBtn onClick={goNext} disabled={false} label={spots.length === 0 ? 'skip for now →' : 'continue →'} />
          </div>
        )}

        {/* Step: password */}
        {mode === 'signup' && step === 'password' && (
          <div className="animate-fade-in">
            <StepTitle emoji="🔐" title="Set a password" sub="You'll use your email + this password to log back in." />
            <div className="space-y-2">
              <input
                type="password" placeholder="password (8+ characters)" value={password} autoFocus
                onChange={(e) => setPassword(e.target.value)} className={inputCls}
              />
              <input
                type="password" placeholder="confirm password" value={password2}
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
              {loading ? 'Creating your account...' : 'create account →'}
            </button>
          </div>
        )}

        <p className="text-center text-xs text-[#c5c0bb] mt-6 leading-relaxed">mutual matches only 🤝</p>
        <p className="text-center text-xs text-[#c5c0bb] mt-2">
          <a href="/privacy" className="underline hover:text-[#9b9590]">Privacy</a>{' · '}
          <a href="/terms" className="underline hover:text-[#9b9590]">Terms</a>
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

function EmailChip({ email }: { email: string }) {
  return (
    <div className="flex items-center gap-2 bg-white border border-[#e8e6e1] rounded-xl px-4 py-3 mb-5">
      <span className="text-base">📧</span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-[#6b6760]">signing up as</p>
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

function Btn({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit" disabled={loading}
      className="w-full bg-[#111] text-white rounded-xl py-3.5 text-sm font-medium mt-1 disabled:opacity-40 active:scale-[0.98] transition-transform"
    >
      {loading ? 'Please wait...' : label}
    </button>
  )
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return <p className="text-red-500 text-sm text-center py-1">{children}</p>
}
