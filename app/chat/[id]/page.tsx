'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@/types'
import { useLang } from '@/lib/i18n'
import MapleEyes from '../../components/MapleEyes'
import HandIcon from '../../components/HandIcon'

const GRADIENTS = [
  'linear-gradient(135deg,#f7b7c6,#e98aa6)', 'linear-gradient(135deg,#a9c7f5,#6f9ce8)',
  'linear-gradient(135deg,#bfe3c6,#7fc98f)', 'linear-gradient(135deg,#d8c3f0,#b492e0)',
  'linear-gradient(135deg,#a8e0d8,#6fc9bd)', 'linear-gradient(135deg,#f5cfa8,#e8a86f)',
]
function gradient(id: string) {
  const n = id.charCodeAt(0) + id.charCodeAt(id.length - 1)
  return GRADIENTS[n % GRADIENTS.length]
}

type Message = { id: string; match_id: string; sender_id: string; body: string; created_at: string }

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const matchId = params?.id as string
  const [me, setMe] = useState<string | null>(null)
  const [them, setThem] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')
  const [lang] = useLang()
  const zh = lang === 'zh'
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (localStorage.getItem('maple_dark') === 'true') document.documentElement.classList.add('dark')
    const userId = localStorage.getItem('anlan_user_id')
    if (!userId || !matchId) { router.push('/matches'); return }
    setMe(userId)

    async function load() {
      const { data: match } = await supabase
        .from('matches')
        .select('user_a, user_b, user_a_profile:users!matches_user_a_fkey(*), user_b_profile:users!matches_user_b_fkey(*)')
        .eq('id', matchId).single()
      if (!match) { router.push('/matches'); return }
      const isA = match.user_a === userId
      setThem((isA ? match.user_b_profile : match.user_a_profile) as unknown as User)
      const { data: msgs } = await supabase
        .from('messages').select('*').eq('match_id', matchId).order('created_at', { ascending: true })
      setMessages((msgs ?? []) as Message[])
      setLoading(false)
    }
    load()

    const chan = supabase
      .channel('chat-' + matchId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => {
          const msg = payload.new as Message
          setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
        })
      .subscribe()
    return () => { supabase.removeChannel(chan) }
  }, [matchId, router])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send() {
    const body = text.trim()
    if (!body || !me || sending) return
    setText(''); setSending(true); setErr('')
    // optimistic
    const optimistic: Message = { id: 'tmp-' + Date.now(), match_id: matchId, sender_id: me, body, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, optimistic])
    const { data, error } = await supabase.from('messages').insert({ match_id: matchId, sender_id: me, body }).select('*').single()
    if (error) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setErr(zh ? '发送失败 —— 需要先建好 messages 表' : "Couldn't send — the messages table isn't set up yet")
      setText(body)
    } else if (data) {
      setMessages(prev => prev.map(m => m.id === optimistic.id ? (data as Message) : m))
    }
    setSending(false)
  }

  return (
    <main className="app">
      <section className="screen feed" style={{ position: 'relative', minHeight: '100vh', height: '100vh' }}>
        <header className="feed-top" style={{ gap: '.7rem' }}>
          <button className="back" onClick={() => router.push('/matches')}><HandIcon name="chevron" size={18} style={{ transform: 'rotate(180deg)' }} /></button>
          {them && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flex: 1, minWidth: 0 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, background: them.avatar_url ? undefined : gradient(them.id) }}>
                {them.avatar_url ? <img src={them.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : them.name[0].toUpperCase()}
              </div>
              <strong className="font-display" style={{ fontSize: 16, fontWeight: 600 }}>{them.name.split(' ')[0]}</strong>
            </div>
          )}
          <button className="customize" onClick={() => { localStorage.setItem('anlan_match_id', matchId); router.push('/date') }}>{zh ? '约会' : 'Date'}</button>
        </header>

        <div className="feed-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', padding: '1rem 1.1rem 1.25rem' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
              <div className="w-8 h-8 rounded-full border-2 border-[#111] border-t-transparent animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '.8rem', padding: '2.5rem 1rem' }}>
              <MapleEyes width={80} strokeWidth={4} />
              <p className="nearby-sub" style={{ maxWidth: 250 }}>
                {zh ? `你和 ${them?.name.split(' ')[0] ?? 'TA'} 匹配了 —— 打个招呼吧。` : `You matched with ${them?.name.split(' ')[0] ?? 'them'} — say hi.`}
              </p>
            </div>
          ) : (
            messages.map(m => {
              const mine = m.sender_id === me
              return (
                <div key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
                  <div style={{
                    padding: '.55rem .85rem', borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: mine ? 'var(--accent)' : 'var(--card)', color: mine ? 'var(--accent-ink)' : 'var(--foreground)',
                    border: mine ? 'none' : '1px solid var(--border)', fontSize: 14, lineHeight: 1.4, wordBreak: 'break-word',
                  }}>{m.body}</div>
                </div>
              )
            })
          )}
          {err && <p className="err-msg">{err}</p>}
          <div ref={endRef} />
        </div>

        <div style={{ position: 'sticky', bottom: 0, display: 'flex', gap: '.5rem', padding: '.7rem 1.1rem 1rem', borderTop: '1px solid var(--border)', background: 'var(--background)' }}>
          <input className="input" placeholder={zh ? '发条消息…' : 'Message…'} value={text}
            onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send() }} style={{ flex: 1 }} />
          <button className="btn btn-primary" style={{ width: 'auto', padding: '0 1.1rem' }} onClick={send} disabled={sending || !text.trim()}>
            {zh ? '发送' : 'Send'}
          </button>
        </div>
      </section>
    </main>
  )
}
