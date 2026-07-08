'use client'

import { useRef } from 'react'

/**
 * The Maple eyes logo — two blinking, looking-around eyes.
 * Tap to make them blink once. Colors follow the CSS palette
 * (var(--card) / var(--foreground)) so it themes automatically.
 */
export default function MapleEyes({
  width = 182,
  strokeWidth = 4,
  className = '',
  tap = true,
}: {
  width?: number
  strokeWidth?: number
  className?: string
  tap?: boolean
}) {
  const ref = useRef<SVGSVGElement>(null)

  function blinkOnce(e: React.MouseEvent) {
    if (!tap) return
    e.stopPropagation()
    ref.current?.querySelectorAll<SVGGElement>('.maple-eye-lid').forEach((g) => {
      g.classList.remove('blink-now')
      void g.getBoundingClientRect()
      g.classList.add('blink-now')
      g.addEventListener('animationend', () => g.classList.remove('blink-now'), { once: true })
    })
  }

  return (
    <svg
      ref={ref}
      viewBox="0 0 190 100"
      width={width}
      className={`${tap ? 'eye-tap ' : ''}${className}`}
      aria-label="Maple"
      onClick={blinkOnce}
    >
      <g className="maple-eye-lid" style={{ transformOrigin: '52px 50px' }}>
        <circle cx="52" cy="50" r="38" fill="var(--card)" stroke="var(--foreground)" strokeWidth={strokeWidth} />
        <g className="maple-eye-iris">
          <circle cx="52" cy="50" r="16" fill="var(--foreground)" />
          <circle cx="47" cy="45" r="5" fill="var(--card)" />
        </g>
      </g>
      <g className="maple-eye-lid" style={{ transformOrigin: '138px 50px' }}>
        <circle cx="138" cy="50" r="38" fill="var(--card)" stroke="var(--foreground)" strokeWidth={strokeWidth} />
        <g className="maple-eye-iris">
          <circle cx="138" cy="50" r="16" fill="var(--foreground)" />
          <circle cx="133" cy="45" r="5" fill="var(--card)" />
        </g>
      </g>
    </svg>
  )
}

/** Sad / crying eyes — looking down, with a tear falling from each. */
export function MapleEyesCrying({ width = 150 }: { width?: number }) {
  return (
    <svg viewBox="0 0 190 128" width={width} aria-label="crying" fill="none">
      {/* sad brows */}
      <path d="M30 18 L66 30" stroke="var(--foreground)" strokeWidth="4" strokeLinecap="round" />
      <path d="M160 18 L124 30" stroke="var(--foreground)" strokeWidth="4" strokeLinecap="round" />
      {/* left eye */}
      <circle cx="52" cy="52" r="38" fill="var(--card)" stroke="var(--foreground)" strokeWidth="4" />
      <g>
        <circle cx="52" cy="64" r="15" fill="var(--foreground)" />
        <circle cx="47" cy="59" r="4.5" fill="var(--card)" />
      </g>
      {/* right eye */}
      <circle cx="138" cy="52" r="38" fill="var(--card)" stroke="var(--foreground)" strokeWidth="4" />
      <g>
        <circle cx="138" cy="64" r="15" fill="var(--foreground)" />
        <circle cx="133" cy="59" r="4.5" fill="var(--card)" />
      </g>
      {/* tears */}
      <path d="M40 92 C 47 100, 47 110, 40 112 C 33 110, 33 100, 40 92 Z" fill="#79b6e8">
        <animate attributeName="opacity" values="0;1;1;0" dur="1.8s" repeatCount="indefinite" />
        <animateTransform attributeName="transform" type="translate" values="0 -6; 0 10" dur="1.8s" repeatCount="indefinite" />
      </path>
      <path d="M150 92 C 157 100, 157 110, 150 112 C 143 110, 143 100, 150 92 Z" fill="#79b6e8">
        <animate attributeName="opacity" values="0;1;1;0" dur="1.8s" begin="0.6s" repeatCount="indefinite" />
        <animateTransform attributeName="transform" type="translate" values="0 -6; 0 12" dur="1.8s" begin="0.6s" repeatCount="indefinite" />
      </path>
    </svg>
  )
}

/** The little hand-drawn doodle line under the splash (martini + mountains). */
export function MapleDoodles() {
  return (
    <svg
      viewBox="0 0 320 92"
      className="maple-doodles"
      fill="none"
      stroke="var(--muted)"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 64 C 74 57, 132 69, 190 62 S 296 68, 308 60" opacity="0.7" />
      <g opacity="0.85">
        <path d="M50 30 L72 52 L94 30" />
        <path d="M47 30 L97 30" />
        <path d="M72 52 L72 63" />
        <path d="M63 64 C 67 60, 77 60, 81 64" />
        <path d="M72 30 L78 21" />
        <circle cx="79" cy="20" r="2.4" fill="var(--muted)" stroke="none" />
      </g>
      <g opacity="0.85">
        <circle cx="210" cy="43" r="6" />
        <path d="M200 62 L213 48 L240 61 L250 50 L264 61" />
      </g>
    </svg>
  )
}

/** The little envelope glyph used for the invite button. */
export function MapleEnvelope({ width = 30, strokeWidth = 6 }: { width?: number; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 140 108" width={width} aria-hidden="true">
      <rect x="10" y="24" width="120" height="76" rx="12" fill="#F2C230" stroke="#D9A400" strokeWidth={strokeWidth} />
      <path d="M14 32 L70 72 L126 32" fill="none" stroke="#D9A400" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
