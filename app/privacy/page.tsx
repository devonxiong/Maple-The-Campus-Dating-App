'use client'

import { useLang, PRIVACY } from '@/lib/i18n'
import LangToggle from '../components/LangToggle'

export default function PrivacyPage() {
  const [lang, toggleLang] = useLang()
  const t = PRIVACY[lang]
  return (
    <main className="min-h-screen bg-[#f8f7f4] px-5 py-16">
      <div className="max-w-[680px] mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍁</span>
            <span className="text-xl font-semibold text-[#111]">Maple</span>
          </div>
          <LangToggle lang={lang} onToggle={toggleLang} />
        </div>

        <h1 className="text-3xl font-semibold text-[#111] mb-2">{t.title}</h1>
        <p className="text-sm text-[#9b9590] mb-10">{t.updated}</p>

        <div className="space-y-8 text-sm text-[#3d3a36] leading-relaxed">
          {t.sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-base font-semibold text-[#111] mb-2">{s.h}</h2>
              {s.body && <p>{s.body}</p>}
              {s.list && (
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  {s.list.map((li, j) => <li key={j}>{li}</li>)}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-[#e8e6e1]">
          <a href="/" className="text-sm text-[#9b9590] hover:text-[#111] transition-colors">{t.back}</a>
        </div>
      </div>
    </main>
  )
}
