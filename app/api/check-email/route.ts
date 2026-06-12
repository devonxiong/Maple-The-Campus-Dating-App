import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET /api/check-email?email=... — is this email already registered? (case-insensitive)
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase()
  if (!email) return NextResponse.json({ exists: false })
  const { data } = await supabaseAdmin
    .from('users')
    .select('id')
    .ilike('email', email)
    .maybeSingle()
  return NextResponse.json({ exists: !!data })
}
