'use client'

import { useState } from 'react'

export default function SupportButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        title="Help & Support"
        className="fixed bottom-5 right-5 z-50 w-10 h-10 bg-white border border-[#e8e6e1] rounded-full shadow-md flex items-center justify-center text-sm font-medium text-[#6b6760] hover:border-[#111] transition-colors"
      >
        ?
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-[420px] bg-white rounded-t-3xl px-6 pt-6 pb-10 shadow-xl">

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[#111]">Help & Support</h2>
              <button onClick={() => setOpen(false)} className="text-[#9b9590] text-lg leading-none">✕</button>
            </div>

            <div className="flex flex-col items-center text-center gap-4 py-4">
              <img src="/maple-logo.svg" alt="Maple" className="w-16 h-16 object-contain" />
              <div>
                <p className="text-sm font-medium text-[#111] mb-1">Got a question or issue?</p>
                <p className="text-xs text-[#9b9590] leading-relaxed">
                  We're here to help. Shoot us an email and we'll get back to you as soon as possible.
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
