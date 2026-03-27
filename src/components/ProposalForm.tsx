'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Client, CatalogItem, ProposalLineItem, LineSection } from '@/lib/types'
import { formatCurrency, calcTotals, SECTION_LABELS, TAX_RATE } from '@/lib/utils'
import { Plus, Trash2, ChevronDown, Search, X, Sparkles, Loader2 } from 'lucide-react'

interface LineItemDraft {
  id: string
  catalog_item_id: string | null
  section: LineSection
  sort_order: number
  name: string
  description: string
  sku: string
  qty: number
  unit_label: string
  unit_price: number
  unit_price_raw: string
  taxable: boolean
  is_recurring: boolean
  recurring_label: string
}

interface Props {
  clients: Client[]
  catalog: CatalogItem[]
  proposal?: any  // for edit mode
}

const SECTIONS: LineSection[] = ['cameras', 'network', 'hardware', 'labor', 'other']

function uid() { return Math.random().toString(36).slice(2) }

const DEFAULT_SCOPE = `Integration One proposes to design and coordinate the installation of a complete perimeter security system for [Client Name] located at [Job Site Address]. The system will consist of [X] high-definition IP cameras covering [describe areas], connected to a centrally-managed NVR. Live monitoring will be provided via Deep Sentinel with real-time alerts and 24/7 professional response.`

const DEFAULT_ASSUMPTIONS = `• Existing electrical outlets (110V) are within 10 ft of each camera mounting location.
• Adequate internet service is available on-site (minimum 25 Mbps upload).
• Client will designate a site contact to provide access during installation.
• Walls and ceilings are accessible for cable routing.
• Patching and painting after cable installation is the client's responsibility.`

const DEFAULT_EXCLUSIONS = `• Permit fees (if required) — obtained by Integration One, billed at cost
• High-voltage electrical work — by licensed electrician
• Underground conduit trenching (unless listed in line items)
• Painting or cosmetic finish work
• Internet service subscription or router upgrades
• Deep Sentinel / monitoring subscription fees (billed directly by provider)`

export default function ProposalForm({ clients, catalog, proposal }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!proposal

  // ── Client & header fields ────────────────────────────────────────────────
  const [clientId, setClientId]         = useState(proposal?.client_id ?? '')
  const [title, setTitle]               = useState(proposal?.title ?? '')
  const [projectName, setProjectName]   = useState(proposal?.project_name ?? '')
  const [repName, setRepName]           = useState(proposal?.rep_name ?? '')
  const [scopeNotes, setScopeNotes]     = useState(proposal?.scope_notes ?? DEFAULT_SCOPE)
  const [assumptions, setAssumptions]   = useState(proposal?.assumptions ?? DEFAULT_ASSUMPTIONS)
  const [exclusions, setExclusions]     = useState(proposal?.exclusions ?? DEFAULT_EXCLUSIONS)
  const [monthlyNotes, setMonthlyNotes] = useState(proposal?.monthly_notes ?? '')
  const [monthlyRecurring, setMonthlyRecurring] = useState(proposal?.monthly_recurring ?? 0)
  const [monthlyDisplay, setMonthlyDisplay] = useState(
    (proposal?.monthly_recurring ?? 0) > 0 ? (proposal.monthly_recurring as number).toFixed(2) : ''
  )

  function handleMonthlyChange(val: string) {
    const cleaned = val.replace(/[^\d.]/g, '').replace(/(\.\d{0,2}).*/, '$1').replace(/^(\d*)(\.\d*)?/, '$1$2')
    setMonthlyDisplay(cleaned)
    setMonthlyRecurring(parseFloat(cleaned) || 0)
  }

  function handleMonthlyBlur() {
    const n = parseFloat(monthlyDisplay) || 0
    setMonthlyRecurring(n)
    setMonthlyDisplay(n > 0 ? n.toFixed(2) : '')
  }
  const [taxRate, setTaxRate]           = useState(proposal?.tax_rate ?? TAX_RATE)
  const [notes, setNotes]               = useState(proposal?.notes ?? '')
  const [conditionalInspection, setConditionalInspection] = useState<boolean>(proposal?.conditional_inspection ?? false)
  const [inspectionClause, setInspectionClause]           = useState<string>(proposal?.inspection_clause ?? '')

  // Bill To (manual override or auto-filled from client)
  const [billTo, setBillTo] = useState({
    name:    proposal?.bill_to_name    ?? '',
    company: proposal?.bill_to_company ?? '',
    email:   proposal?.bill_to_email   ?? '',
    phone:   proposal?.bill_to_phone   ?? '',
    address: proposal?.bill_to_address ?? '',
    city:    proposal?.bill_to_city    ?? '',
    state:   proposal?.bill_to_state   ?? 'CA',
    zip:     proposal?.bill_to_zip     ?? '',
  })

  const [siteSameAsBilling, setSiteSameAsBilling] = useState(false)
  const [siteAddress, setSiteAddress] = useState(proposal?.site_address ?? '')
  const [siteCity, setSiteCity]       = useState(proposal?.site_city ?? '')
  const [siteState, setSiteState]     = useState(proposal?.site_state ?? 'CA')
  const [siteZip, setSiteZip]         = useState(proposal?.site_zip ?? '')

  // ── Line items ────────────────────────────────────────────────────────────
  const initItems: LineItemDraft[] = (proposal?.line_items ?? []).map((li: ProposalLineItem) => ({
    id: li.id, catalog_item_id: li.catalog_item_id, section: li.section,
    sort_order: li.sort_order, name: li.name, description: li.description ?? '',
    sku: li.sku ?? '', qty: li.qty, unit_label: li.unit_label, unit_price: li.unit_price,
    unit_price_raw: li.unit_price.toFixed(2),
    taxable: li.taxable, is_recurring: li.is_recurring, recurring_label: li.recurring_label ?? '',
  }))
  const [items, setItems] = useState<LineItemDraft[]>(initItems)
  const [activeRowId, setActiveRowId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Promo code
  const [promoCode, setPromoCode]       = useState<string>(proposal?.promo_code ?? '')
  const [promoDiscount, setPromoDiscount] = useState<number>(proposal?.promo_discount ?? 0)
  const [promoStatus, setPromoStatus]   = useState<null | 'valid' | 'invalid'>(
    proposal?.promo_code ? 'valid' : null
  )
  const [promoMessage, setPromoMessage] = useState<string>(
    proposal?.promo_code && proposal?.promo_discount > 0
      ? `${proposal.promo_code} applied — saves ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(proposal.promo_discount)}`
      : ''
  )
  const [promoValidating, setPromoValidating] = useState(false)

  async function applyPromoCode() {
    const trimmed = promoCode.trim()
    if (!trimmed) return
    setPromoValidating(true)
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed, grandTotal: totals.grand_total }),
      })
      const data = await res.json()
      if (data.valid) {
        setPromoStatus('valid')
        setPromoDiscount(data.discountAmount)
        setPromoCode(data.code)
        setPromoMessage(`${data.code} applied — saves ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.discountAmount)}`)
      } else {
        setPromoStatus('invalid')
        setPromoDiscount(0)
        setPromoMessage(data.reason ?? 'Invalid code')
      }
    } catch {
      setPromoStatus('invalid')
      setPromoDiscount(0)
      setPromoMessage('Failed to validate code')
    }
    setPromoValidating(false)
  }

  function clearPromo() {
    setPromoCode('')
    setPromoDiscount(0)
    setPromoStatus(null)
    setPromoMessage('')
  }

  // AI agents
  const [aiItemsOpen, setAiItemsOpen]           = useState(false)
  const [aiItemsBrief, setAiItemsBrief]         = useState('')
  const [aiItemsLoading, setAiItemsLoading]     = useState(false)
  const [aiItemsSuggestions, setAiItemsSuggestions] = useState<any[]>([])
  const [aiScopeOpen, setAiScopeOpen]           = useState(false)
  const [aiScopeBrief, setAiScopeBrief]         = useState('')
  const [aiScopeLoading, setAiScopeLoading]     = useState(false)

  async function runSuggestItems() {
    setAiItemsLoading(true)
    try {
      const res = await fetch('/api/agents/suggest-items', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiItemsBrief, catalog }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAiItemsSuggestions(data.items)
    } catch (e: any) { alert('AI error: ' + e.message) }
    setAiItemsLoading(false)
  }

  function addSuggestedItems() {
    const newItems = aiItemsSuggestions.map(s => ({
      id: uid(),
      catalog_item_id: catalog.find(c => c.sku && c.sku === s.sku)?.id ?? null,
      section: s.section as LineSection,
      sort_order: items.length,
      name: s.name, description: s.description, sku: s.sku,
      qty: s.qty, unit_label: s.unit_label, unit_price: s.unit_price,
      unit_price_raw: (s.unit_price ?? 0).toFixed(2),
      taxable: s.taxable, is_recurring: false, recurring_label: '',
    }))
    setItems(prev => [...prev, ...newItems])
    setAiItemsOpen(false); setAiItemsSuggestions([]); setAiItemsBrief('')
  }

  async function runWriteScope() {
    setAiScopeLoading(true)
    try {
      const res = await fetch('/api/agents/write-scope', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: aiScopeBrief,
          clientName: billTo.company || billTo.name,
          siteAddress: siteSameAsBilling ? billTo.address : siteAddress,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setScopeNotes(data.scope); setAssumptions(data.assumptions); setExclusions(data.exclusions)
      setAiScopeOpen(false); setAiScopeBrief('')
    } catch (e: any) { alert('AI error: ' + e.message) }
    setAiScopeLoading(false)
  }

  // HubSpot search
  const [hsQuery, setHsQuery]     = useState('')
  const [hsResults, setHsResults] = useState<any[]>([])
  const [hsSearching, setHsSearching] = useState(false)
  const [hsOpen, setHsOpen]       = useState(false)

  async function searchHubSpot(q: string) {
    setHsQuery(q)
    if (q.length < 2) { setHsResults([]); return }
    setHsSearching(true)
    const res = await fetch(`/api/hubspot?q=${encodeURIComponent(q)}`)
    setHsResults(await res.json())
    setHsSearching(false)
  }

  function importHubSpotContact(c: any) {
    setBillTo({
      name:    c.name,
      company: c.company,
      email:   c.email,
      phone:   c.phone,
      address: c.address,
      city:    c.city,
      state:   c.state || 'CA',
      zip:     c.zip,
    })
    setHsOpen(false)
    setHsQuery('')
    setHsResults([])
  }

  // Auto-fill bill-to when client selected
  function handleClientChange(id: string) {
    setClientId(id)
    const c = clients.find(cl => cl.id === id)
    if (!c) return
    setBillTo({
      name:    c.name    ?? '',
      company: c.company ?? '',
      email:   c.email   ?? '',
      phone:   c.phone   ?? '',
      address: c.billing_address ?? '',
      city:    c.billing_city    ?? '',
      state:   c.billing_state   ?? 'CA',
      zip:     c.billing_zip     ?? '',
    })
    if (c.site_address) {
      setSiteAddress(c.site_address)
      setSiteCity(c.site_city ?? '')
      setSiteState(c.site_state ?? 'CA')
      setSiteZip(c.site_zip ?? '')
    }
  }

  const catalogSection = (cat: string): LineSection =>
    cat === 'camera' ? 'cameras' : cat === 'network' ? 'network'
    : cat === 'hardware' ? 'hardware' : cat === 'labor' ? 'labor' : 'other'

  // Add line item from catalog — fills active row if one exists, else appends
  function addFromCatalog(item: CatalogItem) {
    if (activeRowId) {
      setItems(prev => prev.map(li => li.id === activeRowId ? {
        ...li,
        catalog_item_id: item.id,
        section: catalogSection(item.category),
        name: item.name,
        description: item.description ?? '',
        sku: item.sku ?? '',
        unit_label: item.unit_label,
        unit_price: item.unit_price,
        unit_price_raw: item.unit_price.toFixed(2),
        taxable: item.taxable,
      } : li))
      setActiveRowId(null)
    } else {
      setItems(prev => [...prev, {
        id: uid(), catalog_item_id: item.id,
        section: catalogSection(item.category),
        sort_order: prev.length,
        name: item.name, description: item.description ?? '',
        sku: item.sku ?? '', qty: 1,
        unit_label: item.unit_label, unit_price: item.unit_price,
        unit_price_raw: item.unit_price.toFixed(2),
        taxable: item.taxable, is_recurring: false, recurring_label: '',
      }])
    }
  }

  function addBlankItem(section: LineSection) {
    const id = uid()
    setItems(prev => [...prev, {
      id, catalog_item_id: null, section, sort_order: prev.length,
      name: '', description: '', sku: '', qty: 1,
      unit_label: section === 'labor' ? 'hr' : 'ea',
      unit_price: 0, unit_price_raw: '0.00', taxable: section !== 'labor', is_recurring: false, recurring_label: '',
    }])
    setActiveRowId(id)
  }

  function updateItem(id: string, field: keyof LineItemDraft, value: any) {
    setItems(prev => prev.map(li => li.id === id ? { ...li, [field]: value } : li))
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(li => li.id !== id))
  }

  // Totals
  const totals = calcTotals(items.map(i => ({
    qty: i.qty, unit_price: i.unit_price, taxable: i.taxable, section: i.section
  })))
  const finalGrandTotal = Math.max(0, Math.round((totals.grand_total - promoDiscount) * 100) / 100)
  const deposit   = Math.round(finalGrandTotal * 0.50 * 100) / 100
  const progress  = Math.round(finalGrandTotal * 0.25 * 100) / 100
  const finalPmt  = Math.round((finalGrandTotal - deposit - progress) * 100) / 100

  // ── Save ─────────────────────────────────────────────────────────────────
  async function handleSave(status: string = 'draft') {
    setSaving(true)
    const payload = {
      client_id: clientId || null,
      title, project_name: projectName, rep_name: repName,
      scope_notes: scopeNotes, assumptions, exclusions,
      monthly_notes: monthlyNotes, monthly_recurring: monthlyRecurring,
      tax_rate: taxRate, status,
      bill_to_name: billTo.name, bill_to_company: billTo.company,
      bill_to_email: billTo.email, bill_to_phone: billTo.phone,
      bill_to_address: billTo.address, bill_to_city: billTo.city,
      bill_to_state: billTo.state, bill_to_zip: billTo.zip,
      site_address: siteSameAsBilling ? billTo.address : siteAddress,
      site_city:    siteSameAsBilling ? billTo.city    : siteCity,
      site_state:   siteSameAsBilling ? billTo.state   : siteState,
      site_zip:     siteSameAsBilling ? billTo.zip     : siteZip,
      subtotal_equipment: totals.subtotal_equipment,
      subtotal_labor: totals.subtotal_labor,
      tax_amount: totals.tax_amount,
      grand_total: finalGrandTotal,
      promo_code: promoCode.trim() || null,
      promo_discount: promoDiscount,
      notes,
      conditional_inspection: conditionalInspection,
      inspection_clause: conditionalInspection ? (inspectionClause || null) : null,
      proposal_number: isEdit ? proposal.proposal_number : '',
    }

    let proposalId = proposal?.id

    if (isEdit) {
      await supabase.from('proposals').update(payload).eq('id', proposalId)
      await supabase.from('proposal_line_items').delete().eq('proposal_id', proposalId)
    } else {
      const { data, error } = await supabase.from('proposals').insert(payload).select().single()
      if (error || !data) { setSaving(false); alert(error?.message); return }
      proposalId = data.id
    }

    if (items.length) {
      const linePayload = items.map((li, i) => ({
        proposal_id: proposalId, catalog_item_id: li.catalog_item_id,
        section: li.section, sort_order: i,
        name: li.name, description: li.description, sku: li.sku,
        qty: li.qty, unit_label: li.unit_label, unit_price: li.unit_price,
        taxable: li.taxable, is_recurring: li.is_recurring, recurring_label: li.recurring_label,
      }))
      await supabase.from('proposal_line_items').insert(linePayload)
    }

    // Increment promo uses on first save (new proposals only, or when promo was just applied)
    if (!isEdit && promoCode.trim() && promoStatus === 'valid') {
      await fetch('/api/promo/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.trim() }),
      })
    }

    setSaving(false)
    router.push(`/proposals/${proposalId}`)
  }

  const catalogByCategory = catalog.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, CatalogItem[]>)

  const itemsBySection = (section: LineSection) => items.filter(i => i.section === section)

  return (
    <div className="grid grid-cols-[1fr_280px] gap-6 items-start">
      {/* ── Main form ── */}
      <div className="space-y-6">

        {/* Header info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Proposal Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Title *</label>
              <input className="input" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Security Camera System — ABC Business" />
            </div>
            <div>
              <label className="label">Project Name</label>
              <input className="input" value={projectName} onChange={e => setProjectName(e.target.value)}
                placeholder="e.g. ABC Business Oakland" />
            </div>
            <div>
              <label className="label">Prepared By</label>
              <input className="input" value={repName} onChange={e => setRepName(e.target.value)}
                placeholder="Paul / Garrett / David" />
            </div>
          </div>
        </div>

        {/* Client */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Client</h2>
          <div>
            <label className="label">Select Existing Client</label>
            <select className="input" value={clientId} onChange={e => handleClientChange(e.target.value)}>
              <option value="">— or fill in manually below —</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.company || c.name}{c.company ? ` (${c.name})` : ''}</option>
              ))}
            </select>
          </div>

          {/* HubSpot import */}
          <div className="relative">
            <button type="button" onClick={() => setHsOpen(o => !o)}
              className="flex items-center gap-2 text-xs font-medium text-cyan-600 hover:text-cyan-500 transition-colors">
              <Search size={13} /> Import from HubSpot
            </button>
            {hsOpen && (
              <div className="absolute left-0 top-6 z-30 bg-white border border-slate-200 rounded-xl shadow-lg w-full min-w-[340px] p-3">
                <div className="flex items-center gap-2 mb-2">
                  <input autoFocus
                    className="input flex-1 text-sm"
                    placeholder="Search by name, company, or email…"
                    value={hsQuery}
                    onChange={e => searchHubSpot(e.target.value)} />
                  <button onClick={() => { setHsOpen(false); setHsQuery(''); setHsResults([]) }}
                    className="text-slate-400 hover:text-slate-600"><X size={15} /></button>
                </div>
                {hsSearching && <p className="text-xs text-slate-400 px-1">Searching…</p>}
                {!hsSearching && hsResults.length === 0 && hsQuery.length >= 2 && (
                  <p className="text-xs text-slate-400 px-1">No contacts found</p>
                )}
                <div className="divide-y divide-slate-50">
                  {hsResults.map(c => (
                    <button key={c.id} type="button" onClick={() => importHubSpotContact(c)}
                      className="w-full text-left px-2 py-2 hover:bg-cyan-50 rounded-lg transition-colors">
                      <div className="text-sm font-medium text-slate-800">{c.company || c.name}</div>
                      <div className="text-xs text-slate-400">{c.company ? c.name + ' · ' : ''}{c.email}{c.phone ? ' · ' + c.phone : ''}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Contact Name</label>
              <input className="input" value={billTo.name}
                onChange={e => setBillTo(b => ({ ...b, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Company</label>
              <input className="input" value={billTo.company}
                onChange={e => setBillTo(b => ({ ...b, company: e.target.value }))} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={billTo.email}
                onChange={e => setBillTo(b => ({ ...b, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={billTo.phone}
                onChange={e => {
                  const d = e.target.value.replace(/\D/g, '').slice(0, 10)
                  const fmt = d.length <= 3 ? d : d.length <= 6 ? d.slice(0,3)+'-'+d.slice(3) : d.slice(0,3)+'-'+d.slice(3,6)+'-'+d.slice(6)
                  setBillTo(b => ({ ...b, phone: fmt }))
                }} />
            </div>
            <div className="col-span-2">
              <label className="label">Billing Address</label>
              <input className="input" value={billTo.address}
                onChange={e => setBillTo(b => ({ ...b, address: e.target.value }))} />
            </div>
            <div><input className="input" placeholder="City" value={billTo.city}
              onChange={e => setBillTo(b => ({ ...b, city: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-2">
              <input className="input" placeholder="State" value={billTo.state}
                onChange={e => setBillTo(b => ({ ...b, state: e.target.value }))} />
              <input className="input" placeholder="ZIP" value={billTo.zip}
                onChange={e => setBillTo(b => ({ ...b, zip: e.target.value }))} />
            </div>
          </div>

          {/* Job site */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-medium text-slate-700 text-sm">Job Site Address</h3>
              <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer ml-auto">
                <input type="checkbox" checked={siteSameAsBilling}
                  onChange={e => setSiteSameAsBilling(e.target.checked)} />
                Same as billing
              </label>
            </div>
            <div className={`grid grid-cols-2 gap-4 ${siteSameAsBilling ? 'opacity-50' : ''}`}>
              <div className="col-span-2">
                <input className="input" placeholder="Street address"
                  value={siteSameAsBilling ? billTo.address : siteAddress}
                  disabled={siteSameAsBilling}
                  onChange={e => setSiteAddress(e.target.value)} />
              </div>
              <input className="input" placeholder="City"
                value={siteSameAsBilling ? billTo.city : siteCity}
                disabled={siteSameAsBilling}
                onChange={e => setSiteCity(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <input className="input" placeholder="State"
                  value={siteSameAsBilling ? billTo.state : siteState}
                  disabled={siteSameAsBilling}
                  onChange={e => setSiteState(e.target.value)} />
                <input className="input" placeholder="ZIP"
                  value={siteSameAsBilling ? billTo.zip : siteZip}
                  disabled={siteSameAsBilling}
                  onChange={e => setSiteZip(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Scope */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Project Scope</h2>
            <button type="button" onClick={() => setAiScopeOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-500 transition-colors">
              <Sparkles size={13} /> AI Write Scope
            </button>
          </div>
          <div>
            <label className="label">Scope Narrative</label>
            <textarea className="input min-h-[100px]" value={scopeNotes} onChange={e => setScopeNotes(e.target.value)} />
          </div>
          <div>
            <label className="label">Assumptions</label>
            <textarea className="input min-h-[100px]" value={assumptions} onChange={e => setAssumptions(e.target.value)} />
          </div>
          <div>
            <label className="label">Exclusions</label>
            <textarea className="input min-h-[100px]" value={exclusions} onChange={e => setExclusions(e.target.value)} />
          </div>
        </div>

        {/* Line items by section */}
        {SECTIONS.map(section => (
          <div key={section} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-slate-800">
              <span className="text-sm font-semibold text-white">{SECTION_LABELS[section]}</span>
              <button onClick={() => addBlankItem(section)}
                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300">
                <Plus size={13} /> Add row
              </button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs text-slate-500 w-[38%]">Description</th>
                  <th className="px-2 py-2 text-center text-xs text-slate-500 w-[10%]">Qty</th>
                  <th className="px-2 py-2 text-center text-xs text-slate-500 w-[8%]">Unit</th>
                  <th className="px-2 py-2 text-right text-xs text-slate-500 w-[14%]">Unit Price</th>
                  <th className="px-2 py-2 text-right text-xs text-slate-500 w-[14%]">Total</th>
                  <th className="px-2 py-2 w-[8%]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {itemsBySection(section).map((li, idx) => (
                  <tr key={li.id} className={activeRowId === li.id ? 'bg-violet-50 ring-1 ring-inset ring-violet-300' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-4 py-2">
                      <input className="input-sm w-full font-medium" placeholder="Item name"
                        value={li.name}
                        onFocus={() => setActiveRowId(li.id)}
                        onBlur={() => setActiveRowId(id => id === li.id && li.name !== '' ? null : id)}
                        onChange={e => updateItem(li.id, 'name', e.target.value)} />
                      <input className="input-sm w-full text-slate-400 mt-0.5 text-xs" placeholder="Description (optional)"
                        value={li.description} onChange={e => updateItem(li.id, 'description', e.target.value)} />
                    </td>
                    <td className="px-2 py-2">
                      <input className="input-sm w-full text-center" type="number" min="0" step="0.5"
                        value={li.qty} onChange={e => updateItem(li.id, 'qty', parseFloat(e.target.value) || 0)} />
                    </td>
                    <td className="px-2 py-2">
                      <input className="input-sm w-full text-center"
                        value={li.unit_label} onChange={e => updateItem(li.id, 'unit_label', e.target.value)} />
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center justify-end gap-0.5">
                        <span className="text-slate-400 text-xs">$</span>
                        <input className="input-sm text-right" style={{ width: 'calc(100% - 12px)' }} type="text" inputMode="decimal"
                          value={li.unit_price_raw ?? li.unit_price.toFixed(2)}
                          onChange={e => {
                            const raw = e.target.value
                            updateItem(li.id, 'unit_price_raw', raw)
                            const n = parseFloat(raw)
                            if (!isNaN(n)) updateItem(li.id, 'unit_price', n)
                          }}
                          onBlur={e => {
                            const n = parseFloat(e.target.value) || 0
                            updateItem(li.id, 'unit_price', n)
                            updateItem(li.id, 'unit_price_raw', n.toFixed(2))
                          }}
                          onFocus={e => e.target.select()} />
                      </div>
                    </td>
                    <td className="px-2 py-2 text-right font-semibold text-slate-700">
                      {formatCurrency(li.qty * li.unit_price)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button onClick={() => removeItem(li.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {itemsBySection(section).length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-4 text-xs text-slate-400 text-center">
                    No items — add from catalog or click "Add row"
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        ))}

        {/* Recurring & Notes */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Monthly Recurring Services</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Total Monthly Recurring ($)</label>
              <input className="input" type="text" inputMode="decimal" placeholder="0.00"
                value={monthlyDisplay}
                onChange={e => handleMonthlyChange(e.target.value)}
                onBlur={handleMonthlyBlur} />
            </div>
            <div>
              <label className="label">Tax Rate</label>
              <input className="input" type="number" min="0" max="1" step="0.0001"
                value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} />
              <p className="text-xs text-slate-400 mt-1">{(taxRate * 100).toFixed(2)}% — applies to taxable items only</p>
            </div>
            <div className="col-span-2">
              <label className="label">Monthly Services Detail</label>
              <input className="input" value={monthlyNotes} onChange={e => setMonthlyNotes(e.target.value)}
                placeholder="e.g. Deep Sentinel: 1 hub + 6 cameras @ $50/ea = $350/mo" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <label className="label">Internal Notes</label>
          <textarea className="input min-h-[80px]" value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Notes visible only in admin portal" />
        </div>

        {/* Conditional Inspection */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <input
              id="conditionalInspection"
              type="checkbox"
              checked={conditionalInspection}
              onChange={e => {
                setConditionalInspection(e.target.checked)
                if (!e.target.checked) setInspectionClause('')
              }}
              className="h-4 w-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-400 cursor-pointer"
            />
            <label htmlFor="conditionalInspection" className="text-sm font-medium text-slate-800 cursor-pointer">
              Conditional on final site inspection
            </label>
          </div>
          {conditionalInspection && (
            <div className="space-y-3">
              <div>
                <label className="label">Clause Preset</label>
                <select
                  className="input"
                  value=""
                  onChange={e => { if (e.target.value) setInspectionClause(e.target.value) }}
                >
                  <option value="">— select a preset or write your own below —</option>
                  <option value="This proposal is conditional upon final site inspection. Pricing is subject to adjustment based on actual site conditions found during inspection.">
                    Short — pricing subject to adjustment
                  </option>
                  <option value="This proposal is conditional upon a final site inspection by an Integration One technician. Equipment quantities, cable routing paths, and labor hours may be revised following the inspection. A revised proposal will be issued prior to project commencement.">
                    Standard — revised proposal before commencement
                  </option>
                  <option value="Pricing reflects a preliminary assessment only. Final pricing will be confirmed after an on-site walkthrough and is subject to change based on conditions discovered during inspection.">
                    Preliminary — confirmed after walkthrough
                  </option>
                </select>
              </div>
              <div>
                <label className="label">Inspection Clause</label>
                <textarea
                  className="input min-h-[80px]"
                  value={inspectionClause}
                  onChange={e => setInspectionClause(e.target.value)}
                  placeholder="Conditional clause text that will appear on the PDF…"
                />
              </div>
            </div>
          )}
        </div>

        {/* Save buttons */}
        <div className="flex gap-3 pb-8">
          <button onClick={() => handleSave('draft')} disabled={saving}
            className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save as Draft'}
          </button>
          <button onClick={() => handleSave('sent')} disabled={saving}
            className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save & Mark Sent'}
          </button>
        </div>
      </div>

      {/* ── Sidebar: catalog + totals ── */}
      <div className="space-y-4 sticky top-6">
        {/* Totals */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-2">
          <h3 className="font-semibold text-slate-800 text-sm mb-3">Totals</h3>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Equipment</span>
            <span>{formatCurrency(totals.subtotal_equipment)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Labor</span>
            <span>{formatCurrency(totals.subtotal_labor)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Tax ({(taxRate*100).toFixed(2)}%)</span>
            <span>{formatCurrency(totals.tax_amount)}</span>
          </div>
          {/* Promo code input */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <label className="text-xs font-medium text-slate-500">Promo Code</label>
            <div className="flex gap-1.5">
              <input
                className="input flex-1 text-sm"
                placeholder="Enter code"
                value={promoCode}
                onChange={e => { setPromoCode(e.target.value); if (promoStatus) { setPromoStatus(null); setPromoDiscount(0); setPromoMessage('') } }}
                onKeyDown={e => e.key === 'Enter' && applyPromoCode()}
              />
              {promoStatus === 'valid' ? (
                <button type="button" onClick={clearPromo}
                  className="px-2 py-1 text-xs text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  Clear
                </button>
              ) : (
                <button type="button" onClick={applyPromoCode} disabled={promoValidating || !promoCode.trim()}
                  className="px-2 py-1 text-xs font-medium bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg disabled:opacity-50 transition-colors">
                  {promoValidating ? '…' : 'Apply'}
                </button>
              )}
            </div>
            {promoMessage && (
              <p className={`text-xs ${promoStatus === 'valid' ? 'text-green-600' : 'text-red-500'}`}>
                {promoMessage}
              </p>
            )}
          </div>

          {promoDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-{formatCurrency(promoDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-200">
            <span>One-Time Total</span>
            <span className="text-cyan-600">{formatCurrency(finalGrandTotal)}</span>
          </div>
          {monthlyRecurring > 0 && (
            <div className="flex justify-between text-sm text-slate-500 pt-1 border-t border-slate-100">
              <span>Monthly Recurring</span>
              <span>{formatCurrency(monthlyRecurring)}/mo</span>
            </div>
          )}
          <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-500">
            <div className="flex justify-between"><span>Deposit (50%)</span><span>{formatCurrency(deposit)}</span></div>
            <div className="flex justify-between"><span>Progress (25%)</span><span>{formatCurrency(progress)}</span></div>
            <div className="flex justify-between"><span>Final (25%)</span><span>{formatCurrency(finalPmt)}</span></div>
          </div>
        </div>

        {/* AI Suggest Items */}
        <button type="button" onClick={() => setAiItemsOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors shadow-sm">
          <Sparkles size={15} /> AI Suggest Line Items
        </button>

        {/* Catalog */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className={`px-4 py-3 border-b ${activeRowId ? 'bg-violet-50 border-violet-200' : 'border-slate-100'}`}>
            <h3 className="font-semibold text-slate-800 text-sm">Equipment Catalog</h3>
            <p className={`text-xs mt-0.5 ${activeRowId ? 'text-violet-600 font-medium' : 'text-slate-400'}`}>
              {activeRowId ? '← Click to fill active row' : 'Click to add to proposal'}
            </p>
          </div>
          <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
            {(['camera','network','hardware','labor','other'] as const).filter(cat => catalogByCategory[cat]?.length).map(cat => {
              const catItems = catalogByCategory[cat]
              const label = cat === 'camera' ? 'Cameras & Sensors' : cat === 'network' ? 'Network & Storage' : cat === 'hardware' ? 'Hardware' : cat === 'labor' ? 'Labor' : 'Other'
              return (
              <div key={cat}>
                <div className="px-4 py-2 bg-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  {label}
                </div>
                {catItems.map(item => (
                  <button key={item.id} onClick={() => addFromCatalog(item)}
                    className="w-full text-left px-4 py-2.5 hover:bg-cyan-50 transition-colors border-b border-slate-50 last:border-0">
                    <div className="text-xs font-medium text-slate-800 leading-snug">{item.name}</div>
                    <div className="flex justify-between items-center mt-0.5">
                      <span className="text-xs text-slate-400">{item.sku || item.unit_label}</span>
                      <span className="text-xs font-semibold text-cyan-600">{formatCurrency(item.unit_price)}/{item.unit_label}</span>
                    </div>
                  </button>
                ))}
              </div>
            )})}
          </div>
        </div>
      </div>

      {/* AI Suggest Items modal */}
      {aiItemsOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-16 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 mb-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-violet-600" />
                <h2 className="font-semibold text-slate-900">AI Suggest Line Items</h2>
              </div>
              <button onClick={() => { setAiItemsOpen(false); setAiItemsSuggestions([]); setAiItemsBrief('') }}
                className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {aiItemsSuggestions.length === 0 ? (
                <>
                  <p className="text-sm text-slate-500">Describe the job and Claude will suggest equipment and labor line items from your catalog.</p>
                  <textarea
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[100px]"
                    placeholder="e.g. Small retail store, front entrance + parking lot + back door, need 4–5 cameras, existing NVR on-site..."
                    value={aiItemsBrief}
                    onChange={e => setAiItemsBrief(e.target.value)} />
                  <button onClick={runSuggestItems} disabled={aiItemsLoading || !aiItemsBrief.trim()}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    {aiItemsLoading ? <><Loader2 size={14} className="animate-spin" /> Thinking…</> : <><Sparkles size={14} /> Suggest Items</>}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-500">{aiItemsSuggestions.length} items suggested — review then add all to the proposal.</p>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden max-h-[320px] overflow-y-auto">
                    {aiItemsSuggestions.map((item, i) => (
                      <div key={i} className="flex items-start justify-between px-4 py-2.5 bg-white hover:bg-slate-50">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-800">{item.name}</div>
                          <div className="text-xs text-slate-400">{item.section} · {item.description}</div>
                        </div>
                        <div className="text-right ml-4 shrink-0">
                          <div className="text-sm font-semibold text-slate-700">{item.qty} × {formatCurrency(item.unit_price)}</div>
                          <div className="text-xs text-slate-400">{item.unit_label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setAiItemsSuggestions([])}
                      className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      ← Try Again
                    </button>
                    <button onClick={addSuggestedItems}
                      className="flex-1 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Add {aiItemsSuggestions.length} Items to Proposal
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Write Scope modal */}
      {aiScopeOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-16 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 mb-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-violet-600" />
                <h2 className="font-semibold text-slate-900">AI Write Scope</h2>
              </div>
              <button onClick={() => { setAiScopeOpen(false); setAiScopeBrief('') }}
                className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-500">Briefly describe the job and Claude will write the scope narrative, assumptions, and exclusions.</p>
              <textarea
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[80px]"
                placeholder="e.g. 6-camera system for a warehouse, covering all loading docks and the main office entrance…"
                value={aiScopeBrief}
                onChange={e => setAiScopeBrief(e.target.value)} />
              <p className="text-xs text-slate-400">This will replace the current scope, assumptions, and exclusions text.</p>
              <button onClick={runWriteScope} disabled={aiScopeLoading || !aiScopeBrief.trim()}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                {aiScopeLoading ? <><Loader2 size={14} className="animate-spin" /> Writing…</> : <><Sparkles size={14} /> Write Scope</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .label { display: block; font-size: 0.75rem; font-weight: 500; color: #64748B; margin-bottom: 0.25rem; }
        .input { width: 100%; border: 1px solid #E2E8F0; border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; color: #0F172A; background: white; outline: none; }
        .input:focus { border-color: #06B6D4; box-shadow: 0 0 0 2px rgba(6,182,212,0.15); }
        .input-sm { border: 1px solid transparent; border-radius: 0.375rem; padding: 0.25rem 0.375rem; font-size: 0.8125rem; color: #0F172A; background: transparent; outline: none; width: 100%; }
        .input-sm:focus { border-color: #06B6D4; background: white; }
      `}</style>
    </div>
  )
}
