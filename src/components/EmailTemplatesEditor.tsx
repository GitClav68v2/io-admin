'use client'
import { useState } from 'react'
import { EmailTemplate, EmailTemplateType } from '@/lib/types'
import { TEMPLATE_VARIABLES } from '@/lib/email-templates'
import { Save, Eye, X } from 'lucide-react'

const TABS: { type: EmailTemplateType; label: string }[] = [
  { type: 'proposal_send', label: 'Proposal' },
  { type: 'invoice_send', label: 'Invoice' },
  { type: 'invoice_reminder', label: 'Reminder' },
  { type: 'payment_receipt', label: 'Receipt' },
]

const SAMPLE_VARS: Record<string, string> = {
  client_name: 'John Smith',
  proposal_number: 'IO-2026-0042',
  project_name: 'Warehouse Camera Install',
  grand_total: '$12,500.00',
  monthly_recurring: '$149.00',
  valid_days: '30',
  invoice_number: 'IO-INV-2026-0018',
  due_date: 'April 28, 2026',
  balance_due: '$6,250.00',
  amount_paid: '$6,250.00',
  rep_name: 'David Clavadetscher',
  company_phone: '(949) 233-1833',
  footer: '<div style="background:#F8FAFC;padding:16px 28px;border-top:1px solid #E2E8F0;"><p style="color:#94A3B8;font-size:12px;margin:0;">IntegrationOne · integrationone.net</p></div>',
}

export default function EmailTemplatesEditor({ templates }: { templates: EmailTemplate[] }) {
  const [activeTab, setActiveTab] = useState<EmailTemplateType>('proposal_send')
  const [drafts, setDrafts] = useState<Record<string, { subject: string; body_html: string }>>(() => {
    const map: Record<string, { subject: string; body_html: string }> = {}
    for (const t of templates) {
      map[t.type] = { subject: t.subject, body_html: t.body_html }
    }
    return map
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const current = drafts[activeTab] ?? { subject: '', body_html: '' }

  function updateDraft(field: 'subject' | 'body_html', value: string) {
    setDrafts(d => ({ ...d, [activeTab]: { ...current, [field]: value } }))
    setSaved(null)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(null)
    const res = await fetch('/api/email-templates/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: activeTab, ...current }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) setError(data.error ?? 'Save failed')
    else setSaved(activeTab)
  }

  function renderPreview() {
    let html = current.body_html
    // Handle {{#if var}}...{{/if}}
    html = html.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, content) =>
      SAMPLE_VARS[key] ? content : ''
    )
    // Replace {{var}}
    for (const [key, value] of Object.entries(SAMPLE_VARS)) {
      html = html.replaceAll(`{{${key}}}`, value)
    }
    setPreview(html)
  }

  const vars = TEMPLATE_VARIABLES[activeTab] ?? []

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 max-w-4xl mt-8">
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="font-semibold text-slate-900">Email Templates</h2>
        <p className="text-xs text-slate-400 mt-0.5">Customize the emails sent with proposals and invoices.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {TABS.map(t => (
          <button
            key={t.type}
            onClick={() => { setActiveTab(t.type); setSaved(null); setError(null) }}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.type
                ? 'border-cyan-500 text-cyan-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-4">
        {/* Subject */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Subject Line</label>
          <input
            type="text"
            value={current.subject}
            onChange={e => updateDraft('subject', e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {/* Body */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">HTML Body</label>
          <textarea
            rows={16}
            value={current.body_html}
            onChange={e => updateDraft('body_html', e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {/* Variables reference */}
        <div className="bg-slate-50 rounded-lg px-4 py-3">
          <p className="text-xs font-semibold text-slate-500 mb-1.5">Available Variables</p>
          <div className="flex flex-wrap gap-1.5">
            {vars.map(v => (
              <code key={v} className="text-xs bg-white border border-slate-200 rounded px-1.5 py-0.5 text-cyan-700">
                {'{{' + v + '}}'}
              </code>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Use <code className="text-xs">{'{{#if var}}...{{/if}}'}</code> for conditional blocks.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-200">
        <div className="flex items-center gap-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved === activeTab && <p className="text-sm text-green-600">Saved.</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={renderPreview}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Eye size={14} /> Preview
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? 'Saving…' : 'Save Template'}
          </button>
        </div>
      </div>

      {/* Preview modal */}
      {preview !== null && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-8" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800 text-sm">Email Preview (sample data)</h3>
              <button onClick={() => setPreview(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <div className="p-5">
              <div className="mb-3">
                <span className="text-xs font-medium text-slate-400">Subject: </span>
                <span className="text-sm text-slate-800">
                  {(() => {
                    let s = current.subject
                    for (const [k, v] of Object.entries(SAMPLE_VARS)) s = s.replaceAll(`{{${k}}}`, v)
                    return s
                  })()}
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden" dangerouslySetInnerHTML={{ __html: preview }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
