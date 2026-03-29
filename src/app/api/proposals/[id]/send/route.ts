import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { createElement, type ReactElement, type JSXElementConstructor } from 'react'
import ProposalPDF from '@/components/ProposalPDF'
import { requireAuth } from '@/lib/api-auth'
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
  try {
    const { id } = await params
    const { data: proposal } = await supabase
      .from('proposals')
      .select('*, line_items:proposal_line_items(*)')
      .eq('id', id)
      .single()

    if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!proposal.bill_to_email) return NextResponse.json({ error: 'No client email on proposal' }, { status: 400 })

    const settings = await getCompanySettings()
    const buffer = await renderToBuffer(createElement(ProposalPDF, { proposal, settings }) as ReactElement<DocumentProps, string | JSXElementConstructor<any>>)

    const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
    const template = await getEmailTemplate('proposal_send')
    const vars = {
      client_name: proposal.bill_to_company || proposal.bill_to_name || 'there',
      proposal_number: proposal.proposal_number,
      project_name: proposal.project_name || proposal.title,
      grand_total: fmt(proposal.grand_total),
      monthly_recurring: proposal.monthly_recurring > 0 ? fmt(proposal.monthly_recurring) : '',
      valid_days: String(proposal.valid_days),
      rep_name: proposal.rep_name || 'The IntegrationOne Team',
      company_phone: settings.phone || '(949) 233-1833',
    }

    const { error } = await resend.emails.send({
      from: 'IntegrationOne <info@integrationone.net>',
      to: proposal.bill_to_email,
      cc: 'info@integrationone.net',
      subject: await renderTemplate(template.subject, vars),
      html: await renderTemplate(template.body_html, vars),
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
