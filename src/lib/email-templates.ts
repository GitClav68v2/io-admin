import { createClient } from '@supabase/supabase-js'
import { getCompanySettings } from './settings'
import type { EmailTemplateType } from './types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Default templates (fallback if DB has no row) ──────────────

const DEFAULTS: Record<EmailTemplateType, { subject: string; body_html: string }> = {
  proposal_send: {
    subject: 'Your Proposal from Integration One — {{proposal_number}}',
    body_html: `<div style="font-family: Arial, sans-serif; max-width: 600px; color: #0F172A;">
  <div style="background: #0F172A; padding: 24px 28px;">
    <span style="font-size: 20px; font-weight: bold; color: white;">INTEGRATION</span>
    <span style="font-size: 20px; font-weight: bold; color: #06B6D4;">ONE</span>
  </div>
  <div style="padding: 32px 28px;">
    <h2 style="color: #0F172A; margin: 0 0 16px;">Hi {{client_name}},</h2>
    <p style="color: #64748B; line-height: 1.7;">
      Thank you for the opportunity to put together a security proposal for you.
      Please find your proposal attached as a PDF — <strong>{{proposal_number}}</strong>.
    </p>
    <div style="background: #F1F5F9; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #64748B;">Proposal</span>
        <strong>{{proposal_number}}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #64748B;">Project</span>
        <strong>{{project_name}}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; border-top: 1px solid #E2E8F0; padding-top: 12px; margin-top: 12px;">
        <span style="color: #64748B;">One-Time Total</span>
        <strong style="color: #06B6D4; font-size: 18px;">{{grand_total}}</strong>
      </div>
      {{#if monthly_recurring}}<div style="display: flex; justify-content: space-between; margin-top: 6px;">
        <span style="color: #64748B; font-size: 13px;">Monthly Recurring (separate)</span>
        <span style="font-size: 13px;">{{monthly_recurring}}/mo</span>
      </div>{{/if}}
    </div>
    <p style="color: #64748B; line-height: 1.7;">
      This proposal is valid for <strong>{{valid_days}} days</strong>.
      To accept, simply sign the proposal and return it to us, or reply to this email.
      We'll take care of the rest.
    </p>
    <p style="color: #64748B; line-height: 1.7;">
      Questions? Reply to this email or call us at <strong>{{company_phone}}</strong>.
      We're happy to walk you through anything.
    </p>
    <p style="color: #64748B; margin-top: 24px;">
      Best regards,<br/>
      <strong>{{rep_name}}</strong><br/>
      Integration One<br/>
      <a href="https://www.integrationone.net" style="color: #06B6D4;">integrationone.net</a>
    </p>
  </div>
  {{footer}}
</div>`,
  },
  invoice_send: {
    subject: 'Invoice from Integration One — {{invoice_number}}',
    body_html: `<div style="font-family: Arial, sans-serif; max-width: 600px; color: #0F172A;">
  <div style="background: #0F172A; padding: 24px 28px;">
    <span style="font-size: 20px; font-weight: bold; color: white;">INTEGRATION</span>
    <span style="font-size: 20px; font-weight: bold; color: #06B6D4;">ONE</span>
  </div>
  <div style="padding: 32px 28px;">
    <h2 style="color: #0F172A; margin: 0 0 16px;">Hi {{client_name}},</h2>
    <p style="color: #64748B; line-height: 1.7;">
      Please find your invoice attached — <strong>{{invoice_number}}</strong>.
    </p>
    <div style="background: #F1F5F9; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #64748B;">Invoice</span><strong>{{invoice_number}}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #64748B;">Due Date</span><strong>{{due_date}}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; border-top: 1px solid #E2E8F0; padding-top: 12px; margin-top: 8px;">
        <span style="color: #64748B;">Balance Due</span>
        <strong style="color: #EF4444; font-size: 18px;">{{balance_due}}</strong>
      </div>
    </div>
    <p style="color: #64748B; line-height: 1.7;">
      Questions? Reply to this email or call <strong>{{company_phone}}</strong>.
    </p>
    <p style="color: #64748B; margin-top: 24px;">
      Best regards,<br/>
      <strong>{{rep_name}}</strong><br/>
      Integration One
    </p>
  </div>
  {{footer}}
</div>`,
  },
  invoice_reminder: {
    subject: 'Friendly Reminder — Invoice {{invoice_number}} Due {{due_date}}',
    body_html: `<div style="font-family: Arial, sans-serif; max-width: 600px; color: #0F172A;">
  <div style="background: #0F172A; padding: 24px 28px;">
    <span style="font-size: 20px; font-weight: bold; color: white;">INTEGRATION</span>
    <span style="font-size: 20px; font-weight: bold; color: #06B6D4;">ONE</span>
  </div>
  <div style="padding: 32px 28px;">
    <h2 style="color: #0F172A; margin: 0 0 16px;">Hi {{client_name}},</h2>
    <p style="color: #64748B; line-height: 1.7;">
      This is a friendly reminder that invoice <strong>{{invoice_number}}</strong> has a balance of
      <strong style="color: #EF4444;">{{balance_due}}</strong> due on <strong>{{due_date}}</strong>.
    </p>
    <div style="background: #F1F5F9; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #64748B;">Invoice</span><strong>{{invoice_number}}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #64748B;">Due Date</span><strong>{{due_date}}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; border-top: 1px solid #E2E8F0; padding-top: 12px; margin-top: 8px;">
        <span style="color: #64748B;">Balance Due</span>
        <strong style="color: #EF4444; font-size: 18px;">{{balance_due}}</strong>
      </div>
    </div>
    <p style="color: #64748B; line-height: 1.7;">
      If you've already sent payment, please disregard this message.
      Questions? Reply to this email or call <strong>{{company_phone}}</strong>.
    </p>
    <p style="color: #64748B; margin-top: 24px;">
      Best regards,<br/>
      <strong>{{rep_name}}</strong><br/>
      Integration One
    </p>
  </div>
  {{footer}}
</div>`,
  },
  payment_receipt: {
    subject: 'Payment Received — Thank You! ({{invoice_number}})',
    body_html: `<div style="font-family: Arial, sans-serif; max-width: 600px; color: #0F172A;">
  <div style="background: #0F172A; padding: 24px 28px;">
    <span style="font-size: 20px; font-weight: bold; color: white;">INTEGRATION</span>
    <span style="font-size: 20px; font-weight: bold; color: #06B6D4;">ONE</span>
  </div>
  <div style="padding: 32px 28px;">
    <h2 style="color: #0F172A; margin: 0 0 16px;">Hi {{client_name}},</h2>
    <p style="color: #64748B; line-height: 1.7;">
      We've received your payment of <strong style="color: #10B981;">{{amount_paid}}</strong>
      for invoice <strong>{{invoice_number}}</strong>. Thank you!
    </p>
    <div style="background: #F0FDF4; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #64748B;">Invoice</span><strong>{{invoice_number}}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #64748B;">Payment</span><strong style="color: #10B981;">{{amount_paid}}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; border-top: 1px solid #D1FAE5; padding-top: 12px; margin-top: 8px;">
        <span style="color: #64748B;">Remaining Balance</span>
        <strong>{{balance_due}}</strong>
      </div>
    </div>
    <p style="color: #64748B; line-height: 1.7;">
      Questions? Reply to this email or call <strong>{{company_phone}}</strong>.
    </p>
    <p style="color: #64748B; margin-top: 24px;">
      Best regards,<br/>
      <strong>{{rep_name}}</strong><br/>
      Integration One
    </p>
  </div>
  {{footer}}
</div>`,
  },
}

// ── Public API ──────────────────────────────────────────────────

export async function getEmailTemplate(type: EmailTemplateType) {
  const { data } = await supabase
    .from('email_templates')
    .select('subject, body_html')
    .eq('type', type)
    .eq('active', true)
    .single()

  return data ?? DEFAULTS[type]
}

export async function renderTemplate(
  template: string,
  vars: Record<string, string>
): Promise<string> {
  // Handle {{#if var}}...{{/if}} blocks
  let result = template.replace(
    /\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, key, content) => (vars[key] ? content : '')
  )

  // Replace {{var}} placeholders
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value)
  }

  // Expand {{footer}} with company settings
  if (result.includes('{{footer}}')) {
    const settings = await getCompanySettings()
    const footer = `<div style="background: #F8FAFC; padding: 16px 28px; border-top: 1px solid #E2E8F0;">
      <p style="color: #94A3B8; font-size: 12px; margin: 0;">Integration One · integrationone.net${settings.license_number ? ` · CA Lic. #${settings.license_number}` : ''}${settings.phone ? ` · ${settings.phone}` : ''}</p>
      ${settings.teams_link ? `<p style="margin: 6px 0 0;"><a href="${settings.teams_link}" style="color: #06B6D4; font-size: 12px;">Schedule a Teams call</a></p>` : ''}
    </div>`
    result = result.replaceAll('{{footer}}', footer)
  }

  return result
}

// Available variables reference for the template editor
export const TEMPLATE_VARIABLES: Record<EmailTemplateType, string[]> = {
  proposal_send: [
    'client_name', 'proposal_number', 'project_name', 'grand_total',
    'monthly_recurring', 'valid_days', 'rep_name', 'company_phone', 'footer',
  ],
  invoice_send: [
    'client_name', 'invoice_number', 'due_date', 'balance_due',
    'rep_name', 'company_phone', 'footer',
  ],
  invoice_reminder: [
    'client_name', 'invoice_number', 'due_date', 'balance_due',
    'rep_name', 'company_phone', 'footer',
  ],
  payment_receipt: [
    'client_name', 'invoice_number', 'amount_paid', 'balance_due',
    'rep_name', 'company_phone', 'footer',
  ],
}
