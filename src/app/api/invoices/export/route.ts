import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

function toRow(fields: (string | number | null | undefined)[]): string {
  return fields.map(escapeCSV).join(',')
}

export async function GET(req: NextRequest) {
  const { response: authResponse } = await requireAuth()
  if (authResponse) return authResponse

  const { searchParams } = new URL(req.url)
  const from   = searchParams.get('from')
  const to     = searchParams.get('to')
  const status = searchParams.get('status')

  let query = supabase
    .from('invoices')
    .select('*, line_items:invoice_line_items(*)')
    .order('issue_date', { ascending: false })

  if (from)   query = query.gte('issue_date', from)
  if (to)     query = query.lte('issue_date', to)
  if (status) query = query.eq('status', status)

  const { data: invoices, error } = await query

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const headers = ['InvoiceNo', 'Customer', 'InvoiceDate', 'DueDate', 'Item', 'Description', 'Qty', 'Rate', 'Amount', 'Tax']
  const rows: string[] = [headers.join(',')]

  for (const inv of invoices ?? []) {
    const customer = inv.bill_to_company || inv.bill_to_name || ''
    const lineItems: any[] = inv.line_items ?? []

    if (lineItems.length === 0) {
      rows.push(toRow([
        inv.invoice_number,
        customer,
        inv.issue_date,
        inv.due_date ?? '',
        '',
        '',
        '',
        '',
        '',
        '',
      ]))
    } else {
      for (const item of lineItems) {
        rows.push(toRow([
          inv.invoice_number,
          customer,
          inv.issue_date,
          inv.due_date ?? '',
          item.name,
          item.description ?? '',
          item.qty,
          item.unit_price,
          item.total,
          item.taxable ? 'Tax' : '',
        ]))
      }
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const csv = rows.join('\n')

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="invoices-export-${today}.csv"`,
    },
  })
}
