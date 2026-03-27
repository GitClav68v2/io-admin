'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CatalogItem, ItemCategory } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { Plus, X, Save, Pencil, Eye, EyeOff } from 'lucide-react'

const CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: 'camera',   label: 'A — Cameras & Sensors' },
  { value: 'network',  label: 'B — Network & Storage' },
  { value: 'hardware', label: 'C — Mounting Hardware & Cabling' },
  { value: 'labor',    label: 'D — Labor' },
  { value: 'other',    label: 'Other' },
]

const blank = (): Partial<CatalogItem> => ({
  category: 'camera', name: '', description: '', sku: '',
  unit_price: 0, unit_label: 'ea', taxable: true, active: true,
  cost_price: 0, markup_pct: 0,
})

export default function CatalogManager({ initialItems }: { initialItems: CatalogItem[] }) {
  const supabase = createClient()
  const [items, setItems]   = useState(initialItems)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<CatalogItem | null>(null)
  const [form, setForm]         = useState<Partial<CatalogItem>>(blank())
  const [saving, setSaving]     = useState(false)

  function openNew()  { setForm(blank()); setEditing(null); setShowForm(true) }
  function openEdit(c: CatalogItem) { setForm(c); setEditing(c); setShowForm(true) }

  async function handleSave() {
    setSaving(true)
    if (editing) {
      const { data } = await supabase.from('catalog_items').update(form).eq('id', editing.id).select().single()
      if (data) setItems(prev => prev.map(i => i.id === data.id ? data : i))
    } else {
      const { data } = await supabase.from('catalog_items').insert(form).select().single()
      if (data) setItems(prev => [...prev, data])
    }
    setSaving(false); setShowForm(false)
  }

  async function toggleActive(item: CatalogItem) {
    const { data } = await supabase.from('catalog_items').update({ active: !item.active }).eq('id', item.id).select().single()
    if (data) setItems(prev => prev.map(i => i.id === data.id ? data : i))
  }

  const grouped = CATEGORIES.reduce((acc, { value }) => {
    acc[value] = items.filter(i => i.category === value)
    return acc
  }, {} as Record<string, CatalogItem[]>)

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={openNew}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
          <Plus size={15} /> Add Item
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-16 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 mb-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-semibold">{editing ? 'Edit Item' : 'New Item'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ItemCategory }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">SKU / Part #</label>
                  <input value={form.sku ?? ''} onChange={e => setForm(f => ({...f, sku: e.target.value}))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Name *</label>
                  <input value={form.name ?? ''} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                  <input value={form.description ?? ''} onChange={e => setForm(f => ({...f, description: e.target.value}))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Unit Price ($)</label>
                  <input type="number" min="0" step="0.01" inputMode="decimal" value={form.unit_price ?? 0}
                    onChange={e => setForm(f => ({...f, unit_price: parseFloat(e.target.value) || 0}))}
                    onBlur={e => setForm(f => ({...f, unit_price: parseFloat(parseFloat(e.target.value || '0').toFixed(2))}))}
                    onFocus={e => e.target.select()}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Unit Label</label>
                  <input value={form.unit_label ?? 'ea'} onChange={e => setForm(f => ({...f, unit_label: e.target.value}))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="ea, hr, lot, ft" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Our Cost ($)</label>
                  <input type="number" min="0" step="0.01" inputMode="decimal" value={form.cost_price ?? 0}
                    onChange={e => setForm(f => ({...f, cost_price: parseFloat(e.target.value) || 0}))}
                    onBlur={e => setForm(f => ({...f, cost_price: parseFloat(parseFloat(e.target.value || '0').toFixed(2))}))}
                    onFocus={e => e.target.select()}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Markup %</label>
                  <input type="number" min="0" step="0.1" inputMode="decimal" value={form.markup_pct ?? 0}
                    onChange={e => setForm(f => ({...f, markup_pct: parseFloat(e.target.value) || 0}))}
                    onBlur={e => setForm(f => ({...f, markup_pct: parseFloat(parseFloat(e.target.value || '0').toFixed(2))}))}
                    onFocus={e => e.target.select()}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-400">
                    Sell Price (calculated): <span className="font-semibold text-slate-600">
                      ${((form.cost_price ?? 0) * (1 + (form.markup_pct ?? 0) / 100)).toFixed(2)}
                    </span> — for reference only; Unit Price above is what gets saved.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.taxable ?? true} onChange={e => setForm(f => ({...f, taxable: e.target.checked}))} />
                  Taxable
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.active ?? true} onChange={e => setForm(f => ({...f, active: e.target.checked}))} />
                  Active (shows in proposals)
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
              <button onClick={() => setShowForm(false)} className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                <Save size={14} /> {saving ? 'Saving…' : 'Save Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {CATEGORIES.map(({ value, label }) => {
          const catItems = grouped[value] ?? []
          return (
            <div key={value} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 bg-slate-800">
                <span className="text-sm font-semibold text-white">{label}</span>
                <span className="text-xs text-slate-400 ml-2">({catItems.length} items)</span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Name / Description', 'SKU', 'Cost', 'Markup %', 'Unit Price', 'Unit', 'Taxable', 'Active', ''].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {!catItems.length && (
                    <tr><td colSpan={9} className="px-4 py-6 text-center text-xs text-slate-400">No items — click Add Item to get started</td></tr>
                  )}
                  {catItems.map((item, i) => (
                    <tr key={item.id} className={`${i%2===0?'bg-white':'bg-slate-50/40'} ${!item.active ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-slate-800">{item.name}</div>
                        {item.description && <div className="text-xs text-slate-400">{item.description}</div>}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-400 font-mono">{item.sku || '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">{item.cost_price ? formatCurrency(item.cost_price) : '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">{item.markup_pct ? `${item.markup_pct}%` : '—'}</td>
                      <td className="px-4 py-2.5 font-semibold text-cyan-600">{formatCurrency(item.unit_price)}</td>
                      <td className="px-4 py-2.5 text-slate-500">{item.unit_label}</td>
                      <td className="px-4 py-2.5 text-slate-500">{item.taxable ? '✓' : '—'}</td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => toggleActive(item)} className="text-slate-400 hover:text-slate-600">
                          {item.active ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                      </td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => openEdit(item)} className="text-cyan-600 hover:text-cyan-400 transition-colors">
                          <Pencil size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}
      </div>
    </div>
  )
}
