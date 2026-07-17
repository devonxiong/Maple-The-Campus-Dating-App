'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@/types'
import { schoolFromEmail } from '@/lib/score'
import { useLang, PROFILE, localizeSchool } from '@/lib/i18n'
import MapleEyes, { MapleEyesCrying } from '../components/MapleEyes'
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
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteBusy, setInviteBusy] = useState(false)
  const [inviteOk, setInviteOk] = useState(false)
  const [delStep, setDelStep] = useState<null | 'confirm' | 'crying'>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [eName, setEName] = useState('')
  const [eGender, setEGender] = useState('')
  const [eInto, setEInto] = useState<string[]>([])
  const [eYear, setEYear] = useState('')
  const [eAge, setEAge] = useState('')
  const [saving, setSaving] = useState(false)
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

  function openEdit() {
    if (!user) return
    setEName(user.name ?? '')
    setEGender(user.gender ?? '')
    setEInto(Array.isArray(user.want_to_date) ? user.want_to_date : [])
    const d = user as unknown as Record<string, unknown>
    setEYear((d.year as string) ?? '')
    setEAge(d.age != null ? String(d.age) : '')
    setShowEdit(true)
  }

  async function saveProfile() {
    if (!user) return
    if (!eName.trim()) { showToast(zh ? '请填写名字' : 'Add your name'); return }
    if (eInto.length === 0) { showToast(zh ? '请选择想认识的人' : 'Pick who you’re into'); return }
    setSaving(true)
    try {
      await supabase.from('users').update({ name: eName.trim(), gender: eGender, want_to_date: eInto }).eq('id', user.id)
      if (eYear) await supabase.from('users').update({ year: eYear }).eq('id', user.id).then(() => {}, () => {})
      if (eAge) await supabase.from('users').update({ age: Number(eAge) }).eq('id', user.id).then(() => {}, () => {})
      setUser({ ...user, name: eName.trim(), gender: eGender, want_to_date: eInto } as User)
      setShowEdit(false)
      showToast(t.tSaved)
    } catch { showToast(t.tUploadFail) } finally { setSaving(false) }
  }

  async function sendInvite() {
    const em = inviteEmail.trim().toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { showToast(zh ? '请输入有效邮箱' : 'Enter a valid email'); return }
    setInviteBusy(true)
    try {
      const res = await fetch('/api/invite', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_email: em, from_name: user?.name ?? 'A friend' }),
      })
      if (!res.ok) { showToast(zh ? '发送失败，请重试' : 'Failed to send. Try again.'); return }
      setInviteOk(true); setInviteEmail('')
      setTimeout(() => { setShowInvite(false); setInviteOk(false) }, 1500)
    } catch { showToast(zh ? '网络错误' : 'Network error') } finally { setInviteBusy(false) }
  }

  async function deleteAccount() {
    setDelStep('crying')
    const userId = localStorage.getItem('anlan_user_id')
    try {
      await fetch('/api/delete-account', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }),
      })
    } catch { /* proceed to sign out regardless */ }
    setTimeout(() => {
      localStorage.removeItem('anlan_user_id')
      localStorage.removeItem('anlan_user_name')
      localStorage.removeItem('anlan_match_id')
      router.push('/')
    }, 2400)
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
                {avatarUrl ? (
                  <button className="btn btn-secondary" onClick={() => router.push('/feed')}>
                    {t.looksGood}
                  </button>
                ) : (
                  <p className="hint" style={{ textAlign: 'center' }}>
                    {zh ? '一张照片是必需的 —— 大家想看到真实的你。' : 'A photo is required — people want to see the real you.'}
                  </p>
                )}
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
              <button className="customize" onClick={openEdit}>
                {zh ? '编辑资料 →' : 'Edit profile →'}
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
            <Row icon="envelope" title={zh ? '邀请朋友' : 'Invite a friend'} sub={zh ? '发给同校的人一个链接' : 'Send a classmate a link'} onClick={() => { setShowInvite(true); setInviteOk(false) }} />
            <Row icon="grad" title={zh ? '学校' : 'Campus'} sub={zh ? '已验证学生' : 'Verified student'}
              right={<span className="me-row-val">{localizeSchool(school, lang)} ✓</span>} />
            <Row icon="chat" title={zh ? '帮助与支持' : 'Help & support'} sub="hello@maplemeet.ai"
              onClick={() => { window.location.href = 'mailto:hello@maplemeet.ai' }} />
            <Row icon="logout" title={zh ? '退出登录' : 'Log out'} onClick={handleLogout} />
            <Row icon="trash" title={zh ? '删除账号' : 'Delete account'} danger onClick={() => setDelStep('confirm')} />
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

      {/* Edit profile sheet */}
      {showEdit && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => !saving && setShowEdit(false)}>
          <div style={{ width: '100%', maxWidth: 440, maxHeight: '88vh', overflowY: 'auto', background: 'var(--background)', borderRadius: '20px 20px 0 0', padding: '1.4rem 1.25rem 2.2rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <p className="font-display" style={{ fontSize: 19, fontWeight: 600, margin: 0 }}>{zh ? '编辑资料' : 'Edit profile'}</p>
              <button className="back" onClick={() => setShowEdit(false)}><HandIcon name="close" size={18} /></button>
            </div>

            {/* Photo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.1rem' }}>
              <div className="me-photo" style={{ width: 64, height: 64, borderRadius: '50%', background: avatarUrl ? undefined : gradient(user.id), fontSize: 26 }} onClick={() => fileRef.current?.click()}>
                {avatarUrl ? <img src={avatarUrl} alt="" /> : user.name[0].toUpperCase()}
              </div>
              <button className="customize" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? t.uploading : (zh ? '换照片' : 'Change photo')}
              </button>
            </div>

            <div className="stack" style={{ gap: '.9rem' }}>
              <div>
                <label className="label">{zh ? '名字' : 'Name'}</label>
                <input className="input" value={eName} onChange={e => setEName(e.target.value)} />
              </div>
              <div className="row">
                <div style={{ flex: '0 0 90px' }}>
                  <label className="label">{zh ? '年龄' : 'Age'}</label>
                  <input className="input" inputMode="numeric" placeholder="20" value={eAge} onChange={e => setEAge(e.target.value.replace(/\D/g, '').slice(0, 2))} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="label">{zh ? '年级' : 'Year'}</label>
                  <div className="chips">
                    {[['First-year', zh ? '大一' : 'First-year'], ['Sophomore', zh ? '大二' : 'Sophomore'], ['Junior', zh ? '大三' : 'Junior'], ['Senior', zh ? '大四' : 'Senior'], ['Grad', zh ? '研究生' : 'Grad']].map(([v, l]) => (
                      <button key={v} className={`chip${eYear === v ? ' active' : ''}`} onClick={() => setEYear(v)}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="label">{zh ? '性别' : 'Gender'}</label>
                <div className="chips">
                  {[['Man', zh ? '男生' : 'Man'], ['Woman', zh ? '女生' : 'Woman'], ['Non-binary', zh ? '非二元' : 'Non-binary']].map(([v, l]) => (
                    <button key={v} className={`chip${eGender === v ? ' active' : ''}`} onClick={() => setEGender(v)}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">{zh ? '想认识' : 'Interested in'}</label>
                <div className="chips">
                  {[['Men', zh ? '男生' : 'Men'], ['Women', zh ? '女生' : 'Women'], ['Non-binary', zh ? '非二元' : 'Non-binary']].map(([v, l]) => (
                    <button key={v} className={`chip${eInto.includes(v) ? ' active' : ''}`}
                      onClick={() => setEInto(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])}>{l}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="wiz-foot" style={{ marginTop: '1.4rem' }}>
              <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving ? (zh ? '保存中…' : 'Saving…') : (zh ? '保存' : 'Save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Invite modal */}
      {showInvite && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => !inviteBusy && setShowInvite(false)}>
          <div style={{ width: '100%', maxWidth: 440, background: 'var(--background)', borderRadius: '20px 20px 0 0', padding: '1.6rem 1.25rem 2.2rem', display: 'flex', flexDirection: 'column', gap: '.9rem', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
            <span style={{ color: 'var(--accent)' }}><HandIcon name="envelope" size={34} /></span>
            <p className="font-display" style={{ fontSize: 19, fontWeight: 600, margin: 0 }}>{zh ? '邀请朋友' : 'Invite a friend'}</p>
            {inviteOk ? (
              <p className="ok-msg" style={{ padding: '1rem 0' }}>{zh ? '邀请已发送 ✓' : 'Invite sent ✓'}</p>
            ) : (
              <>
                <p className="hint" style={{ textAlign: 'center', marginTop: 0, maxWidth: 300 }}>
                  {zh ? '认识谁应该来这儿？填他的校园邮箱，我们帮你发邀请。' : "Know someone who should be here? Drop their .edu email and we'll send them an invite."}
                </p>
                <input className="input" type="email" placeholder="their@school.edu" value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendInvite()}
                  style={{ maxWidth: 320, textAlign: 'center' }} autoFocus />
                <button className="btn btn-primary" style={{ maxWidth: 320 }} onClick={sendInvite} disabled={inviteBusy}>
                  {inviteBusy ? (zh ? '发送中…' : 'Sending…') : (zh ? '发送邀请' : 'Send invite')}
                </button>
              </>
            )}
            <button className="btn btn-secondary" style={{ maxWidth: 320 }} onClick={() => setShowInvite(false)}>{zh ? '关闭' : 'Close'}</button>
          </div>
        </div>
      )}

      {/* Delete account flow */}
      {delStep && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }} onClick={() => delStep === 'confirm' && setDelStep(null)}>
          <div style={{ width: '100%', maxWidth: 360, background: 'var(--background)', borderRadius: 22, padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            {delStep === 'confirm' ? (
              <>
                <MapleEyes width={110} strokeWidth={4} tap={false} />
                <p className="font-display" style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{zh ? '确定要删除吗？' : 'Are you sure?'}</p>
                <p className="hint" style={{ textAlign: 'center', marginTop: 0, maxWidth: 280 }}>
                  {zh ? '这会永久删除你的账号和所有数据，无法恢复。' : "This permanently deletes your account and everything on it. This can't be undone."}
                </p>
                <button className="btn" style={{ background: 'var(--danger)', color: '#fff', borderColor: 'var(--danger)' }} onClick={deleteAccount}>
                  {zh ? '永久删除' : 'Delete forever'}
                </button>
                <button className="btn btn-secondary" onClick={() => setDelStep(null)}>{zh ? '取消' : 'Cancel'}</button>
              </>
            ) : (
              <>
                <MapleEyesCrying width={150} />
                <p className="font-display" style={{ fontSize: 19, fontWeight: 600, margin: 0 }}>{zh ? '正在删除账号…' : 'Deleting your account…'}</p>
                <p className="hint" style={{ textAlign: 'center', marginTop: 0 }}>{zh ? '很遗憾看到你离开。' : "We're sad to see you go."}</p>
              </>
            )}
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
