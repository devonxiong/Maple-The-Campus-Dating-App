'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/i18n'
import MapleEyes from '../components/MapleEyes'
import HandIcon, { IconName } from '../components/HandIcon'

const TILES: { key: string; en: string; zh: string; icon: IconName; bg: string; ink: string; href: string; wide?: boolean }[] = [
  { key: 'mh', en: 'Mental Health', zh: '心理健康', icon: 'brain', bg: '#F2C744', ink: '#2b2410', href: 'https://services.claremont.edu/mcaps/' },
  { key: 'ss', en: 'Safe Sex', zh: '安全性行为', icon: 'lifebuoy', bg: '#5FB6E6', ink: '#0c2a3a', href: 'https://www.plannedparenthood.org/learn/birth-control' },
  { key: 'cn', en: 'Consent', zh: '关于同意', icon: 'handshake', bg: '#8FC98F', ink: '#12300f', href: 'https://www.rainn.org/articles/what-is-consent' },
  { key: 'sb', en: 'Substances', zh: '药物与安全', icon: 'cup', bg: '#E8A868', ink: '#2b2410', href: 'https://www.samhsa.gov/find-help/national-helpline' },
  { key: 'all', en: 'Everything else', zh: '更多资源', icon: 'sparkle', bg: '#EBD98A', ink: '#2b2410', href: 'https://services.claremont.edu/empower/', wide: true },
]

export default function ResourcesPage() {
  const router = useRouter()
  const [lang] = useLang()
  const zh = lang === 'zh'

  useEffect(() => { if (localStorage.getItem('maple_dark') === 'true') document.documentElement.classList.add('dark') }, [])

  return (
    <main className="app">
      <section className="screen feed" style={{ position: 'relative', minHeight: '100vh' }}>
        <header className="feed-top">
          <button className="back" onClick={() => router.push('/date')}>{zh ? '← 返回' : '← back'}</button>
          <MapleEyes width={42} strokeWidth={6} />
        </header>

        <div className="feed-scroll" style={{ paddingBottom: '2rem' }}>
          <div className="page-hero">
            <span style={{ color: 'var(--foreground)' }}><HandIcon name="toolbox" size={30} /></span>
            <h2>{zh ? '约会资源' : 'Dating Resources'}</h2>
            <p>{zh ? '你的知识库 —— 没人告诉你的那些事，都在一处。' : 'Your knowledge hub — the stuff no one tells you, in one place.'}</p>
          </div>

          <div className="res-grid">
            {TILES.map(tile => (
              <a key={tile.key} className={`res-tile${tile.wide ? ' wide' : ''}`} href={tile.href} target="_blank" rel="noopener noreferrer"
                style={{ background: tile.bg, color: tile.ink, textDecoration: 'none' }}>
                <span className="rt-ico" style={{ display: 'inline-flex' }}><HandIcon name={tile.icon} size={22} /></span>
                {zh ? tile.zh : tile.en}
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
