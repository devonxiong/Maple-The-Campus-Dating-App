import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const { reporter_id, reported_id, reason } = await req.json()
  if (!reporter_id || !reported_id || !reason) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Insert report
  await supabase.from('reports').insert({ reporter_id, reported_id, reason })

  // Auto-block so reported user disappears immediately
  await supabase.from('swipes').upsert(
    { from_user: reporter_id, to_user: reported_id, sentiment: 'block' },
    { onConflict: 'from_user,to_user' }
  )

  // Notify admin
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    const resend = new Resend(resendKey)
    await resend.emails.send({
      from: 'Maple <invite@maplemeet.ai>',
      to: ['hello@maplemeet.ai'],
      subject: `⚠️ Report: ${reason}`,
      html: `
        <div style="font-family:monospace;padding:24px;background:#f8f7f4;">
          <h2 style="color:#111;margin:0 0 16px;">New report</h2>
          <p><strong>Reason:</strong> ${reason}</p>
          <p><strong>Reporter:</strong> ${reporter_id}</p>
          <p><strong>Reported:</strong> ${reported_id}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        </div>
      `,
    }).catch(() => {})
  }

  return NextResponse.json({ success: true })
}
