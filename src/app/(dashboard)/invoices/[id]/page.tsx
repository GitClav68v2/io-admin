import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import InvoiceDetail from '@/components/InvoiceDetail'

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, client:clients(*), line_items:invoice_line_items(*)')
    .eq('id', id)
    .single()
  if (!invoice) notFound()
  return <InvoiceDetail invoice={invoice} />
}
