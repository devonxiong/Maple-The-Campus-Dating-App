import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service-role client so we can create the match past RLS (the anon client
// can't insert into `matches`).
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// POST /api/blind-date-start — create (or reuse) a match with a random person.
export async function POST(req: NextRequest) {
  const { userId, otherId } = await req.json()
  if (!userId || !otherId || userId === otherId) {
    return NextResponse.json({ error: 'Missing users' }, { status: 400 })
  }

  // Reuse an existing match between the two (either direction) if there is one.
  const { data: existing } = await supabaseAdmin
    .from('matches')
    .select('id')
    .or(`and(user_a.eq.${userId},user_b.eq.${otherId}),and(user_a.eq.${otherId},user_b.eq.${userId})`)
    .neq('status', 'cancelled')
    .limit(1)
    .maybeSingle()
  if (existing) return NextResponse.json({ matchId: existing.id, reused: true })

  const { data, error } = await supabaseAdmin
    .from('matches')
    .insert({ user_a: userId, user_b: otherId, status: 'released' })
    .select('id')
    .single()
  if (error || !data) {
    console.error('[blind-date-start] insert error:', error)
    return NextResponse.json({ error: 'Could not start' }, { status: 500 })
  }
  return NextResponse.json({ matchId: data.id })
}
