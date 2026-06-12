'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useLang, VERIFY } from '@/lib/i18n'
import LangToggle from '../components/LangToggle'

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [lang, toggleLang] = useLang()
  const t = VERIFY[lang]

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) { setStatus('error'); return }

    fetch(`/api/verify-email?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          localStorage.setItem('anlan_user_id', data.userId)
          localStorage.setItem('anlan_user_name', data.name)
          setStatus('success')
          setTimeout(() => router.push('/feed'), 1500)
        } else {
          setStatus('error')
        }
      })
      .catch(() => setStatus('error'))
  }, [searchParams, router])

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-5 bg-[#f8f7f4]">
      <LangToggle lang={lang} onToggle={toggleLang} className="absolute top-5 right-5" />
      <div className="text-center max-w-[300px]">
        {status === 'loading' && (
          <>
            <div className="w-10 h-10 rounded-full border-2 border-[#111] border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-sm text-[#6b6760]">{t.verifying}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">🍁</div>
            <h1 className="text-xl font-semibold text-[#111] mb-2">{t.youreIn}</h1>
            <p className="text-sm text-[#9b9590]">{t.takingFeed}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">😬</div>
            <h1 className="text-xl font-semibold text-[#111] mb-2">{t.expired}</h1>
            <p className="text-sm text-[#9b9590] mb-6">{t.invalid}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-[#111] text-white text-sm px-6 py-3 rounded-xl font-medium"
            >
              {t.backSignup}
            </button>
          </>
        )}
      </div>
    </main>
  )
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  )
}
