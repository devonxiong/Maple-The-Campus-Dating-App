import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET /api/share-location?id=... — read a stored location (for the /loc page).
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  try {
    const { data } = await supabaseAdmin.from('shared_locations').select('lat,lng,created_at').eq('id', id).maybeSingle()
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}

// POST /api/share-location — store a live location and return a shareable link.
// Needs a `shared_locations` table:
//   create table shared_locations (
//     id uuid primary key default gen_random_uuid(),
//     user_id uuid, lat double precision, lng double precision,
//     created_at timestamptz default now(),
//     expires_at timestamptz default now() + interval '2 hours'
//   );
// If the table doesn't exist yet, we fall back to a plain Google Maps link.
export async function POST(req: NextRequest) {
  const { userId, lat, lng } = await req.json()
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 })
  }
  const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`
  try {
    const { data, error } = await supabaseAdmin
      .from('shared_locations')
      .insert({ user_id: userId ?? null, lat, lng })
      .select('id')
      .single()
    if (!error && data) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.maplemeet.ai'
      return NextResponse.json({ url: `${appUrl}/loc/${data.id}`, mapsUrl })
    }
  } catch { /* table may not exist — fall back */ }
  return NextResponse.json({ url: mapsUrl, mapsUrl, fallback: true })
}
