'use client'

import { Lang } from '@/lib/i18n'

export default function LangToggle({ lang, onToggle, className = '' }: {
  lang: Lang
  onToggle: () => void
  className?: string
}) {
  return (
    <button
      onClick={onToggle}
      title="Switch language"
      className={`inline-flex items-center gap-1 h-8 px-3 rounded-full border border-[#e8e6e1] bg-white/70 text-xs font-medium text-[#6b6760] hover:border-[#111] hover:text-[#111] transition-colors whitespace-nowrap leading-none ${className}`}
    >
      <span className="text-[13px]">🌐</span>
      {lang === 'en' ? '中文' : 'EN'}
    </button>
  )
}
