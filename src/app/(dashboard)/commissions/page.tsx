import { createClient } from '@/lib/supabase/server'
import CommissionsReport from '@/components/CommissionsReport'
import CommissionRatesManager from '@/components/CommissionRatesManager'

export default async function CommissionsPage() {
  const supabase = await createClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, line_items:invoice_line_items(*)')
    .order('issue_date', { ascending: false })

  const { data: commissionRates } = await supabase
    .from('commission_rates')
    .select('*')
    .order('effective_date', { ascending: false })

  return (
    <div className="p-4 md:p-8 space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Commissions</h1>
      <CommissionsReport
        initialInvoices={invoices ?? []}
        commissionRates={commissionRates ?? []}
      />
      <CommissionRatesManager initialRates={commissionRates ?? []} />
    </div>
  )
}
