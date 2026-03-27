'use server'
import { createPortalAdmin } from '@/lib/supabase/portal-admin'
import { Resend } from 'resend'
import { revalidatePath } from 'next/cache'
import { PortalCustomer, PortalInvoice } from '@/lib/types'


// ── Customers ──────────────────────────────────────────────────

export async function addPortalCustomer(form: Partial<PortalCustomer>): Promise<{ data?: PortalCustomer; error?: string }> {
  try {
    const db = createPortalAdmin()
    const { data: rows } = await db
      .from('customers')
      .select('account_number')
      .order('account_number', { ascending: false })
      .limit(1)
    const last = rows?.[0] ?? null
    const next = last
      ? `IO-${String(parseInt(last.account_number.replace('IO-', ''), 10) + 1).padStart(4, '0')}`
      : 'IO-0001'
    const { data, error } = await db.from('customers').insert({ ...form, account_number: next }).select().single()
    if (error) return { error: error.message }
    try { revalidatePath('/portal') } catch {}
    return { data: data as PortalCustomer }
  } catch (e: any) {
    return { error: e.message ?? 'Unknown error' }
  }
}

export async function updatePortalCustomer(id: string, form: Partial<PortalCustomer>): Promise<{ data?: PortalCustomer; error?: string }> {
  try {
    const db = createPortalAdmin()
    const { data, error } = await db.from('customers').update(form).eq('id', id).select().single()
    if (error) return { error: error.message }
    try { revalidatePath('/portal'); revalidatePath(`/portal/${id}`) } catch {}
    return { data: data as PortalCustomer }
  } catch (e: any) {
    return { error: e.message ?? 'Unknown error' }
  }
}

// ── Invoices ───────────────────────────────────────────────────

export async function addPortalInvoice(
  customerId: string,
  invoice: Omit<PortalInvoice, 'id' | 'created_at' | 'customer_id' | 'pdf_path'>
) {
  const db = createPortalAdmin()
  const { data, error } = await db
    .from('invoices')
    .insert({ ...invoice, customer_id: customerId, pdf_path: null })
    .select()
    .single()
  if (error) throw new Error(error.message)

  // Send email notification to customer
  const { data: customer } = await db.from('customers').select('email, business_name').eq('id', customerId).single()
  if (customer?.email) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 })
    const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    await resend.emails.send({
      from: 'Integration One <info@integrationone.net>',
      to: customer.email,
      subject: `Invoice ${invoice.invoice_number} — Integration One`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1e293b">
          <h2 style="color:#06b6d4">Integration One</h2>
          <p>Hi ${customer.business_name},</p>
          <p>A new invoice is available in your client portal.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:8px 0;color:#64748b">Invoice #</td><td style="padding:8px 0;font-weight:600">${invoice.invoice_number}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Date</td><td style="padding:8px 0">${fmtDate(invoice.invoice_date)}</td></tr>
            ${invoice.due_date ? `<tr><td style="padding:8px 0;color:#64748b">Due</td><td style="padding:8px 0">${fmtDate(invoice.due_date)}</td></tr>` : ''}
            <tr><td style="padding:8px 0;color:#64748b">Amount Due</td><td style="padding:8px 0;font-weight:600;color:#0f172a">$${fmt(invoice.amount_total)}</td></tr>
          </table>
          <a href="https://portal.integrationone.net" style="display:inline-block;background:#06b6d4;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">View Invoice</a>
          <p style="margin-top:32px;font-size:0.85rem;color:#94a3b8">Integration One · 949-233-1833 · info@integrationone.net</p>
        </div>
      `
    })
  }

  revalidatePath(`/portal/${customerId}`)
  return data as PortalInvoice
}

export async function uploadInvoicePDF(formData: FormData) {
  const db = createPortalAdmin()
  const file = formData.get('file') as File
  const customerId = formData.get('customerId') as string
  const invoiceId = formData.get('invoiceId') as string

  const bytes = await file.arrayBuffer()
  const path = `${customerId}/${invoiceId}/${file.name}`

  const { error: upErr } = await db.storage.from('invoices').upload(path, bytes, {
    contentType: 'application/pdf',
    upsert: true
  })
  if (upErr) throw new Error(upErr.message)

  const { error: upd } = await db.from('invoices').update({ pdf_path: path }).eq('id', invoiceId)
  if (upd) throw new Error(upd.message)

  revalidatePath(`/portal/${customerId}`)
  return path
}
