import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { createElement, type ReactElement, type JSXElementConstructor } from 'react'
import InvoicePDF from '@/components/InvoicePDF'
import { getCompanySettings } from '@/lib/settings'
import { getEmailTemplate, renderTemplate } from '@/lib/email-templates'

export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response: authResponse } = await requireAuth()
  if (authResponse) return authResponse
  const { id } = await params
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, line_items:invoice_line_items(*)')
    .eq('id', id)
    .single()

  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!invoice.bill_to_email) return NextResponse.json({ error: 'No client email' }, { status: 400 })

  const settings = await getCompanySettings()
  const buffer = await renderToBuffer(createElement(InvoicePDF, { invoice, settings }) as ReactElement<DocumentProps, string | JSXElementConstructor<any>>)
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const template = await getEmailTemplate('invoice_send')
  const vars = {
    client_name: invoice.bill_to_company || invoice.bill_to_name || 'there',
    invoice_number: invoice.invoice_number,
    due_date: invoice.due_date || 'Upon receipt',
    balance_due: fmt(invoice.balance_due),
    rep_name: invoice.rep_name || 'The Integration One Team',
    company_phone: settings.phone || '(949) 233-1833',
  }

  const { error } = await resend.emails.send({
    from: 'Integration One <info@integrationone.net>',
    to: invoice.bill_to_email,
    cc: 'info@integrationone.net',
    subject: await renderTemplate(template.subject, vars),
    html: await renderTemplate(template.body_html, vars),
    attachments: [{
      filename: `${invoice.invoice_number}.pdf`,
      content: Buffer.from(buffer).toString('base64'),
    }]
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await supabase.from('invoices').update({ sent_at: new Date().toISOString() }).eq('id', id)
  return NextResponse.json({ success: true })
}
