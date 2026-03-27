'use client'
import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Invoice, InvoiceLineItem, CommissionRate, CommissionSummary } from '@/lib/types'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { calcCommission } from '@/lib/utils'

type InvoiceWithLines = Invoice & { line_items: InvoiceLineItem[] }

interface Props {
  initialInvoices: InvoiceWithLines[]
  commissionRates: CommissionRate[]
}

function getRateForRep(rep: string, rates: CommissionRate[]): number {
  const match = rates.find(r => r.rep_name === rep)
  return match ? Number(match.rate_pct) : 10
}

export default function CommissionsReport({ initialInvoices, commissionRates }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const firstOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]

  const [fromDate, setFromDate]         = useState(firstOfYear)
  const [toDate, setToDate]             = useState(today)
  const [repFilter, setRepFilter]       = useState('all')
  const [expandedReps, setExpandedReps] = useState<Set<string>>(new Set())

  const allReps = useMemo(() => {
    const names = new Set<string>()
    for (const inv of initialInvoices) {
      if (inv.rep_name) names.add(inv.rep_name)
    }
    return Array.from(names).sort()
  }, [initialInvoices])

  const filteredInvoices = useMemo(() => {
    return initialInvoices.filter(inv => {
      if (inv.issue_date < fromDate || inv.issue_date > toDate) return false
      if (repFilter !== 'all' && inv.rep_name !== repFilter) return false
      return true
    })
  }, [initialInvoices, fromDate, toDate, repFilter])

  const summaries = useMemo<CommissionSummary[]>(() => {
    const byRep = new Map<string, InvoiceWithLines[]>()
    for (const inv of filteredInvoices) {
      const rep = inv.rep_name || '(Unassigned)'
      if (!byRep.has(rep)) byRep.set(rep, [])
      byRep.get(rep)!.push(inv)
    }

    return Array.from(byRep.entries()).map(([rep_name, invs]) => {
      const allLines = invs.flatMap(inv => inv.line_items ?? [])
      const rate = getRateForRep(rep_name, commissionRates)
      const { revenue, cost, margin, commission } = calcCommission(allLines, rate)
      const margin_pct = revenue > 0 ? (margin / revenue) * 100 : 0
      return {
        rep_name,
        invoice_count: invs.length,
        revenue,
        total_cost: cost,
        gross_margin: margin,
        margin_pct,
        commission_earned: commission,
      }
    }).sort((a, b) => b.revenue - a.revenue)
  }, [filteredInvoices, commissionRates])

  const totals = useMemo(() => {
    return summaries.reduce(
      (acc, s) => ({
        invoice_count: acc.invoice_count + s.invoice_count,
        revenue: acc.revenue + s.revenue,
        total_cost: acc.total_cost + s.total_cost,
        gross_margin: acc.gross_margin + s.gross_margin,
        commission_earned: acc.commission_earned + s.commission_earned,
      }),
      { invoice_count: 0, revenue: 0, total_cost: 0, gross_margin: 0, commission_earned: 0 }
    )
  }, [summaries])

  const totalsMarginPct = totals.revenue > 0 ? (totals.gross_margin / totals.revenue) * 100 : 0

  function toggleRep(rep: string) {
    setExpandedReps(prev => {
      const next = new Set(prev)
      if (next.has(rep)) next.delete(rep)
      else next.add(rep)
      return next
    })
  }

  function getRepInvoices(rep: string): InvoiceWithLines[] {
    return filteredInvoices.filter(inv => (inv.rep_name || '(Unassigned)') === rep)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Filters</p>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">To</label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Rep</label>
            <select
              value={repFilter}
              onChange={e => setRepFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Reps</option>
              {allReps.map(rep => (
                <option key={rep} value={rep}>{rep}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Rep', 'Invoices', 'Revenue', 'Cost', 'Gross Margin', 'Margin %', 'Commission Earned'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {summaries.map(s => (
              <>
                <tr
                  key={s.rep_name}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => toggleRep(s.rep_name)}
                >
                  <td className="px-5 py-3 font-medium text-slate-800">{s.rep_name}</td>
                  <td className="px-5 py-3 text-slate-600">{s.invoice_count}</td>
                  <td className="px-5 py-3 font-semibold text-slate-800">{formatCurrency(s.revenue)}</td>
                  <td className="px-5 py-3 text-slate-600">{formatCurrency(s.total_cost)}</td>
                  <td className="px-5 py-3 text-slate-700">{formatCurrency(s.gross_margin)}</td>
                  <td className="px-5 py-3 text-slate-600">{s.margin_pct.toFixed(1)}%</td>
                  <td className="px-5 py-3 font-semibold text-cyan-700">{formatCurrency(s.commission_earned)}</td>
                  <td className="px-5 py-3 text-slate-400">
                    {expandedReps.has(s.rep_name)
                      ? <ChevronDown size={15} />
                      : <ChevronRight size={15} />}
                  </td>
                </tr>
                {expandedReps.has(s.rep_name) && (
                  <tr key={`${s.rep_name}-detail`}>
                    <td colSpan={8} className="px-0 py-0 bg-slate-50 border-b border-slate-200">
                      <div className="px-8 py-3">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          Invoices for {s.rep_name}
                        </p>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-slate-400">
                              <th className="text-left py-1 pr-4 font-semibold">Invoice #</th>
                              <th className="text-left py-1 pr-4 font-semibold">Title</th>
                              <th className="text-left py-1 pr-4 font-semibold">Date</th>
                              <th className="text-left py-1 pr-4 font-semibold">Status</th>
                              <th className="text-right py-1 pr-4 font-semibold">Revenue</th>
                              <th className="text-right py-1 pr-4 font-semibold">Cost</th>
                              <th className="text-right py-1 pr-4 font-semibold">Margin</th>
                              <th className="text-right py-1 font-semibold">Commission</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {getRepInvoices(s.rep_name).map(inv => {
                              const rate = getRateForRep(s.rep_name, commissionRates)
                              const { revenue, cost, margin, commission } = calcCommission(inv.line_items ?? [], rate)
                              return (
                                <tr key={inv.id} className="text-slate-600">
                                  <td className="py-1.5 pr-4 font-mono">{inv.invoice_number}</td>
                                  <td className="py-1.5 pr-4">{inv.title}</td>
                                  <td className="py-1.5 pr-4">{formatDateShort(inv.issue_date)}</td>
                                  <td className="py-1.5 pr-4 capitalize">{inv.status}</td>
                                  <td className="py-1.5 pr-4 text-right">{formatCurrency(revenue)}</td>
                                  <td className="py-1.5 pr-4 text-right">{formatCurrency(cost)}</td>
                                  <td className="py-1.5 pr-4 text-right">{formatCurrency(margin)}</td>
                                  <td className="py-1.5 text-right font-semibold text-cyan-700">{formatCurrency(commission)}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}

            {!summaries.length && (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                  No invoices found for the selected date range and rep
                </td>
              </tr>
            )}

            {/* Totals row */}
            {summaries.length > 0 && (
              <tr className="bg-slate-50 font-semibold border-t-2 border-slate-200">
                <td className="px-5 py-3 text-slate-700">Totals</td>
                <td className="px-5 py-3 text-slate-700">{totals.invoice_count}</td>
                <td className="px-5 py-3 text-slate-900">{formatCurrency(totals.revenue)}</td>
                <td className="px-5 py-3 text-slate-700">{formatCurrency(totals.total_cost)}</td>
                <td className="px-5 py-3 text-slate-800">{formatCurrency(totals.gross_margin)}</td>
                <td className="px-5 py-3 text-slate-700">{totalsMarginPct.toFixed(1)}%</td>
                <td className="px-5 py-3 text-cyan-700">{formatCurrency(totals.commission_earned)}</td>
                <td className="px-5 py-3" />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
