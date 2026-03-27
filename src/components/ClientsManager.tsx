'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Client, ClientSite } from '@/lib/types'
import { Plus, X, Save, Trash2 } from 'lucide-react'

const LEAD_SOURCE_OPTIONS = ['Google Search', 'Referral', 'Existing Customer', 'LinkedIn', 'Trade Show', 'Other']

interface SiteDraft {
  id?: string
  label: string
  address: string
  city: string
  state: string
  zip: string
}

const blankSite = (): SiteDraft => ({ label: '', address: '', city: '', state: 'CA', zip: '' })

const blank = (): Partial<Client> => ({
  name: '', company: '', email: '', phone: '', account_number: '',
  corporate_address: '', corporate_city: '', corporate_state: 'CA', corporate_zip: '',
  billing_address: '', billing_city: '', billing_state: 'CA', billing_zip: '',
  notes: '', lead_source: '', referred_by: '',
})

export default function ClientsManager({ initialClients }: { initialClients: Client[] }) {
  const supabase = createClient()
  const [clients, setClients]         = useState(initialClients)
  const [showForm, setShowForm]       = useState(false)
  const [editing, setEditing]         = useState<Client | null>(null)
  const [form, setForm]               = useState<Partial<Client>>(blank())
  const [saving, setSaving]           = useState(false)
  const [billingSame, setBillingSame] = useState(false)
  const [sites, setSites]             = useState<SiteDraft[]>([])

  function openNew() {
    setForm(blank()); setEditing(null); setBillingSame(false); setSites([]); setShowForm(true)
  }

  async function openEdit(c: Client) {
    setForm(c)
    setEditing(c)
    setBillingSame(
      !!c.corporate_address && c.billing_address === c.corporate_address &&
      c.billing_city === c.corporate_city && c.billing_state === c.corporate_state &&
      c.billing_zip === c.corporate_zip
    )
    const { data } = await supabase
      .from('client_sites').select('*').eq('client_id', c.id).order('created_at')
    setSites((data ?? []).map((s: ClientSite) => ({
      id: s.id, label: s.label ?? '', address: s.address,
      city: s.city ?? '', state: s.state ?? 'CA', zip: s.zip ?? '',
    })))
    setShowForm(true)
  }

  async function handleSave() {
    setSaving(true)
    let savedClient: Client | null = null

    if (editing) {
      const { data } = await supabase.from('clients').update(form).eq('id', editing.id).select().single()
      if (data) { setClients(prev => prev.map(c => c.id === data.id ? data : c)); savedClient = data }
    } else {
      const { data } = await supabase.from('clients').insert(form).select().single()
      if (data) { setClients(prev => [data, ...prev]); savedClient = data }
    }

    if (savedClient) {
      await supabase.from('client_sites').delete().eq('client_id', savedClient.id)
      const validSites = sites.filter(s => s.address.trim())
      if (validSites.length) {
        await supabase.from('client_sites').insert(
          validSites.map(s => ({
            client_id: savedClient!.id,
            label:   s.label  || null,
            address: s.address,
            city:    s.city   || null,
            state:   s.state  || null,
            zip:     s.zip    || null,
          }))
        )
      }
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

  function updateSite(i: number, patch: Partial<SiteDraft>) {
    setSites(prev => prev.map((s, j) => j === i ? { ...s, ...patch } : s))
  }

  const inputCls = 'w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500'

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
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-8 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 mb-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">{editing ? 'Edit Client' : 'New Client'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-5">

              {/* Basic info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field('name', 'Contact Name *')}
                {field('company', 'Company / Business Name')}
                {field('email', 'Email', 'email')}
                {field('phone', 'Phone')}
                {field('account_number', 'Account #')}
              </div>

              {/* Corporate Address */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Corporate Address</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">{field('corporate_address', 'Street')}</div>
                  {field('corporate_city', 'City')}
                  <div className="grid grid-cols-2 gap-2">
                    {field('corporate_state', 'State')}
                    {field('corporate_zip', 'ZIP')}
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Billing Address</p>
                  <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                    <input type="checkbox" checked={billingSame} onChange={e => {
                      setBillingSame(e.target.checked)
                      if (e.target.checked) setForm(f => ({
                        ...f,
                        billing_address: f.corporate_address ?? '',
                        billing_city:    f.corporate_city    ?? '',
                        billing_state:   f.corporate_state   ?? 'CA',
                        billing_zip:     f.corporate_zip     ?? '',
                      }))
                    }} />
                    Same as corporate address
                  </label>
                </div>
                {!billingSame && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">{field('billing_address', 'Street')}</div>
                    {field('billing_city', 'City')}
                    <div className="grid grid-cols-2 gap-2">
                      {field('billing_state', 'State')}
                      {field('billing_zip', 'ZIP')}
                    </div>
                  </div>
                )}
              </div>

              {/* Job Sites */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Job Sites</p>
                  <button type="button" onClick={() => setSites(s => [...s, blankSite()])}
                    className="flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-500 font-medium">
                    <Plus size={12} /> Add Site
                  </button>
                </div>
                {!sites.length && (
                  <p className="text-xs text-slate-400 italic">No job sites yet — click Add Site.</p>
                )}
                <div className="space-y-3">
                  {sites.map((site, i) => (
                    <div key={i} className="border border-slate-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          placeholder="Label (optional — e.g. Warehouse, Main Office)"
                          value={site.label}
                          onChange={e => updateSite(i, { label: e.target.value })}
                          className="flex-1 text-xs font-medium text-slate-500 border-none outline-none bg-transparent placeholder:text-slate-300"
                        />
                        <button onClick={() => setSites(s => s.filter((_, j) => j !== i))}
                          className="text-slate-300 hover:text-red-400 shrink-0">
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <input placeholder="Street" value={site.address}
                        onChange={e => updateSite(i, { address: e.target.value })}
                        className={inputCls} />
                      <div className="grid grid-cols-5 gap-2">
                        <input placeholder="City" value={site.city}
                          onChange={e => updateSite(i, { city: e.target.value })}
                          className={`col-span-3 ${inputCls}`} />
                        <input placeholder="ST" value={site.state}
                          onChange={e => updateSite(i, { state: e.target.value })}
                          className={inputCls} />
                        <input placeholder="ZIP" value={site.zip}
                          onChange={e => updateSite(i, { zip: e.target.value })}
                          className={inputCls} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
                <textarea value={form.notes ?? ''} onChange={e => setForm(f => ({...f, notes: e.target.value}))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[70px]" />
              </div>

              {/* Lead Source */}
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
              {['Company / Name', 'Account', 'Email', 'Phone', 'Address', ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {clients.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 cursor-pointer" onClick={() => openEdit(c)}>
                  <div className="font-medium text-cyan-600 hover:underline">{c.company || c.name}</div>
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
                <td className="px-5 py-3">
                  {c.phone
                    ? <a href={`tel:${c.phone.replace(/\D/g, '')}`} onClick={e => e.stopPropagation()}
                        className="text-cyan-600 hover:underline font-medium">{c.phone}</a>
                    : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-5 py-3 text-slate-500">
                  {c.billing_address ? (() => {
                    const addr = [c.billing_address, c.billing_city, c.billing_state, c.billing_zip].filter(Boolean).join(', ')
                    return (
                      <a href={`https://maps.google.com/?q=${encodeURIComponent(addr)}`} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-cyan-600 hover:underline text-xs">{addr}</a>
                    )
                  })() : <span className="text-xs text-slate-300">—</span>}
                </td>
                <td className="px-5 py-3 cursor-pointer" onClick={e => { e.stopPropagation(); openEdit(c) }}>
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
