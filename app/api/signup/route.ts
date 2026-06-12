import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { scryptSync, randomBytes } from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// scrypt password hashing — built into Node, no external dependency.
// Stored format: "<saltHex>:<hashHex>"
function hashPassword(pw: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(pw, salt, 64)
  return `${salt.toString('hex')}:${hash.toString('hex')}`
}

// POST /api/signup — create the account at the end of onboarding.
// Phone is already verified (Twilio) and school email is OAuth-verified,
// so we insert with email_verified = true.
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email, phone, name, gender, want_to_date, year, top_spots, password, campus } = body

  if (!email || !phone || !name || !gender || !Array.isArray(want_to_date) || want_to_date.length === 0 || !password) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (String(password).length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  // One account per phone number (app-level check; DB unique index is the backstop).
  const { data: phoneTaken } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('phone', phone)
    .maybeSingle()
  if (phoneTaken) {
    return NextResponse.json({ error: 'This phone number is already registered. Log in instead.' }, { status: 409 })
  }

  const password_hash = hashPassword(String(password))

  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({
      email: String(email).toLowerCase(),
      phone,
      name,
      gender,
      want_to_date,
      top_spots: Array.isArray(top_spots) ? top_spots : [],
      campus: campus || 'Main Campus',
      email_verified: true,
      password_hash,
    })
    .select('id, name')
    .single()

  if (error) {
    if (error.code === '23505') {
      const dup = `${error.message} ${error.details ?? ''}`.toLowerCase()
      const isPhone = dup.includes('phone')
      return NextResponse.json({
        error: isPhone
          ? 'This phone number is already registered. Log in instead.'
          : 'This email is already registered. Log in instead.',
      }, { status: 409 })
    }
    console.error('[signup] insert error:', error)
    return NextResponse.json({ error: 'Sign up failed. Try again.' }, { status: 500 })
  }

  // Best-effort: persist year only if the column exists. Never blocks signup.
  if (year) {
    await supabaseAdmin.from('users').update({ year }).eq('id', data.id)
      .then(({ error: e }) => { if (e) console.warn('[signup] year not saved (add column?):', e.message) })
  }

  return NextResponse.json({ id: data.id, name: data.name })
}
