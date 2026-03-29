import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency, formatDateShort, STATUS_COLORS } from '@/lib/utils'
import { Plus, FileText, Receipt, Users, RefreshCw } from 'lucide-react'
import DashboardCharts from '@/components/DashboardCharts'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ data: proposals }, { data: recentInvoices }, { data: clients }, { data: allInvoices }, { data: upcomingRecurring }] = await Promise.all([
    supabase.from('proposals').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('invoices').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('clients').select('id', { count: 'exact' }),
    supabase.from('invoices').select('id, status, grand_total, amount_paid, balance_due, paid_at, due_date, issue_date'),
    supabase.from('recurring_invoices')
      .select('*, template_invoice:invoices(invoice_number, title, grand_total, bill_to_company), client:clients(name, company)')
      .eq('active', true)
      .order('next_due_date', { ascending: true })
      .limit(5),
  ])

  const openProposals  = proposals?.filter(p => ['draft','sent'].includes(p.status)).length ?? 0
  const unpaidInvoices = recentInvoices?.filter(i => ['unpaid','partial'].includes(i.status)).length ?? 0
  const totalClients   = clients?.length ?? 0

  // ── Compute revenue by month (last 12 months) ─────────────────
  const now = new Date()
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const monthlyMap = new Map<string, number>()

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyMap.set(key, 0)
  }

  for (const inv of allInvoices ?? []) {
    if (!inv.paid_at || inv.amount_paid <= 0) continue
    const d = new Date(inv.paid_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (monthlyMap.has(key)) {
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + inv.amount_paid)
    }
  }

  const monthlyRevenue = Array.from(monthlyMap.entries()).map(([key, revenue]) => ({
    month: monthNames[parseInt(key.split('-')[1]) - 1],
    revenue,
  }))

  // ── Compute aging receivables ─────────────────────────────────
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const bucketDefs = [
    { label: 'Current (0–30 days)', color: '#10B981' },
    { label: '31–60 days', color: '#F59E0B' },
    { label: '61–90 days', color: '#F97316' },
    { label: '90+ days', color: '#EF4444' },
  ]
  const bucketAmounts = [0, 0, 0, 0]
  const bucketCounts  = [0, 0, 0, 0]
  let totalOutstanding = 0

  for (const inv of allInvoices ?? []) {
    if (inv.status !== 'unpaid' && inv.status !== 'partial') continue
    const due = inv.due_date ? new Date(inv.due_date + 'T00:00:00') : new Date(inv.issue_date + 'T00:00:00')
    const daysOverdue = Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86400000))
    const idx = daysOverdue <= 30 ? 0 : daysOverdue <= 60 ? 1 : daysOverdue <= 90 ? 2 : 3
    bucketAmounts[idx] += inv.balance_due
    bucketCounts[idx]++
    totalOutstanding += inv.balance_due
  }

  const agingBuckets = bucketDefs.map((def, i) => ({
    ...def,
    amount: bucketAmounts[i],
    count: bucketCounts[i],
  }))

  const stats = [
    { label: 'Open Proposals', value: openProposals,  icon: FileText, href: '/proposals', color: 'text-blue-600' },
    { label: 'Unpaid Invoices', value: unpaidInvoices, icon: Receipt,  href: '/invoices',  color: 'text-red-500'  },
    { label: 'Total Clients',   value: totalClients,   icon: Users,    href: '/clients',   color: 'text-cyan-500' },
  ]

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <Link href="/proposals/new"
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
          <Plus size={16} /> New Proposal
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
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

      {/* Charts */}
      <DashboardCharts
        monthlyRevenue={monthlyRevenue}
        agingBuckets={agingBuckets}
        totalOutstanding={totalOutstanding}
      />

      {/* Upcoming Recurring */}
      {(upcomingRecurring?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <RefreshCw size={15} className="text-purple-500" /> Upcoming Recurring
            </h2>
            <Link href="/invoices" className="text-xs text-cyan-600 hover:underline">Manage</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {upcomingRecurring?.map(r => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-medium text-slate-800">{r.template_invoice?.title}</div>
                  <div className="text-xs text-slate-400">
                    {r.client?.company || r.client?.name || r.template_invoice?.bill_to_company || '—'} · {r.frequency}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-700">{formatCurrency(r.template_invoice?.grand_total ?? 0)}</div>
                  <div className="text-xs text-slate-400">Due {formatDateShort(r.next_due_date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            {recentInvoices?.map(inv => (
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
            {!recentInvoices?.length && <p className="px-5 py-8 text-sm text-slate-400 text-center">No invoices yet</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
