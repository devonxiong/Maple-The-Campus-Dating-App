'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import MapleEyes from '../../components/MapleEyes'

export default function LocationPage() {
  const params = useParams()
  const id = params?.id as string
  const [loc, setLoc] = useState<{ lat: number; lng: number; created_at?: string } | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/share-location?id=${id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setLoc(d))
      .catch(() => setNotFound(true))
  }, [id])

  return (
    <main className="app">
      <section className="screen" style={{ position: 'relative', minHeight: '100vh', justifyContent: 'flex-start', padding: '2.5rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1rem' }}>
          <MapleEyes width={38} strokeWidth={6} tap={false} />
          <span className="feed-campus">Maple · live location</span>
        </div>

        {notFound ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <MapleEyes width={92} strokeWidth={4} tap={false} />
            <p className="nearby-h" style={{ marginTop: '1rem' }}>This location expired</p>
            <p className="nearby-sub">The link is no longer active.</p>
          </div>
        ) : !loc ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
            <div className="w-8 h-8 rounded-full border-2 border-[#111] border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            <h1 className="font-display" style={{ fontSize: 22, fontWeight: 600, margin: '0 0 .25rem' }}>Here&rsquo;s where they are</h1>
            <p className="nearby-sub" style={{ marginBottom: '1rem' }}>Shared live from Maple. Meet them safely.</p>
            <div style={{ width: '100%', maxWidth: 460, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <iframe
                title="location"
                width="100%" height="360" style={{ border: 0, display: 'block' }}
                loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${loc.lat},${loc.lng}&z=16&output=embed`}
              />
            </div>
            <a className="btn btn-primary" style={{ maxWidth: 460, marginTop: '1rem', display: 'block', textDecoration: 'none' }}
              href={`https://maps.google.com/?q=${loc.lat},${loc.lng}`} target="_blank" rel="noopener noreferrer">
              Open in Google Maps →
            </a>
          </>
        )}
      </section>
    </main>
  )
}
