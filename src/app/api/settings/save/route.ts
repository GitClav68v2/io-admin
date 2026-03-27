import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { response: authResponse } = await requireAuth()
  if (authResponse) return authResponse

  const body = await req.json()

  // Fetch existing row to get the id
  const { data: existing } = await supabase.from('company_settings').select('id').single()

  if (existing?.id) {
    const { error } = await supabase
      .from('company_settings')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await supabase
      .from('company_settings')
      .insert({ ...body, updated_at: new Date().toISOString() })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
