import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function formatDateShort(date: string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export const STATUS_COLORS = {
  // Proposal
  draft:    'bg-slate-100 text-slate-700',
  sent:     'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  expired:  'bg-orange-100 text-orange-700',
  // Invoice
  unpaid:   'bg-red-100 text-red-700',
  partial:  'bg-yellow-100 text-yellow-700',
  paid:     'bg-green-100 text-green-700',
  void:     'bg-slate-100 text-slate-500',
} as const

export const SECTION_LABELS: Record<string, string> = {
  cameras:  'A — Cameras & Sensors',
  network:  'B — Network & Storage',
  hardware: 'C — Mounting Hardware & Cabling',
  labor:    'D — Labor',
  other:    'Other',
}

export const TAX_RATE = 0.1025

export function calcCommission(
  lineItems: Array<{ unit_price: number; cost_price: number; qty: number }>,
  ratePct: number
): { revenue: number; cost: number; margin: number; commission: number } {
  const revenue = lineItems.reduce((s, li) => s + li.unit_price * li.qty, 0)
  const cost = lineItems.reduce((s, li) => s + (li.cost_price ?? 0) * li.qty, 0)
  const margin = revenue - cost
  const commission = margin * ratePct / 100
  return { revenue, cost, margin, commission }
}

export function calcTotals(items: { qty: number; unit_price: number; taxable: boolean; section: string }[]) {
  const equipmentSections = ['cameras', 'network', 'hardware', 'other']
  let subtotal_equipment = 0
  let subtotal_labor = 0
  let taxable = 0

  for (const item of items) {
    const line = item.qty * item.unit_price
    if (item.section === 'labor') {
      subtotal_labor += line
    } else {
      subtotal_equipment += line
    }
    if (item.taxable) taxable += line
  }

  const tax_amount  = Math.round(taxable * TAX_RATE * 100) / 100
  const grand_total = subtotal_equipment + subtotal_labor + tax_amount

  return { subtotal_equipment, subtotal_labor, tax_amount, grand_total }
}
