'use client'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDateShort, STATUS_COLORS } from '@/lib/utils'
import Link from 'next/link'

interface ProposalRow {
  id: string
  proposal_number: string
  title: string
  grand_total: number
  status: string
  created_at: string
  bill_to_company: string | null
  client?: { name: string; company: string | null } | null
}

export default function ProposalsTable({ proposals }: { proposals: ProposalRow[] }) {
  const router = useRouter()

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {['Proposal #', 'Title / Client', 'Total', 'Status', 'Created'].map(h => (
              <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {proposals.map(p => (
            <tr key={p.id} onClick={() => router.push(`/proposals/${p.id}`)} className="cursor-pointer hover:bg-slate-50 transition-colors">
              <td className="px-5 py-3 font-mono text-xs text-cyan-600">{p.proposal_number}</td>
              <td className="px-5 py-3">
                <span className="font-medium text-cyan-600">{p.title}</span>
                <div className="text-xs text-slate-400">{p.client?.company || p.client?.name || p.bill_to_company || '—'}</div>
              </td>
              <td className="px-5 py-3 font-semibold">{formatCurrency(p.grand_total)}</td>
              <td className="px-5 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[p.status as keyof typeof STATUS_COLORS]}`}>
                  {p.status}
                </span>
              </td>
              <td className="px-5 py-3 text-slate-500">{formatDateShort(p.created_at)}</td>
            </tr>
          ))}
          {!proposals.length && (
            <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400">No proposals yet — <Link href="/proposals/new" className="text-cyan-600 hover:underline">create one</Link></td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
