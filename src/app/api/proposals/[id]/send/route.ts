import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { createElement, type ReactElement, type JSXElementConstructor } from 'react'
import ProposalPDF from '@/components/ProposalPDF'

export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { data: proposal } = await supabase
      .from('proposals')
      .select('*, line_items:proposal_line_items(*)')
      .eq('id', id)
      .single()

    if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!proposal.bill_to_email) return NextResponse.json({ error: 'No client email on proposal' }, { status: 400 })

    const buffer = await renderToBuffer(createElement(ProposalPDF, { proposal }) as ReactElement<DocumentProps, string | JSXElementConstructor<any>>)

    const clientName = proposal.bill_to_company || proposal.bill_to_name || 'there'
    const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

    const { error } = await resend.emails.send({
      from: 'Integration One <info@integrationone.net>',
      to: proposal.bill_to_email,
      cc: 'info@integrationone.net',
      subject: `Your Proposal from Integration One — ${proposal.proposal_number}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; color: #0F172A;">
          <div style="background: #0F172A; padding: 24px 28px;">
            <span style="font-size: 20px; font-weight: bold; color: white;">INTEGRATION</span>
            <span style="font-size: 20px; font-weight: bold; color: #06B6D4;">ONE</span>
          </div>
          <div style="padding: 32px 28px;">
            <h2 style="color: #0F172A; margin: 0 0 16px;">Hi ${clientName},</h2>
            <p style="color: #64748B; line-height: 1.7;">
              Thank you for the opportunity to put together a security proposal for you.
              Please find your proposal attached as a PDF — <strong>${proposal.proposal_number}</strong>.
            </p>
            <div style="background: #F1F5F9; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #64748B;">Proposal</span>
                <strong>${proposal.proposal_number}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #64748B;">Project</span>
                <strong>${proposal.project_name || proposal.title}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; border-top: 1px solid #E2E8F0; padding-top: 12px; margin-top: 12px;">
                <span style="color: #64748B;">One-Time Total</span>
                <strong style="color: #06B6D4; font-size: 18px;">${fmt(proposal.grand_total)}</strong>
              </div>
              ${proposal.monthly_recurring > 0 ? `<div style="display: flex; justify-content: space-between; margin-top: 6px;">
                <span style="color: #64748B; font-size: 13px;">Monthly Recurring (separate)</span>
                <span style="font-size: 13px;">${fmt(proposal.monthly_recurring)}/mo</span>
              </div>` : ''}
            </div>
            <p style="color: #64748B; line-height: 1.7;">
              This proposal is valid for <strong>${proposal.valid_days} days</strong>.
              To accept, simply sign the proposal and return it to us, or reply to this email.
              We'll take care of the rest.
            </p>
            <p style="color: #64748B; line-height: 1.7;">
              Questions? Reply to this email or call us at <strong>(949) 233-1833</strong>.
              We're happy to walk you through anything.
            </p>
            <p style="color: #64748B; margin-top: 24px;">
              Best regards,<br/>
              <strong>${proposal.rep_name || 'The Integration One Team'}</strong><br/>
              Integration One<br/>
              <a href="https://www.integrationone.net" style="color: #06B6D4;">integrationone.net</a>
            </p>
          </div>
          <div style="background: #F8FAFC; padding: 16px 28px; border-top: 1px solid #E2E8F0;">
            <p style="color: #94A3B8; font-size: 12px; margin: 0;">
              Integration One · integrationone.net · CA Lic. #987654
            </p>
          </div>
        </div>
      `,
      attachments: [{
        filename: `${proposal.proposal_number}.pdf`,
        content: Buffer.from(buffer).toString('base64'),
      }]
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabase.from('proposals').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', id)

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Failed to send proposal' }, { status: 500 })
  }
}
