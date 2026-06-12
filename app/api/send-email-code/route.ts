import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// Use the service-role key (server-only) so OTP codes are never exposed to the
// anon/public client. email_otps has RLS enabled with no policies.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

// POST /api/send-email-code — generate a 6-digit code, store it, email it.
export async function POST(req: NextRequest) {
  const { email } = await req.json()
  const normalized = String(email || '').trim().toLowerCase()
  if (!normalized || !EMAIL_RE.test(normalized)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const code = String(Math.floor(100000 + Math.random() * 900000))
  const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 min

  const { error: dbErr } = await supabaseAdmin
    .from('email_otps')
    .upsert({ email: normalized, code, attempts: 0, expires_at }, { onConflict: 'email' })
  if (dbErr) {
    console.error('[send-email-code] db error:', dbErr)
    return NextResponse.json({ error: 'Could not start verification' }, { status: 500 })
  }

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.log(`[send-email-code] ${normalized} code=${code} (no Resend key)`)
    return NextResponse.json({ success: true, fallback: true })
  }

  const resend = new Resend(resendKey)
  const { error } = await resend.emails.send({
    from: 'Maple <verify@maplemeet.ai>',
    to: [normalized],
    subject: `${code} is your Maple verification code`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:420px;margin:0 auto;padding:40px 24px;background:#f8f7f4;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="font-size:22px;font-weight:700;color:#111;margin:0 0 4px;">🍁 Maple</h1>
          <p style="color:#9b9590;font-size:13px;margin:0;">For the one you've seen a thousand times.</p>
        </div>
        <div style="background:white;border-radius:16px;padding:28px 24px;border:1px solid #e8e6e1;text-align:center;">
          <p style="color:#6b6760;font-size:14px;margin:0 0 16px;">Your verification code is</p>
          <p style="font-size:34px;font-weight:700;letter-spacing:8px;color:#111;margin:0 0 16px;">${code}</p>
          <p style="color:#9b9590;font-size:12px;margin:0;">Expires in 10 minutes. If you didn't request this, ignore this email.</p>
        </div>
      </div>
    `,
  })
  if (error) {
    console.error('[send-email-code] resend error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
