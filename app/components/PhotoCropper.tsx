'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Circular avatar cropper — drag to reposition, slider (or wheel/pinch) to zoom.
 * Calls onDone with a square JPEG Blob of the cropped region.
 */
export default function PhotoCropper({
  file, onDone, onCancel, busy, lang = 'en',
}: {
  file: File
  onDone: (blob: Blob) => void
  onCancel: () => void
  busy?: boolean
  lang?: 'en' | 'zh'
}) {
  const S = 280            // frame size (px)
  const OUT = 640          // exported image size (px)
  const zh = lang === 'zh'

  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 }) // top-left of image within frame
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null)
  const cover = useRef(1)

  // Load the image
  useEffect(() => {
    const url = URL.createObjectURL(file)
    const i = new Image()
    i.onload = () => {
      cover.current = Math.max(S / i.naturalWidth, S / i.naturalHeight)
      setImg(i)
      const k = cover.current
      setPos({ x: (S - i.naturalWidth * k) / 2, y: (S - i.naturalHeight * k) / 2 })
      setZoom(1)
    }
    i.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  const k = img ? cover.current * zoom : 1
  const iw = img ? img.naturalWidth * k : 0
  const ih = img ? img.naturalHeight * k : 0

  function clamp(x: number, y: number) {
    return {
      x: Math.min(0, Math.max(S - iw, x)),
      y: Math.min(0, Math.max(S - ih, y)),
    }
  }

  // Re-clamp when zoom changes (keep centered on the middle of the frame)
  useEffect(() => {
    if (!img) return
    setPos(p => {
      // keep the frame center fixed while zooming
      return clamp(p.x, p.y)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, img])

  function onPointerDown(e: React.PointerEvent) {
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    drag.current = { px: e.clientX, py: e.clientY, ox: pos.x, oy: pos.y }
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return
    const nx = drag.current.ox + (e.clientX - drag.current.px)
    const ny = drag.current.oy + (e.clientY - drag.current.py)
    setPos(clamp(nx, ny))
  }
  function onPointerUp() { drag.current = null }

  function onWheel(e: React.WheelEvent) {
    setZoom(z => Math.min(4, Math.max(1, z - e.deltaY * 0.0015)))
  }

  function done() {
    if (!img) return
    const c = document.createElement('canvas')
    c.width = OUT; c.height = OUT
    const ctx = c.getContext('2d')
    if (!ctx) return
    // frame (0..S) maps to source natural coords: (f - pos)/k
    const sx = -pos.x / k, sy = -pos.y / k, sSize = S / k
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUT, OUT)
    c.toBlob(b => { if (b) onDone(b) }, 'image/jpeg', 0.9)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%' }}>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
        style={{
          position: 'relative', width: S, height: S, borderRadius: '50%', overflow: 'hidden',
          cursor: 'grab', touchAction: 'none', background: 'var(--card)',
          boxShadow: '0 0 0 1.5px var(--border), 0 8px 24px rgba(0,0,0,.15)', userSelect: 'none',
        }}
      >
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img.src} alt="crop" draggable={false}
            style={{ position: 'absolute', left: pos.x, top: pos.y, width: iw, height: ih, maxWidth: 'none', pointerEvents: 'none' }}
          />
        )}
        {/* subtle inner ring guide */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.35)', pointerEvents: 'none' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 300, display: 'flex', alignItems: 'center', gap: '.6rem' }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{zh ? '缩放' : 'Zoom'}</span>
        <input type="range" min={1} max={4} step={0.01} value={zoom}
          onChange={e => setZoom(Number(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--accent)' }} />
      </div>
      <p className="hint" style={{ textAlign: 'center', marginTop: 0 }}>{zh ? '拖动照片调整位置，滑动缩放' : 'Drag to reposition · slide to zoom'}</p>

      <div style={{ width: '100%', maxWidth: 300, display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
        <button className="btn btn-primary" disabled={busy || !img} onClick={done}>
          {busy ? (zh ? '保存中…' : 'Saving…') : (zh ? '就用这张 →' : 'Use photo →')}
        </button>
        <button className="btn btn-secondary" disabled={busy} onClick={onCancel}>{zh ? '重新选择' : 'Pick another'}</button>
      </div>
    </div>
  )
}
