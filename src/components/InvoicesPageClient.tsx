'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Download, RefreshCw, Loader2 } from 'lucide-react'
import { formatCurrency, formatDateShort, STATUS_COLORS } from '@/lib/utils'

interface InvoiceRow {
  id: string
  invoice_number: string
  title: string
  grand_total: number
  balance_due: number
  status: string
  due_date: string | null
  bill_to_company: string | null
  recurring_invoice_id: string | null
  client?: { name: string; company: string | null } | null
}

interface RecurringRow {
  id: string
  frequency: string
  next_due_date: string
  end_date: string | null
  active: boolean
  last_generated_at: string | null
  notes: string | null
  template_invoice?: { invoice_number: string; title: string; grand_total: number; bill_to_company: string | null; bill_to_name: string | null } | null
  client?: { name: string; company: string | null } | null
}

export default function InvoicesPageClient({ invoices, recurring }: { invoices: InvoiceRow[]; recurring: RecurringRow[] }) {
  const router = useRouter()
  const [tab, setTab] = useState<'invoices' | 'recurring'>('invoices')
  const [generating, setGenerating] = useState<string | null>(null)

  async function handleGenerate(id: string) {
    setGenerating(id)
    try {
      const res = await fetch(`/api/recurring/${id}/generate`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        router.refresh()
        router.push(`/invoices/${data.invoiceId}`)
      } else {
        alert(data.error || 'Something went wrong.')
      }
    } catch {
      alert('Error generating invoice.')
    }
    setGenerating(null)
  }

  const activeCount = recurring.filter(r => r.active).length

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
        <a
          href="/api/invoices/export"
          download
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export to QuickBooks
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5">
        <button
          onClick={() => setTab('invoices')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === 'invoices' ? 'bg-white shadow-sm border border-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          All Invoices
        </button>
        <button
          onClick={() => setTab('recurring')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            tab === 'recurring' ? 'bg-white shadow-sm border border-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <RefreshCw size={13} /> Recurring
          {activeCount > 0 && (
            <span className="bg-purple-100 text-purple-700 text-xs px-1.5 py-0.5 rounded-full font-medium">{activeCount}</span>
          )}
        </button>
      </div>

      {tab === 'invoices' ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Invoice', 'Title / Client', 'Total', 'Balance Due', 'Status', 'Due Date', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs">
                    <Link href={`/invoices/${inv.id}`} className="text-cyan-600 hover:underline">{inv.invoice_number}</Link>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <Link href={`/invoices/${inv.id}`} className="font-medium text-cyan-600 hover:underline">{inv.title}</Link>
                      {inv.recurring_invoice_id && <RefreshCw size={11} className="text-purple-500" />}
                    </div>
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
              {!invoices.length && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">No invoices yet — convert an accepted proposal to create one</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Template Invoice', 'Client', 'Amount', 'Frequency', 'Next Due', 'Status', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recurring.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-800">{r.template_invoice?.title || '—'}</div>
                    <div className="text-xs text-slate-400 font-mono">{r.template_invoice?.invoice_number}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {r.client?.company || r.client?.name || r.template_invoice?.bill_to_company || '—'}
                  </td>
                  <td className="px-5 py-3 font-semibold">{formatCurrency(r.template_invoice?.grand_total ?? 0)}</td>
                  <td className="px-5 py-3 capitalize text-slate-600">{r.frequency}</td>
                  <td className="px-5 py-3 text-slate-600">{formatDateShort(r.next_due_date)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {r.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {r.active && (
                      <button
                        onClick={() => handleGenerate(r.id)}
                        disabled={generating === r.id}
                        className="flex items-center gap-1.5 text-purple-600 hover:text-purple-800 text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {generating === r.id ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                        Generate Next
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!recurring.length && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">No recurring schedules — use &quot;Make Recurring&quot; on any invoice</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
