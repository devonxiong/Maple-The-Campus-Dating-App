'use client'

/**
 * Hand-drawn, single-stroke line icons — a de-emoji'd icon set that matches the
 * doodle aesthetic (the eyes / martini-doodle look). Everything is stroke-based
 * and uses currentColor, so icons theme with the surrounding text.
 */
export type IconName =
  | 'gradcap' | 'person' | 'scroll' | 'envelope' | 'pin' | 'lock'
  | 'heart' | 'eye' | 'sparkle' | 'wave' | 'gift' | 'shield' | 'toolbox'
  | 'bell' | 'gear' | 'globe' | 'moon' | 'sun' | 'plus' | 'check' | 'handshake'
  | 'close' | 'chevron' | 'logout' | 'trash' | 'seeNoEvil' | 'chat' | 'grad'
  | 'calendar' | 'robot' | 'quote'
  | 'phone' | 'flag' | 'siren' | 'idcard' | 'brain' | 'lifebuoy' | 'cup' | 'share'

const P: Record<IconName, React.ReactNode> = {
  gradcap: (
    <>
      <path d="M12 4.2 L21.5 8.3 L12 12.6 L2.5 8.3 Z" />
      <path d="M6 10.2 V14.8 C6 16.5 18 16.5 18 14.8 V10.2" />
      <path d="M21.5 8.3 V13.2" />
      <circle cx="21.5" cy="14" r="0.9" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8" r="3.9" />
      <path d="M4.8 20 C4.8 15.6 8.2 13.6 12 13.6 C15.8 13.6 19.2 15.6 19.2 20" />
    </>
  ),
  scroll: (
    <>
      <path d="M7 4.5 H15.6 L18.5 8.2 V18.6 C18.5 19.6 17.7 20.2 16.8 20.2 H7.2 C6.3 20.2 5.5 19.6 5.5 18.6 V6.1 C5.5 5.1 6.2 4.5 7 4.5 Z" />
      <path d="M15.4 4.6 V8.2 H18.4" />
      <path d="M8.4 12 H15 M8.4 15 H15" />
    </>
  ),
  envelope: (
    <>
      <rect x="3" y="5.8" width="18" height="12.4" rx="2.4" />
      <path d="M4.2 7.2 L12 13 L19.8 7.2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 20.8 C12 20.8 5.2 14.4 5.2 9.6 A6.8 6.8 0 0 1 18.8 9.6 C18.8 14.4 12 20.8 12 20.8 Z" />
      <circle cx="12" cy="9.6" r="2.5" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.2" />
      <path d="M8 10.5 V7.6 A4 4 0 0 1 16 7.6 V10.5" />
      <path d="M12 14.2 V16.4" />
    </>
  ),
  heart: <path d="M12 20 C12 20 3.6 14.5 3.6 8.9 C3.6 6.1 5.8 4.1 8.3 4.1 C10 4.1 11.4 5.1 12 6.4 C12.6 5.1 14 4.1 15.7 4.1 C18.2 4.1 20.4 6.1 20.4 8.9 C20.4 14.5 12 20 12 20 Z" />,
  eye: (
    <>
      <path d="M2.5 12 C5 7.6 9 5.6 12 5.6 C15 5.6 19 7.6 21.5 12 C19 16.4 15 18.4 12 18.4 C9 18.4 5 16.4 2.5 12 Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.5 C12.5 8 13.8 9.5 18 10 C13.8 10.5 12.5 12 12 16.5 C11.5 12 10.2 10.5 6 10 C10.2 9.5 11.5 8 12 3.5 Z" />
      <path d="M18.5 15 C18.7 17 19.2 17.6 21 18 C19.2 18.4 18.7 19 18.5 21 C18.3 19 17.8 18.4 16 18 C17.8 17.6 18.3 17 18.5 15 Z" />
    </>
  ),
  wave: (
    <>
      <path d="M7 12.5 V7.2 A1.3 1.3 0 0 1 9.6 7.2 V11.5" />
      <path d="M9.6 11 V6 A1.3 1.3 0 0 1 12.2 6 V11.5" />
      <path d="M12.2 11 V6.6 A1.3 1.3 0 0 1 14.8 6.6 V12" />
      <path d="M14.8 11.5 V8.8 A1.3 1.3 0 0 1 17.4 8.8 V13.5 C17.4 17.5 14.8 20 11.5 20 C8.8 20 7 18.6 6 16.5 L4.6 13.6 A1.3 1.3 0 0 1 6.9 12.4 L7.8 14" />
    </>
  ),
  gift: (
    <>
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="1.6" />
      <path d="M3.5 7.5 H20.5 V10.5 H3.5 Z" />
      <path d="M12 7.5 V20" />
      <path d="M12 7.5 C12 5 10.5 4 9 4.6 C7.6 5.2 8.4 7.2 12 7.5 C15.6 7.2 16.4 5.2 15 4.6 C13.5 4 12 5 12 7.5 Z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.8 L19 6.4 V11 C19 15.8 16 19 12 20.6 C8 19 5 15.8 5 11 V6.4 Z" />
      <path d="M9.2 11.8 L11.2 13.8 L15 9.6" />
    </>
  ),
  toolbox: (
    <>
      <rect x="3.5" y="8.5" width="17" height="10.5" rx="1.8" />
      <path d="M8.5 8.5 V6.8 A1.6 1.6 0 0 1 10.1 5.2 H13.9 A1.6 1.6 0 0 1 15.5 6.8 V8.5" />
      <path d="M3.5 12.5 H20.5 M10.5 12.5 V14.5 H13.5 V12.5" />
    </>
  ),
  bell: (
    <>
      <path d="M6.5 17 C6 17 6 16 6.6 15.3 C7.4 14.3 7.8 13.3 7.8 11.5 C7.8 8.3 9.6 6 12 6 C14.4 6 16.2 8.3 16.2 11.5 C16.2 13.3 16.6 14.3 17.4 15.3 C18 16 18 17 17.5 17 Z" />
      <path d="M12 6 V4.4" />
      <path d="M10.4 19.4 A2 2 0 0 0 13.6 19.4" />
    </>
  ),
  gear: (
    <>
      <path d="M4 7.5 H20 M4 12 H20 M4 16.5 H20" />
      <circle cx="9" cy="7.5" r="2.1" fill="var(--card)" />
      <circle cx="15" cy="12" r="2.1" fill="var(--card)" />
      <circle cx="9" cy="16.5" r="2.1" fill="var(--card)" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M3.6 12 H20.4 M12 3.6 C14.5 6 15.5 9 15.5 12 C15.5 15 14.5 18 12 20.4 C9.5 18 8.5 15 8.5 12 C8.5 9 9.5 6 12 3.6 Z" />
    </>
  ),
  moon: <path d="M20 14.5 A8.2 8.2 0 0 1 9.6 4.2 A8.4 8.4 0 1 0 20 14.5 Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.6 V4.8 M12 19.2 V21.4 M21.4 12 H19.2 M4.8 12 H2.6 M18.7 5.3 L17.1 6.9 M6.9 17.1 L5.3 18.7 M18.7 18.7 L17.1 17.1 M6.9 6.9 L5.3 5.3" />
    </>
  ),
  plus: <path d="M12 5.5 V18.5 M5.5 12 H18.5" />,
  check: <path d="M5 12.5 L10 17.5 L19 6.5" />,
  handshake: (
    <>
      <path d="M3 9 L7 8 L11.5 11 C12.2 11.6 12 12.8 11 12.8 C10.4 12.8 9.6 12.2 9 11.6" />
      <path d="M21 9 L17 8 L13.5 10.5" />
      <path d="M7 8 V15 M17 8 V15" />
      <path d="M11 12.6 L13.5 15 C14.2 15.6 15.2 15.4 15.6 14.6 L17 12" />
    </>
  ),
  close: <path d="M6.5 6.5 L17.5 17.5 M17.5 6.5 L6.5 17.5" />,
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="15" rx="2.2" />
      <path d="M4 9.5 H20 M8 3.5 V7 M16 3.5 V7" />
    </>
  ),
  robot: (
    <>
      <rect x="5" y="8" width="14" height="11" rx="2.4" />
      <path d="M12 8 V4.8 M12 4.8 A1.2 1.2 0 1 0 12 4.79" />
      <circle cx="9.3" cy="13" r="1.2" /><circle cx="14.7" cy="13" r="1.2" />
      <path d="M3.5 12 V15 M20.5 12 V15" />
    </>
  ),
  quote: (
    <>
      <path d="M6 15 C4.5 15 4 13.8 4 12.5 C4 10 6 8.5 8.5 8.5 M8.5 8.5 C8 10 7.5 11 7.5 12.5 C7.5 14 6.8 15 6 15 Z" />
      <path d="M15 15 C13.5 15 13 13.8 13 12.5 C13 10 15 8.5 17.5 8.5 M17.5 8.5 C17 10 16.5 11 16.5 12.5 C16.5 14 15.8 15 15 15 Z" />
    </>
  ),
  chevron: <path d="M9.5 5.5 L16 12 L9.5 18.5" />,
  logout: (
    <>
      <path d="M14 4.5 H6.5 A1.6 1.6 0 0 0 5 6.1 V17.9 A1.6 1.6 0 0 0 6.5 19.5 H14" />
      <path d="M14.5 12 H21 M18 8.5 L21.5 12 L18 15.5" />
    </>
  ),
  trash: (
    <>
      <path d="M5 7 H19 M9 7 V5.4 A1.2 1.2 0 0 1 10.2 4.2 H13.8 A1.2 1.2 0 0 1 15 5.4 V7" />
      <path d="M6.6 7 L7.4 18.6 A1.5 1.5 0 0 0 8.9 20 H15.1 A1.5 1.5 0 0 0 16.6 18.6 L17.4 7" />
      <path d="M10 10.5 V16.5 M14 10.5 V16.5" />
    </>
  ),
  seeNoEvil: (
    <>
      <path d="M2.6 12.4 C5.2 8.4 9 6.6 12 6.6 C15 6.6 18.8 8.4 21.4 12.4" />
      <path d="M6 12.5 L4 14 M18 12.5 L20 14 M9 14.4 L8.2 16.6 M15 14.4 L15.8 16.6 M12 15 V17.3" />
    </>
  ),
  chat: <path d="M4.5 6.2 A1.7 1.7 0 0 1 6.2 4.5 H17.8 A1.7 1.7 0 0 1 19.5 6.2 V14 A1.7 1.7 0 0 1 17.8 15.7 H9.5 L5.5 19.2 V15.7 H6.2 A1.7 1.7 0 0 1 4.5 14 Z" />,
  grad: (
    <>
      <path d="M12 4.2 L21.5 8.3 L12 12.6 L2.5 8.3 Z" />
      <path d="M6 10.2 V14.8 C6 16.5 18 16.5 18 14.8 V10.2" />
    </>
  ),
  phone: <path d="M6.5 4 C5.5 4 4.5 4.8 4.4 6 C4 12 9.5 19 16 19.6 C17.2 19.7 18 18.7 18 17.7 L18 15.2 C18 14.4 17.4 13.8 16.6 13.7 L14.4 13.4 C13.9 13.3 13.4 13.5 13.1 13.9 L12.2 15 C10.2 13.9 8.6 12.3 7.6 10.3 L8.7 9.4 C9.1 9.1 9.3 8.6 9.2 8.1 L8.9 5.9 C8.8 5.1 8.1 4.5 7.3 4.5 Z" />,
  flag: (
    <>
      <path d="M6 20 V4" />
      <path d="M6 5 C10 2.5 14 7.5 18 5 V13 C14 15.5 10 10.5 6 13" />
    </>
  ),
  siren: (
    <>
      <path d="M6 18 V13 A6 6 0 0 1 18 13 V18 Z" />
      <path d="M4.5 18 H19.5" />
      <path d="M12 4.5 V6.5 M20 8 L18.4 9 M4 8 L5.6 9" />
    </>
  ),
  idcard: (
    <>
      <rect x="3.5" y="6" width="17" height="12" rx="2" />
      <circle cx="8.5" cy="11" r="2" />
      <path d="M5.5 15.5 C5.5 13.8 11.5 13.8 11.5 15.5" />
      <path d="M14 10 H18 M14 13 H18" />
    </>
  ),
  brain: (
    <>
      <path d="M9.5 5 A2.4 2.4 0 0 0 6.2 6.6 A2.3 2.3 0 0 0 4.4 9.6 A2.4 2.4 0 0 0 4.4 13.8 A2.3 2.3 0 0 0 6.6 16.6 A2.4 2.4 0 0 0 9.5 18 V5 Z" />
      <path d="M14.5 5 A2.4 2.4 0 0 1 17.8 6.6 A2.3 2.3 0 0 1 19.6 9.6 A2.4 2.4 0 0 1 19.6 13.8 A2.3 2.3 0 0 1 17.4 16.6 A2.4 2.4 0 0 1 14.5 18 V5 Z" />
      <path d="M12 5 V18" />
    </>
  ),
  lifebuoy: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <circle cx="12" cy="12" r="3.4" />
      <path d="M9.6 9.6 L6 6 M14.4 9.6 L18 6 M9.6 14.4 L6 18 M14.4 14.4 L18 18" />
    </>
  ),
  cup: (
    <>
      <path d="M5.5 7 H16.5 V13 A4.5 4.5 0 0 1 12 17.5 H10 A4.5 4.5 0 0 1 5.5 13 Z" />
      <path d="M16.5 8.5 H18.5 A2 2 0 0 1 18.5 12.5 H16.5" />
      <path d="M6 20 H16" />
    </>
  ),
  share: (
    <>
      <circle cx="6" cy="12" r="2.4" /><circle cx="17.5" cy="6" r="2.4" /><circle cx="17.5" cy="18" r="2.4" />
      <path d="M8.1 10.9 L15.4 7.1 M8.1 13.1 L15.4 16.9" />
    </>
  ),
}

export default function HandIcon({
  name,
  size = 24,
  strokeWidth = 1.7,
  className = '',
  style,
}: {
  name: IconName
  size?: number
  strokeWidth?: number
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {P[name]}
    </svg>
  )
}
