export const dynamic = 'force-dynamic'
import { createPortalAdmin } from '@/lib/supabase/portal-admin'
import PortalCustomersManager from '@/components/PortalCustomersManager'

export default async function PortalPage() {
  const db = createPortalAdmin()
  const { data: clients } = await db
    .from('clients')
    .select('*')
    .not('account_number', 'is', null)
    .order('company')
    .order('name')
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Customer Portal</h1>
      <PortalCustomersManager initialCustomers={clients ?? []} />
    </div>
  )
}
