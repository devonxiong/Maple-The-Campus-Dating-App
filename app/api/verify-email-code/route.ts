import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const MAX_ATTEMPTS = 5

// POST /api/verify-email-code — check the code for an email.
export async function POST(req: NextRequest) {
  const { email, code } = await req.json()
  const normalized = String(email || '').trim().toLowerCase()
  if (!normalized || !code) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('email_otps')
    .select('code, attempts, expires_at')
    .eq('email', normalized)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: 'No code — request a new one' }, { status: 400 })
  }
  if (new Date(data.expires_at).getTime() < Date.now()) {
    await supabaseAdmin.from('email_otps').delete().eq('email', normalized)
    return NextResponse.json({ error: 'Code expired — request a new one' }, { status: 400 })
  }
  if (data.attempts >= MAX_ATTEMPTS) {
    await supabaseAdmin.from('email_otps').delete().eq('email', normalized)
    return NextResponse.json({ error: 'Too many tries — request a new code' }, { status: 400 })
  }
  if (String(data.code) !== String(code)) {
    await supabaseAdmin.from('email_otps').update({ attempts: data.attempts + 1 }).eq('email', normalized)
    return NextResponse.json({ error: 'Wrong code' }, { status: 400 })
  }

  // Success — consume the code.
  await supabaseAdmin.from('email_otps').delete().eq('email', normalized)
  return NextResponse.json({ success: true })
}
