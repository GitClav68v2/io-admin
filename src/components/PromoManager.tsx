'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PromoCode } from '@/lib/types'
import { Plus, X, Save } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const blank = (): Partial<PromoCode> => ({
  code: '',
  type: 'percentage',
  value: 0,
  expiry_date: null,
  max_uses: null,
  active: true,
})

export default function PromoManager({ initialPromos }: { initialPromos: PromoCode[] }) {
  const supabase = createClient()
  const [promos, setPromos]     = useState(initialPromos)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState<Partial<PromoCode>>(blank())
  const [saving, setSaving]     = useState(false)

  function openNew() { setForm(blank()); setShowForm(true) }

  async function handleSave() {
    if (!form.code?.trim()) return
    setSaving(true)
    const payload = {
      code:        form.code.trim().toUpperCase(),
      type:        form.type,
      value:       form.value,
      expiry_date: form.expiry_date || null,
      max_uses:    form.max_uses || null,
      active:      form.active ?? true,
    }
    const { data } = await supabase.from('promo_codes').insert(payload).select().single()
    if (data) setPromos(prev => [data, ...prev])
    setSaving(false)
    setShowForm(false)
  }

  async function toggleActive(promo: PromoCode) {
    const { data } = await supabase
      .from('promo_codes')
      .update({ active: !promo.active })
      .eq('id', promo.id)
      .select()
      .single()
    if (data) setPromos(prev => prev.map(p => p.id === data.id ? data : p))
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={openNew}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
          <Plus size={15} /> New Promo
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-16 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 mb-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">New Promo Code</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Code *</label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 uppercase"
                  placeholder="e.g. SAVE10"
                  value={form.code ?? ''}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Type *</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    value={form.type ?? 'percentage'}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value as 'percentage' | 'fixed' }))}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Value * {form.type === 'percentage' ? '(%)' : '($)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step={form.type === 'percentage' ? '0.01' : '1'}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    value={form.value ?? ''}
                    onChange={e => setForm(f => ({ ...f, value: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    value={form.expiry_date ?? ''}
                    onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value || null }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Max Uses</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Unlimited"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    value={form.max_uses ?? ''}
                    onChange={e => setForm(f => ({ ...f, max_uses: parseInt(e.target.value) || null }))}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
              <button onClick={() => setShowForm(false)}
                className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !form.code?.trim()}
                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                <Save size={14} /> {saving ? 'Saving…' : 'Create Promo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Code', 'Type', 'Value', 'Expiry', 'Uses', 'Active', ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {promos.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 font-mono font-semibold text-slate-800">{p.code}</td>
                <td className="px-5 py-3 text-slate-500 capitalize">{p.type}</td>
                <td className="px-5 py-3 text-slate-700 font-medium">
                  {p.type === 'percentage' ? `${p.value}%` : `$${p.value.toFixed(2)}`}
                </td>
                <td className="px-5 py-3 text-slate-500">{p.expiry_date ? formatDate(p.expiry_date) : '—'}</td>
                <td className="px-5 py-3 text-slate-500">
                  {p.uses_count}{p.max_uses ? ` / ${p.max_uses}` : ''}
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {p.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => toggleActive(p)}
                    className="text-xs font-medium text-cyan-600 hover:underline"
                  >
                    {p.active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
            {!promos.length && (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">No promo codes yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
