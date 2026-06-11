import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const { to_email, to_name, from_name } = await req.json()

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.log(`[Invite] ${from_name} → ${to_email} (no Resend key)`)
    return NextResponse.json({ success: true, fallback: true })
  }

  const resend = new Resend(resendKey)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.maplemeet.ai'
  const firstName = to_name ? to_name.split(' ')[0] : 'hey'

  const { error } = await resend.emails.send({
    from: 'Maple <invite@maplemeet.ai>',
    to: [to_email],
    subject: `${from_name} thinks you should be on Maple 🍁`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:420px;margin:0 auto;padding:40px 24px;background:#f8f7f4;">
        <div style="text-align:center;margin-bottom:28px;">
          <img src="${appUrl}/maple-logo.svg" alt="🍁" width="56" height="56" style="margin-bottom:12px;" />
          <h1 style="font-size:22px;font-weight:700;color:#111;margin:0 0 4px;">Maple</h1>
          <p style="color:#9b9590;font-size:13px;margin:0;">For the one you've seen a thousand times.</p>
        </div>

        <div style="background:white;border-radius:16px;padding:24px;border:1px solid #e8e6e1;margin-bottom:16px;">
          <p style="color:#6b6760;line-height:1.7;margin:0 0 14px;font-size:14px;">
            Hey ${firstName} 👋
          </p>
          <p style="color:#6b6760;line-height:1.7;margin:0 0 14px;font-size:14px;">
            <strong style="color:#111;">${from_name}</strong> thinks you should be on Maple — a campus dating app built for the Claremont Colleges.
          </p>
          <p style="color:#6b6760;line-height:1.7;margin:0 0 24px;font-size:14px;">
            No photos. No swiping on strangers. You only see people from your campus,
            and you only match if it's mutual. When it clicks, AI plans your first date. 🤖
          </p>
          <div style="text-align:center;">
            <a href="${appUrl}" style="display:inline-block;background:#111;color:white;padding:14px 36px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:-0.01em;">
              shoot your shot →
            </a>
          </div>
        </div>

        <p style="text-align:center;color:#c5c0bb;font-size:11px;margin:0;">
          No photos · Mutual matches only · 5C only
        </p>
        <p style="text-align:center;color:#c5c0bb;font-size:10px;margin-top:8px;">
          You received this because a classmate invited you. Not interested? Just ignore this.
        </p>
      </div>
    `,
  })

  if (error) {
    console.error('[Invite] Resend error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
