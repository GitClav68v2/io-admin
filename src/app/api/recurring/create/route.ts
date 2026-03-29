import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VALID_FREQ = ['monthly', 'quarterly', 'annual']

export async function POST(req: NextRequest) {
  const { response: authResponse } = await requireAuth()
  if (authResponse) return authResponse

  const { invoice_id, frequency, next_due_date, end_date, notes } = await req.json()

  if (!invoice_id || !frequency || !next_due_date) {
    return NextResponse.json({ error: 'invoice_id, frequency, and next_due_date are required' }, { status: 400 })
  }
  if (!VALID_FREQ.includes(frequency)) {
    return NextResponse.json({ error: 'Invalid frequency' }, { status: 400 })
  }

  // Verify invoice exists
  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, client_id')
    .eq('id', invoice_id)
    .single()

  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

  // Check no existing active recurring schedule for this invoice
  const { data: existing } = await supabase
    .from('recurring_invoices')
    .select('id')
    .eq('template_invoice_id', invoice_id)
    .eq('active', true)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Active recurring schedule already exists for this invoice' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('recurring_invoices')
    .insert({
      template_invoice_id: invoice_id,
      client_id: invoice.client_id,
      frequency,
      next_due_date,
      end_date: end_date || null,
      notes: notes || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
