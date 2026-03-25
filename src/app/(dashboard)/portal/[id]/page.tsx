import { createPortalAdmin } from '@/lib/supabase/portal-admin'
import PortalCustomerDetail from '@/components/PortalCustomerDetail'
import { notFound } from 'next/navigation'

export default async function PortalCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createPortalAdmin()
  const [{ data: customer }, { data: invoices }] = await Promise.all([
    db.from('customers').select('*').eq('id', id).single(),
    db.from('invoices').select('*').eq('customer_id', id).order('invoice_date', { ascending: false })
  ])
  if (!customer) notFound()
  return <PortalCustomerDetail customer={customer} initialInvoices={invoices ?? []} />
}
