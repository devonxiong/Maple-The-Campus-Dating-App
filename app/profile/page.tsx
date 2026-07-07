'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@/types'
import { schoolFromEmail } from '@/lib/score'
import { useLang, PROFILE, localizeSchool } from '@/lib/i18n'
import MapleEyes from '../components/MapleEyes'
import HandIcon, { IconName } from '../components/HandIcon'

const GRADIENTS = [
  'linear-gradient(135deg,#f7b7c6,#e98aa6)', 'linear-gradient(135deg,#a9c7f5,#6f9ce8)',
  'linear-gradient(135deg,#bfe3c6,#7fc98f)', 'linear-gradient(135deg,#d8c3f0,#b492e0)',
  'linear-gradient(135deg,#a8e0d8,#6fc9bd)', 'linear-gradient(135deg,#f5cfa8,#e8a86f)',
]
function gradient(id: string) {
  const n = id.charCodeAt(0) + id.charCodeAt(id.length - 1)
  return GRADIENTS[n % GRADIENTS.length]
}

function ProfileContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isSetup = searchParams.get('setup') === '1'
  const fileRef = useRef<HTMLInputElement>(null)

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  const [lang, toggleLang] = useLang()
  const t = PROFILE[lang]
  const zh = lang === 'zh'

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }
  const soon = () => showToast(zh ? '即将上线' : 'Coming soon')

  useEffect(() => {
    if (localStorage.getItem('maple_dark') === 'true') {
      document.documentElement.classList.add('dark'); setDarkMode(true)
    }
    const userId = localStorage.getItem('anlan_user_id')
    if (!userId) { router.push('/'); return }
    supabase.from('users').select('*').eq('id', userId).single()
      .then(({ data }) => {
        if (!data) { router.push('/'); return }
        setUser(data as User)
        setAvatarUrl(data.avatar_url ?? null)
        setLoading(false)
      })
  }, [router])

  function toggleDark() {
    const n = !darkMode
    setDarkMode(n)
    document.documentElement.classList.toggle('dark', n)
    localStorage.setItem('maple_dark', String(n))
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (!file.type.startsWith('image/')) { showToast(t.tSelectImage); return }
    if (file.size > 5 * 1024 * 1024) { showToast(t.tTooLarge); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('userId', user.id)
      const res = await fetch('/api/upload-avatar', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) { showToast(t.tUploadFail); console.error(json.error); return }
      setAvatarUrl(`${json.url}?t=${Date.now()}`)
      showToast(t.tSaved)
    } catch {
      showToast(t.tUploadFail)
    } finally {
      setUploading(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('anlan_user_id')
    localStorage.removeItem('anlan_user_name')
    localStorage.removeItem('anlan_match_id')
    router.push('/')
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f8f7f4]">
        <div className="w-8 h-8 rounded-full border-2 border-[#111] border-t-transparent animate-spin" />
      </main>
    )
  }
  if (!user) return null

  const school = schoolFromEmail(user.email)
  const year = (user as unknown as Record<string, unknown>).year as string | undefined
  const meta = [localizeSchool(school, lang), year, user.gender].filter(Boolean).join(' · ')

  // ── Setup mode: photo upload right after signup ──
  if (isSetup) {
    return (
      <main className="app">
        <section className="screen done" style={{ paddingTop: '5rem' }}>
          <MapleEyes width={130} strokeWidth={4} />
          <h2 className="font-display" style={{ fontSize: 22, fontWeight: 600, margin: '.5rem 0 0' }}>{t.setupTitle}</h2>
          <p style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 260, textAlign: 'center' }}>{t.setupSub}</p>
          <div
            className={`me-photo eye-tap`}
            style={{ width: 120, height: 120, fontSize: 46, background: avatarUrl ? undefined : gradient(user.id), margin: '.5rem 0' }}
            onClick={() => fileRef.current?.click()}
          >
            {avatarUrl ? <img src={avatarUrl} alt={user.name} /> : user.name[0].toUpperCase()}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhotoSelect} />
          <div style={{ width: '100%', maxWidth: 300, display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            <button className="btn btn-primary" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? t.uploading : avatarUrl ? t.changePhoto : t.addPhoto}
            </button>
            <button className="btn btn-secondary" onClick={() => router.push('/feed')}>
              {avatarUrl ? t.looksGood : t.skip}
            </button>
          </div>
        </section>
        {toast && <div className="feed-toast">{toast}</div>}
      </main>
    )
  }

  // ── Me (account hub) ──
  const Row = ({ icon, title, sub, right, onClick, danger }: {
    icon: IconName; title: string; sub?: string; right?: React.ReactNode; onClick?: () => void; danger?: boolean
  }) => (
    <div className={`safe-row${danger ? ' danger' : ''}`} onClick={onClick}>
      <span className="safe-ico"><HandIcon name={icon} size={20} /></span>
      <div className="safe-main"><strong>{title}</strong>{sub && <span className="sub">{sub}</span>}</div>
      {right ?? <span className="chev"><HandIcon name="chevron" size={16} /></span>}
    </div>
  )

  return (
    <main className="app">
      <section className="screen feed" style={{ position: 'relative', minHeight: '100vh' }}>
        <header className="feed-top">
          <div className="feed-brand">
            <MapleEyes width={42} strokeWidth={6} />
            <span className="feed-campus">{zh ? '我' : 'Me'}</span>
          </div>
        </header>

        <div className="feed-scroll" style={{ paddingBottom: '5rem' }}>
          <div className="me-card">
            <div className="me-photo eye-tap" style={{ background: avatarUrl ? undefined : gradient(user.id) }} onClick={() => fileRef.current?.click()}>
              {avatarUrl ? <img src={avatarUrl} alt={user.name} /> : user.name[0].toUpperCase()}
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhotoSelect} />
            <div className="me-info">
              <span className="me-name">{user.name} <span className="verified"><HandIcon name="check" size={12} /></span></span>
              <div className="me-meta">{meta}</div>
              <button className="customize" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? t.uploading : (zh ? '编辑资料 →' : 'Edit profile →')}
              </button>
            </div>
          </div>

          <button className="pro-card" onClick={soon}>
            <div className="pro-top">
              <span className="pro-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <HandIcon name="sparkle" size={15} /> Maple Pro
              </span>
              <span className="pro-price">$1.99/wk</span>
            </div>
            <p className="pro-perks">{zh ? '看谁喜欢你 · 发送邀请 · 更多盲盒 · 隐身模式' : 'See who likes you · send invites · extra blind boxes · stealth mode'}</p>
            <span className="pro-cta">{zh ? '升级 →' : 'Upgrade →'}</span>
          </button>

          <p className="date-sec-label">{zh ? '设置' : 'Settings'}</p>
          <div className="me-list">
            <Row icon="bell" title={zh ? '通知' : 'Notifications'} sub={zh ? '匹配、消息、邀请' : 'Matches, messages, invites'} onClick={soon} />
            <Row icon="seeNoEvil" title={zh ? '隐私与可见性' : 'Privacy & visibility'} sub={zh ? '谁能看到你、隐身模式' : 'Who can see you, stealth mode'} onClick={soon} />
            <Row icon="globe" title={zh ? '语言' : 'Language'} sub={zh ? '应用语言' : 'App language'} onClick={toggleLang}
              right={<span className="me-row-val">{lang === 'en' ? 'EN' : '中文'} ⇄</span>} />
            <Row icon={darkMode ? 'sun' : 'moon'} title={zh ? '外观' : 'Appearance'} sub={zh ? '浅色或深色' : 'Light or dark'} onClick={toggleDark}
              right={<span className="me-row-val">{darkMode ? (zh ? '深色' : 'Dark') : (zh ? '浅色' : 'Light')} ⇄</span>} />
          </div>

          <p className="date-sec-label" style={{ marginTop: '1.4rem' }}>{zh ? '账号' : 'Account'}</p>
          <div className="me-list">
            <Row icon="grad" title={zh ? '学校' : 'Campus'} sub={zh ? '已验证学生' : 'Verified student'}
              right={<span className="me-row-val">{localizeSchool(school, lang)} ✓</span>} />
            <Row icon="chat" title={zh ? '帮助与支持' : 'Help & support'} sub="hello@maplemeet.ai"
              onClick={() => { window.location.href = 'mailto:hello@maplemeet.ai' }} />
            <Row icon="logout" title={zh ? '退出登录' : 'Log out'} onClick={handleLogout} />
            <Row icon="trash" title={zh ? '删除账号' : 'Delete account'} danger onClick={soon} />
          </div>
        </div>

        <nav className="feed-nav" style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 440, zIndex: 30 }}>
          <button className="nav-item" onClick={() => router.push('/feed')}><span className="ico"><HandIcon name="pin" size={19} /></span>{zh ? '附近' : 'Nearby'}</button>
          <button className="nav-item" onClick={() => router.push('/matches')}><span className="ico"><HandIcon name="seeNoEvil" size={19} /></span>{zh ? '匹配' : 'Matches'}</button>
          <button className="nav-item" onClick={() => router.push('/match')}><span className="ico"><HandIcon name="heart" size={19} /></span>{zh ? '约会' : 'Date'}</button>
          <button className="nav-item active"><span className="ico"><HandIcon name="person" size={19} /></span>{zh ? '我' : 'Me'}</button>
        </nav>
      </section>

      {toast && <div className="feed-toast">{toast}</div>}
    </main>
  )
}

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfileContent />
    </Suspense>
  )
}
