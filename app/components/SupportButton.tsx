'use client'

import { useState } from 'react'
import MapleEyes from './MapleEyes'

export default function SupportButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Trigger — sits ABOVE the bottom tab bar so it never covers the nav */}
      <button
        onClick={() => setOpen(true)}
        title="Help & Support"
        className="fixed right-4 bottom-[5.25rem] z-40 w-9 h-9 bg-white border border-[#e8e6e1] rounded-full shadow-md flex items-center justify-center text-sm font-medium text-[#6b6760] hover:border-[#111] transition-colors"
      >
        ?
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-[420px] bg-white rounded-t-3xl px-6 pt-6 pb-10 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[#111] font-display">Help &amp; Support</h2>
              <button onClick={() => setOpen(false)} className="text-[#9b9590] text-lg leading-none">✕</button>
            </div>

            <div className="flex flex-col items-center text-center gap-4 py-4">
              <MapleEyes width={120} strokeWidth={4} />
              <div>
                <p className="text-sm font-medium text-[#111] mb-1">Got a question or issue?</p>
                <p className="text-xs text-[#9b9590] leading-relaxed">
                  We&apos;re here to help. Shoot us an email and we&apos;ll get back to you as soon as possible.
                </p>
              </div>

              <a
                href="mailto:hello@maplemeet.ai"
                className="w-full bg-[#111] text-white rounded-xl py-3 text-sm font-medium active:scale-[0.98] transition-transform"
              >
                Email hello@maplemeet.ai
              </a>

              <p className="text-[10px] text-[#c5c0bb]">we usually respond within 24 hours</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
