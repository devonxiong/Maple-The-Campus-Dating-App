'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from 'react'

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
// Claremont Colleges center
const CAMPUS = { lat: 34.1025, lng: -117.7117 }
const RADIUS_M = 20

let mapsPromise: Promise<void> | null = null
function loadMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if ((window as any).google?.maps) return Promise.resolve()
  if (mapsPromise) return mapsPromise
  mapsPromise = new Promise((resolve, reject) => {
    if (!MAPS_KEY) { reject(new Error('Google Maps key not set')); return }
    const existing = document.getElementById('gmaps-script') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('maps failed')))
      return
    }
    const s = document.createElement('script')
    s.id = 'gmaps-script'
    s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places`
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('maps failed'))
    document.head.appendChild(s)
  })
  return mapsPromise
}

export default function SpotPicker({ spots, onAdd, onRemove }: {
  spots: string[]
  onAdd: (name: string) => void
  onRemove: (name: string) => void
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const objs = useRef<any>({})
  const [ready, setReady] = useState(false)
  const [err, setErr] = useState('')
  const [activeName, setActiveName] = useState('')
  const [manual, setManual] = useState('')

  useEffect(() => {
    let cancelled = false
    loadMaps().then(() => {
      if (cancelled || !mapRef.current) return
      const g = (window as any).google

      const map = new g.maps.Map(mapRef.current, {
        center: CAMPUS,
        zoom: 17,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'greedy',
        clickableIcons: true,
      })
      const marker = new g.maps.Marker({ map, position: CAMPUS, draggable: true })
      const circle = new g.maps.Circle({
        map, center: CAMPUS, radius: RADIUS_M,
        fillColor: '#e0654f', fillOpacity: 0.15,
        strokeColor: '#e0654f', strokeOpacity: 0.6, strokeWeight: 1.5,
      })
      const geocoder = new g.maps.Geocoder()
      objs.current = { g, map, marker, circle }

      const setPos = (pos: any, name?: string) => {
        marker.setPosition(pos)
        circle.setCenter(pos)
        map.panTo(pos)
        if (name) { setActiveName(name); return }
        geocoder.geocode({ location: pos }, (res: any, status: string) => {
          if (status === 'OK' && res?.[0]) {
            setActiveName(res[0].formatted_address?.split(',')[0] || 'Pinned location')
          } else {
            setActiveName('Pinned location')
          }
        })
      }

      marker.addListener('dragend', () => setPos(marker.getPosition()))
      map.addListener('click', (e: any) => setPos(e.latLng))

      if (inputRef.current) {
        const ac = new g.maps.places.Autocomplete(inputRef.current, {
          fields: ['name', 'geometry', 'formatted_address'],
        })
        ac.setBounds(new g.maps.Circle({ center: CAMPUS, radius: 4000 }).getBounds())
        ac.addListener('place_changed', () => {
          const p = ac.getPlace()
          if (p.geometry?.location) {
            map.setZoom(18)
            setPos(p.geometry.location, p.name || p.formatted_address?.split(',')[0])
          }
        })
      }

      setPos(CAMPUS)
      setReady(true)
    }).catch(() => {
      setErr("Map couldn't load — type your spot below instead.")
    })
    return () => { cancelled = true }
  }, [])

  function useMyLocation() {
    if (!navigator.geolocation || !objs.current.map) return
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude }
        const { map, marker, circle } = objs.current
        marker.setPosition(pos); circle.setCenter(pos); map.panTo(pos); map.setZoom(18)
        new objs.current.g.maps.Geocoder().geocode({ location: pos }, (res: any, s: string) => {
          setActiveName(s === 'OK' && res?.[0] ? (res[0].formatted_address?.split(',')[0] || 'My location') : 'My location')
        })
      },
      () => setErr('Location permission denied.'),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const alreadyAdded = activeName && spots.some(s => s.toLowerCase() === activeName.toLowerCase())
  const full = spots.length >= 5

  return (
    <div className="space-y-3">
      {/* Search */}
      <input
        ref={inputRef}
        type="text"
        placeholder="🔍 Search a place — dorm, library, gym…"
        className="w-full bg-white border border-[#e8e6e1] rounded-xl px-4 py-3 text-sm text-[#111] placeholder:text-[#c5c0bb] focus:outline-none focus:border-[#111] transition-colors"
      />

      {/* Map */}
      <div className="relative">
        <div ref={mapRef} className="w-full h-[240px] rounded-xl overflow-hidden border border-[#e8e6e1] bg-[#ecebe7]" />
        {!ready && !err && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-[#9b9590] pointer-events-none">loading map…</div>
        )}
        {ready && (
          <button
            type="button" onClick={useMyLocation}
            className="absolute bottom-2 right-2 bg-white border border-[#e8e6e1] rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#6b6760] shadow-sm hover:border-[#111] transition-colors"
          >
            📍 my location
          </button>
        )}
      </div>

      {err && (
        <div className="flex gap-2">
          <input
            type="text" value={manual} onChange={(e) => setManual(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && manual.trim() && !full) { onAdd(manual.trim()); setManual('') } }}
            placeholder="e.g. Honnold Library"
            className="flex-1 bg-white border border-[#e8e6e1] rounded-xl px-3 py-2.5 text-sm text-[#111] placeholder:text-[#c5c0bb] focus:outline-none focus:border-[#111]"
          />
          <button onClick={() => { if (manual.trim() && !full) { onAdd(manual.trim()); setManual('') } }} disabled={!manual.trim() || full}
            className="px-4 rounded-xl bg-[#111] text-white text-sm font-medium disabled:opacity-30">add</button>
        </div>
      )}

      {/* Active pin → add */}
      {!err && activeName && (
        <button
          type="button"
          disabled={!!alreadyAdded || full}
          onClick={() => { onAdd(activeName); }}
          className="w-full flex items-center justify-between gap-2 bg-white border border-[#e8e6e1] rounded-xl px-4 py-3 text-sm hover:border-[#111] transition-colors disabled:opacity-50"
        >
          <span className="text-[#111] font-medium truncate">📍 {activeName}</span>
          <span className="text-xs text-[#6b6760] shrink-0">
            {alreadyAdded ? 'added ✓' : full ? 'max 5' : '+ add this spot'}
          </span>
        </button>
      )}

      {/* Chosen spots */}
      {spots.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {spots.map(s => (
            <button key={s} type="button" onClick={() => onRemove(s)}
              className="flex items-center gap-1 bg-[#f1efea] text-[#111] text-xs font-medium rounded-full pl-3 pr-2 py-1.5 hover:bg-[#e8e6e1] transition-colors">
              {s} <span className="text-[#9b9590]">×</span>
            </button>
          ))}
        </div>
      )}

      <p className="text-[11px] text-[#c5c0bb] leading-snug">
        Tap the map or search to drop a pin. The circle ≈ {RADIUS_M}m around your spot. Add up to 5.
      </p>
    </div>
  )
}
