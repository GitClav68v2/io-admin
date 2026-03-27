'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Supplier } from '@/lib/types'
import { Plus, X, Save, Phone } from 'lucide-react'

const blank = (): Partial<Supplier> => ({
  name: '', company: '', email: '', phone: '',
  website: '', address: '', city: '', state: 'CA', zip: '',
  billing_address: '', billing_city: '', billing_state: 'CA', billing_zip: '',
  notes: '',
})

export default function SuppliersManager({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
  const supabase = createClient()
  const [suppliers, setSuppliers] = useState(initialSuppliers)
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState<Supplier | null>(null)
  const [form, setForm]           = useState<Partial<Supplier>>(blank())
  const [saving, setSaving]       = useState(false)
  const [billingSame, setBillingSame] = useState(false)

  function openNew()  { setForm(blank()); setEditing(null); setBillingSame(false); setShowForm(true) }
  function openEdit(s: Supplier) {
    setForm(s)
    setEditing(s)
    setBillingSame(
      !!s.address && s.billing_address === s.address &&
      s.billing_city === s.city && s.billing_state === s.state && s.billing_zip === s.zip
    )
    setShowForm(true)
  }

  async function handleSave() {
    setSaving(true)
    if (editing) {
      const { data } = await supabase.from('suppliers').update(form).eq('id', editing.id).select().single()
      if (data) setSuppliers(prev => prev.map(s => s.id === data.id ? data : s))
    } else {
      const { data } = await supabase.from('suppliers').insert(form).select().single()
      if (data) setSuppliers(prev => [data, ...prev])
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

  function field(key: keyof Supplier, label: string, type = 'text', placeholder = '') {
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
          <Plus size={15} /> Add Supplier
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-16 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 mb-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">{editing ? 'Edit Supplier' : 'New OEM Supplier'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field('company', 'Company / Business Name *')}
                {field('name', 'Contact Name')}
                {field('email', 'Email', 'email')}
                {field('phone', 'Phone')}
                <div className="sm:col-span-2">{field('website', 'Website', 'url', 'https://')}</div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Corporate Address</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">{field('address', 'Street')}</div>
                  {field('city', 'City')}
                  <div className="grid grid-cols-2 gap-2">
                    {field('state', 'State')}
                    {field('zip', 'ZIP')}
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Billing Address</p>
                  <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                    <input type="checkbox" checked={billingSame} onChange={e => {
                      setBillingSame(e.target.checked)
                      if (e.target.checked) setForm(f => ({
                        ...f,
                        billing_address: f.address ?? '',
                        billing_city: f.city ?? '',
                        billing_state: f.state ?? 'CA',
                        billing_zip: f.zip ?? '',
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
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
                <textarea value={form.notes ?? ''} onChange={e => setForm(f => ({...f, notes: e.target.value}))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[70px]" />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
              <button onClick={() => setShowForm(false)} className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                <Save size={14} /> {saving ? 'Saving…' : 'Save Supplier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Company / Name', 'Email', 'Phone', 'Website', 'Address', ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {suppliers.map(s => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="font-medium text-slate-800">{s.company || s.name}</div>
                  {s.company && <div className="text-xs text-slate-400">{s.name}</div>}
                </td>
                <td className="px-5 py-3 text-slate-500">
                  {s.email ? <a href={`mailto:${s.email}`} className="text-cyan-600 hover:underline">{s.email}</a> : '—'}
                </td>
                <td className="px-5 py-3">
                  {s.phone
                    ? <span onClick={() => { window.location.href = `tel:${s.phone!.replace(/\D/g, '')}` }}
                        className="flex items-center gap-1 text-cyan-600 hover:underline font-medium cursor-pointer w-fit">
                        <Phone size={12} />{s.phone}
                      </span>
                    : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-5 py-3 text-slate-500">
                  {s.website
                    ? <a href={s.website.startsWith('http') ? s.website : `https://${s.website}`} target="_blank" rel="noreferrer" className="text-cyan-600 hover:underline">
                        {s.website.replace(/^https?:\/\//, '')}
                      </a>
                    : '—'}
                </td>
                <td className="px-5 py-3 text-slate-500">
                  {s.address ? (() => {
                    const addr = [s.address, s.city, s.state, s.zip].filter(Boolean).join(', ')
                    return <a href={`https://maps.google.com/?q=${encodeURIComponent(addr)}`} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline text-xs">{addr}</a>
                  })() : <span className="text-xs text-slate-300">—</span>}
                </td>
                <td className="px-5 py-3">
                  <button onClick={() => openEdit(s)} className="text-cyan-600 hover:underline text-xs font-medium">Edit</button>
                </td>
              </tr>
            ))}
            {!suppliers.length && <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">No suppliers yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
