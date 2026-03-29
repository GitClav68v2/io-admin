import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VALID_TYPES = ['proposal_send', 'invoice_send', 'invoice_reminder', 'payment_receipt']

export async function POST(req: NextRequest) {
  const { response: authResponse } = await requireAuth()
  if (authResponse) return authResponse

  const { type, subject, body_html } = await req.json()

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid template type' }, { status: 400 })
  }
  if (!subject || !body_html) {
    return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('email_templates')
    .select('id')
    .eq('type', type)
    .single()

  if (existing?.id) {
    const { error } = await supabase
      .from('email_templates')
      .update({ subject, body_html, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await supabase
      .from('email_templates')
      .insert({ type, subject, body_html, updated_at: new Date().toISOString() })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
