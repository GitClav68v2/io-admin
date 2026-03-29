'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Prospect, ProspectStatus } from '@/lib/types'
import { STATUS_COLORS, cn } from '@/lib/utils'
import { Plus, X, Save, Search } from 'lucide-react'

const BUSINESS_TYPES = [
  'Warehouse / Industrial',
  'Office / Commercial',
  'Retail / Storefront',
  'Restaurant / Food Service',
  'Medical / Healthcare',
  'Construction Site',
  'Residential / HOA',
  'Other',
]

const AREA_OPTIONS = [
  'Parking Lot',
  'Entry Points',
  'Fence Line',
  'Interior Areas',
  'Gate / Access',
  'Other',
]

const LEAD_SOURCE_OPTIONS = [
  'Google Search',
  'Referral',
  'Website Quote Form',
  'LinkedIn',
  'Trade Show',
  'Other',
]

const STATUS_OPTIONS: { value: ProspectStatus; label: string }[] = [
  { value: 'new',       label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost',      label: 'Lost' },
]

const blank = (): Partial<Prospect> => ({
  name: '', company: '', email: '', phone: '',
  zip: '', city: '', state: 'CA',
  business_type: '', areas: [], lead_source: '', notes: '',
  status: 'new',
})

export default function ProspectsManager({ initialProspects }: { initialProspects: Prospect[] }) {
  const supabase = createClient()
  const [prospects, setProspects] = useState(initialProspects)
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState<Prospect | null>(null)
  const [form, setForm]           = useState<Partial<Prospect>>(blank())
  const [saving, setSaving]       = useState(false)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Re-insert tel: links so Google Voice extension's MutationObserver picks them up
  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelectorAll<HTMLAnchorElement>('a[href^="tel:"]').forEach(a => {
        const parent = a.parentNode
        if (!parent) return
        const clone = a.cloneNode(true) as HTMLAnchorElement
        parent.replaceChild(clone, a)
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [prospects])

  function openNew() {
    setForm(blank()); setEditing(null); setShowForm(true)
  }

  function openEdit(p: Prospect) {
    setForm(p); setEditing(p); setShowForm(true)
  }

  async function handleSave() {
    setSaving(true)
    const payload = { ...form }
    delete (payload as any).id
    delete (payload as any).created_at

    if (editing) {
      const { data } = await supabase.from('prospects').update(payload).eq('id', editing.id).select().single()
      if (data) setProspects(prev => prev.map(p => p.id === data.id ? data : p))
    } else {
      const { data } = await supabase.from('prospects').insert(payload).select().single()
      if (data) setProspects(prev => [data, ...prev])
    }
    setSaving(false)
    setShowForm(false)
  }

  async function handleDelete() {
    if (!editing || !confirm('Delete this prospect?')) return
    await supabase.from('prospects').delete().eq('id', editing.id)
    setProspects(prev => prev.filter(p => p.id !== editing.id))
    setShowForm(false)
  }

  function fmtPhone(val: string) {
    const d = val.replace(/\D/g, '').slice(0, 10)
    if (d.length <= 3) return d
    if (d.length <= 6) return d.slice(0,3) + '-' + d.slice(3)
    return d.slice(0,3) + '-' + d.slice(3,6) + '-' + d.slice(6)
  }

  function toggleArea(area: string) {
    const current = form.areas ?? []
    setForm(f => ({
      ...f,
      areas: current.includes(area) ? current.filter(a => a !== area) : [...current, area],
    }))
  }


  const filtered = prospects.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      (p.company ?? '').toLowerCase().includes(q) ||
      (p.email ?? '').toLowerCase().includes(q) ||
      (p.phone ?? '').includes(q)
    )
  })

  const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500'

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search prospects…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
          <Plus size={15} /> Add Prospect
        </button>
      </div>

      {/* Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-8 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 mb-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">{editing ? 'Edit Prospect' : 'New Prospect'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">

              {/* Name / Company */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Full Name *</label>
                  <input value={form.name ?? ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Business Name</label>
                  <input value={form.company ?? ''} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className={inputCls} />
                </div>
              </div>

              {/* Email / Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                  <input type="email" value={form.email ?? ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                  <input value={form.phone ?? ''} onChange={e => setForm(f => ({ ...f, phone: fmtPhone(e.target.value) }))} className={inputCls} />
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">ZIP Code</label>
                  <input value={form.zip ?? ''} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">City</label>
                  <input value={form.city ?? ''} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">State</label>
                  <input value={form.state ?? ''} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className={inputCls} />
                </div>
              </div>

              {/* Business Type */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Business Type</label>
                <select value={form.business_type ?? ''} onChange={e => setForm(f => ({ ...f, business_type: e.target.value }))} className={inputCls}>
                  <option value="">Select…</option>
                  {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Areas */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Areas to Protect</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {AREA_OPTIONS.map(area => (
                    <label key={area} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input type="checkbox" checked={(form.areas ?? []).includes(area)} onChange={() => toggleArea(area)}
                        className="rounded border-slate-300 text-cyan-500 focus:ring-cyan-500" />
                      {area}
                    </label>
                  ))}
                </div>
              </div>

              {/* Status / Lead Source */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                  <select value={form.status ?? 'new'} onChange={e => setForm(f => ({ ...f, status: e.target.value as ProspectStatus }))} className={inputCls}>
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Lead Source</label>
                  <select value={form.lead_source ?? ''} onChange={e => setForm(f => ({ ...f, lead_source: e.target.value }))} className={inputCls}>
                    <option value="">Select…</option>
                    {LEAD_SOURCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
                <textarea value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className={`${inputCls} min-h-[70px]`} />
              </div>

            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
              <div>
                {editing && (
                  <button onClick={handleDelete} className="text-xs text-red-500 hover:text-red-600 font-medium">Delete</button>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowForm(false)} className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.name?.trim()}
                  className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  <Save size={14} /> {saving ? 'Saving…' : editing ? 'Save' : 'Add Prospect'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prospect table — matches Clients layout */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Company / Name', 'Status', 'Email', 'Phone', 'Address', ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 cursor-pointer" onClick={() => openEdit(p)}>
                  <div className="font-medium text-cyan-600 hover:underline">{p.company || p.name}</div>
                  {p.company && <div className="text-xs text-slate-400">{p.name}</div>}
                </td>
                <td className="px-5 py-3">
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', (STATUS_COLORS as any)[p.status] ?? '')}>
                    {p.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-500">
                  {p.email
                    ? <a href={`mailto:${p.email}`} onClick={e => e.stopPropagation()}
                        className="text-cyan-600 hover:underline">{p.email}</a>
                    : '—'}
                </td>
                <td className="px-5 py-3">
                  {p.phone
                    ? <a href={`tel:${p.phone.replace(/\D/g, '')}`} onClick={e => e.stopPropagation()} className="text-cyan-600 hover:underline font-medium">{p.phone}</a>
                    : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-5 py-3 text-slate-500">
                  {p.city || p.zip ? (() => {
                    const addr = [p.city, p.state, p.zip].filter(Boolean).join(', ')
                    return (
                      <a href={`https://maps.google.com/?q=${encodeURIComponent(addr)}`} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-cyan-600 hover:underline text-xs">{addr}</a>
                    )
                  })() : <span className="text-xs text-slate-300">—</span>}
                </td>
                <td className="px-5 py-3 cursor-pointer" onClick={e => { e.stopPropagation(); openEdit(p) }}>
                  <span className="text-cyan-600 hover:underline text-xs font-medium">Edit</span>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                {prospects.length ? 'No matching prospects' : 'No prospects yet'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
