'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@/types'
import { schoolFromEmail } from '@/lib/score'
import { useLang, PROFILE, localizeSchool } from '@/lib/i18n'
import MapleEyes from '../components/MapleEyes'
import HandIcon, { IconName } from '../components/HandIcon'
import PhotoCropper from '../components/PhotoCropper'

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
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [toast, setToast] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  const [geotracking, setGeotracking] = useState(true)
  const [agentEnabled, setAgentEnabled] = useState(true)
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
        const d = data as Record<string, unknown>
        setGeotracking(d.geotracking_enabled !== false)
        setAgentEnabled(d.agent_enabled !== false)
        setLoading(false)
      })
  }, [router])

  async function savePrivacy(geo: boolean, agent: boolean) {
    const userId = localStorage.getItem('anlan_user_id')
    if (!userId) return
    await supabase.from('users').update({ geotracking_enabled: geo, agent_enabled: agent }).eq('id', userId)
    if (!geo) await supabase.from('user_presence').delete().eq('user_id', userId)
  }

  function toggleDark() {
    const n = !darkMode
    setDarkMode(n)
    document.documentElement.classList.toggle('dark', n)
    localStorage.setItem('maple_dark', String(n))
  }

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !user) return
    if (!file.type.startsWith('image/')) { showToast(t.tSelectImage); return }
    if (file.size > 15 * 1024 * 1024) { showToast(t.tTooLarge); return }
    setPendingFile(file)
  }

  async function uploadCropped(blob: Blob) {
    if (!user) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', new File([blob], 'avatar.jpg', { type: 'image/jpeg' }))
      fd.append('userId', user.id)
      const res = await fetch('/api/upload-avatar', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) { showToast(t.tUploadFail); console.error(json.error); return }
      setAvatarUrl(`${json.url}?t=${Date.now()}`)
      setPendingFile(null)
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

  // ── Setup mode: photo (with crop/zoom) right after signup — the last step ──
  if (isSetup) {
    return (
      <main className="app">
        <section className="screen done" style={{ paddingTop: '4rem', gap: '1rem' }}>
          <MapleEyes width={120} strokeWidth={4} />
          <h2 className="font-display" style={{ fontSize: 22, fontWeight: 600, margin: '.25rem 0 0' }}>{t.setupTitle}</h2>
          <p style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 260, textAlign: 'center', margin: 0 }}>{t.setupSub}</p>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFilePicked} />
          {pendingFile ? (
            <PhotoCropper file={pendingFile} onDone={uploadCropped} busy={uploading} lang={lang}
              onCancel={() => { setPendingFile(null); setTimeout(() => fileRef.current?.click(), 0) }} />
          ) : (
            <>
              {avatarUrl && (
                <div className="me-photo" style={{ width: 130, height: 130, borderRadius: '50%', margin: '.25rem 0' }}>
                  <img src={avatarUrl} alt={user.name} />
                </div>
              )}
              <div style={{ width: '100%', maxWidth: 300, display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                <button className="btn btn-primary" disabled={uploading} onClick={() => fileRef.current?.click()}>
                  {avatarUrl ? t.changePhoto : t.addPhoto}
                </button>
                <button className="btn btn-secondary" onClick={() => router.push('/feed')}>
                  {avatarUrl ? t.looksGood : t.skip}
                </button>
              </div>
            </>
          )}
        </section>
        {toast && <div className="feed-toast">{toast}</div>}
      </main>
    )
  }

  // ── Me (account hub) ──
  const Switch = ({ on }: { on: boolean }) => (
    <span style={{ width: 44, height: 24, borderRadius: 999, background: on ? 'var(--accent)' : 'var(--border)', position: 'relative', flex: '0 0 auto', transition: 'background .15s', display: 'inline-block' }}>
      <span style={{ position: 'absolute', top: 2, left: on ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .15s', boxShadow: '0 1px 2px rgba(0,0,0,.25)' }} />
    </span>
  )
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
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFilePicked} />
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
            <Row icon="pin" title={zh ? '允许定位' : 'Allow location'} sub={zh ? '用你常去的地点来匹配' : 'Match by the places you show up'}
              onClick={() => { const n = !geotracking; setGeotracking(n); savePrivacy(n, agentEnabled) }}
              right={<Switch on={geotracking} />} />
            <Row icon="robot" title={zh ? 'AI 规划约会' : 'AI date planning'} sub={zh ? '匹配后让 AI 帮你安排约会' : 'Let AI plan your date after a match'}
              onClick={() => { const n = !agentEnabled; setAgentEnabled(n); savePrivacy(geotracking, n) }}
              right={<Switch on={agentEnabled} />} />
            <Row icon="bell" title={zh ? '通知' : 'Notifications'} sub={zh ? '匹配、消息、邀请' : 'Matches, messages, invites'} onClick={soon} />
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
          <button className="nav-item" onClick={() => router.push('/date')}><span className="ico"><HandIcon name="heart" size={19} /></span>{zh ? '约会' : 'Date'}</button>
          <button className="nav-item active"><span className="ico"><HandIcon name="person" size={19} /></span>{zh ? '我' : 'Me'}</button>
        </nav>
      </section>

      {pendingFile && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => !uploading && setPendingFile(null)}>
          <div style={{ width: '100%', maxWidth: 440, background: 'var(--background)', borderRadius: '20px 20px 0 0', padding: '1.5rem 1.25rem 2rem' }} onClick={e => e.stopPropagation()}>
            <p className="font-display" style={{ fontSize: 17, fontWeight: 600, textAlign: 'center', marginBottom: '1rem' }}>{zh ? '调整照片' : 'Adjust photo'}</p>
            <PhotoCropper file={pendingFile} onDone={uploadCropped} onCancel={() => setPendingFile(null)} busy={uploading} lang={lang} />
          </div>
        </div>
      )}

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
