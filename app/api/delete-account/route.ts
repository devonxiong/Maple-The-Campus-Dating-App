import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service-role client so we can delete the user + all their rows past RLS.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// POST /api/delete-account — permanently delete the account and its data.
export async function POST(req: NextRequest) {
  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  // Best-effort cleanup of rows that reference this user (ignore missing tables).
  const cleanups = [
    supabaseAdmin.from('swipes').delete().or(`from_user.eq.${userId},to_user.eq.${userId}`),
    supabaseAdmin.from('matches').delete().or(`user_a.eq.${userId},user_b.eq.${userId}`),
    supabaseAdmin.from('user_presence').delete().eq('user_id', userId),
    supabaseAdmin.from('blind_date_requests').delete().or(`requester_id.eq.${userId},target_id.eq.${userId}`),
    supabaseAdmin.from('notifications').delete().or(`to_user.eq.${userId},from_user.eq.${userId}`),
    supabaseAdmin.from('reports').delete().or(`reporter_id.eq.${userId},target_id.eq.${userId}`),
  ]
  await Promise.allSettled(cleanups)

  // Remove the stored avatar (best-effort).
  try {
    const { data: files } = await supabaseAdmin.storage.from('avatars').list('', { search: userId })
    if (files?.length) {
      await supabaseAdmin.storage.from('avatars').remove(files.map(f => f.name))
    }
  } catch { /* bucket may not exist */ }

  const { error } = await supabaseAdmin.from('users').delete().eq('id', userId)
  if (error) {
    console.error('[delete-account] error:', error)
    return NextResponse.json({ error: 'Could not delete account' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
