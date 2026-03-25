import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { createElement, type ReactElement, type JSXElementConstructor } from 'react'
import InvoicePDF from '@/components/InvoicePDF'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, line_items:invoice_line_items(*)')
    .eq('id', id)
    .single()

  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!invoice.bill_to_email) return NextResponse.json({ error: 'No client email' }, { status: 400 })

  const buffer = await renderToBuffer(createElement(InvoicePDF, { invoice }) as ReactElement<DocumentProps, string | JSXElementConstructor<any>>)
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  const clientName = invoice.bill_to_company || invoice.bill_to_name || 'there'

  const { error } = await resend.emails.send({
    from: 'Integration One <info@integrationone.net>',
    to: invoice.bill_to_email,
    cc: 'info@integrationone.net',
    subject: `Invoice from Integration One — ${invoice.invoice_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; color: #0F172A;">
        <div style="background: #0F172A; padding: 24px 28px;">
          <span style="font-size: 20px; font-weight: bold; color: white;">INTEGRATION</span>
          <span style="font-size: 20px; font-weight: bold; color: #06B6D4;">ONE</span>
        </div>
        <div style="padding: 32px 28px;">
          <h2 style="color: #0F172A; margin: 0 0 16px;">Hi ${clientName},</h2>
          <p style="color: #64748B; line-height: 1.7;">
            Please find your invoice attached — <strong>${invoice.invoice_number}</strong>.
          </p>
          <div style="background: #F1F5F9; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #64748B;">Invoice</span><strong>${invoice.invoice_number}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #64748B;">Due Date</span><strong>${invoice.due_date || 'Upon receipt'}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 1px solid #E2E8F0; padding-top: 12px; margin-top: 8px;">
              <span style="color: #64748B;">Balance Due</span>
              <strong style="color: #EF4444; font-size: 18px;">${fmt(invoice.balance_due)}</strong>
            </div>
          </div>
          <p style="color: #64748B; line-height: 1.7;">
            Questions? Reply to this email or call <strong>(949) 233-1833</strong>.
          </p>
          <p style="color: #64748B; margin-top: 24px;">
            Best regards,<br/>
            <strong>${invoice.rep_name || 'The Integration One Team'}</strong><br/>
            Integration One
          </p>
        </div>
        <div style="background: #F8FAFC; padding: 16px 28px; border-top: 1px solid #E2E8F0;">
          <p style="color: #94A3B8; font-size: 12px; margin: 0;">Integration One · integrationone.net · CA Lic. #987654</p>
        </div>
      </div>
    `,
    attachments: [{
      filename: `${invoice.invoice_number}.pdf`,
      content: Buffer.from(buffer).toString('base64'),
    }]
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await supabase.from('invoices').update({ sent_at: new Date().toISOString() }).eq('id', id)
  return NextResponse.json({ success: true })
}
