'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from 'react'

const AMAP_KEY = process.env.NEXT_PUBLIC_AMAP_KEY
const AMAP_SECURITY = process.env.NEXT_PUBLIC_AMAP_SECURITY
// Tsinghua University (清华大学), Beijing — AMap uses [lng, lat] (GCJ-02)
const CAMPUS: [number, number] = [116.326, 40.0035]
const RADIUS_M = 20

let amapPromise: Promise<void> | null = null
function loadAMap(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if ((window as any).AMap) return Promise.resolve()
  if (amapPromise) return amapPromise
  amapPromise = new Promise((resolve, reject) => {
    if (!AMAP_KEY) { reject(new Error('AMap key not set')); return }
    if (AMAP_SECURITY) (window as any)._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY }
    const existing = document.getElementById('amap-script') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('amap failed')))
      return
    }
    const s = document.createElement('script')
    s.id = 'amap-script'
    s.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}&plugin=AMap.AutoComplete,AMap.PlaceSearch,AMap.Geocoder,AMap.Geolocation`
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('amap failed'))
    document.head.appendChild(s)
  })
  return amapPromise
}

const STR = {
  en: {
    search: '🔍 Search a place — dorm, library, gym…',
    loading: 'loading map…', myLoc: '📍 my location',
    mapErr: "Map couldn't load — type your spot below instead.",
    manualPh: 'e.g. Tsinghua Library', add: 'add',
    added: 'added ✓', max: 'max 5', addThis: '+ add this spot',
    hint: (r: number) => `Tap the map or search to drop a pin. The circle ≈ ${r}m around your spot. Add up to 5.`,
    denied: 'Location permission denied.',
    pinned: 'Pinned location',
  },
  zh: {
    search: '🔍 搜索地点 — 宿舍、图书馆、食堂…',
    loading: '地图加载中…', myLoc: '📍 我的位置',
    mapErr: '地图加载失败 — 请在下方手动输入地点。',
    manualPh: '例如：清华大学图书馆', add: '添加',
    added: '已添加 ✓', max: '最多 5 个', addThis: '+ 添加这个地点',
    hint: (r: number) => `点地图或搜索来放一个图钉。圆圈约覆盖 ${r}m。最多添加 5 个。`,
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
  const inputId = 'amap-spot-search'
  const objs = useRef<any>({})
  const [ready, setReady] = useState(false)
  const [err, setErr] = useState('')
  const [activeName, setActiveName] = useState('')
  const [manual, setManual] = useState('')

  useEffect(() => {
    let cancelled = false
    loadAMap().then(() => {
      if (cancelled || !mapRef.current) return
      const AMap = (window as any).AMap

      const map = new AMap.Map(mapRef.current, {
        zoom: 16,
        center: CAMPUS,
        resizeEnable: true,
      })
      const marker = new AMap.Marker({ position: CAMPUS, draggable: true })
      const circle = new AMap.Circle({
        center: CAMPUS, radius: RADIUS_M,
        strokeColor: '#e0654f', strokeOpacity: 0.6, strokeWeight: 1.5,
        fillColor: '#e0654f', fillOpacity: 0.15,
      })
      map.add(marker)
      map.add(circle)
      const geocoder = new AMap.Geocoder({ city: '北京' })
      const placeSearch = new AMap.PlaceSearch({ city: '北京', pageSize: 1 })
      objs.current = { AMap, map, marker, circle, geocoder, placeSearch }

      const setPos = (lnglat: any, name?: string) => {
        marker.setPosition(lnglat)
        circle.setCenter(lnglat)
        map.setCenter(lnglat)
        if (name) { setActiveName(name); return }
        geocoder.getAddress(lnglat, (status: string, result: any) => {
          if (status === 'complete' && result.regeocode) {
            const rc = result.regeocode
            const poi = rc.pois && rc.pois[0]?.name
            setActiveName(poi || rc.formattedAddress || L.pinned)
          } else {
            setActiveName(L.pinned)
          }
        })
      }

      marker.on('dragend', (e: any) => setPos(e.lnglat))
      map.on('click', (e: any) => setPos(e.lnglat))

      // Search autocomplete bound to the input
      const auto = new AMap.AutoComplete({ input: inputId, city: '北京' })
      auto.on('select', (e: any) => {
        const poi = e.poi
        if (poi?.location) {
          map.setZoom(17)
          setPos([poi.location.lng, poi.location.lat], poi.name)
        } else if (poi?.name) {
          placeSearch.search(poi.name, (status: string, result: any) => {
            const p = result?.poiList?.pois?.[0]
            if (status === 'complete' && p?.location) {
              map.setZoom(17)
              setPos([p.location.lng, p.location.lat], poi.name)
            }
          })
        }
      })

      setPos(CAMPUS)
      setReady(true)
    }).catch(() => {
      setErr(L.mapErr)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function useMyLocation() {
    const { AMap, map } = objs.current
    if (!AMap || !map) return
    const geo = new AMap.Geolocation({ enableHighAccuracy: true, timeout: 8000 })
    geo.getCurrentPosition((status: string, result: any) => {
      if (status === 'complete' && result.position) {
        const lnglat = [result.position.lng, result.position.lat]
        const { marker, circle, geocoder } = objs.current
        marker.setPosition(lnglat); circle.setCenter(lnglat); map.setCenter(lnglat); map.setZoom(17)
        geocoder.getAddress(lnglat, (s: string, r: any) => {
          const rc = r?.regeocode
          setActiveName((rc?.pois && rc.pois[0]?.name) || rc?.formattedAddress || L.pinned)
        })
      } else {
        setErr(L.denied)
      }
    })
  }

  const alreadyAdded = activeName && spots.some(s => s.toLowerCase() === activeName.toLowerCase())
  const full = spots.length >= 5

  return (
    <div className="space-y-3">
      {/* Search */}
      <input
        id={inputId}
        type="text"
        autoComplete="off"
        placeholder={L.search}
        className="w-full bg-white border border-[#e8e6e1] rounded-xl px-4 py-3 text-sm text-[#111] placeholder:text-[#c5c0bb] focus:outline-none focus:border-[#111] transition-colors"
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
          <span className="text-[#111] font-medium truncate">📍 {activeName}</span>
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
              className="flex items-center gap-1 bg-[#f1efea] text-[#111] text-xs font-medium rounded-full pl-3 pr-2 py-1.5 hover:bg-[#e8e6e1] transition-colors">
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
