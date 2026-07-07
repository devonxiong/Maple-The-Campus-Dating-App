'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { buildFeed, buildSwipedSet, schoolFromEmail, PresenceMap } from '@/lib/score'
import { User, FeedCard, Match, Notification } from '@/types'
import { Lang, readLang, writeLang, FEED, FeedT, localizeSchool } from '@/lib/i18n'
import MapleEyes from '../components/MapleEyes'

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (resp: { access_token?: string; error?: string }) => void
          }) => { requestAccessToken: () => void }
        }
      }
    }
  }
}

const COLORS = [
  'bg-rose-50 text-rose-500',
  'bg-sky-50 text-sky-500',
  'bg-emerald-50 text-emerald-500',
  'bg-amber-50 text-amber-500',
  'bg-violet-50 text-violet-500',
  'bg-teal-50 text-teal-500',
]

function avatarColor(id: string) {
  const n = id.charCodeAt(0) + id.charCodeAt(id.length - 1)
  return COLORS[n % COLORS.length]
}
function nameColor(name: string) {
  const n = name.charCodeAt(0) + name.charCodeAt(name.length - 1)
  return COLORS[n % COLORS.length]
}

type Sentiment = 'like' | 'dislike' | 'neutral' | 'pass' | 'block'
type BellStatus = 'off' | 'watching' | 'triggered'
type EmailContact = { name: string; email: string }
type ClassmateOnMaple = FeedCard & { contactName: string }
type ContactNotOnMaple = EmailContact & { invited: boolean }

export default function FeedPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [feed, setFeed] = useState<FeedCard[]>([])
  const [knownOnMaple, setKnownOnMaple] = useState<ClassmateOnMaple[]>([])
  const [knownOff, setKnownOff] = useState<ContactNotOnMaple[]>([])
  const [loading, setLoading] = useState(true)
  const [contactsLoading, setContactsLoading] = useState(false)
  const [emailConnected, setEmailConnected] = useState(false)
  const [swipeLoading, setSwipeLoading] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState<string | null>(null)
  const [directInviteEmail, setDirectInviteEmail] = useState('')
  const [directInviteSent, setDirectInviteSent] = useState<string[]>([])
  const [directInviteLoading, setDirectInviteLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [match, setMatch] = useState<Match | null>(null)
  const [bellStatus, setBellStatus] = useState<BellStatus>('off')
  const [dailyCap, setDailyCap] = useState(false)
  const [secondChance, setSecondChance] = useState(false)
  const [allSwipedData, setAllSwipedData] = useState<{ to_user: string; sentiment: 'like' | 'dislike' | 'neutral' | 'pass'; created_at: string }[]>([])
  const [allUsersSnapshot, setAllUsersSnapshot] = useState<User[]>([])
  const [presenceSnapshot, setPresenceSnapshot] = useState<PresenceMap>(new Map())
  const tokenClientRef = useRef<{ requestAccessToken: () => void } | null>(null)
  const [darkMode, setDarkMode] = useState(false)
  const [lang, setLang] = useState<Lang>('en')
  const [showSettings, setShowSettings] = useState(false)
  const [geotracking, setGeotracking] = useState(true)
  const [agentEnabled, setAgentEnabled] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [topSpots, setTopSpots] = useState<string[]>([])
  const [reportTarget, setReportTarget] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [pendingBlindRequest, setPendingBlindRequest] = useState<{ id: string; requester_id: string } | null>(null)
  const [sentBlindRequest, setSentBlindRequest] = useState<{ id: string; status: string } | null>(null)
  const [showBlindConsent, setShowBlindConsent] = useState(false)
  const [blindBoxLoading, setBlindBoxLoading] = useState(false)

  // Load dark mode + language preference
  useEffect(() => {
    const saved = localStorage.getItem('maple_dark')
    if (saved === 'true') {
      document.documentElement.classList.add('dark')
      setDarkMode(true)
    }
    setLang(readLang())
  }, [])

  const t = FEED[lang]
  function toggleLang() {
    setLang(prev => {
      const next: Lang = prev === 'en' ? 'zh' : 'en'
      writeLang(next)
      return next
    })
  }

  function toggleDark() {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('maple_dark', String(next))
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  function handleLogout() {
    localStorage.removeItem('anlan_user_id')
    localStorage.removeItem('anlan_user_name')
    localStorage.removeItem('anlan_match_id')
    router.push('/')
  }

  function handleSecondChance() {
    if (!currentUser) return
    // Rebuild feed excluding only likes/blocks — passes are unlocked temporarily
    const noPassSwipes = allSwipedData.filter(s => s.sentiment !== 'pass')
    const swipedIds = new Set(noPassSwipes.map(s => s.to_user))
    const myPresence = presenceSnapshot.get(currentUser.id) ?? undefined
    const totalUserCount = allUsersSnapshot.length + 1
    const feedResult = buildFeed(currentUser, allUsersSnapshot, swipedIds, new Set(), totalUserCount, presenceSnapshot, myPresence)
    setFeed(feedResult)
    setSecondChance(true)
    setDailyCap(false)
  }

  async function savePrivacySettings(geo: boolean, agent: boolean) {
    const userId = localStorage.getItem('anlan_user_id')
    if (!userId) return
    setSavingSettings(true)
    await supabase.from('users').update({
      geotracking_enabled: geo,
      agent_enabled: agent,
    }).eq('id', userId)
    // If geotracking turned off, remove presence
    if (!geo) {
      await supabase.from('user_presence').delete().eq('user_id', userId)
      setBellStatus('off')
    }
    setSavingSettings(false)
    showToast(t.tSettingsSaved)
  }

  // Bell: geolocation → update user_presence every 30s
  useEffect(() => {
    const userId = localStorage.getItem('anlan_user_id')
    if (!userId || !navigator.geolocation || !geotracking) return

    async function updatePresence(lat: number, lng: number) {
      await supabase.from('user_presence').upsert(
        { user_id: userId, lat, lng, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
      setBellStatus(s => s === 'triggered' ? s : 'watching')
    }

    navigator.geolocation.getCurrentPosition(
      pos => updatePresence(pos.coords.latitude, pos.coords.longitude),
      () => setBellStatus('off')
    )

    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        pos => updatePresence(pos.coords.latitude, pos.coords.longitude),
        () => {}
      )
    }, 30000)

    return () => clearInterval(interval)
  }, [geotracking])

  // Bell: listen for proximity notifications
  useEffect(() => {
    const userId = localStorage.getItem('anlan_user_id')
    if (!userId) return

    const chan = supabase.channel('bell-' + userId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `to_user=eq.${userId}` },
        (payload) => {
          const notif = payload.new as Notification
          if (notif.message === '__blind_date__') {
            supabase.from('blind_date_requests').select('id,requester_id')
              .eq('target_id', userId).eq('status', 'pending')
              .order('created_at', { ascending: false }).limit(1).maybeSingle()
              .then(({ data }) => { if (data) setPendingBlindRequest(data) })
            showToast(t.tBlindIncoming)
          } else if (notif.message === '__blind_date_accepted__') {
            showToast(t.tBlindYes)
            setTimeout(() => router.push('/match'), 1200)
          } else if (notif.message === '__blind_date_declined__') {
            setSentBlindRequest(null)
            showToast(t.tBlindPassed)
          } else if (notif.type === 'bell') {
            setBellStatus('triggered')
            showToast(notif.message || t.tNearbyLikes)
            setTimeout(() => setBellStatus(s => s === 'triggered' ? 'watching' : s), 10000)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(chan) }
  }, [router])

  // Load Google Identity Services script
  useEffect(() => {
    if (document.getElementById('gis-script')) return
    const script = document.createElement('script')
    script.id = 'gis-script'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    document.head.appendChild(script)
  }, [])

  // Load main data
  useEffect(() => {
    const userId = localStorage.getItem('anlan_user_id')
    if (!userId) { router.push('/'); return }

    async function load() {
      setLoading(true)
      try {
        const todayStart = new Date()
        todayStart.setUTCHours(0, 0, 0, 0)

        const [{ data: me }, { data: all }, { data: swiped }, { data: admirers }, { count: swipedToday }, { data: presences }, { data: incomingBlind }, { data: outgoingBlind }] = await Promise.all([
          supabase.from('users').select('*').eq('id', userId).single(),
          supabase.from('users').select('*').neq('id', userId),
          supabase.from('swipes').select('to_user,sentiment,created_at').eq('from_user', userId),
          supabase.from('swipes').select('from_user').eq('to_user', userId).eq('sentiment', 'like'),
          supabase.from('swipes').select('*', { count: 'exact', head: true })
            .eq('from_user', userId).gte('created_at', todayStart.toISOString()),
          supabase.from('user_presence').select('user_id, lat, lng'),
          supabase.from('blind_date_requests').select('id,requester_id').eq('target_id', userId).eq('status', 'pending').limit(1).maybeSingle(),
          supabase.from('blind_date_requests').select('id,status').eq('requester_id', userId).eq('status', 'pending').limit(1).maybeSingle(),
        ])

        if (!me) { router.push('/'); return }
        setCurrentUser(me)
        setAllUsers(all ?? [])
        setAllUsersSnapshot(all ?? [])
        setAllSwipedData((swiped ?? []) as { to_user: string; sentiment: 'like' | 'dislike' | 'neutral' | 'pass'; created_at: string }[])
        // Load privacy settings
        const meAny = me as unknown as Record<string, unknown>
        setGeotracking(meAny.geotracking_enabled !== false)
        setAgentEnabled(meAny.agent_enabled !== false)
        // Top spots
        setTopSpots(me.top_spots ?? [])
        // Blind date requests
        if (incomingBlind) setPendingBlindRequest(incomingBlind)
        if (outgoingBlind) setSentBlindRequest(outgoingBlind)

        // Check for existing match on load (in case realtime event was missed)
        const handledMatches: string[] = JSON.parse(localStorage.getItem('anlan_matches_handled') ?? '[]')
        const { data: existingMatch } = await supabase
          .from('matches')
          .select('id, status')
          .or(`user_a.eq.${userId},user_b.eq.${userId}`)
          .eq('status', 'released')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        if (existingMatch && !handledMatches.includes(existingMatch.id)) {
          localStorage.setItem('anlan_match_id', existingMatch.id)
          router.push('/match')
          return
        }

        // 10/day cap — only applies if there are enough users to be meaningful
        if ((swipedToday ?? 0) >= 10 && (all?.length ?? 0) > 10) {
          setDailyCap(true)
          return
        }

        const swipedIds = buildSwipedSet(
          (swiped ?? []) as { to_user: string; sentiment: 'like' | 'dislike' | 'neutral' | 'pass'; created_at: string }[]
        )

        // Build presence map for GPS scoring
        const presenceMap: PresenceMap = new Map(
          (presences ?? [])
            .filter(p => p.user_id && p.lat != null && p.lng != null)
            .map(p => [p.user_id as string, { lat: p.lat as number, lng: p.lng as number }])
        )
        const myPresence = userId ? presenceMap.get(userId) ?? undefined : undefined
        setPresenceSnapshot(presenceMap)

        const totalUserCount = (all?.length ?? 0) + 1
        const feedResult = buildFeed(me, all ?? [], swipedIds, new Set(), totalUserCount, presenceMap, myPresence)
        console.log('[feed] me:', me?.id, 'all:', all?.length, 'feed:', feedResult.length, 'swiped:', swipedIds.size)
        setFeed(feedResult)
      } catch (err) {
        console.error('[feed] load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  // Realtime match subscription — instant in demo mode (status='released' on insert)
  useEffect(() => {
    const userId = localStorage.getItem('anlan_user_id')
    if (!userId) return
    const onMatch = (payload: { new: Match }) => {
      if (payload.new.status === 'released') setMatch(payload.new)
    }
    const chanA = supabase.channel('match-a')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches', filter: `user_a=eq.${userId}` }, onMatch)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: `user_a=eq.${userId}` }, onMatch)
      .subscribe()
    const chanB = supabase.channel('match-b')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches', filter: `user_b=eq.${userId}` }, onMatch)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: `user_b=eq.${userId}` }, onMatch)
      .subscribe()
    return () => { supabase.removeChannel(chanA); supabase.removeChannel(chanB) }
  }, [])

  useEffect(() => {
    if (match) {
      localStorage.setItem('anlan_match_id', match.id)
      // Plan the date using GPS midpoint + Google Places (best-effort)
      fetch('/api/plan-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.id }),
      }).catch(() => {})
      // Notify both users via SMS (best-effort)
      fetch('/api/notify-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.id }),
      }).catch(() => {})
      router.push('/match')
    }
  }, [match, router])

  async function fetchContacts(accessToken: string) {
    setContactsLoading(true)
    try {
      // Fetch Google Contacts via People API
      const res = await fetch(
        'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses&pageSize=500&sortOrder=FIRST_NAME_ASCENDING',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      const data = await res.json()
      const connections: EmailContact[] = (data.connections ?? [])
        .map((p: { names?: { displayName: string }[]; emailAddresses?: { value: string }[] }) => ({
          name: p.names?.[0]?.displayName ?? '',
          email: p.emailAddresses?.[0]?.value?.toLowerCase() ?? '',
        }))
        .filter((c: EmailContact) => c.name && c.email)

      const swipedIds = new Set(
        (await supabase.from('swipes').select('to_user').eq('from_user', currentUser?.id ?? ''))
          .data?.map((s: { to_user: string }) => s.to_user) ?? []
      )

      const emailToUser = new Map(allUsers.map((u) => [u.email.toLowerCase(), u]))
      const myEmail = currentUser?.email.toLowerCase() ?? ''

      const onMaple: ClassmateOnMaple[] = []
      const offMaple: ContactNotOnMaple[] = []

      const FIVE_C_DOMAINS = [
        'pitzer.edu', 'students.pitzer.edu',
        'mymail.pomona.edu',
        'scrippscollege.edu',
        'claremontmckenna.edu', 'cmc.edu',
        'g.hmc.edu',
      ]
      function isFiveC(email: string) {
        return FIVE_C_DOMAINS.some(d => email.endsWith('@' + d))
      }

      for (const contact of connections) {
        if (contact.email === myEmail) continue
        if (!isFiveC(contact.email)) continue // skip non-5C contacts
        const mapleUser = emailToUser.get(contact.email)
        if (mapleUser && !swipedIds.has(mapleUser.id)) {
          onMaple.push({
            user: mapleUser,
            score: 10,
            hint: `You know each other`,
            contactName: contact.name,
          })
        } else if (!mapleUser) {
          offMaple.push({ ...contact, invited: false })
        }
      }

      setKnownOnMaple(onMaple)
      setKnownOff(offMaple.slice(0, 20)) // cap at 20 for invite list
      setEmailConnected(true)
    } catch {
      showToast(t.tFailContacts)
    } finally {
      setContactsLoading(false)
    }
  }

  function connectEmail() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) { showToast(t.tGoogleNot); return }

    if (!window.google) {
      showToast(t.tGoogleLoad)
      return
    }

    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/contacts.readonly',
      callback: (resp) => {
        if (resp.access_token) fetchContacts(resp.access_token)
        else showToast(t.tGoogleCancel)
      },
    })
    tokenClientRef.current.requestAccessToken()
  }

  const swipe = useCallback(async (targetId: string, sentiment: Sentiment, isKnown = false) => {
    const userId = localStorage.getItem('anlan_user_id')
    if (!userId || swipeLoading) return
    setSwipeLoading(targetId + sentiment)
    try {
      const { error } = await supabase.from('swipes')
        .upsert({ from_user: userId, to_user: targetId, sentiment }, { onConflict: 'from_user,to_user' })
      if (error) { showToast(t.tOops); return }
      if (sentiment === 'like') showToast(t.tShotSent)
      if (sentiment === 'pass') showToast(t.tGone30)
      if (sentiment === 'block') showToast(t.tBlocked)
      if (isKnown) setKnownOnMaple((f) => f.filter((c) => c.user.id !== targetId))
      else setFeed((f) => f.filter((c) => c.user.id !== targetId))
    } catch {
      showToast(t.tOops)
    } finally {
      setSwipeLoading(null)
    }
  }, [swipeLoading, t])

  const sendInvite = useCallback(async (contact: ContactNotOnMaple) => {
    if (inviteLoading || !currentUser) return
    setInviteLoading(contact.email)
    try {
      await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email: contact.email,
          to_name: contact.name,
          from_name: currentUser.name,
          course_name: 'your network',
        }),
      })
      setKnownOff((prev) => prev.map((c) => c.email === contact.email ? { ...c, invited: true } : c))
      showToast(t.tInvited(contact.name.split(' ')[0]))
    } catch {
      showToast(t.tFailInvite)
    } finally {
      setInviteLoading(null)
    }
  }, [inviteLoading, currentUser, t])

  async function openBlindBox() {
    if (!currentUser || blindBoxLoading) return
    setBlindBoxLoading(true)
    try {
      const res = await fetch('/api/blind-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: currentUser.id }),
      })
      const data = await res.json()
      if (data.error === 'no_eligible_targets') {
        showToast(t.tNoOne)
      } else if (data.error === 'already_pending') {
        setSentBlindRequest({ id: data.request_id, status: 'pending' })
        showToast(t.tAlreadyWaiting)
      } else if (data.success) {
        setSentBlindRequest({ id: data.request_id, status: 'pending' })
        showToast(t.tBlindSent)
      } else if (data.error) {
        showToast(t.tCouldNotSend)
        console.error('[blind-date] error:', data.error)
      }
    } catch {
      showToast(t.tOops2)
    } finally {
      setBlindBoxLoading(false)
      setShowBlindConsent(false)
    }
  }

  async function respondToBlindDate(accept: boolean) {
    if (!currentUser || !pendingBlindRequest || blindBoxLoading) return
    setBlindBoxLoading(true)
    try {
      const res = await fetch('/api/blind-date', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: pendingBlindRequest.id, responder_id: currentUser.id, accept }),
      })
      const data = await res.json()
      if (accept && data.match_id) {
        localStorage.setItem('anlan_match_id', data.match_id)
        router.push('/match')
      } else {
        setPendingBlindRequest(null)
        showToast(accept ? t.tOnYourWay : t.tMaybeNext)
      }
    } catch {
      showToast(t.tOops2)
    } finally {
      setBlindBoxLoading(false)
    }
  }

  async function submitReport() {
    if (!currentUser || !reportTarget || !reportReason) return
    setReportLoading(true)
    try {
      await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reporter_id: currentUser.id, reported_id: reportTarget, reason: reportReason }),
      })
      setFeed(f => f.filter(c => c.user.id !== reportTarget))
      setKnownOnMaple(f => f.filter(c => c.user.id !== reportTarget))
      showToast(t.tReported)
    } catch {
      showToast(t.tOops2)
    } finally {
      setReportLoading(false)
      setReportTarget(null)
      setReportReason('')
    }
  }

  async function saveTopSpots(spots: string[]) {
    const userId = localStorage.getItem('anlan_user_id')
    if (!userId) return
    setTopSpots(spots)
    await supabase.from('users').update({ top_spots: spots }).eq('id', userId)
  }

  async function sendDirectInvite() {
    const email = directInviteEmail.trim().toLowerCase()
    if (!email || directInviteLoading) return
    if (!email.endsWith('.edu')) { showToast(t.tNeedEdu); return }
    if (directInviteSent.includes(email)) { showToast(t.tAlreadyInvited); return }
    setDirectInviteLoading(true)
    try {
      await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email: email,
          to_name: email.split('@')[0],
          from_name: currentUser?.name ?? 'Someone',
        }),
      })
      setDirectInviteSent(prev => [...prev, email])
      setDirectInviteEmail('')
      showToast(t.tInviteSentTo(email.split('@')[0]))
    } catch {
      showToast(t.tFailInvite2)
    } finally {
      setDirectInviteLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f8f7f4]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#111] border-t-transparent animate-spin" />
          <p className="text-sm text-[#9b9590]">{t.loading}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f8f7f4]">
      <div className="max-w-[420px] mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-1.5">
              <MapleEyes width={40} strokeWidth={6} />
              <h1 className="text-lg font-semibold text-[#111] font-display">Maple</h1>
            </div>
            <p className="text-xs text-[#9b9590]">{t.tagline}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-full border border-[#e8e6e1] text-[11px] font-medium text-[#6b6760] hover:border-[#111] hover:text-[#111] transition-colors whitespace-nowrap leading-none"
              title="Switch language"
            >
              <span className="text-[12px]">🌐</span>
              {lang === 'en' ? '中文' : 'EN'}
            </button>
            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#eeeae4] transition-colors"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="text-base">{darkMode ? '☀️' : '🌙'}</span>
            </button>
            {/* Settings */}
            <button
              onClick={() => setShowSettings(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#eeeae4] transition-colors"
              title="Privacy settings"
            >
              <span className="text-base">⚙️</span>
            </button>
            {currentUser && (
              <button onClick={() => router.push('/profile')} className="shrink-0">
                {currentUser.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover border border-[#e8e6e1]"
                  />
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${avatarColor(currentUser.id)}`}>
                    {currentUser.name[0].toUpperCase()}
                  </div>
                )}
              </button>
            )}
          </div>
        </div>


        {contactsLoading && (
          <div className="flex items-center gap-2 text-xs text-[#9b9590] mb-5 px-1">
            <div className="w-3 h-3 rounded-full border border-[#9b9590] border-t-transparent animate-spin" />
            {t.checkingKnown}
          </div>
        )}

        {/* Action legend */}
        {(feed.length > 0 || knownOnMaple.length > 0) && (
          <div className="flex items-center justify-center gap-3 mb-4 px-1">
            <span className="text-[10px] text-[#9b9590]">🍁 <span className="font-medium text-[#6b6760]">{t.legShoot}</span> — {t.legShootSub}</span>
            <span className="text-[#ddd]">·</span>
            <span className="text-[10px] text-[#9b9590]">👋 <span className="font-medium text-[#6b6760]">{t.legPass}</span> — {t.legPassSub}</span>
            <span className="text-[#ddd]">·</span>
            <span className="text-[10px] text-[#9b9590]">🚫 {t.legBlock}</span>
          </div>
        )}

        <div className="space-y-6 animate-fade-up">

          {/* Incoming blind date request */}
          {pendingBlindRequest && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🎁</span>
                <p className="text-sm font-semibold text-amber-900">{t.blindReqTitle}</p>
              </div>
              <p className="text-xs text-amber-700 leading-relaxed mb-4">
                {t.blindReqDesc}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => respondToBlindDate(false)}
                  disabled={blindBoxLoading}
                  className="flex-1 py-2.5 rounded-xl border border-amber-200 text-xs font-medium text-amber-700 disabled:opacity-40 active:scale-95 transition-all"
                >
                  {t.notThisTime}
                </button>
                <button
                  onClick={() => respondToBlindDate(true)}
                  disabled={blindBoxLoading}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-semibold disabled:opacity-40 active:scale-95 transition-all"
                >
                  {blindBoxLoading ? '···' : t.imIn}
                </button>
              </div>
            </div>
          )}

          {/* Second chance banner */}
          {secondChance && feed.length > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
              <span className="text-sm">🔁</span>
              <p className="text-xs text-amber-700 leading-relaxed">
                {t.secondChance}
              </p>
            </div>
          )}

          {/* People you know on Maple */}
          {knownOnMaple.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="text-xs font-semibold text-[#111]">{t.knownTitle}</span>
                <span className="text-xs text-[#9b9590]">{t.knownSub}</span>
              </div>
              <div className="space-y-3">
                {knownOnMaple.map((card) => (
                  <KnownCard
                    key={card.user.id}
                    card={card}
                    swipeLoading={swipeLoading}
                    onSwipe={(s) => swipe(card.user.id, s, true)}
                    onReport={() => setReportTarget(card.user.id)}
                    t={t}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Regular anonymous feed */}
          {feed.length > 0 && (
            <section>
              {knownOnMaple.length > 0 && (
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="text-xs font-semibold text-[#111]">{t.maybeTitle}</span>
                  <span className="text-xs text-[#9b9590]">{t.maybeSub}</span>
                </div>
              )}
              <div className="space-y-3">
                {feed.map((card) => (
                  <AnonymousCard
                    key={card.user.id}
                    card={card}
                    swipeLoading={swipeLoading}
                    onSwipe={(s) => swipe(card.user.id, s, false)}
                    onReport={() => setReportTarget(card.user.id)}
                    t={t}
                    lang={lang}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Invite contacts not on Maple */}
          {knownOff.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="text-xs font-semibold text-[#111]">{t.inviteTitle}</span>
                <span className="text-xs text-[#9b9590]">{t.inviteSub}</span>
              </div>
              <div className="space-y-2">
                {knownOff.map((c) => (
                  <div key={c.email} className="bg-white rounded-2xl border border-[#e8e6e1] px-4 py-3 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${nameColor(c.name)}`}>
                      {c.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#111] truncate">{c.name}</p>
                      <p className="text-xs text-[#9b9590] truncate">{c.email}</p>
                    </div>
                    <button
                      onClick={() => sendInvite(c)}
                      disabled={c.invited || inviteLoading === c.email}
                      className={`shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                        c.invited ? 'bg-[#f0ede8] text-[#9b9590]' : 'bg-[#111] text-white active:scale-95'
                      }`}
                    >
                      {c.invited ? t.sent : inviteLoading === c.email ? '···' : t.invite}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Direct email invite */}
          <section className="pt-2">
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="text-xs font-semibold text-[#111]">{t.inviteSomeone}</span>
              <span className="text-xs text-[#9b9590]">{t.inviteSomeoneSub}</span>
            </div>
            <div className="bg-white border border-[#e8e6e1] rounded-2xl px-4 py-4">
              <p className="text-xs text-[#9b9590] mb-3 leading-relaxed">
                {t.inviteBody}
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={directInviteEmail}
                  onChange={e => setDirectInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendDirectInvite()}
                  placeholder={t.invitePh}
                  className="flex-1 text-sm border border-[#e8e6e1] rounded-xl px-3 py-2.5 outline-none focus:border-[#111] transition-colors placeholder:text-[#c5c0bb]"
                />
                <button
                  onClick={sendDirectInvite}
                  disabled={directInviteLoading || !directInviteEmail.trim()}
                  className="px-4 py-2.5 bg-[#111] text-white text-xs font-medium rounded-xl disabled:opacity-40 active:scale-95 transition-all shrink-0"
                >
                  {directInviteLoading ? '···' : t.send}
                </button>
              </div>
              {directInviteSent.length > 0 && (
                <div className="mt-3 space-y-1">
                  {directInviteSent.map(email => (
                    <div key={email} className="flex items-center gap-1.5 text-[11px] text-[#9b9590]">
                      <span className="text-emerald-500">✓</span>
                      <span>{email}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 开盲盒 (moved below) */}
          {!pendingBlindRequest && (
            <section className="pt-2">
              <div className="relative overflow-hidden bg-[#111] rounded-2xl px-5 py-5">
                <div className="absolute -right-4 -top-4 text-[80px] opacity-10 select-none">🎁</div>
                <p className="text-sm font-semibold text-white mb-1">{t.blindCard}</p>
                {sentBlindRequest ? (
                  <>
                    <p className="text-xs text-[#9b9590] leading-relaxed mb-4">
                      {t.blindWaiting}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-xs text-amber-400">{t.blindPending}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-[#9b9590] leading-relaxed mb-4">
                      {t.blindDesc}
                    </p>
                    <button
                      onClick={() => setShowBlindConsent(true)}
                      className="px-5 py-2.5 bg-amber-400 text-[#111] text-xs font-semibold rounded-xl active:scale-95 transition-all"
                    >
                      {t.openBox}
                    </button>
                  </>
                )}
              </div>
            </section>
          )}

          {/* Routine exhausted / empty state */}
          {(dailyCap || (!contactsLoading && feed.length === 0 && knownOnMaple.length === 0)) && (
            <div className="flex flex-col items-center justify-center text-center py-16 gap-5">
              <MapleEyes width={96} strokeWidth={4} />

              <div>
                <p className="text-base font-semibold text-[#111] mb-1">
                  {t.seenEveryone}
                </p>
                <p className="text-xs text-[#9b9590] max-w-[240px] leading-relaxed">
                  {t.seenEveryoneSub}
                </p>
              </div>

              <div className="w-full max-w-[280px] bg-white border border-[#e8e6e1] rounded-2xl px-5 py-4 text-left space-y-3">
                <p className="text-xs font-medium text-[#111]">{t.whileYouWait}</p>
                <div className="flex items-start gap-2.5">
                  <span className="text-sm mt-0.5">📨</span>
                  <p className="text-xs text-[#6b6760] leading-relaxed">
                    {t.waitTip1}
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-sm mt-0.5">🍁</span>
                  <p className="text-xs text-[#6b6760] leading-relaxed">
                    {t.waitTip2}
                  </p>
                </div>
              </div>

              {!secondChance && allSwipedData.some(s => s.sentiment === 'pass') && (
                <button
                  onClick={handleSecondChance}
                  className="w-full max-w-[280px] bg-[#111] text-white text-sm font-medium py-3 rounded-2xl active:scale-[0.98] transition-transform"
                >
                  {t.seeAgain}
                </button>
              )}

              <p className="text-[10px] text-[#c5c0bb]">
                {t.poolRefresh}
              </p>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#111] text-white text-xs px-4 py-2.5 rounded-full shadow-lg animate-fade-in whitespace-nowrap">
          {toast}
        </div>
      )}

      {/* Blind Date Consent Modal */}
      {showBlindConsent && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowBlindConsent(false)} />
          <div className="relative w-full max-w-[420px] bg-[#111] rounded-t-3xl px-6 pt-6 pb-10 shadow-xl animate-fade-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-white">{t.blindCard}</h2>
              <button onClick={() => setShowBlindConsent(false)} className="text-[#6b6760] text-lg">✕</button>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-base mt-0.5">🎲</span>
                <p className="text-xs text-[#9b9590] leading-relaxed">
                  {t.consentB1pre}<strong className="text-white">{t.consentB1bold}</strong>{t.consentB1post}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-base mt-0.5">🤝</span>
                <p className="text-xs text-[#9b9590] leading-relaxed">
                  {t.consentB2pre}<strong className="text-white">{t.consentB2bold}</strong>{t.consentB2post}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-base mt-0.5">✨</span>
                <p className="text-xs text-[#9b9590] leading-relaxed">
                  {t.consentB3}
                </p>
              </div>
            </div>
            <button
              onClick={openBlindBox}
              disabled={blindBoxLoading}
              className="w-full py-3.5 bg-amber-400 text-[#111] text-sm font-semibold rounded-2xl disabled:opacity-40 active:scale-[0.98] transition-all"
            >
              {blindBoxLoading ? '···' : t.letsGo}
            </button>
            <button
              onClick={() => setShowBlindConsent(false)}
              className="w-full mt-3 py-2.5 text-xs text-[#6b6760] hover:text-white transition-colors"
            >
              {t.maybeLater}
            </button>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setReportTarget(null); setReportReason('') }} />
          <div className="relative w-full max-w-[420px] bg-white rounded-t-3xl px-5 pt-5 pb-10 shadow-xl animate-fade-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[#111]">{t.reportTitle}</h2>
              <button onClick={() => { setReportTarget(null); setReportReason('') }} className="text-[#9b9590] text-lg">✕</button>
            </div>
            <p className="text-xs text-[#9b9590] mb-4 leading-relaxed">
              {t.reportBody}
            </p>
            <div className="space-y-2 mb-5">
              {[
                { v: 'Inappropriate messages', l: t.rInappropriate },
                { v: 'Fake profile', l: t.rFake },
                { v: 'Harassment', l: t.rHarass },
                { v: 'Spam', l: t.rSpam },
                { v: 'Other', l: t.rOther },
              ].map(({ v, l }) => (
                <button
                  key={v}
                  onClick={() => setReportReason(v)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition-all ${
                    reportReason === v
                      ? 'border-[#111] bg-[#111] text-white font-medium'
                      : 'border-[#e8e6e1] text-[#6b6760] hover:border-[#111]'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <button
              onClick={submitReport}
              disabled={!reportReason || reportLoading}
              className="w-full py-3 bg-red-500 text-white text-sm font-medium rounded-xl disabled:opacity-40 active:scale-[0.98] transition-all"
            >
              {reportLoading ? '···' : t.submitReport}
            </button>
          </div>
        </div>
      )}

      {/* Privacy Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSettings(false)} />
          <div className="relative w-full max-w-[420px] bg-white rounded-t-3xl px-5 pt-5 pb-10 shadow-xl animate-fade-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[#111]">{t.privacy}</h2>
              <button onClick={() => setShowSettings(false)} className="text-[#9b9590] text-lg">✕</button>
            </div>

            <div className="space-y-4">
              {/* Geotracking */}
              <div className="flex items-start justify-between gap-4 py-3 border-b border-[#f0ede8]">
                <div>
                  <p className="text-sm font-medium text-[#111]">{t.locTrack}</p>
                  <p className="text-xs text-[#9b9590] mt-0.5 leading-relaxed">
                    {t.locTrackSub}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const next = !geotracking
                    setGeotracking(next)
                    await savePrivacySettings(next, agentEnabled)
                  }}
                  disabled={savingSettings}
                  className={`shrink-0 w-12 h-6 rounded-full transition-colors relative ${geotracking ? 'bg-[#111]' : 'bg-[#e8e6e1]'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${geotracking ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Agent search */}
              <div className="flex items-start justify-between gap-4 py-3 border-b border-[#f0ede8]">
                <div>
                  <p className="text-sm font-medium text-[#111]">{t.aiPlan}</p>
                  <p className="text-xs text-[#9b9590] mt-0.5 leading-relaxed">
                    {t.aiPlanSub}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const next = !agentEnabled
                    setAgentEnabled(next)
                    await savePrivacySettings(geotracking, next)
                  }}
                  disabled={savingSettings}
                  className={`shrink-0 w-12 h-6 rounded-full transition-colors relative ${agentEnabled ? 'bg-[#111]' : 'bg-[#e8e6e1]'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${agentEnabled ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Top spots */}
              <div className="py-3 border-b border-[#f0ede8]">
                <p className="text-sm font-medium text-[#111] mb-0.5">{t.topSpots}</p>
                <p className="text-xs text-[#9b9590] mb-3 leading-relaxed">
                  {t.topSpotsSub}
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Honnold Library', 'The Motley', 'Collins Dining', 'Frank Dining',
                    'Frary Dining', 'McConnell Center', 'The Coop', 'Broad Café',
                    'Claremont Village', 'North Quad', 'South Quad', 'Keck Science',
                    'Smith Campus Center', 'Pitzer Mounds', 'The Hive',
                  ].map(spot => {
                    const selected = topSpots.includes(spot)
                    return (
                      <button
                        key={spot}
                        onClick={() => {
                          const next = selected
                            ? topSpots.filter(s => s !== spot)
                            : topSpots.length < 3 ? [...topSpots, spot] : topSpots
                          saveTopSpots(next)
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                          selected
                            ? 'bg-[#111] text-white border-[#111]'
                            : 'border-[#e8e6e1] text-[#6b6760] hover:border-[#111]'
                        }`}
                      >
                        {spot}
                      </button>
                    )
                  })}
                </div>
                {topSpots.length > 0 && (
                  <p className="text-[10px] text-[#9b9590] mt-2">{topSpots.length}/3 {t.selectedSuffix}</p>
                )}
              </div>

              {/* Profile link + logout */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={() => { setShowSettings(false); router.push('/profile') }}
                  className="w-full text-xs text-[#9b9590] py-2 hover:text-[#111] transition-colors"
                >
                  {t.goProfile}
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 border border-[#e8e6e1] rounded-xl text-xs text-[#9b9590] hover:border-red-300 hover:text-red-400 transition-all active:scale-[0.98]"
                >
                  {t.logout}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function KnownCard({ card, swipeLoading, onSwipe, onReport, t }: {
  card: ClassmateOnMaple
  swipeLoading: string | null
  onSwipe: (s: Sentiment) => void
  onReport: () => void
  t: FeedT
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className="relative bg-white rounded-2xl border-2 border-[#111] p-4 shadow-sm">
      <button
        onClick={() => setMenuOpen(o => !o)}
        className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-[#c5c0bb] hover:bg-[#f0ede8] transition-all text-sm font-bold"
      >
        ···
      </button>
      {menuOpen && (
        <div className="absolute top-10 right-3 z-10 bg-white border border-[#e8e6e1] rounded-xl shadow-lg overflow-hidden min-w-[140px]">
          <button
            onClick={() => { onReport(); setMenuOpen(false) }}
            className="w-full text-left px-4 py-2.5 text-xs text-amber-600 hover:bg-amber-50 transition-colors"
          >
            {t.report}
          </button>
          <button
            onClick={() => { onSwipe('block'); setMenuOpen(false) }}
            disabled={swipeLoading !== null}
            className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40"
          >
            {t.block}
          </button>
        </div>
      )}
      {menuOpen && <div className="fixed inset-0 z-[9]" onClick={() => setMenuOpen(false)} />}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-base font-semibold shrink-0 ${nameColor(card.user.name)}`}>
          {card.user.name[0].toUpperCase()}
        </div>
        <div className="min-w-0 pr-6">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[#111]">{card.user.name}</p>
            <span className="text-[10px] bg-[#111] text-white px-1.5 py-0.5 rounded-full">{t.uKnowThem}</span>
          </div>
          <p className="text-xs text-[#9b9590]">
            {card.user.gender}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 bg-[#f0ede8] rounded-xl px-3 py-2 mb-4">
        <span className="text-xs">👋</span>
        <span className="text-xs text-[#6b6760]">{card.hint}</span>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSwipe('pass')} disabled={swipeLoading !== null}
          className="flex-1 py-2.5 rounded-xl border border-[#e8e6e1] text-xs font-medium text-[#9b9590] disabled:opacity-40 active:scale-95 transition-all">
          {swipeLoading === card.user.id + 'pass' ? '···' : t.cardPass}
        </button>
        <button onClick={() => onSwipe('like')} disabled={swipeLoading !== null}
          className="flex-1 py-2.5 rounded-xl bg-[#111] text-white text-xs font-medium disabled:opacity-40 active:scale-95 transition-all">
          {swipeLoading === card.user.id + 'like' ? '···' : t.cardShoot}
        </button>
      </div>
    </div>
  )
}

function AnonymousCard({ card, swipeLoading, onSwipe, onReport, t, lang }: {
  card: FeedCard
  swipeLoading: string | null
  onSwipe: (s: Sentiment) => void
  onReport: () => void
  t: FeedT
  lang: Lang
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className="relative bg-white rounded-2xl border border-[#e8e6e1] p-4 shadow-sm">
      <button
        onClick={() => setMenuOpen(o => !o)}
        className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-[#c5c0bb] hover:bg-[#f0ede8] transition-all text-sm font-bold"
      >
        ···
      </button>
      {menuOpen && (
        <div className="absolute top-10 right-3 z-10 bg-white border border-[#e8e6e1] rounded-xl shadow-lg overflow-hidden min-w-[140px]">
          <button
            onClick={() => { onReport(); setMenuOpen(false) }}
            className="w-full text-left px-4 py-2.5 text-xs text-amber-600 hover:bg-amber-50 transition-colors"
          >
            {t.report}
          </button>
          <button
            onClick={() => { onSwipe('block'); setMenuOpen(false) }}
            disabled={swipeLoading !== null}
            className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40"
          >
            {t.block}
          </button>
        </div>
      )}
      {menuOpen && <div className="fixed inset-0 z-[9]" onClick={() => setMenuOpen(false)} />}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-base font-semibold shrink-0 ${avatarColor(card.user.id)}`}>
          {card.user.name[0].toUpperCase()}
        </div>
        <div className="min-w-0 pr-6 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-medium text-[#111]">{card.user.name}</p>
            {card.school && (
              <span className="text-[10px] bg-[#f0ede8] text-[#6b6760] px-1.5 py-0.5 rounded-full font-medium">{localizeSchool(card.school, lang)}</span>
            )}
            {card.distanceKm !== undefined && card.distanceKm < 0.8 && (
              <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full font-medium">{t.nearby}</span>
            )}
          </div>
          <p className="text-xs text-[#9b9590]">{card.user.gender}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 bg-[#f8f7f4] rounded-xl px-3 py-2 mb-4">
        <span className="text-xs">✦</span>
        <span className="text-xs text-[#6b6760]">{card.hint}</span>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSwipe('pass')} disabled={swipeLoading !== null}
          className="flex-1 py-2.5 rounded-xl border border-[#e8e6e1] text-xs font-medium text-[#9b9590] disabled:opacity-40 active:scale-95 transition-all">
          {swipeLoading === card.user.id + 'pass' ? '···' : t.cardPass}
        </button>
        <button onClick={() => onSwipe('like')} disabled={swipeLoading !== null}
          className="flex-1 py-2.5 rounded-xl bg-[#111] text-white text-xs font-medium disabled:opacity-40 active:scale-95 transition-all">
          {swipeLoading === card.user.id + 'like' ? '···' : t.cardShoot}
        </button>
      </div>
    </div>
  )
}
