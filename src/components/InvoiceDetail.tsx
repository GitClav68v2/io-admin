'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Invoice } from '@/lib/types'
import { formatCurrency, formatDate, STATUS_COLORS, SECTION_LABELS } from '@/lib/utils'
import { FileDown, Send, CheckCircle, Loader2, Pencil, X, Save } from 'lucide-react'
import Link from 'next/link'

export default function InvoiceDetail({ invoice }: { invoice: Invoice }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState<string | null>(null)
  const [paymentInput, setPaymentInput] = useState('')
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: invoice.title,
    bill_to_name: invoice.bill_to_name ?? '',
    bill_to_company: invoice.bill_to_company ?? '',
    bill_to_email: invoice.bill_to_email ?? '',
    bill_to_phone: invoice.bill_to_phone ?? '',
    bill_to_address: invoice.bill_to_address ?? '',
    bill_to_city: invoice.bill_to_city ?? '',
    bill_to_state: invoice.bill_to_state ?? '',
    bill_to_zip: invoice.bill_to_zip ?? '',
    notes: invoice.notes ?? '',
    rep_name: invoice.rep_name ?? '',
  })
  const [saving, setSaving] = useState(false)

  function fmtPhone(val: string) {
    const d = val.replace(/\D/g, '').slice(0, 10)
    if (d.length <= 3) return d
    if (d.length <= 6) return d.slice(0,3) + '-' + d.slice(3)
    return d.slice(0,3) + '-' + d.slice(3,6) + '-' + d.slice(6)
  }

  async function lookupZip(zip: string) {
    setEditForm(f => ({ ...f, bill_to_zip: zip }))
    if (!/^\d{5}$/.test(zip)) return
    try {
      const res = await fetch(`/api/zipcode?zip=${zip}`)
      const data = await res.json()
      if (data) setEditForm(f => ({ ...f, bill_to_city: data.city, bill_to_state: data.state }))
    } catch {}
  }

  async function handleSaveEdit() {
    setSaving(true)
    await supabase.from('invoices').update(editForm).eq('id', invoice.id)
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  async function handlePDF() {
    setLoading('pdf')
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/pdf`)
      if (!res.ok) { alert('Error generating PDF. Please try again.'); setLoading(null); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url
      a.download = `${invoice.invoice_number}.pdf`
      a.click(); URL.revokeObjectURL(url)
    } catch {
      alert('Error generating PDF. Please try again.')
    }
    setLoading(null)
  }

  async function handleSend() {
    setLoading('send')
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/send`, { method: 'POST' })
      const data = await res.json()
      if (data.success) { alert('Invoice emailed!'); router.refresh() }
      else alert('Something went wrong. Please try again.')
    } catch {
      alert('Error sending invoice. Please try again.')
    }
    setLoading(null)
  }

  async function recordPayment() {
    const amount = parseFloat(paymentInput)
    if (!amount || isNaN(amount)) return
    const newPaid = invoice.amount_paid + amount
    const newStatus = newPaid >= invoice.grand_total ? 'paid' : 'partial'
    await supabase.from('invoices').update({
      amount_paid: newPaid,
      status: newStatus,
      ...(newStatus === 'paid' ? { paid_at: new Date().toISOString() } : {})
    }).eq('id', invoice.id)
    setPaymentInput('')
    router.refresh()
  }

  const items = invoice.line_items ?? []
  const sections = ['cameras','network','hardware','labor','other'] as const

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Invoice</span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[invoice.status]}`}>
              {invoice.status}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">{invoice.title}</h1>
          <p className="text-slate-400 text-sm">
            {invoice.invoice_number} · Issued {formatDate(invoice.issue_date)}
            {invoice.proposal_id && <> · <Link href={`/proposals/${invoice.proposal_id}`} className="text-cyan-600 hover:underline">View Proposal</Link></>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
            <Pencil size={14} /> Edit
          </button>
          <button onClick={handlePDF} disabled={!!loading}
            className="flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
            {loading === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />} PDF
          </button>
          {invoice.bill_to_email && (
            <button onClick={handleSend} disabled={!!loading}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
              {loading === 'send' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Email Invoice
            </button>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-8 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 mb-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">Edit Invoice</h2>
              <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Bill To</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Contact Name</label>
                  <input value={editForm.bill_to_name} onChange={e => setEditForm(f => ({ ...f, bill_to_name: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Company</label>
                  <input value={editForm.bill_to_company} onChange={e => setEditForm(f => ({ ...f, bill_to_company: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                  <input type="email" value={editForm.bill_to_email} onChange={e => setEditForm(f => ({ ...f, bill_to_email: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                  <input value={editForm.bill_to_phone} onChange={e => setEditForm(f => ({ ...f, bill_to_phone: fmtPhone(e.target.value) }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Street</label>
                <input value={editForm.bill_to_address} onChange={e => setEditForm(f => ({ ...f, bill_to_address: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">ZIP</label>
                  <input value={editForm.bill_to_zip} onChange={e => lookupZip(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">City</label>
                  <input value={editForm.bill_to_city} onChange={e => setEditForm(f => ({ ...f, bill_to_city: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">State</label>
                  <input value={editForm.bill_to_state} onChange={e => setEditForm(f => ({ ...f, bill_to_state: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Rep Name</label>
                  <input value={editForm.rep_name} onChange={e => setEditForm(f => ({ ...f, rep_name: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
                <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[70px]" />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
              <button onClick={() => setEditing(false)} className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Cancel</button>
              <button onClick={handleSaveEdit} disabled={saving}
                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                <Save size={14} /> {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-5 mb-6">
        {/* Bill To */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Bill To</h3>
          <p className="font-semibold text-slate-800">{invoice.bill_to_company || invoice.bill_to_name || '—'}</p>
          {invoice.bill_to_company && <p className="text-sm text-slate-600">{invoice.bill_to_name}</p>}
          <p className="text-sm text-slate-500 mt-1">{invoice.bill_to_address}</p>
          <p className="text-sm text-slate-500">{invoice.bill_to_city}, {invoice.bill_to_state} {invoice.bill_to_zip}</p>
          {invoice.bill_to_email && <p className="text-sm text-cyan-600 mt-1">{invoice.bill_to_email}</p>}
          {invoice.bill_to_phone && <p className="text-sm text-cyan-600"><a href={`tel:${invoice.bill_to_phone.replace(/\D/g, '')}`}>{invoice.bill_to_phone}</a></p>}
        </div>

        {/* Payment status */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Payment Status</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Total</span><span className="font-semibold">{formatCurrency(invoice.grand_total)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Paid</span><span className="text-green-600 font-semibold">{formatCurrency(invoice.amount_paid)}</span></div>
            <div className="flex justify-between pt-2 border-t border-slate-100 font-bold">
              <span>Balance Due</span><span className="text-red-600">{formatCurrency(invoice.balance_due)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400"><span>Due</span><span>{formatDate(invoice.due_date)}</span></div>
          </div>
          {invoice.status !== 'paid' && invoice.status !== 'void' && (
            <div className="flex gap-2 pt-2">
              <input type="number" placeholder="Payment amount" value={paymentInput}
                onChange={e => setPaymentInput(e.target.value)}
                className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              <button onClick={recordPayment}
                className="flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                <CheckCircle size={13} /> Record
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Line items */}
      {sections.map(section => {
        const sectionItems = items.filter(li => li.section === section)
        if (!sectionItems.length) return null
        return (
          <div key={section} className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-4">
            <div className="px-5 py-3 bg-slate-800">
              <span className="text-sm font-semibold text-white">{SECTION_LABELS[section]}</span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-2 text-left text-xs text-slate-400">Description</th>
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
                      {li.description && <div className="text-xs text-slate-400">{li.description}</div>}
                    </td>
                    <td className="px-3 py-2.5 text-center">{li.qty} {li.unit_label}</td>
                    <td className="px-3 py-2.5 text-right">{formatCurrency(li.unit_price)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold">{formatCurrency(li.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}

      {/* Totals */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 max-w-sm ml-auto">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Tax ({(invoice.tax_rate*100).toFixed(2)}%)</span><span>{formatCurrency(invoice.tax_amount)}</span></div>
          <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-200">
            <span>Total</span><span className="text-cyan-600">{formatCurrency(invoice.grand_total)}</span>
          </div>
          <div className="flex justify-between text-green-600"><span>Paid</span><span>{formatCurrency(invoice.amount_paid)}</span></div>
          <div className="flex justify-between font-bold text-red-600 pt-1 border-t border-slate-100">
            <span>Balance Due</span><span>{formatCurrency(invoice.balance_due)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
