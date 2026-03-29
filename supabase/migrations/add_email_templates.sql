-- Email templates for proposals, invoices, reminders, receipts
create table if not exists email_templates (
  id          uuid primary key default gen_random_uuid(),
  type        text not null unique
    check (type in ('proposal_send','invoice_send','invoice_reminder','payment_receipt')),
  subject     text not null,
  body_html   text not null,
  active      boolean not null default true,
  updated_at  timestamptz default now()
);

alter table email_templates enable row level security;

create policy "team_all" on email_templates
  for all to authenticated using (true) with check (true);

-- Seed default templates
insert into email_templates (type, subject, body_html) values
(
  'proposal_send',
  'Your Proposal from Integration One — {{proposal_number}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; color: #0F172A;">
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
      We''ll take care of the rest.
    </p>
    <p style="color: #64748B; line-height: 1.7;">
      Questions? Reply to this email or call us at <strong>{{company_phone}}</strong>.
      We''re happy to walk you through anything.
    </p>
    <p style="color: #64748B; margin-top: 24px;">
      Best regards,<br/>
      <strong>{{rep_name}}</strong><br/>
      Integration One<br/>
      <a href="https://www.integrationone.net" style="color: #06B6D4;">integrationone.net</a>
    </p>
  </div>
  {{footer}}
</div>'
),
(
  'invoice_send',
  'Invoice from Integration One — {{invoice_number}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; color: #0F172A;">
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
</div>'
),
(
  'invoice_reminder',
  'Friendly Reminder — Invoice {{invoice_number}} Due {{due_date}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; color: #0F172A;">
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
      If you''ve already sent payment, please disregard this message.
      Questions? Reply to this email or call <strong>{{company_phone}}</strong>.
    </p>
    <p style="color: #64748B; margin-top: 24px;">
      Best regards,<br/>
      <strong>{{rep_name}}</strong><br/>
      Integration One
    </p>
  </div>
  {{footer}}
</div>'
),
(
  'payment_receipt',
  'Payment Received — Thank You! ({{invoice_number}})',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; color: #0F172A;">
  <div style="background: #0F172A; padding: 24px 28px;">
    <span style="font-size: 20px; font-weight: bold; color: white;">INTEGRATION</span>
    <span style="font-size: 20px; font-weight: bold; color: #06B6D4;">ONE</span>
  </div>
  <div style="padding: 32px 28px;">
    <h2 style="color: #0F172A; margin: 0 0 16px;">Hi {{client_name}},</h2>
    <p style="color: #64748B; line-height: 1.7;">
      We''ve received your payment of <strong style="color: #10B981;">{{amount_paid}}</strong>
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
</div>'
);
