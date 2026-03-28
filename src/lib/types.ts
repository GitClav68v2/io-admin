export interface ClientSite {
  id: string
  client_id: string
  label: string | null
  address: string
  city: string | null
  state: string | null
  zip: string | null
}

export type ProposalStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired'
export type InvoiceStatus  = 'unpaid' | 'partial' | 'paid' | 'void'
export type ItemCategory   = 'camera' | 'network' | 'hardware' | 'labor' | 'other'
export type LineSection    = 'cameras' | 'network' | 'hardware' | 'labor' | 'other'

export interface Client {
  id: string
  created_at: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  account_number: string | null
  corporate_address: string | null
  corporate_city: string | null
  corporate_state: string | null
  corporate_zip: string | null
  billing_address: string | null
  billing_city: string | null
  billing_state: string | null
  billing_zip: string | null
  site_address: string | null
  site_city: string | null
  site_state: string | null
  site_zip: string | null
  notes: string | null
  lead_source: string | null
  referred_by: string | null
}

// ── Portal invoice types ───────────────────────────────────────
export type PortalInvoiceStatus = 'unpaid' | 'partial' | 'paid'

export interface PortalInvoice {
  id: string
  created_at: string
  client_id: string
  invoice_number: string
  invoice_date: string
  due_date: string | null
  amount_total: number
  amount_paid: number
  status: PortalInvoiceStatus
  pdf_path: string | null
}

export interface Supplier {
  id: string
  created_at: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  website: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  billing_address: string | null
  billing_city: string | null
  billing_state: string | null
  billing_zip: string | null
  notes: string | null
}

export interface CatalogItem {
  id: string
  category: ItemCategory
  name: string
  description: string | null
  sku: string | null
  unit_price: number
  unit_label: string
  taxable: boolean
  active: boolean
  cost_price: number
  markup_pct: number
}

export interface Proposal {
  id: string
  created_at: string
  updated_at: string
  proposal_number: string
  client_id: string | null
  status: ProposalStatus
  title: string
  scope_notes: string | null
  assumptions: string | null
  exclusions: string | null
  project_name: string | null
  site_address: string | null
  site_city: string | null
  site_state: string | null
  site_zip: string | null
  bill_to_name: string | null
  bill_to_company: string | null
  bill_to_email: string | null
  bill_to_phone: string | null
  bill_to_address: string | null
  bill_to_city: string | null
  bill_to_state: string | null
  bill_to_zip: string | null
  subtotal_equipment: number
  subtotal_labor: number
  tax_rate: number
  tax_amount: number
  grand_total: number
  monthly_recurring: number
  monthly_notes: string | null
  deposit_pct: number
  progress_pct: number
  final_pct: number
  valid_days: number
  expires_at: string | null
  sent_at: string | null
  accepted_at: string | null
  rep_name: string | null
  notes: string | null
  version: number
  conditional_inspection: boolean
  inspection_clause: string | null
  promo_code: string | null
  promo_discount: number
  line_items?: ProposalLineItem[]
  client?: Client
}

export interface PromoCode {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  expiry_date: string | null
  max_uses: number | null
  uses_count: number
  active: boolean
}

export interface ProposalLineItem {
  id: string
  proposal_id: string
  catalog_item_id: string | null
  section: LineSection
  sort_order: number
  name: string
  description: string | null
  sku: string | null
  qty: number
  unit_label: string
  unit_price: number
  cost_price: number
  total: number
  taxable: boolean
  is_recurring: boolean
  recurring_label: string | null
}

export interface Invoice {
  id: string
  created_at: string
  updated_at: string
  invoice_number: string
  proposal_id: string | null
  client_id: string | null
  status: InvoiceStatus
  title: string
  bill_to_name: string | null
  bill_to_company: string | null
  bill_to_email: string | null
  bill_to_phone: string | null
  bill_to_address: string | null
  bill_to_city: string | null
  bill_to_state: string | null
  bill_to_zip: string | null
  subtotal: number
  tax_rate: number
  tax_amount: number
  grand_total: number
  amount_paid: number
  balance_due: number
  issue_date: string
  due_date: string | null
  paid_at: string | null
  sent_at: string | null
  notes: string | null
  rep_name: string | null
  line_items?: InvoiceLineItem[]
  client?: Client
}

export interface InvoiceLineItem {
  id: string
  invoice_id: string
  section: LineSection
  sort_order: number
  name: string
  description: string | null
  qty: number
  unit_label: string
  unit_price: number
  cost_price: number
  total: number
  taxable: boolean
}

export type ProspectStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'

export interface Prospect {
  id: string
  created_at: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  zip: string | null
  city: string | null
  state: string | null
  business_type: string | null
  areas: string[]
  lead_source: string | null
  notes: string | null
  status: ProspectStatus
}

export interface CompanySettings {
  id: string
  address: string | null
  phone: string | null
  license_number: string | null
  teams_link: string | null
  logo_url: string | null
}

export interface CommissionRate {
  id: string
  user_email: string
  rep_name: string | null
  rate_pct: number
  effective_date: string
}

export interface CommissionSummary {
  rep_name: string
  invoice_count: number
  revenue: number
  total_cost: number
  gross_margin: number
  margin_pct: number
  commission_earned: number
}
