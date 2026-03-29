import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Download } from 'lucide-react'
import { formatCurrency, formatDateShort, STATUS_COLORS } from '@/lib/utils'
import InvoicesPageClient from '@/components/InvoicesPageClient'

export default async function InvoicesPage() {
  const supabase = await createClient()
  const [{ data: invoices }, { data: recurring }] = await Promise.all([
    supabase
      .from('invoices')
      .select('*, client:clients(name, company)')
      .order('created_at', { ascending: false }),
    supabase
      .from('recurring_invoices')
      .select('*, template_invoice:invoices(invoice_number, title, grand_total, bill_to_company, bill_to_name), client:clients(name, company)')
      .order('next_due_date', { ascending: true }),
  ])

  return (
    <InvoicesPageClient
      invoices={invoices ?? []}
      recurring={recurring ?? []}
    />
  )
}
