import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency, formatDateShort, STATUS_COLORS } from '@/lib/utils'
import { Plus, FileText, Receipt, Users } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ data: proposals }, { data: invoices }, { data: clients }] = await Promise.all([
    supabase.from('proposals').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('invoices').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('clients').select('id', { count: 'exact' }),
  ])

  const openProposals  = proposals?.filter(p => ['draft','sent'].includes(p.status)).length ?? 0
  const unpaidInvoices = invoices?.filter(i => ['unpaid','partial'].includes(i.status)).length ?? 0
  const totalClients   = clients?.length ?? 0

  const stats = [
    { label: 'Open Proposals', value: openProposals,  icon: FileText, href: '/proposals', color: 'text-blue-600' },
    { label: 'Unpaid Invoices', value: unpaidInvoices, icon: Receipt,  href: '/invoices',  color: 'text-red-500'  },
    { label: 'Total Clients',   value: totalClients,   icon: Users,    href: '/clients',   color: 'text-cyan-500' },
  ]

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <Link href="/proposals/new"
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
          <Plus size={16} /> New Proposal
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mb-10">
        {stats.map(({ label, value, icon: Icon, href, color }) => (
          <Link key={label} href={href}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:border-cyan-300 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-500">{label}</span>
              <Icon size={18} className={color} />
            </div>
            <div className="text-3xl font-bold text-slate-900">{value}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Recent Proposals */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Recent Proposals</h2>
            <Link href="/proposals" className="text-xs text-cyan-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {proposals?.map(p => (
              <Link key={p.id} href={`/proposals/${p.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                <div>
                  <div className="text-sm font-medium text-slate-800">{p.title}</div>
                  <div className="text-xs text-slate-400">{p.proposal_number} · {formatDateShort(p.created_at)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-700">{formatCurrency(p.grand_total)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[p.status as keyof typeof STATUS_COLORS]}`}>
                    {p.status}
                  </span>
                </div>
              </Link>
            ))}
            {!proposals?.length && <p className="px-5 py-8 text-sm text-slate-400 text-center">No proposals yet</p>}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Recent Invoices</h2>
            <Link href="/invoices" className="text-xs text-cyan-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {invoices?.map(inv => (
              <Link key={inv.id} href={`/invoices/${inv.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                <div>
                  <div className="text-sm font-medium text-slate-800">{inv.title}</div>
                  <div className="text-xs text-slate-400">{inv.invoice_number} · {formatDateShort(inv.issue_date)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-700">{formatCurrency(inv.balance_due)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[inv.status as keyof typeof STATUS_COLORS]}`}>
                    {inv.status}
                  </span>
                </div>
              </Link>
            ))}
            {!invoices?.length && <p className="px-5 py-8 text-sm text-slate-400 text-center">No invoices yet</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
