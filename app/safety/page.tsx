'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/i18n'
import MapleEyes from '../components/MapleEyes'
import HandIcon, { IconName } from '../components/HandIcon'

export default function SafetyPage() {
  const router = useRouter()
  const [lang] = useLang()
  const [toast, setToast] = useState('')
  const [sharing, setSharing] = useState(false)
  const zh = lang === 'zh'

  useEffect(() => { if (localStorage.getItem('maple_dark') === 'true') document.documentElement.classList.add('dark') }, [])
  function showToast(m: string) { setToast(m); setTimeout(() => setToast(''), 2400) }

  async function shareLocation() {
    if (!navigator.geolocation) { showToast(zh ? '此设备不支持定位' : 'Location not available'); return }
    setSharing(true)
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude, lng = pos.coords.longitude
      let url = `https://maps.google.com/?q=${lat},${lng}`
      try {
        const r = await fetch('/api/share-location', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: localStorage.getItem('anlan_user_id'), lat, lng }),
        })
        const j = await r.json()
        if (j.url) url = j.url
      } catch { /* keep maps fallback */ }
      setSharing(false)
      const shareData = { title: 'My live location', text: zh ? '这是我现在的位置' : "Here's where I am right now", url }
      if (navigator.share) { try { await navigator.share(shareData) } catch { /* cancelled */ } }
      else { try { await navigator.clipboard.writeText(url); showToast(zh ? '链接已复制' : 'Link copied to clipboard') } catch { showToast(url) } }
    }, () => { setSharing(false); showToast(zh ? '定位权限被拒绝' : 'Location permission denied') }, { enableHighAccuracy: true, timeout: 10000 })
  }

  const Row = ({ icon, title, sub, onClick }: { icon: IconName; title: string; sub: string; onClick: () => void }) => (
    <div className="safe-row" onClick={onClick}>
      <span className="safe-ico"><HandIcon name={icon} size={22} /></span>
      <div className="safe-main"><strong>{title}</strong><span className="sub">{sub}</span></div>
      <span className="chev"><HandIcon name="chevron" size={16} /></span>
    </div>
  )

  return (
    <main className="app">
      <section className="screen feed" style={{ position: 'relative', minHeight: '100vh' }}>
        <header className="feed-top">
          <button className="back" onClick={() => router.push('/date')}>{zh ? '← 返回' : '← back'}</button>
          <MapleEyes width={42} strokeWidth={6} />
        </header>

        <div className="feed-scroll" style={{ paddingBottom: '2rem' }}>
          <div className="page-hero">
            <span style={{ color: 'var(--danger)' }}><HandIcon name="shield" size={30} /></span>
            <h2>{zh ? '约会安全' : 'Dating Safety'}</h2>
            <p>{zh ? '在公共场合见面、告诉朋友、相信直觉。需要帮助时，这里有。' : "Meet in public, tell a friend, trust your gut. Here's help if you need it."}</p>
          </div>

          <Row icon="phone" title={zh ? '求助热线' : 'Help hotline'} sub={zh ? '24/7 保密支持热线（988）' : '24/7 confidential support line (988)'}
            onClick={() => { window.location.href = 'tel:988' }} />
          <Row icon="idcard" title={zh ? '紧急联系人' : 'Emergency contact'} sub={zh ? '设置需要时 Maple 通知谁' : 'Pick who Maple alerts if you need it'}
            onClick={() => showToast(zh ? '即将上线' : 'Coming soon')} />
          <Row icon="siren" title={zh ? '校园安保' : 'Campus safety'} sub={zh ? '克莱蒙特联盟校园安保' : 'Claremont Colleges Campus Safety'}
            onClick={() => { window.location.href = 'tel:+19096072000' }} />
          <Row icon="flag" title={zh ? '举报某人' : 'Report someone'} sub={zh ? '举报资料或对话（在对方卡片的 ··· 菜单）' : "Flag a profile — from their card's ··· menu"}
            onClick={() => router.push('/feed')} />

          <div className="sos">
            <button className="btn btn-sos" onClick={shareLocation} disabled={sharing}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem' }}>
              <HandIcon name="share" size={16} />
              {sharing ? (zh ? '获取位置中…' : 'Getting location…') : (zh ? '分享我的实时位置' : 'Share my live location')}
            </button>
          </div>
        </div>
      </section>
      {toast && <div className="feed-toast">{toast}</div>}
    </main>
  )
}
