'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Client } from '@/lib/types'
import { Plus, X, Save } from 'lucide-react'

const LEAD_SOURCE_OPTIONS = ['Google Search', 'Referral', 'Existing Customer', 'LinkedIn', 'Trade Show', 'Other']

const blank = (): Partial<Client> => ({
  name: '', company: '', email: '', phone: '', account_number: '',
  billing_address: '', billing_city: '', billing_state: 'CA', billing_zip: '',
  site_address: '', site_city: '', site_state: 'CA', site_zip: '', notes: '',
  lead_source: '', referred_by: '',
})

export default function ClientsManager({ initialClients }: { initialClients: Client[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [clients, setClients]     = useState(initialClients)
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState<Client | null>(null)
  const [form, setForm]           = useState<Partial<Client>>(blank())
  const [saving, setSaving]       = useState(false)

  function openNew()  { setForm(blank()); setEditing(null); setShowForm(true) }
  function openEdit(c: Client) { setForm(c); setEditing(c); setShowForm(true) }

  async function handleSave() {
    setSaving(true)
    if (editing) {
      const { data } = await supabase.from('clients').update(form).eq('id', editing.id).select().single()
      if (data) setClients(prev => prev.map(c => c.id === data.id ? data : c))
    } else {
      const { data } = await supabase.from('clients').insert(form).select().single()
      if (data) setClients(prev => [data, ...prev])
    }
    setSaving(false)
    setShowForm(false)
  }

  function fmtPhone(val: string) {
    const d = val.replace(/\D/g, '').slice(0, 10)
    if (d.length <= 3) return d
    if (d.length <= 6) return d.slice(0,3) + '-' + d.slice(3)
    return d.slice(0,3) + '-' + d.slice(3,6) + '-' + d.slice(6)
  }

  function field(key: keyof Client, label: string, type = 'text', placeholder = '') {
    return (
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
        <input type={type} placeholder={placeholder}
          value={(form[key] as string) ?? ''}
          onChange={e => setForm(f => ({ ...f, [key]: key === 'phone' ? fmtPhone(e.target.value) : e.target.value }))}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={openNew}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
          <Plus size={15} /> Add Client
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-16 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 mb-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">{editing ? 'Edit Client' : 'New Client'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field('name', 'Contact Name *')}
                {field('company', 'Company / Business Name')}
                {field('email', 'Email', 'email')}
                {field('phone', 'Phone')}
                {field('account_number', 'Account #')}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Billing Address</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">{field('billing_address', 'Street')}</div>
                  {field('billing_city', 'City')}
                  <div className="grid grid-cols-2 gap-2">
                    {field('billing_state', 'State')}
                    {field('billing_zip', 'ZIP')}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Job Site Address (if different)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">{field('site_address', 'Street')}</div>
                  {field('site_city', 'City')}
                  <div className="grid grid-cols-2 gap-2">
                    {field('site_state', 'State')}
                    {field('site_zip', 'ZIP')}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
                <textarea value={form.notes ?? ''} onChange={e => setForm(f => ({...f, notes: e.target.value}))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[70px]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Lead Source</label>
                  <select value={form.lead_source ?? ''}
                    onChange={e => setForm(f => ({ ...f, lead_source: e.target.value, referred_by: e.target.value !== 'Referral' ? '' : f.referred_by }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="">Select…</option>
                    {LEAD_SOURCE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                {form.lead_source === 'Referral' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Referred By <span className="font-normal">(name or company)</span></label>
                    <input type="text" placeholder="e.g. John Smith at ABC Corp" maxLength={100}
                      value={form.referred_by ?? ''}
                      onChange={e => setForm(f => ({ ...f, referred_by: e.target.value }))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
              <button onClick={() => setShowForm(false)} className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                <Save size={14} /> {saving ? 'Saving…' : 'Save Client'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Company / Name', 'Account #', 'Email', 'Phone', 'Address', ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {clients.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => router.push(`/portal/${c.id}`)}>
                <td className="px-5 py-3">
                  <div className="font-medium text-slate-800">{c.company || c.name}</div>
                  {c.company && <div className="text-xs text-slate-400">{c.name}</div>}
                </td>
                <td className="px-5 py-3">
                  {c.account_number
                    ? <span className="font-mono text-xs bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded">{c.account_number}</span>
                    : <span className="text-xs text-slate-300">—</span>}
                </td>
                <td className="px-5 py-3 text-slate-500">
                  {c.email
                    ? <a href={`mailto:${c.email}`} onClick={e => e.stopPropagation()}
                        className="text-cyan-600 hover:underline">{c.email}</a>
                    : '—'}
                </td>
                <td className="px-5 py-3 text-slate-500">
                  {c.phone
                    ? <a href={`tel:${c.phone.replace(/\D/g, '')}`} onClick={e => e.stopPropagation()}
                        className="text-cyan-600 hover:underline">{c.phone}</a>
                    : '—'}
                </td>
                <td className="px-5 py-3 text-slate-500">
                  {c.billing_address ? (() => {
                    const addr = [c.billing_address, c.billing_city, c.billing_state, c.billing_zip].filter(Boolean).join(', ')
                    const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(addr)}`
                    return (
                      <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-cyan-600 hover:underline text-xs">{addr}</a>
                    )
                  })() : <span className="text-xs text-slate-300">—</span>}
                </td>
                <td className="px-5 py-3" onClick={e => { e.stopPropagation(); openEdit(c) }}>
                  <span className="text-cyan-600 hover:underline text-xs font-medium">Edit</span>
                </td>
              </tr>
            ))}
            {!clients.length && <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">No clients yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
