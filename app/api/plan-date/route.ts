import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const MAPS_KEY = process.env.GOOGLE_MAPS_KEY!

// ── Real Claremont / 5C spots ────────────────────────────────────────────────
const CLAREMONT_SPOTS = [
  { name: 'The Motley Coffeehouse', address: '1030 Columbia Ave, Claremont, CA', lat: 34.0988, lng: -117.7096, vibe: 'cozy campus coffee shop at Scripps' },
  { name: 'Honnold-Mudd Library', address: '800 Dartmouth Ave, Claremont, CA', lat: 34.0993, lng: -117.7115, vibe: 'the shared 5C library — low pressure, easy to find each other' },
  { name: 'The Back Abbey', address: '419 W Foothill Blvd, Claremont, CA', lat: 34.0991, lng: -117.7235, vibe: 'casual restaurant in Claremont Village' },
  { name: "Walter's Restaurant", address: '310 Yale Ave, Claremont, CA', lat: 34.0966, lng: -117.7184, vibe: 'classic Claremont Village spot' },
  { name: 'Heroes Restaurant & Brewery', address: '1894 Foothill Blvd, La Verne, CA', lat: 34.1002, lng: -117.7392, vibe: 'chill brewery near campus' },
  { name: 'Garner Park (Village Green)', address: '840 Village Center Dr, Claremont, CA', lat: 34.0972, lng: -117.7191, vibe: 'open park right in Claremont Village' },
  { name: 'Rhino Records Claremont', address: '134 Yale Ave, Claremont, CA', lat: 34.0978, lng: -117.7182, vibe: 'record store and coffee — unique date spot' },
  { name: 'The Copper Door Coffee Roasters', address: '233 W Foothill Blvd, Claremont, CA', lat: 34.0979, lng: -117.7202, vibe: 'local Claremont coffee shop' },
  { name: 'Rancho Santa Ana Botanic Garden', address: '1500 N College Ave, Claremont, CA', lat: 34.1107, lng: -117.7104, vibe: 'beautiful garden walk — perfect for a first meet' },
  { name: 'The Hub at Pomona College', address: 'Pomona College, Claremont, CA', lat: 34.0988, lng: -117.7072, vibe: 'on-campus café, super easy to get to' },
]

// Haversine distance in meters
function distanceM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function midpoint(lat1: number, lng1: number, lat2: number, lng2: number) {
  return { lat: (lat1 + lat2) / 2, lng: (lng1 + lng2) / 2 }
}

function walkMinutes(meters: number) {
  return Math.round(meters / 80)
}

function staticMapUrl(lat: number, lng: number) {
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=16&size=400x200&markers=color:red%7C${lat},${lng}&key=${MAPS_KEY}`
}

function mapsUrl(name: string, address: string) {
  return `https://maps.google.com/?q=${encodeURIComponent(name + ', ' + address)}`
}

function nextFridayEvening() {
  const now = new Date()
  const day = now.getDay()
  const daysUntilFriday = (5 - day + 7) % 7 || 7
  const friday = new Date(now)
  friday.setDate(now.getDate() + daysUntilFriday)
  return friday.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) + ' · 7:00 PM'
}

export async function POST(req: NextRequest) {
  const { matchId } = await req.json()
  if (!matchId) return NextResponse.json({ error: 'Missing matchId' }, { status: 400 })

  const { data: match, error: matchErr } = await supabaseAdmin
    .from('matches')
    .select('user_a, user_b')
    .eq('id', matchId)
    .single()

  if (matchErr || !match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

  // Get GPS locations
  const { data: presences } = await supabaseAdmin
    .from('user_presence')
    .select('user_id, lat, lng')
    .in('user_id', [match.user_a, match.user_b])

  const a = presences?.find(p => p.user_id === match.user_a)
  const b = presences?.find(p => p.user_id === match.user_b)

  let mid = { lat: 34.0972, lng: -117.7107 } // Default: 5C center
  if (a && b) {
    mid = midpoint(a.lat, a.lng, b.lat, b.lng)
  }

  // Try Google Places nearbysearch first (real results within ~1km of midpoint)
  let chosenSpot = null
  try {
    for (const type of ['cafe', 'restaurant', 'park', 'library']) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${mid.lat},${mid.lng}&radius=2000&type=${type}&keyword=claremont&key=${MAPS_KEY}`
      const res = await fetch(url)
      const data = await res.json()
      const result = data.results?.find((r: { business_status?: string }) => r.business_status === 'OPERATIONAL')
      if (result) {
        const placeLat = result.geometry.location.lat
        const placeLng = result.geometry.location.lng
        const distFromMid = distanceM(mid.lat, mid.lng, placeLat, placeLng)
        // Only use if within 2.5km of 5C center (avoid random LA places)
        const distFrom5C = distanceM(34.0972, -117.7107, placeLat, placeLng)
        if (distFrom5C < 5000) {
          const distA = a ? distanceM(a.lat, a.lng, placeLat, placeLng) : distFromMid
          const distB = b ? distanceM(b.lat, b.lng, placeLat, placeLng) : distFromMid
          chosenSpot = {
            name: result.name,
            address: result.vicinity || result.formatted_address || 'Claremont, CA',
            lat: placeLat,
            lng: placeLng,
            walk_minutes: walkMinutes((distA + distB) / 2),
            vibe: `${result.name} is right in the area`,
          }
          break
        }
      }
    }
  } catch (e) {
    console.error('[plan-date] Places API error:', e)
  }

  // Fallback: pick the curated spot closest to midpoint
  if (!chosenSpot) {
    const sorted = CLAREMONT_SPOTS
      .map(s => ({ ...s, dist: distanceM(mid.lat, mid.lng, s.lat, s.lng) }))
      .sort((a, b) => a.dist - b.dist)
    const pick = sorted[0]
    const distA = a ? distanceM(a.lat, a.lng, pick.lat, pick.lng) : pick.dist
    const distB = b ? distanceM(b.lat, b.lng, pick.lat, pick.lng) : pick.dist
    chosenSpot = {
      name: pick.name,
      address: pick.address,
      lat: pick.lat,
      lng: pick.lng,
      walk_minutes: walkMinutes((distA + distB) / 2),
      vibe: pick.vibe,
    }
  }

  const dateCardJson = {
    time: nextFridayEvening(),
    venue: chosenSpot.name,
    address: chosenSpot.address,
    walk_minutes: chosenSpot.walk_minutes,
    maps_url: mapsUrl(chosenSpot.name, chosenSpot.address),
    static_map: staticMapUrl(chosenSpot.lat, chosenSpot.lng),
    lat: chosenSpot.lat,
    lng: chosenSpot.lng,
    shared_context: chosenSpot.vibe,
    reasoning: `${chosenSpot.name} is roughly equidistant for both of you — ~${chosenSpot.walk_minutes} min walk each.`,
    icebreaker: "What's the most unexpectedly good thing you've discovered around here?",
  }

  await supabaseAdmin
    .from('matches')
    .update({ date_card_json: dateCardJson })
    .eq('id', matchId)

  return NextResponse.json(dateCardJson)
}
