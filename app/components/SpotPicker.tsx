'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from 'react'

const GMAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
// The Claremont Colleges consortium, Claremont CA. Google Maps uses {lat, lng}.
const CAMPUS = { lat: 34.1017, lng: -117.7078 }
const RADIUS_M = 30
const LIMIT_DEG = 0.03 // ~3km box around campus

let gmapsPromise: Promise<void> | null = null
function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if ((window as any).google?.maps) return Promise.resolve()
  if (gmapsPromise) return gmapsPromise
  gmapsPromise = new Promise((resolve, reject) => {
    if (!GMAPS_KEY) { reject(new Error('Google Maps key not set')); return }
    const existing = document.getElementById('gmaps-script') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('gmaps failed')))
      return
    }
    const s = document.createElement('script')
    s.id = 'gmaps-script'
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&libraries=places`
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('gmaps failed'))
    document.head.appendChild(s)
  })
  return gmapsPromise
}

const STR = {
  en: {
    search: 'Search a place — dorm, library, dining hall…',
    loading: 'loading map…', myLoc: 'my location',
    mapErr: "Map couldn't load — type your spot below instead.",
    manualPh: 'e.g. Honnold Library', add: 'add',
    added: 'added ✓', max: 'max 3', addThis: '+ add this spot',
    hint: (r: number) => `Tap the map or search to drop a pin. The circle ≈ ${r}m around your spot. Add up to 3.`,
    denied: 'Location permission denied.',
    pinned: 'Pinned location',
  },
  zh: {
    search: '搜索地点 — 宿舍、图书馆、食堂…',
    loading: '地图加载中…', myLoc: '我的位置',
    mapErr: '地图加载失败 — 请在下方手动输入地点。',
    manualPh: '例如：Honnold Library', add: '添加',
    added: '已添加 ✓', max: '最多 3 个', addThis: '+ 添加这个地点',
    hint: (r: number) => `点地图或搜索来放一个图钉。圆圈约覆盖 ${r}m。最多添加 3 个。`,
    denied: '定位权限被拒绝。',
    pinned: '选中的位置',
  },
}

export default function SpotPicker({ spots, onAdd, onRemove, lang = 'en' }: {
  spots: string[]
  onAdd: (name: string) => void
  onRemove: (name: string) => void
  lang?: 'en' | 'zh'
}) {
  const L = STR[lang]
  const mapRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const objs = useRef<any>({})
  const [ready, setReady] = useState(false)
  const [err, setErr] = useState('')
  const [activeName, setActiveName] = useState('')
  const [manual, setManual] = useState('')

  useEffect(() => {
    let cancelled = false
    loadGoogleMaps().then(() => {
      if (cancelled || !mapRef.current) return
      const g = (window as any).google

      const map = new g.maps.Map(mapRef.current, {
        zoom: 16,
        center: CAMPUS,
        minZoom: 14,
        disableDefaultUI: true,
        zoomControl: true,
        clickableIcons: true,
        restriction: {
          latLngBounds: {
            north: CAMPUS.lat + LIMIT_DEG, south: CAMPUS.lat - LIMIT_DEG,
            east: CAMPUS.lng + LIMIT_DEG, west: CAMPUS.lng - LIMIT_DEG,
          },
          strictBounds: false,
        },
      })
      const marker = new g.maps.Marker({ position: CAMPUS, map, draggable: true })
      const circle = new g.maps.Circle({
        map, center: CAMPUS, radius: RADIUS_M,
        strokeColor: '#c6822f', strokeOpacity: 0.7, strokeWeight: 1.5,
        fillColor: '#c6822f', fillOpacity: 0.15,
      })
      const geocoder = new g.maps.Geocoder()
      objs.current = { g, map, marker, circle, geocoder }

      const setPos = (latLng: any, name?: string) => {
        marker.setPosition(latLng)
        circle.setCenter(latLng)
        map.panTo(latLng)
        if (name) { setActiveName(name); return }
        geocoder.geocode({ location: latLng }, (results: any[], status: string) => {
          if (status === 'OK' && results?.[0]) {
            const r = results[0]
            // Prefer a place/POI-ish name over the full street address.
            const short = r.address_components?.[0]?.long_name
            setActiveName(short && !/^\d/.test(short) ? short : (r.formatted_address?.split(',')[0] || L.pinned))
          } else {
            setActiveName(L.pinned)
          }
        })
      }

      marker.addListener('dragend', (e: any) => setPos(e.latLng))
      map.addListener('click', (e: any) => setPos(e.latLng))

      // Places autocomplete on the search box, biased to campus.
      if (searchRef.current && g.maps.places) {
        const bounds = new g.maps.LatLngBounds(
          { lat: CAMPUS.lat - LIMIT_DEG, lng: CAMPUS.lng - LIMIT_DEG },
          { lat: CAMPUS.lat + LIMIT_DEG, lng: CAMPUS.lng + LIMIT_DEG },
        )
        const auto = new g.maps.places.Autocomplete(searchRef.current, {
          bounds, fields: ['name', 'geometry'],
        })
        auto.setOptions({ strictBounds: false })
        auto.addListener('place_changed', () => {
          const place = auto.getPlace()
          if (place?.geometry?.location) {
            map.setZoom(17)
            setPos(place.geometry.location, place.name)
          }
        })
      }

      setPos(CAMPUS)
      setReady(true)
    }).catch(() => { setErr(L.mapErr) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function useMyLocation() {
    if (!navigator.geolocation) { setErr(L.denied); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { g, map, marker, circle, geocoder } = objs.current
        if (!g || !map) return
        const latLng = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        marker.setPosition(latLng); circle.setCenter(latLng); map.panTo(latLng); map.setZoom(17)
        geocoder.geocode({ location: latLng }, (results: any[], status: string) => {
          setActiveName(status === 'OK' && results?.[0]
            ? (results[0].formatted_address?.split(',')[0] || L.pinned)
            : L.pinned)
        })
      },
      () => setErr(L.denied),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  const alreadyAdded = activeName && spots.some(s => s.toLowerCase() === activeName.toLowerCase())
  const full = spots.length >= 3

  return (
    <div className="space-y-3">
      {/* Search */}
      <input
        ref={searchRef}
        type="text"
        autoComplete="off"
        placeholder={L.search}
        className="input"
        style={{ width: '100%' }}
      />

      {/* Map */}
      <div className="relative">
        <div ref={mapRef} className="w-full h-[240px] rounded-xl overflow-hidden border border-[#e8e6e1] bg-[#ecebe7]" />
        {!ready && !err && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-[#9b9590] pointer-events-none">{L.loading}</div>
        )}
        {ready && (
          <button
            type="button" onClick={useMyLocation}
            className="absolute bottom-2 right-2 z-10 bg-white border border-[#e8e6e1] rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#6b6760] shadow-sm hover:border-[#111] transition-colors"
          >
            {L.myLoc}
          </button>
        )}
      </div>

      {err && (
        <div className="flex gap-2">
          <input
            type="text" value={manual} onChange={(e) => setManual(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && manual.trim() && !full) { onAdd(manual.trim()); setManual('') } }}
            placeholder={L.manualPh}
            className="flex-1 bg-white border border-[#e8e6e1] rounded-xl px-3 py-2.5 text-sm text-[#111] placeholder:text-[#c5c0bb] focus:outline-none focus:border-[#111]"
          />
          <button onClick={() => { if (manual.trim() && !full) { onAdd(manual.trim()); setManual('') } }} disabled={!manual.trim() || full}
            className="px-4 rounded-xl bg-[#111] text-white text-sm font-medium disabled:opacity-30">{L.add}</button>
        </div>
      )}

      {/* Active pin → add */}
      {!err && activeName && (
        <button
          type="button"
          disabled={!!alreadyAdded || full}
          onClick={() => { onAdd(activeName) }}
          className="w-full flex items-center justify-between gap-2 bg-white border border-[#e8e6e1] rounded-xl px-4 py-3 text-sm hover:border-[#111] transition-colors disabled:opacity-50"
        >
          <span className="text-[#111] font-medium truncate">{activeName}</span>
          <span className="text-xs text-[#6b6760] shrink-0">
            {alreadyAdded ? L.added : full ? L.max : L.addThis}
          </span>
        </button>
      )}

      {/* Chosen spots */}
      {spots.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {spots.map(s => (
            <button key={s} type="button" onClick={() => onRemove(s)}
              className="flex items-center gap-1 bg-[#e8e6e1] text-[#111] text-xs font-medium rounded-full pl-3 pr-2 py-1.5 hover:bg-[#e8e6e1] transition-colors">
              {s} <span className="text-[#9b9590]">×</span>
            </button>
          ))}
        </div>
      )}

      <p className="text-[11px] text-[#c5c0bb] leading-snug">
        {L.hint(RADIUS_M)}
      </p>
    </div>
  )
}
