import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { base64, mimeType } = await req.json()
  if (!base64 || !mimeType) return NextResponse.json({ error: 'Missing image' }, { status: 400 })

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: base64 },
          },
          {
            type: 'text',
            text: `This is a Hyperschedule screenshot from a student at the Claremont Colleges (Claremont, CA).

Extract all class/course time slots. For each class, identify:
- Which days of the week it meets (M/T/W/Th/F)
- Start and end time (in Pacific time)

Then generate busy slots for the next 14 days starting from ${todayStr}.
Use PDT (UTC-7) → convert to UTC for the output.

Return ONLY a valid JSON object in this exact format, no other text:
{
  "busy_slots": [
    { "start": "2026-05-26T17:00:00.000Z", "end": "2026-05-26T18:15:00.000Z" },
    ...
  ],
  "classes_found": 4
}

If you cannot read a valid schedule from the image, return:
{ "error": "no schedule found" }`,
          },
        ],
      }],
    })

    const raw = (message.content[0] as { type: string; text: string }).text.trim()

    // Extract JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'parse failed' }, { status: 422 })

    const parsed = JSON.parse(jsonMatch[0])
    if (parsed.error || !parsed.busy_slots) return NextResponse.json({ error: 'no schedule found' }, { status: 422 })

    return NextResponse.json({ busy_slots: parsed.busy_slots, classes_found: parsed.classes_found ?? 0 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[parse-schedule]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
