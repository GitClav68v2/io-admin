import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import InvoiceDetail from '@/components/InvoiceDetail'

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: invoice }, { data: recurring }] = await Promise.all([
    supabase
      .from('invoices')
      .select('*, client:clients(*), line_items:invoice_line_items(*)')
      .eq('id', id)
      .single(),
    supabase
      .from('recurring_invoices')
      .select('id')
      .eq('template_invoice_id', id)
      .eq('active', true)
      .limit(1),
  ])
  if (!invoice) notFound()
  return <InvoiceDetail invoice={invoice} hasRecurring={!!recurring?.length} />
}
