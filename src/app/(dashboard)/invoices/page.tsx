import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency, formatDateShort, STATUS_COLORS } from '@/lib/utils'

export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, client:clients(name, company)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Invoices</h1>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Invoice #', 'Title / Client', 'Total', 'Balance Due', 'Status', 'Due Date', ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {invoices?.map(inv => (
              <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-slate-500">{inv.invoice_number}</td>
                <td className="px-5 py-3">
                  <div className="font-medium text-slate-800">{inv.title}</div>
                  <div className="text-xs text-slate-400">{inv.client?.company || inv.client?.name || inv.bill_to_company || '—'}</div>
                </td>
                <td className="px-5 py-3 font-semibold">{formatCurrency(inv.grand_total)}</td>
                <td className="px-5 py-3 font-semibold text-red-600">{formatCurrency(inv.balance_due)}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[inv.status as keyof typeof STATUS_COLORS]}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-500">{formatDateShort(inv.due_date)}</td>
                <td className="px-5 py-3">
                  <Link href={`/invoices/${inv.id}`} className="text-cyan-600 hover:underline text-xs font-medium">Open →</Link>
                </td>
              </tr>
            ))}
            {!invoices?.length && (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">No invoices yet — convert an accepted proposal to create one</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
