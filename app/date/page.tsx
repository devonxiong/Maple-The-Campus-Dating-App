'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User, DateCard } from '@/types'
import { useLang, localizeSchool } from '@/lib/i18n'
import { schoolFromEmail } from '@/lib/score'
import MapleEyes from '../components/MapleEyes'
import HandIcon from '../components/HandIcon'

const GRADIENTS = [
  'linear-gradient(135deg,#f7b7c6,#e98aa6)', 'linear-gradient(135deg,#a9c7f5,#6f9ce8)',
  'linear-gradient(135deg,#bfe3c6,#7fc98f)', 'linear-gradient(135deg,#d8c3f0,#b492e0)',
  'linear-gradient(135deg,#a8e0d8,#6fc9bd)', 'linear-gradient(135deg,#f5cfa8,#e8a86f)',
]
function gradient(id: string) {
  const n = id.charCodeAt(0) + id.charCodeAt(id.length - 1)
  return GRADIENTS[n % GRADIENTS.length]
}

export default function DatePage() {
  const router = useRouter()
  const [them, setThem] = useState<User | null>(null)
  const [dateCard, setDateCard] = useState<DateCard | null>(null)
  const [matchId, setMatchId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [blindOpen, setBlindOpen] = useState(false)
  const [blindUser, setBlindUser] = useState<User | null>(null)
  const [blindRevealed, setBlindRevealed] = useState(false)
  const [blindBusy, setBlindBusy] = useState(false)
  const [lang] = useLang()
  const zh = lang === 'zh'

  function showToast(m: string) { setToast(m); setTimeout(() => setToast(''), 2000) }
  const soon = () => showToast(zh ? '即将上线' : 'Coming soon')

  async function openBlind() {
    setBlindOpen(true); setBlindRevealed(false); setBlindUser(null); setBlindBusy(true)
    const me = localStorage.getItem('anlan_user_id')
    const { data } = await supabase.from('users').select('*').neq('id', me).limit(80)
    const pool = (data ?? []) as User[]
    setBlindUser(pool.length ? pool[Math.floor(Math.random() * pool.length)] : null)
    setBlindBusy(false)
  }

  async function startBlindDate() {
    const me = localStorage.getItem('anlan_user_id')
    if (!me || !blindUser) return
    setBlindBusy(true)
    try {
      const res = await fetch('/api/blind-date-start', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: me, otherId: blindUser.id }),
      })
      const j = await res.json()
      if (res.ok && j.matchId) { localStorage.setItem('anlan_match_id', j.matchId); router.push('/chat/' + j.matchId); return }
    } catch { /* fall through */ }
    setBlindBusy(false); showToast(zh ? '暂时无法开始，请重试' : 'Could not start — try again')
  }

  useEffect(() => {
    if (localStorage.getItem('maple_dark') === 'true') document.documentElement.classList.add('dark')
    const userId = localStorage.getItem('anlan_user_id')
    if (!userId) { router.push('/'); return }
    supabase
      .from('matches')
      .select('id, status, user_a, user_b, date_card_json, created_at, user_a_profile:users!matches_user_a_fkey(*), user_b_profile:users!matches_user_b_fkey(*)')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const m = data as Record<string, unknown>
          const isA = m.user_a === userId
          setThem((isA ? m.user_b_profile : m.user_a_profile) as User)
          setDateCard((m.date_card_json as DateCard) ?? null)
          setMatchId(m.id as string)
        }
        setLoading(false)
      })
  }, [router])

  const Nav = (
    <nav className="feed-nav" style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 440, zIndex: 30 }}>
      <button className="nav-item" onClick={() => router.push('/feed')}><span className="ico"><HandIcon name="pin" size={19} /></span>{zh ? '附近' : 'Nearby'}</button>
      <button className="nav-item" onClick={() => router.push('/matches')}><span className="ico"><HandIcon name="seeNoEvil" size={19} /></span>{zh ? '匹配' : 'Matches'}</button>
      <button className="nav-item active"><span className="ico"><HandIcon name="heart" size={19} /></span>{zh ? '约会' : 'Date'}</button>
      <button className="nav-item" onClick={() => router.push('/profile')}><span className="ico"><HandIcon name="person" size={19} /></span>{zh ? '我' : 'Me'}</button>
    </nav>
  )

  const music = (() => {
    const si = them?.spotify_interests as unknown as Record<string, unknown> | null
    const genres = si?.top_genres as string[] | undefined
    return genres && genres.length ? genres.slice(0, 2).join(' / ') : (zh ? '待添加' : 'add yours')
  })()

  return (
    <main className="app">
      <section className="screen feed" style={{ position: 'relative', minHeight: '100vh' }}>
        <header className="feed-top">
          <div className="feed-brand">
            <MapleEyes width={42} strokeWidth={6} />
            <span className="feed-campus">{zh ? '我的约会' : 'My date'}</span>
          </div>
        </header>

        <div className="feed-scroll" style={{ paddingBottom: '5rem' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
              <div className="w-8 h-8 rounded-full border-2 border-[#111] border-t-transparent animate-spin" />
            </div>
          ) : (
            <>
              {them ? (
                <div className="date-card">
                  <div className="date-photo" style={{ background: them.avatar_url ? undefined : gradient(them.id) }}>
                    {them.avatar_url ? <img src={them.avatar_url} alt={them.name} /> : them.name[0].toUpperCase()}
                  </div>
                  <div className="date-fields">
                    <span className="date-name">{them.name.split(' ')[0]}</span>
                    <span className="date-field"><b>{zh ? '地点：' : 'Spot: '}</b> <span>{dateCard?.venue ?? (zh ? '待定' : 'TBD')}</span></span>
                    <span className="date-field"><b>{zh ? '话题：' : 'Topic: '}</b> <span>{dateCard?.shared_context ?? (zh ? '你们的共同点' : 'what you share')}</span></span>
                    <span className="date-field"><b>{zh ? '音乐：' : 'Music: '}</b> <span>{music}</span></span>
                    <span className="date-field"><a className="set" onClick={soon}>+ {zh ? '偏好约会地点' : 'preferred date spots'}</a></span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '.75rem', padding: '2rem 1rem 1.25rem' }}>
                  <MapleEyes width={80} strokeWidth={4} />
                  <p className="nearby-h" style={{ margin: 0 }}>{zh ? '还没有约会' : 'No date yet'}</p>
                  <p className="nearby-sub" style={{ maxWidth: 280, margin: 0 }}>
                    {zh ? '在“附近”和某人互相喜欢后，这里会出现你们的约会 —— 也可以直接开一个下面的盲盒。' : 'Match with someone in Nearby and your date shows up here — or just open a blind box below.'}
                  </p>
                  <button className="btn btn-primary" style={{ maxWidth: 220 }} onClick={() => router.push('/feed')}>{zh ? '去看看附近 →' : 'Browse Nearby →'}</button>
                </div>
              )}

              <div className="tool-row">
                <button className="tool-btn" onClick={() => router.push('/resources')}><span className="tool-ring"><HandIcon name="toolbox" size={26} /></span><span className="tl">{zh ? '资源' : 'Resources'}</span></button>
                <button className="tool-btn" onClick={() => router.push('/safety')}><span className="tool-ring"><HandIcon name="shield" size={26} /></span><span className="tl">{zh ? '安全' : 'Safety'}</span></button>
                <button className="tool-btn" onClick={openBlind}><span className="tool-ring"><HandIcon name="gift" size={26} /></span><span className="tl">{zh ? '盲盒' : 'Blind box'}</span></button>
              </div>

              {them && (
                <>
                  <p className="date-sec-label">{zh ? '时间安排' : 'Schedule'}</p>
                  <div className="date-block date-block-gap">
                    <span className="val"><HandIcon name="calendar" size={18} /> {dateCard?.time ?? (zh ? '待定' : 'TBD')}</span>
                    <button className="customize" onClick={() => { if (matchId) { localStorage.setItem('anlan_match_id', matchId); router.push('/match') } else soon() }}>{zh ? '调整' : 'Customize'}</button>
                  </div>
                  <p className="date-sec-label">{zh ? '校内地点' : 'Spot on campus'}</p>
                  <div className="date-block">
                    <span className="val"><HandIcon name="pin" size={18} /> {dateCard?.venue ?? (zh ? '待定' : 'TBD')}</span>
                    <button className="customize" onClick={() => { if (matchId) { localStorage.setItem('anlan_match_id', matchId); router.push('/match') } else soon() }}>{zh ? '调整' : 'Customize'}</button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {Nav}
      </section>

      {/* Blind box */}
      {blindOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }} onClick={() => !blindBusy && setBlindOpen(false)}>
          <div style={{ width: '100%', maxWidth: 340, background: 'var(--background)', borderRadius: 22, padding: '1.6rem 1.25rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <p className="font-display" style={{ fontSize: 19, fontWeight: 600, margin: 0 }}>{zh ? '盲盒约会' : 'Blind box'}</p>
            <p className="hint" style={{ marginTop: 0, maxWidth: 280 }}>{zh ? '从你的校园里随机挑一个人 —— 直接约一次，不用划。' : 'A random person from your campus — go on a date, no swiping.'}</p>
            <div style={{ width: '100%', maxWidth: 250, height: 280, borderRadius: 20, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: blindUser ? gradient(blindUser.id) : 'linear-gradient(135deg,#c9b3e8,#9a78d0)' }}>
              {blindBusy && !blindUser ? (
                <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : !blindRevealed ? (
                <span style={{ fontSize: 88, filter: 'blur(3px)', opacity: .9 }}>?</span>
              ) : blindUser ? (
                <>
                  {blindUser.avatar_url
                    ? <img src={blindUser.avatar_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 92, fontWeight: 800, opacity: .55 }}>{blindUser.name[0].toUpperCase()}</span>}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1rem', textAlign: 'left', background: 'linear-gradient(to top,rgba(0,0,0,.6),transparent)' }}>
                    <strong style={{ fontSize: 18, display: 'block' }}>{blindUser.name.split(' ')[0]}</strong>
                    <span style={{ fontSize: 13, opacity: .9 }}>{localizeSchool(schoolFromEmail(blindUser.email), lang)} · {blindUser.gender}</span>
                  </div>
                </>
              ) : <span style={{ fontSize: 40 }}>—</span>}
            </div>
            {!blindRevealed ? (
              <button className="btn btn-primary" style={{ maxWidth: 250 }} onClick={() => setBlindRevealed(true)} disabled={blindBusy || !blindUser}>{zh ? '打开盲盒' : 'Open the box'}</button>
            ) : blindUser ? (
              <div style={{ width: '100%', maxWidth: 250, display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                <button className="btn btn-primary" onClick={startBlindDate} disabled={blindBusy}>{blindBusy ? (zh ? '开始中…' : 'Starting…') : (zh ? '和 TA 约一次 →' : 'Start a date →')}</button>
                <button className="btn btn-secondary" onClick={openBlind} disabled={blindBusy}>{zh ? '换一个' : 'Someone else'}</button>
              </div>
            ) : <p className="hint">{zh ? '暂时没有可约的人' : 'No one available right now'}</p>}
            <button className="back" onClick={() => setBlindOpen(false)}>{zh ? '关闭' : 'Close'}</button>
          </div>
        </div>
      )}

      {toast && <div className="feed-toast">{toast}</div>}
    </main>
  )
}
