'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@/types'
import { schoolFromEmail } from '@/lib/score'
import { useLang, PROFILE, localizeSchool } from '@/lib/i18n'
import LangToggle from '../components/LangToggle'

const COLORS = [
  'bg-rose-50 text-rose-500', 'bg-sky-50 text-sky-500',
  'bg-emerald-50 text-emerald-500', 'bg-amber-50 text-amber-500',
  'bg-violet-50 text-violet-500', 'bg-teal-50 text-teal-500',
]
function avatarColor(id: string) {
  const n = id.charCodeAt(0) + id.charCodeAt(id.length - 1)
  return COLORS[n % COLORS.length]
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
  const [lang, toggleLang] = useLang()
  const t = PROFILE[lang]

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  useEffect(() => {
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

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (!file.type.startsWith('image/')) { showToast(t.tSelectImage); return }
    if (file.size > 5 * 1024 * 1024) { showToast(t.tTooLarge); return }

    setUploading(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${user.id}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadErr) { showToast(t.tUploadFail); console.error(uploadErr); return }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id)
      setAvatarUrl(publicUrl)
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

  return (
    <main className="min-h-screen bg-[#f8f7f4]">
      <div className="max-w-[420px] mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          {isSetup ? (
            <div>
              <h1 className="text-lg font-semibold text-[#111]">{t.setupTitle}</h1>
              <p className="text-xs text-[#9b9590]">{t.setupSub}</p>
            </div>
          ) : (
            <button
              onClick={() => router.push('/feed')}
              className="text-sm text-[#9b9590] hover:text-[#111] transition-colors"
            >
              {t.back}
            </button>
          )}
          <LangToggle lang={lang} onToggle={toggleLang} />
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-md"
              />
            ) : (
              <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-semibold ${avatarColor(user.id)}`}>
                {user.name[0].toUpperCase()}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-[#111] rounded-full flex items-center justify-center shadow-md disabled:opacity-50 active:scale-95 transition-all"
            >
              {uploading
                ? <div className="w-3.5 h-3.5 rounded-full border border-white border-t-transparent animate-spin" />
                : <span className="text-sm">📷</span>
              }
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
          <p className="text-base font-semibold text-[#111]">{user.name}</p>
          <p className="text-xs text-[#9b9590] mt-0.5">{localizeSchool(school, lang)} · {user.gender}</p>
        </div>

        {isSetup ? (
          /* ── Setup mode: just photo upload + continue ── */
          <div className="space-y-3">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full py-3.5 bg-[#111] text-white text-sm font-medium rounded-2xl disabled:opacity-40 active:scale-[0.98] transition-all"
            >
              {uploading ? t.uploading : avatarUrl ? t.changePhoto : t.addPhoto}
            </button>
            <button
              onClick={() => router.push('/feed')}
              className="w-full py-3 text-sm text-[#9b9590] hover:text-[#111] transition-colors"
            >
              {avatarUrl ? t.looksGood : t.skip}
            </button>
          </div>
        ) : (
          /* ── Full profile view ── */
          <div className="space-y-3">

            <div className="bg-white border border-[#e8e6e1] rounded-2xl divide-y divide-[#f0ede8]">
              <ProfileRow label={t.email} value={user.email} />
              <ProfileRow label={t.gender} value={user.gender} />
              <ProfileRow
                label={t.lookingFor}
                value={Array.isArray(user.want_to_date)
                  ? user.want_to_date.join(', ')
                  : (user.want_to_date ?? '—')}
              />
              {user.top_spots && user.top_spots.length > 0 && (
                <ProfileRow label={t.spots} value={user.top_spots.join(', ')} />
              )}
            </div>

            {/* Logout */}
            <div className="pt-2">
              <button
                onClick={handleLogout}
                className="w-full py-3 border border-[#e8e6e1] rounded-2xl text-sm text-[#9b9590] hover:border-red-300 hover:text-red-400 transition-all active:scale-[0.98]"
              >
                {t.logout}
              </button>
            </div>

          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#111] text-white text-xs px-4 py-2.5 rounded-full shadow-lg whitespace-nowrap animate-fade-in">
          {toast}
        </div>
      )}
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

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3 flex items-center justify-between gap-4">
      <span className="text-xs text-[#9b9590] shrink-0">{label}</span>
      <span className="text-xs font-medium text-[#111] text-right truncate">{value}</span>
    </div>
  )
}
