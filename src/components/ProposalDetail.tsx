'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Proposal, CatalogItem, Client } from '@/lib/types'
import { formatCurrency, formatDate, STATUS_COLORS, SECTION_LABELS } from '@/lib/utils'
import { FileDown, Send, CheckCircle, XCircle, Edit, Receipt, Loader2, Sparkles, Copy, X } from 'lucide-react'
import ProposalForm from './ProposalForm'

interface Props { proposal: Proposal; catalog: CatalogItem[]; clients: Client[] }

export default function ProposalDetail({ proposal, catalog, clients }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [followup, setFollowup] = useState<{ subject: string; body: string } | null>(null)

  async function updateStatus(status: string) {
    await supabase.from('proposals').update({ status, ...(status === 'sent' ? { sent_at: new Date().toISOString() } : status === 'accepted' ? { accepted_at: new Date().toISOString() } : {}) }).eq('id', proposal.id)
    router.refresh()
  }

  async function handlePDF() {
    setLoading('pdf')
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/pdf`)
      if (!res.ok) { const e = await res.json().catch(() => ({})); alert('PDF error: ' + (e.error ?? res.status)); setLoading(null); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url
      a.download = `${proposal.proposal_number}.pdf`
      a.click(); URL.revokeObjectURL(url)
    } catch { alert('Error generating PDF. Please try again.') }
    setLoading(null)
  }

  async function handleSend() {
    setLoading('send')
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/send`, { method: 'POST' })
      const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
      if (data.success) { alert('Proposal emailed successfully!'); router.refresh() }
      else alert('Something went wrong. Please try again.')
    } catch { alert('Something went wrong. Please try again.') }
    setLoading(null)
  }

  async function draftFollowup() {
    setLoading('followup')
    try {
      const res = await fetch('/api/agents/draft-followup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalNumber: proposal.proposal_number,
          clientName: proposal.bill_to_company || proposal.bill_to_name,
          title: proposal.title, total: proposal.grand_total,
          sentDate: proposal.sent_at, repName: proposal.rep_name,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setFollowup(data)
    } catch (e: any) { alert('AI error: ' + e.message) }
    setLoading(null)
  }

  async function convertToInvoice() {
    setLoading('invoice')
    const res = await fetch(`/api/proposals/${proposal.id}/convert`, { method: 'POST' })
    const data = await res.json()
    if (data.invoiceId) router.push(`/invoices/${data.invoiceId}`)
    else alert('Error: ' + data.error)
    setLoading(null)
  }

  if (editing) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setEditing(false)} className="text-sm text-slate-500 hover:text-slate-800">← Back</button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{proposal.title}</h1>
            {proposal.project_name && <p className="text-slate-500 text-sm">{proposal.project_name}</p>}
          </div>
        </div>
        <ProposalForm clients={clients} catalog={catalog} proposal={proposal} />
      </div>
    )
  }

  const lineItems = proposal.line_items ?? []
  const sections = ['cameras','network','hardware','labor','other'] as const

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">{proposal.title}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[proposal.status]}`}>
              {proposal.status}
            </span>
          </div>
          {proposal.project_name && <p className="text-slate-600 text-sm font-medium mb-0.5">{proposal.project_name}</p>}
          <p className="text-slate-400 text-sm">{proposal.proposal_number} · Created {formatDate(proposal.created_at)}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
            <Edit size={14} /> Edit
          </button>
          <button onClick={handlePDF} disabled={!!loading}
            className="flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
            {loading === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />} PDF
          </button>
          {proposal.bill_to_email && (
            <button onClick={handleSend} disabled={!!loading}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
              {loading === 'send' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Email Client
            </button>
          )}
          {proposal.status === 'sent' && (
            <>
              <button onClick={draftFollowup} disabled={!!loading}
                className="flex items-center gap-2 border border-violet-300 hover:bg-violet-50 text-violet-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                {loading === 'followup' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Draft Follow-up
              </button>
              <button onClick={() => updateStatus('accepted')}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                <CheckCircle size={14} /> Accept
              </button>
              <button onClick={() => updateStatus('declined')}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-400 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                <XCircle size={14} /> Decline
              </button>
            </>
          )}
          {proposal.status === 'accepted' && (
            <button onClick={convertToInvoice} disabled={!!loading}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
              {loading === 'invoice' ? <Loader2 size={14} className="animate-spin" /> : <Receipt size={14} />} Convert to Invoice
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-6">
        {/* Bill To */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Bill To</h3>
          <p className="font-semibold text-slate-800">{proposal.bill_to_company || proposal.bill_to_name || '—'}</p>
          {proposal.bill_to_company && <p className="text-sm text-slate-600">{proposal.bill_to_name}</p>}
          <p className="text-sm text-slate-500 mt-1">{proposal.bill_to_address}</p>
          <p className="text-sm text-slate-500">{[proposal.bill_to_city, proposal.bill_to_state].filter(Boolean).join(', ')}{proposal.bill_to_zip ? ` ${proposal.bill_to_zip}` : ''}</p>
          {proposal.bill_to_email && <p className="text-sm text-cyan-600 mt-1">{proposal.bill_to_email}</p>}
          {proposal.bill_to_phone && <p className="text-sm text-slate-500">{proposal.bill_to_phone}</p>}
        </div>
        {/* Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Summary</h3>
          <div className="space-y-1.5 text-sm">
            {proposal.rep_name     && <div className="flex justify-between"><span className="text-slate-500">Rep</span><span>{proposal.rep_name}</span></div>}
            <div className="flex justify-between"><span className="text-slate-500">Expires</span><span>{formatDate(proposal.expires_at)}</span></div>
            {proposal.sent_at     && <div className="flex justify-between"><span className="text-slate-500">Sent</span><span>{formatDate(proposal.sent_at)}</span></div>}
            {proposal.accepted_at && <div className="flex justify-between"><span className="text-slate-500">Accepted</span><span>{formatDate(proposal.accepted_at)}</span></div>}
            <div className="flex justify-between pt-2 border-t border-slate-100 font-semibold">
              <span>Total</span><span className="text-cyan-600">{formatCurrency(proposal.grand_total)}</span>
            </div>
            {proposal.monthly_recurring > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Monthly</span><span>{formatCurrency(proposal.monthly_recurring)}/mo</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Line items */}
      {sections.map(section => {
        const sectionItems = lineItems.filter(li => li.section === section)
        if (!sectionItems.length) return null
        return (
          <div key={section} className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-4">
            <div className="px-5 py-3 bg-slate-800">
              <span className="text-sm font-semibold text-white">{SECTION_LABELS[section]}</span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-2 text-left text-xs text-slate-400 w-[50%]">Description</th>
                  <th className="px-3 py-2 text-center text-xs text-slate-400">Qty</th>
                  <th className="px-3 py-2 text-right text-xs text-slate-400">Unit Price</th>
                  <th className="px-3 py-2 text-right text-xs text-slate-400">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sectionItems.map((li, i) => (
                  <tr key={li.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                    <td className="px-5 py-2.5">
                      <div className="font-medium text-slate-800">{li.name}</div>
                      {li.description && <div className="text-xs text-slate-400 mt-0.5">{li.description}</div>}
                    </td>
                    <td className="px-3 py-2.5 text-center text-slate-600">{li.qty} {li.unit_label}</td>
                    <td className="px-3 py-2.5 text-right text-slate-600">{formatCurrency(li.unit_price)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold">{formatCurrency(li.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}

      {/* Follow-up email modal */}
      {followup && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-16 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 mb-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-violet-600" />
                <h2 className="font-semibold text-slate-900">Draft Follow-up Email</h2>
              </div>
              <button onClick={() => setFollowup(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Subject</p>
                <p className="text-sm font-semibold text-slate-800 bg-slate-50 rounded-lg px-3 py-2">{followup.subject}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Body</p>
                <pre className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-3 whitespace-pre-wrap font-sans leading-relaxed">{followup.body}</pre>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(`Subject: ${followup.subject}\n\n${followup.body}`); alert('Copied!') }}
                className="flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                <Copy size={14} /> Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 max-w-sm ml-auto">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Equipment</span><span>{formatCurrency(proposal.subtotal_equipment)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Tax ({(proposal.tax_rate*100).toFixed(2)}%)</span><span>{formatCurrency(proposal.tax_amount)}</span></div>
          <div className="flex justify-between pt-2 border-t border-slate-100"><span className="text-slate-500">Subtotal</span><span>{formatCurrency(proposal.subtotal_equipment + proposal.tax_amount)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Labor</span><span>{formatCurrency(proposal.subtotal_labor)}</span></div>
          <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-200">
            <span>Total</span><span className="text-cyan-600">{formatCurrency(proposal.grand_total)}</span>
          </div>
          {proposal.monthly_recurring > 0 && (
            <div className="flex justify-between text-slate-500 text-xs pt-1 border-t border-slate-100">
              <span>Monthly Recurring (separate)</span><span>{formatCurrency(proposal.monthly_recurring)}/mo</span>
            </div>
          )}
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-500">
          <div className="flex justify-between"><span>Deposit (50%)</span><span>{formatCurrency(proposal.grand_total * 0.5)}</span></div>
          <div className="flex justify-between"><span>Progress (25%)</span><span>{formatCurrency(proposal.grand_total * 0.25)}</span></div>
          <div className="flex justify-between"><span>Final (25%)</span><span>{formatCurrency(proposal.grand_total * 0.25)}</span></div>
        </div>
      </div>
    </div>
  )
}
