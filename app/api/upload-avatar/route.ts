import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service-role client so we can manage the storage bucket and bypass RLS.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const BUCKET = 'avatars'

async function ensureBucket() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  if (!buckets?.some(b => b.name === BUCKET)) {
    await supabaseAdmin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
    })
  }
}

// POST /api/upload-avatar — multipart { file, userId }
export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file') as File | null
  const userId = form.get('userId') as string | null

  if (!file || !userId) {
    return NextResponse.json({ error: 'Missing file or userId' }, { status: 400 })
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Please select an image' }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Photo too large — max 5MB' }, { status: 400 })
  }

  try {
    await ensureBucket()

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const path = `${userId}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: upErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, { upsert: true, contentType: file.type })
    if (upErr) {
      console.error('[upload-avatar] upload error:', upErr)
      return NextResponse.json({ error: 'Upload failed — try again' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
    await supabaseAdmin.from('users').update({ avatar_url: publicUrl }).eq('id', userId)

    return NextResponse.json({ url: publicUrl })
  } catch (e) {
    console.error('[upload-avatar] error:', e)
    return NextResponse.json({ error: 'Upload failed — try again' }, { status: 500 })
  }
}
