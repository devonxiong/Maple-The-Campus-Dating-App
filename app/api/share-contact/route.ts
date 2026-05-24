import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER ?? '+18449094525'

export async function POST(req: NextRequest) {
  try {
    const { matchId, fromUserId } = await req.json()
    if (!matchId || !fromUserId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    // Get match + both users
    const { data: match } = await supabase
      .from('matches')
      .select('user_a, user_b')
      .eq('id', matchId)
      .single()
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

    const toUserId = match.user_a === fromUserId ? match.user_b : match.user_a

    const [{ data: fromUser }, { data: toUser }] = await Promise.all([
      supabase.from('users').select('name, phone').eq('id', fromUserId).single(),
      supabase.from('users').select('name, phone').eq('id', toUserId).single(),
    ])

    if (!fromUser || !toUser) return NextResponse.json({ error: 'Users not found' }, { status: 404 })

    // Send SMS to the other person with the requester's number
    await twilioClient.messages.create({
      to: toUser.phone,
      from: TWILIO_PHONE,
      body: `🍁 ${fromUser.name} wants to stay in touch!\n\ntheir number: ${fromUser.phone}\n\nsave it and shoot your shot 😎`,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[share-contact]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
