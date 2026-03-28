import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency, formatDateShort, STATUS_COLORS } from '@/lib/utils'
import { Plus } from 'lucide-react'

export default async function ProposalsPage() {
  const supabase = await createClient()
  const { data: proposals } = await supabase
    .from('proposals')
    .select('*, client:clients(name, company)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Proposals</h1>
        <Link href="/proposals/new"
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
          <Plus size={16} /> New Proposal
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Proposal #', 'Title / Client', 'Total', 'Status', 'Created', ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {proposals?.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 font-mono text-xs">
                  <Link href={`/proposals/${p.id}`} className="text-cyan-600 hover:underline">{p.proposal_number}</Link>
                </td>
                <td className="px-5 py-3">
                  <Link href={`/proposals/${p.id}`} className="font-medium text-cyan-600 hover:underline">{p.title}</Link>
                  <div className="text-xs text-slate-400">{p.client?.company || p.client?.name || p.bill_to_company || '—'}</div>
                </td>
                <td className="px-5 py-3 font-semibold">{formatCurrency(p.grand_total)}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[p.status as keyof typeof STATUS_COLORS]}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-500">{formatDateShort(p.created_at)}</td>
                <td className="px-5 py-3">
                  <Link href={`/proposals/${p.id}`} className="text-cyan-600 hover:underline text-xs font-medium">Open →</Link>
                </td>
              </tr>
            ))}
            {!proposals?.length && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">No proposals yet — <Link href="/proposals/new" className="text-cyan-600 hover:underline">create one</Link></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
