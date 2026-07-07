'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@/types'
import { useLang } from '@/lib/i18n'
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

type MatchRow = { id: string; other: User; isNew: boolean }

export default function MatchesPage() {
  const router = useRouter()
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [lang] = useLang()
  const zh = lang === 'zh'

  useEffect(() => {
    if (localStorage.getItem('maple_dark') === 'true') document.documentElement.classList.add('dark')
    const userId = localStorage.getItem('anlan_user_id')
    if (!userId) { router.push('/'); return }
    supabase
      .from('matches')
      .select('id, status, user_a, user_b, created_at, user_a_profile:users!matches_user_a_fkey(*), user_b_profile:users!matches_user_b_fkey(*)')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const rows: MatchRow[] = (data ?? []).map((m: Record<string, unknown>) => {
          const isA = m.user_a === userId
          const other = (isA ? m.user_b_profile : m.user_a_profile) as User
          return { id: m.id as string, other, isNew: m.status === 'released' }
        }).filter(r => r.other)
        setMatches(rows)
        setLoading(false)
      })
  }, [router])

  function openMatch(id: string) {
    localStorage.setItem('anlan_match_id', id)
    router.push('/match')
  }

  const Nav = (
    <nav className="feed-nav" style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 440, zIndex: 30 }}>
      <button className="nav-item" onClick={() => router.push('/feed')}><span className="ico"><HandIcon name="pin" size={19} /></span>{zh ? '附近' : 'Nearby'}</button>
      <button className="nav-item active"><span className="ico"><HandIcon name="seeNoEvil" size={19} /></span>{zh ? '匹配' : 'Matches'}</button>
      <button className="nav-item" onClick={() => router.push('/match')}><span className="ico"><HandIcon name="heart" size={19} /></span>{zh ? '约会' : 'Date'}</button>
      <button className="nav-item" onClick={() => router.push('/profile')}><span className="ico"><HandIcon name="person" size={19} /></span>{zh ? '我' : 'Me'}</button>
    </nav>
  )

  return (
    <main className="app">
      <section className="screen feed" style={{ position: 'relative', minHeight: '100vh' }}>
        <header className="feed-top">
          <div className="feed-brand">
            <MapleEyes width={42} strokeWidth={6} />
            <span className="feed-campus">{zh ? '我的匹配' : 'My matches'}</span>
          </div>
        </header>

        <div className="feed-scroll" style={{ paddingBottom: '5rem' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
              <div className="w-8 h-8 rounded-full border-2 border-[#111] border-t-transparent animate-spin" />
            </div>
          ) : matches.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem', padding: '3.5rem 1rem' }}>
              <MapleEyes width={92} strokeWidth={4} />
              <div>
                <p className="nearby-h">{zh ? '还没有匹配' : 'No matches yet'}</p>
                <p className="nearby-sub" style={{ maxWidth: 260 }}>{zh ? '在“附近”里发送喜欢，双向喜欢就会出现在这里。' : 'Send likes in Nearby — when someone likes you back, they show up here.'}</p>
              </div>
              <button className="btn btn-primary" style={{ maxWidth: 220 }} onClick={() => router.push('/feed')}>{zh ? '去看看附近 →' : 'Browse Nearby →'}</button>
            </div>
          ) : (
            <>
              <h3 className="sec-title">{zh ? '新匹配' : 'New matches'}</h3>
              <div className="match-strip">
                {matches.map(m => (
                  <div key={m.id} className="match-card" onClick={() => openMatch(m.id)}>
                    <div className="match-photo" style={{ background: gradient(m.other.id) }}>
                      {m.isNew && <span className="match-new">NEW</span>}
                      {m.other.avatar_url
                        ? <img src={m.other.avatar_url} alt={m.other.name} />
                        : <span className="initial">{m.other.name[0].toUpperCase()}</span>}
                    </div>
                    <p className="match-name">{m.other.name.split(' ')[0]}</p>
                  </div>
                ))}
              </div>
              <p className="match-hint">{zh ? '点一个匹配查看你们的约会 ↓' : 'Tap a match to see your date ↓'}</p>
            </>
          )}
        </div>

        {Nav}
      </section>
    </main>
  )
}
