import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { scryptSync, timingSafeEqual } from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Constant-time verify against the "<saltHex>:<hashHex>" scrypt format.
function verifyPassword(pw: string, stored: string): boolean {
  const [saltHex, hashHex] = (stored || '').split(':')
  if (!saltHex || !hashHex) return false
  const salt = Buffer.from(saltHex, 'hex')
  const expected = Buffer.from(hashHex, 'hex')
  const actual = scryptSync(pw, salt, expected.length)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

// POST /api/login — email + password
export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Enter your email and password' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, name, password_hash')
    .ilike('email', String(email).trim().toLowerCase())
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: "We couldn't find that email. Sign up first." }, { status: 404 })
  }
  if (!data.password_hash) {
    return NextResponse.json({ error: 'No password set for this account yet.' }, { status: 403 })
  }
  if (!verifyPassword(String(password), data.password_hash)) {
    return NextResponse.json({ error: 'Wrong email or password' }, { status: 401 })
  }

  return NextResponse.json({ id: data.id, name: data.name })
}
