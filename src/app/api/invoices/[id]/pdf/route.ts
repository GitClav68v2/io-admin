import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { createElement, type ReactElement, type JSXElementConstructor } from 'react'
import InvoicePDF from '@/components/InvoicePDF'
import { requireAuth } from '@/lib/api-auth'

export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response: authResponse } = await requireAuth()
  if (authResponse) return authResponse
  try {
    const { id } = await params
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, line_items:invoice_line_items(*)')
      .eq('id', id)
      .single()

    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const buffer = await renderToBuffer(createElement(InvoicePDF, { invoice }) as ReactElement<DocumentProps, string | JSXElementConstructor<any>>)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoice_number}.pdf"`,
      }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'PDF generation failed' }, { status: 500 })
  }
}
