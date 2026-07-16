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

function ago(iso: string, zh: boolean): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return zh ? '刚刚' : 'now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

type MatchRow = { id: string; other: User; isNew: boolean }
type LastMsg = { body: string; at: string; mine: boolean }

export default function MatchesPage() {
  const router = useRouter()
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [last, setLast] = useState<Record<string, LastMsg>>({})
  const [loading, setLoading] = useState(true)
  const [lang] = useLang()
  const zh = lang === 'zh'

  useEffect(() => {
    if (localStorage.getItem('maple_dark') === 'true') document.documentElement.classList.add('dark')
    const userId = localStorage.getItem('anlan_user_id')
    if (!userId) { router.push('/'); return }
    async function load() {
      const { data } = await supabase
        .from('matches')
        .select('id, status, user_a, user_b, created_at, user_a_profile:users!matches_user_a_fkey(*), user_b_profile:users!matches_user_b_fkey(*)')
        .or(`user_a.eq.${userId},user_b.eq.${userId}`)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
      const rows: MatchRow[] = (data ?? []).map((m: Record<string, unknown>) => {
        const isA = m.user_a === userId
        const other = (isA ? m.user_b_profile : m.user_a_profile) as User
        return { id: m.id as string, other, isNew: m.status === 'released' }
      }).filter(r => r.other)
      setMatches(rows)

      const ids = rows.map(r => r.id)
      if (ids.length) {
        const { data: msgs } = await supabase
          .from('messages').select('match_id, body, created_at, sender_id')
          .in('match_id', ids).order('created_at', { ascending: false })
        const map: Record<string, LastMsg> = {}
        for (const m of (msgs ?? []) as { match_id: string; body: string; created_at: string; sender_id: string }[]) {
          if (!map[m.match_id]) map[m.match_id] = { body: m.body, at: m.created_at, mine: m.sender_id === userId }
        }
        setLast(map)
      }
      setLoading(false)
    }
    load()
  }, [router])

  function openMatch(id: string) {
    localStorage.setItem('anlan_match_id', id)
    router.push('/chat/' + id)
  }

  const chats = matches.filter(m => last[m.id]).sort((a, b) => last[b.id].at.localeCompare(last[a.id].at))
  const fresh = matches.filter(m => !last[m.id])

  const Nav = (
    <nav className="feed-nav" style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 440, zIndex: 30 }}>
      <button className="nav-item" onClick={() => router.push('/feed')}><span className="ico"><HandIcon name="pin" size={19} /></span>{zh ? '附近' : 'Nearby'}</button>
      <button className="nav-item active"><span className="ico"><HandIcon name="seeNoEvil" size={19} /></span>{zh ? '匹配' : 'Matches'}</button>
      <button className="nav-item" onClick={() => router.push('/date')}><span className="ico"><HandIcon name="heart" size={19} /></span>{zh ? '约会' : 'Date'}</button>
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
              {fresh.length > 0 && (
                <>
                  <h3 className="sec-title">{zh ? '新匹配' : 'New matches'}</h3>
                  <div className="match-strip">
                    {fresh.map(m => (
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
                  <p className="match-hint">{zh ? '点一个匹配开始聊天 ↓' : 'Tap a match to start chatting ↓'}</p>
                </>
              )}

              {chats.length > 0 && (
                <>
                  <h3 className="sec-title" style={{ marginTop: fresh.length > 0 ? '.5rem' : 0 }}>{zh ? '我的聊天' : 'My chats'}</h3>
                  <div>
                    {chats.map(m => (
                      <div key={m.id} className="chat-row" onClick={() => openMatch(m.id)}>
                        <div className="chat-av" style={{ background: gradient(m.other.id) }}>
                          {m.other.avatar_url
                            ? <img src={m.other.avatar_url} alt={m.other.name} />
                            : m.other.name[0].toUpperCase()}
                        </div>
                        <div className="chat-main">
                          <strong>{m.other.name.split(' ')[0]}</strong>
                          <span className="msg">{last[m.id].mine ? (zh ? '你：' : 'You: ') : ''}{last[m.id].body}</span>
                        </div>
                        <div className="chat-side">
                          <span className="chat-time">{ago(last[m.id].at, zh)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {Nav}
      </section>
    </main>
  )
}
