import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function getTwilio() {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID
  if (!sid || !token || !verifySid) return null
  return { client: twilio(sid, token), verifySid }
}

// POST /api/verify-phone — send SMS OTP.
// userId is optional: in the new onboarding the account doesn't exist yet,
// so we verify the phone on its own (Twilio Verify is keyed by phone number).
export async function POST(req: NextRequest) {
  const { phone } = await req.json()
  if (!phone) {
    return NextResponse.json({ error: 'Missing phone' }, { status: 400 })
  }

  const tw = getTwilio()
  if (!tw) {
    return NextResponse.json({ error: 'SMS not configured' }, { status: 500 })
  }

  try {
    await tw.client.verify.v2
      .services(tw.verifySid)
      .verifications.create({ to: phone, channel: 'sms' })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[verify-phone] Twilio error:', err)
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 })
  }
}

// PUT /api/verify-phone — confirm OTP code.
// userId optional: if provided (legacy flow) we flip email_verified; otherwise
// we just confirm the code and let the caller create the account afterward.
export async function PUT(req: NextRequest) {
  const { userId, phone, code } = await req.json()
  if (!phone || !code) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const tw = getTwilio()
  if (!tw) {
    return NextResponse.json({ error: 'SMS not configured' }, { status: 500 })
  }

  try {
    const check = await tw.client.verify.v2
      .services(tw.verifySid)
      .verificationChecks.create({ to: phone, code })

    if (check.status !== 'approved') {
      return NextResponse.json({ error: 'Wrong code' }, { status: 400 })
    }

    if (userId) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({ email_verified: true })
        .eq('id', userId)
        .select('id, name')
        .single()
      if (error || !data) {
        return NextResponse.json({ error: 'DB error' }, { status: 500 })
      }
      return NextResponse.json({ success: true, name: data.name })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[verify-phone] Twilio check error:', err)
    return NextResponse.json({ error: 'Wrong code' }, { status: 400 })
  }
}
