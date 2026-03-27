'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Client, PortalInvoice, PortalInvoiceStatus } from '@/lib/types'
import { addPortalInvoice, uploadInvoicePDF } from '@/app/(dashboard)/portal/actions'
import { ArrowLeft, Upload } from 'lucide-react'

const blankInvoice = () => ({
  invoice_number: '', invoice_date: '', due_date: '',
  amount_total: '', amount_paid: '0', status: 'unpaid' as PortalInvoiceStatus
})

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 })
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const statusColor = (s: string) =>
  s === 'paid' ? 'text-emerald-600 bg-emerald-50' :
  s === 'partial' ? 'text-amber-600 bg-amber-50' :
  'text-red-500 bg-red-50'

export default function PortalCustomerDetail({
  client, initialInvoices
}: {
  client: Client
  initialInvoices: PortalInvoice[]
}) {
  const router = useRouter()
  const [invoices, setInvoices] = useState(initialInvoices)
  const [form, setForm] = useState(blankInvoice())
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [error, setError] = useState('')

  function formatCurrency(value: string) {
    const digits = value.replace(/[^\d.]/g, '')
    const parts = digits.split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    if (parts.length > 1) parts[1] = parts[1].slice(0, 2)
    return parts.length > 2 ? parts[0] + '.' + parts[1] : parts.join('.')
  }

  async function handleAddInvoice(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const data = await addPortalInvoice(client.id, {
        invoice_number: form.invoice_number,
        invoice_date: form.invoice_date,
        due_date: form.due_date || null,
        amount_total: parseFloat(form.amount_total.replace(/,/g, '')),
        amount_paid: parseFloat(form.amount_paid.replace(/,/g, '') || '0'),
        status: form.status,
      })
      setInvoices(prev => [data, ...prev])
      setForm(blankInvoice())
    } catch (e: any) {
      setError(e.message)
    }
    setSaving(false)
  }

  async function handleUploadPDF(invoiceId: string, file: File) {
    setUploading(invoiceId)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('customerId', client.id)
      fd.append('invoiceId', invoiceId)
      const path = await uploadInvoicePDF(fd)
      setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, pdf_path: path } : inv))
    } catch (e: any) {
      alert('Upload failed. Please try again.')
    }
    setUploading(null)
  }

  const inputCls = "border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full bg-white"
  const labelCls = "block text-xs font-medium text-slate-500 mb-1"

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <button onClick={() => router.push('/portal')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        <ArrowLeft size={15} /> Back to Customers
      </button>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{client.company || client.name}</h1>
            <p className="text-slate-500 text-sm mt-1">
              {client.account_number && (
                <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded mr-2">{client.account_number}</span>
              )}
              {client.name && client.company && <span className="mr-3">{client.name}</span>}
              {client.email && <span className="mr-3">{client.email}</span>}
              {client.phone && <span>{client.phone}</span>}
            </p>
            {client.lead_source && (
              <p className="text-slate-400 text-xs mt-2">
                <span className="font-medium text-slate-500">Lead Source:</span> {client.lead_source}
                {client.referred_by && <span> &mdash; <span className="font-medium text-slate-500">Referred by:</span> {client.referred_by}</span>}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Add Invoice</h2>
        <form onSubmit={handleAddInvoice}
          onKeyDown={e => {
            if (e.key === 'Enter' && e.target instanceof HTMLInputElement && e.target.type !== 'date') {
              e.preventDefault()
              const fields = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('input, select, button'))
              const idx = fields.indexOf(e.target as HTMLElement)
              if (idx < fields.length - 1) fields[idx + 1].focus()
            }
          }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><label className={labelCls}>Invoice #</label><input value={form.invoice_number} onChange={e => setForm(f => ({ ...f, invoice_number: e.target.value }))} required className={inputCls} /></div>
          <div><label className={labelCls}>Invoice Date</label><input type="date" value={form.invoice_date} onChange={e => setForm(f => ({ ...f, invoice_date: e.target.value }))} required className={inputCls} /></div>
          <div><label className={labelCls}>Due Date</label><input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className={inputCls} /></div>
          <div><label className={labelCls}>Total $</label><input value={form.amount_total} onChange={e => setForm(f => ({ ...f, amount_total: formatCurrency(e.target.value) }))} required placeholder="0.00" className={inputCls} /></div>
          <div><label className={labelCls}>Paid $</label><input value={form.amount_paid} onChange={e => setForm(f => ({ ...f, amount_paid: formatCurrency(e.target.value) }))} placeholder="0.00" className={inputCls} /></div>
          <div><label className={labelCls}>Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as PortalInvoiceStatus }))} className={inputCls}>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div className="flex items-end col-span-2 md:col-span-2 gap-2">
            <button type="submit" disabled={saving}
              className="bg-cyan-500 hover:bg-cyan-400 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 w-full">
              {saving ? 'Adding…' : 'Add Invoice'}
            </button>
          </div>
          {error && <p className="col-span-full text-red-500 text-sm">{error}</p>}
        </form>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Invoice #', 'Date', 'Due', 'Total', 'Paid', 'Status', 'PDF'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map(inv => (
              <tr key={inv.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-800">{inv.invoice_number}</td>
                <td className="px-5 py-3 text-slate-500">{fmtDate(inv.invoice_date)}</td>
                <td className="px-5 py-3 text-slate-500">{inv.due_date ? fmtDate(inv.due_date) : '—'}</td>
                <td className="px-5 py-3 font-medium">${fmt(inv.amount_total)}</td>
                <td className="px-5 py-3 text-slate-500">${fmt(inv.amount_paid)}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${statusColor(inv.status)}`}>{inv.status}</span>
                </td>
                <td className="px-5 py-3">
                  {inv.pdf_path ? (
                    <span className="text-xs text-emerald-600 font-medium">✓ Uploaded</span>
                  ) : (
                    <label className="cursor-pointer flex items-center gap-1 text-cyan-600 hover:text-cyan-500 text-xs font-medium">
                      <Upload size={13} />
                      {uploading === inv.id ? 'Uploading…' : 'Upload PDF'}
                      <input type="file" accept="application/pdf" className="hidden"
                        onChange={e => e.target.files?.[0] && handleUploadPDF(inv.id, e.target.files[0])} />
                    </label>
                  )}
                </td>
              </tr>
            ))}
            {!invoices.length && (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">No invoices yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
