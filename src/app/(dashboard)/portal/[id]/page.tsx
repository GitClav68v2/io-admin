export const dynamic = 'force-dynamic'
import { createPortalAdmin } from '@/lib/supabase/portal-admin'
import PortalCustomerDetail from '@/components/PortalCustomerDetail'
import { notFound } from 'next/navigation'

export default async function PortalCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createPortalAdmin()
  const [{ data: client }, { data: invoices }] = await Promise.all([
    db.from('clients').select('*').eq('id', id).single(),
    db.from('portal_invoices').select('*').eq('client_id', id).order('invoice_date', { ascending: false })
  ])
  if (!client) notFound()
  return <PortalCustomerDetail client={client} initialInvoices={invoices ?? []} />
}
