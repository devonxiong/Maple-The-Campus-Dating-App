import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function safeNotify(payload: object | object[]) {
  try {
    await sb.from('notifications').insert(payload as never)
  } catch { /* best effort */ }
}

/** POST — requester opens a blind box */
export async function POST(req: NextRequest) {
  try {
    const { requester_id } = await req.json()
    if (!requester_id) return NextResponse.json({ error: 'missing fields' }, { status: 400 })

    // Already has a pending outgoing request?
    const { data: existing } = await sb
      .from('blind_date_requests')
      .select('id')
      .eq('requester_id', requester_id)
      .eq('status', 'pending')
      .maybeSingle()
    if (existing) return NextResponse.json({ error: 'already_pending', request_id: existing.id })

    // Get all users
    const { data: allUsers } = await sb.from('users').select('id').neq('id', requester_id)
    if (!allUsers?.length) return NextResponse.json({ error: 'no_eligible_targets' })

    // Exclude: blocks (both ways), likes already sent, past blind date targets
    const [{ data: mySwipes }, { data: blockedMe }, { data: pastTargets }] = await Promise.all([
      sb.from('swipes').select('to_user').eq('from_user', requester_id).in('sentiment', ['block', 'like']),
      sb.from('swipes').select('from_user').eq('to_user', requester_id).eq('sentiment', 'block'),
      sb.from('blind_date_requests').select('target_id').eq('requester_id', requester_id),
    ])

    const exclude = new Set([
      requester_id,
      ...(mySwipes ?? []).map((s: Record<string, string>) => s.to_user),
      ...(blockedMe ?? []).map((s: Record<string, string>) => s.from_user),
      ...(pastTargets ?? []).map((r: Record<string, string>) => r.target_id),
    ])

    const eligible = (allUsers as { id: string }[]).filter(u => !exclude.has(u.id))
    if (!eligible.length) return NextResponse.json({ error: 'no_eligible_targets' })

    const target = eligible[Math.floor(Math.random() * eligible.length)]

    const { data: request, error: insertErr } = await sb
      .from('blind_date_requests')
      .insert({ requester_id, target_id: target.id })
      .select()
      .single()

    if (insertErr) {
      console.error('[blind-date] insert error:', insertErr)
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    // Notify target (best effort — use sentinel message to avoid type constraint issues)
    await safeNotify({ to_user: target.id, type: 'bell', message: '__blind_date__' })

    return NextResponse.json({ success: true, request_id: request.id })
  } catch (err) {
    console.error('[blind-date] POST error:', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}

/** PATCH — target responds */
export async function PATCH(req: NextRequest) {
  try {
    const { request_id, responder_id, accept } = await req.json()
    if (!request_id || !responder_id) return NextResponse.json({ error: 'missing fields' }, { status: 400 })

    const { data: request } = await sb
      .from('blind_date_requests')
      .select('*')
      .eq('id', request_id)
      .eq('target_id', responder_id)
      .eq('status', 'pending')
      .maybeSingle()

    if (!request) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const newStatus = accept ? 'accepted' : 'declined'
    await sb.from('blind_date_requests').update({ status: newStatus }).eq('id', request_id)

    if (accept) {
      const { data: match } = await sb.from('matches').insert({
        user_a: request.requester_id,
        user_b: request.target_id,
        status: 'released',
      }).select().single()

      await safeNotify([
        { to_user: request.requester_id, type: 'bell', message: '__blind_date_accepted__' },
        { to_user: request.target_id,   type: 'bell', message: '__blind_date_accepted__' },
      ])

      return NextResponse.json({ success: true, match_id: match?.id })
    }

    await safeNotify({ to_user: request.requester_id, type: 'bell', message: '__blind_date_declined__' })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[blind-date] PATCH error:', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
