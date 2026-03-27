import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import { Proposal } from '@/lib/types'
import { SECTION_LABELS } from '@/lib/utils'

const NAVY  = '#4B5563'
const CYAN  = '#06B6D4'
const GRAY  = '#64748B'
const LIGHT = '#F1F5F9'
const WHITE = '#FFFFFF'

const s = StyleSheet.create({
  page:       { fontFamily: 'Helvetica', fontSize: 9, color: NAVY, paddingBottom: 40 },
  // Header
  header:     { flexDirection: 'row', backgroundColor: NAVY, padding: '14 20 14 20' },
  logoBlock:  { flex: 1 },
  logoText:   { fontSize: 18, fontFamily: 'Helvetica-Bold', color: WHITE },
  logoCyan:   { color: CYAN },
  tagline:    { fontSize: 7.5, color: '#94A3B8', marginTop: 2 },
  contact:    { fontSize: 7, color: '#94A3B8', marginTop: 4 },
  docBlock:   { alignItems: 'flex-end' },
  docTitle:   { fontSize: 20, fontFamily: 'Helvetica-Bold', color: CYAN },
  metaRow:    { flexDirection: 'row', marginTop: 2 },
  metaLabel:  { fontSize: 7.5, color: '#94A3B8', fontFamily: 'Helvetica-Bold', marginRight: 3 },
  metaVal:    { fontSize: 7.5, color: WHITE },
  licText:    { fontSize: 7, color: CYAN, fontFamily: 'Helvetica-Bold', marginTop: 5 },
  // Client block
  clientRow:  { flexDirection: 'row', margin: '12 20 0 20', gap: 12 },
  clientBox:  { flex: 1, border: '1 solid #E2E8F0', borderRadius: 4, padding: '8 10' },
  boxHeading: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: CYAN, marginBottom: 4 },
  clientName: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: NAVY },
  clientLine: { fontSize: 8.5, color: GRAY, marginTop: 1 },
  // Section
  sectionWrap:{ margin: '14 20 0 20' },
  secHeader:  { backgroundColor: NAVY, padding: '5 10', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  secTitle:   { fontSize: 8, fontFamily: 'Helvetica-Bold', color: WHITE },
  // Table
  tableHead:  { flexDirection: 'row', backgroundColor: LIGHT, padding: '4 0', borderBottom: '1 solid #E2E8F0' },
  tableRow:   { flexDirection: 'row', padding: '4 0', borderBottom: '1 solid #F8FAFC' },
  tableRowAlt:{ flexDirection: 'row', padding: '4 0', backgroundColor: LIGHT, borderBottom: '1 solid #F8FAFC' },
  colDesc:    { flex: 1, paddingLeft: 10 },
  colQty:     { width: 55, textAlign: 'center' },
  colUnit:    { width: 70, textAlign: 'right' },
  colTotal:   { width: 70, textAlign: 'right', paddingRight: 10 },
  thText:     { fontSize: 7, fontFamily: 'Helvetica-Bold', color: GRAY },
  itemName:   { fontSize: 8.5, fontFamily: 'Helvetica-Bold' },
  itemDesc:   { fontSize: 7.5, color: GRAY, marginTop: 1 },
  cellText:   { fontSize: 8.5 },
  // Totals
  totalsWrap: { margin: '14 20 0 20', alignItems: 'flex-end' },
  totalsBox:  { width: 200, border: '1 solid #E2E8F0', borderRadius: 4 },
  totalRow:   { flexDirection: 'row', justifyContent: 'space-between', padding: '3 10' },
  totalLabel: { fontSize: 8.5, color: GRAY },
  totalVal:   { fontSize: 8.5 },
  grandRow:   { flexDirection: 'row', justifyContent: 'space-between', padding: '5 10', backgroundColor: NAVY, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  grandLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: WHITE },
  grandVal:   { fontSize: 10, fontFamily: 'Helvetica-Bold', color: CYAN },
  // Recurring
  recurWrap:  { margin: '8 20 0 20' },
  recurLabel: { fontSize: 7.5, color: GRAY, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  recurBox:   { border: '1 solid #E2E8F0', borderRadius: 4, padding: '6 10' },
  recurRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  recurText:  { fontSize: 8.5, color: GRAY },
  recurAmt:   { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: CYAN },
  // Payment
  payWrap:    { margin: '14 20 0 20' },
  payTitle:   { fontSize: 9, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 4 },
  payRow:     { flexDirection: 'row', padding: '4 0', borderBottom: '1 solid #F1F5F9' },
  payCell:    { fontSize: 8.5 },
  // Scope
  scopeWrap:  { margin: '14 20 0 20' },
  scopeTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 4 },
  scopeText:  { fontSize: 8.5, color: GRAY, lineHeight: 1.5 },
  // Warranty/Terms
  clauseWrap: { margin: '14 20 0 20' },
  clauseTitle:{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 2 },
  clauseText: { fontSize: 8, color: GRAY, lineHeight: 1.5, marginBottom: 6 },
  // Signature
  sigWrap:    { margin: '20 20 0 20', flexDirection: 'row', gap: 12 },
  sigBox:     { flex: 1, border: '1 solid #E2E8F0', borderRadius: 4, padding: '10 12', backgroundColor: LIGHT },
  sigHeading: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: CYAN, marginBottom: 8 },
  sigLine:    { flexDirection: 'row', marginBottom: 6 },
  sigLabel:   { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: NAVY, width: 65 },
  sigUnder:   { flex: 1, borderBottom: '1 solid #CBD5E1' },
  // Footer
  footer:     { position: 'absolute', bottom: 14, left: 20, right: 20, borderTop: '1 solid #E2E8F0', paddingTop: 5, flexDirection: 'row', justifyContent: 'space-between' },
  footText:   { fontSize: 7, color: GRAY },
})

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function fmtDate(s: string | null | undefined) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

const WARRANTY = [
  ['Equipment — Manufacturer Warranty', 'All hardware carries the full manufacturer warranty (typically 2–3 years). Integration One will facilitate warranty claims on behalf of the client. Integration One does not extend or supplement manufacturer warranties.'],
  ['Installation Labor — 1 Year', 'Integration One warrants all installation workmanship, cable terminations, and physical mounting for one (1) year from project completion. Defects in workmanship will be remedied at no charge.'],
  ['Programming & Configuration — 90 Days', 'NVR configuration, camera settings, motion zones, and remote access setup are warranted for 90 days. Client-requested changes after acceptance are billable at the standard service rate.'],
  ['Warranty Exclusions', 'Does not cover: vandalism, power surges, acts of God, unauthorized modifications, failure of client-supplied internet, or normal wear and tear.'],
]

const TERMS = [
  ['1. Proposal Validity.', 'This proposal is valid for 30 days from the date of issue. Integration One reserves the right to revise pricing after expiration.'],
  ['2. Change Orders.', 'Work beyond this scope requires a written change order signed by both parties before commencement. Change orders are billed at $95/hr (standard) or $145/hr (after-hours).'],
  ['3. Equipment Ownership.', 'Title to all materials and equipment remains with Integration One until final payment is received in full.'],
  ['4. Subcontractors.', 'Integration One coordinates licensed low-voltage subcontractors. All subcontractors carry appropriate licensure and insurance.'],
  ['5. Client Responsibilities.', 'Client agrees to provide safe site access, designate a site contact, and ensure electrical outlets and internet are available as described.'],
  ['6. Permits.', 'Integration One will obtain required permits where applicable. Permit fees are billed at cost unless stated otherwise.'],
  ['7. Limitation of Liability.', 'Total liability shall not exceed the contract price. Integration One is not liable for losses resulting from system failure or monitoring service interruptions.'],
  ['8. Monitoring Services.', 'Integration One is a coordinator and does not operate a monitoring center. Monthly fees are paid directly to the monitoring provider.'],
  ['9. Dispute Resolution.', 'Disputes shall first be submitted to mediation, then governed by the laws of the State of California, County of Orange.'],
  ['10. Entire Agreement.', 'This proposal, once accepted, constitutes the entire agreement between the parties.'],
]

export default function ProposalPDF({ proposal }: { proposal: Proposal }) {
  const items = proposal.line_items ?? []
  const sections = ['cameras','network','hardware','labor','other'] as const
  const deposit  = proposal.grand_total * (proposal.deposit_pct  / 100)
  const progress = proposal.grand_total * (proposal.progress_pct / 100)
  const final    = proposal.grand_total * (proposal.final_pct    / 100)

  return (
    <Document>
      {/* ── PAGE 1: Cover + Client ── */}
      <Page size="LETTER" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.logoBlock}>
            <Text style={s.logoText}>INTEGRATION<Text style={s.logoCyan}>ONE</Text></Text>
            <Text style={s.tagline}>Your Perimeter. Your Rules.</Text>
            <Text style={s.contact}>integrationone.net  ·  info@integrationone.net  ·  (949) 233-1833</Text>
          </View>
          <View style={s.docBlock}>
            <Text style={s.docTitle}>PROPOSAL</Text>
            {[
              ['Proposal #:', proposal.proposal_number],
              ['Date:', fmtDate(proposal.created_at)],
              ['Expires:', fmtDate(proposal.expires_at)],
              ['Version:', `v${proposal.version}`],
              ...(proposal.rep_name ? [['Prepared by:', proposal.rep_name]] : []),
            ].map(([label, val]) => (
              <View key={label} style={s.metaRow}>
                <Text style={s.metaLabel}>{label}</Text>
                <Text style={s.metaVal}>{val}</Text>
              </View>
            ))}
            <Text style={s.licText}>CA Lic. #987654</Text>
          </View>
        </View>

        {/* Bill To / Job Site */}
        <View style={s.clientRow}>
          {[
            {
              heading: 'BILL TO',
              lines: [
                proposal.bill_to_company || proposal.bill_to_name || '',
                proposal.bill_to_company ? proposal.bill_to_name || '' : '',
                proposal.bill_to_address || '',
                [proposal.bill_to_city, proposal.bill_to_state, proposal.bill_to_zip].filter(Boolean).join(', '),
                proposal.bill_to_email || '',
                proposal.bill_to_phone || '',
              ].filter(Boolean)
            },
            {
              heading: 'JOB SITE',
              lines: [
                proposal.project_name || '',
                proposal.site_address || '',
                [proposal.site_city, proposal.site_state, proposal.site_zip].filter(Boolean).join(', '),
              ].filter(Boolean)
            }
          ].map(({ heading, lines }) => (
            <View key={heading} style={s.clientBox}>
              <Text style={s.boxHeading}>{heading}</Text>
              {lines.map((line, i) => (
                <Text key={i} style={i === 0 ? s.clientName : s.clientLine}>{line}</Text>
              ))}
            </View>
          ))}
        </View>

        {/* Scope */}
        {proposal.scope_notes && (
          <View style={s.scopeWrap}>
            <Text style={s.scopeTitle}>PROJECT OVERVIEW</Text>
            <Text style={s.scopeText}>{proposal.scope_notes}</Text>
          </View>
        )}

        {proposal.assumptions && (
          <View style={[s.scopeWrap, { marginTop: 10 }]}>
            <Text style={s.scopeTitle}>ASSUMPTIONS</Text>
            <Text style={s.scopeText}>{proposal.assumptions}</Text>
          </View>
        )}

        {proposal.exclusions && (
          <View style={[s.scopeWrap, { marginTop: 10 }]}>
            <Text style={s.scopeTitle}>EXCLUSIONS</Text>
            <Text style={s.scopeText}>{proposal.exclusions}</Text>
          </View>
        )}

        <View style={s.footer}>
          <Text style={s.footText}>Integration One  ·  CA Lic. #987654  ·  integrationone.net</Text>
          <Text style={s.footText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* ── PAGE 2: Line Items + Pricing ── */}
      <Page size="LETTER" style={s.page}>
        <View style={s.header}>
          <View style={s.logoBlock}>
            <Text style={s.logoText}>INTEGRATION<Text style={s.logoCyan}>ONE</Text></Text>
          </View>
          <View style={s.docBlock}>
            <Text style={[s.metaVal, { fontSize: 10 }]}>SYSTEM & PRICING DETAIL</Text>
            <Text style={s.metaVal}>{proposal.proposal_number}</Text>
          </View>
        </View>

        {sections.map(section => {
          const sectionItems = items.filter(li => li.section === section)
          if (!sectionItems.length) return null
          return (
            <View key={section} style={s.sectionWrap}>
              <View style={s.secHeader}>
                <Text style={s.secTitle}>{SECTION_LABELS[section]}</Text>
              </View>
              {/* Table header */}
              <View style={s.tableHead}>
                <View style={s.colDesc}><Text style={s.thText}>DESCRIPTION</Text></View>
                <View style={s.colQty}><Text style={[s.thText, { textAlign: 'center' }]}>QTY</Text></View>
                <View style={s.colUnit}><Text style={[s.thText, { textAlign: 'right' }]}>UNIT PRICE</Text></View>
                <View style={s.colTotal}><Text style={[s.thText, { textAlign: 'right' }]}>TOTAL</Text></View>
              </View>
              {sectionItems.map((li, i) => (
                <View key={li.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                  <View style={s.colDesc}>
                    <Text style={s.itemName}>{li.name}</Text>
                    {li.description ? <Text style={s.itemDesc}>{li.description}</Text> : null}
                  </View>
                  <View style={s.colQty}><Text style={[s.cellText, { textAlign: 'center' }]}>{li.qty} {li.unit_label}</Text></View>
                  <View style={s.colUnit}><Text style={[s.cellText, { textAlign: 'right' }]}>{fmt(li.unit_price)}</Text></View>
                  <View style={s.colTotal}><Text style={[s.cellText, { textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>{fmt(li.total)}</Text></View>
                </View>
              ))}
            </View>
          )
        })}

        {/* Totals */}
        <View style={s.totalsWrap}>
          <View style={s.totalsBox}>
            <View style={s.totalRow}><Text style={s.totalLabel}>Equipment</Text><Text style={s.totalVal}>{fmt(proposal.subtotal_equipment)}</Text></View>
            <View style={s.totalRow}><Text style={s.totalLabel}>Labor</Text><Text style={s.totalVal}>{fmt(proposal.subtotal_labor)}</Text></View>
            <View style={s.totalRow}><Text style={s.totalLabel}>Sales Tax ({(proposal.tax_rate*100).toFixed(2)}%)</Text><Text style={s.totalVal}>{fmt(proposal.tax_amount)}</Text></View>
            <View style={s.grandRow}><Text style={s.grandLabel}>ONE-TIME TOTAL</Text><Text style={s.grandVal}>{fmt(proposal.grand_total)}</Text></View>
          </View>
        </View>

        {/* Recurring */}
        {proposal.monthly_recurring > 0 && (
          <View style={s.recurWrap} wrap={false}>
            <Text style={s.recurLabel}>RECURRING MONTHLY SERVICES (billed directly by provider — not included in One-Time Total)</Text>
            <View style={s.recurBox}>
              <View style={s.recurRow}>
                <Text style={s.recurText}>{proposal.monthly_notes || 'Monthly monitoring services'}</Text>
                <Text style={s.recurAmt}>{fmt(proposal.monthly_recurring)}/mo</Text>
              </View>
            </View>
          </View>
        )}

        {/* Payment Schedule */}
        <View style={s.payWrap} wrap={false}>
          <Text style={s.payTitle}>PAYMENT SCHEDULE</Text>
          {[
            ['Deposit (50%)', 'Due upon signed proposal — equipment will not be ordered until received', fmt(deposit)],
            ['Progress Payment (25%)', 'Due upon material delivery to job site', fmt(progress)],
            ['Final Payment (25%)', 'Due upon system commissioning and client walkthrough', fmt(final)],
          ].map(([milestone, trigger, amount]) => (
            <View key={milestone} style={s.payRow}>
              <View style={{ width: 120 }}><Text style={[s.payCell, { fontFamily: 'Helvetica-Bold' }]}>{milestone}</Text></View>
              <View style={{ flex: 1 }}><Text style={[s.payCell, { color: GRAY }]}>{trigger}</Text></View>
              <View style={{ width: 70 }}><Text style={[s.payCell, { textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>{amount}</Text></View>
            </View>
          ))}
          <Text style={[s.scopeText, { marginTop: 4, fontSize: 7.5 }]}>
            Late payment: Balances unpaid more than 15 days after due date accrue interest at 1.5%/month. Integration One retains title to all installed equipment until payment is received in full.
          </Text>
        </View>

        <View style={s.footer}>
          <Text style={s.footText}>Integration One  ·  CA Lic. #987654  ·  integrationone.net</Text>
          <Text style={s.footText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* ── PAGE 3: Warranty, Terms, Signature ── */}
      <Page size="LETTER" style={s.page}>
        <View style={s.header}>
          <View style={s.logoBlock}>
            <Text style={s.logoText}>INTEGRATION<Text style={s.logoCyan}>ONE</Text></Text>
          </View>
          <View style={s.docBlock}>
            <Text style={[s.metaVal, { fontSize: 10 }]}>WARRANTY & TERMS</Text>
            <Text style={s.metaVal}>{proposal.proposal_number}</Text>
          </View>
        </View>

        <View style={s.clauseWrap}>
          <Text style={[s.payTitle, { fontSize: 10, marginBottom: 6 }]}>WARRANTY</Text>
          {WARRANTY.map(([title, body]) => (
            <View key={title}>
              <Text style={s.clauseTitle}>{title}</Text>
              <Text style={s.clauseText}>{body}</Text>
            </View>
          ))}
        </View>

        <View style={s.clauseWrap}>
          <Text style={[s.payTitle, { fontSize: 10, marginBottom: 6 }]}>TERMS & CONDITIONS</Text>
          {TERMS.map(([title, body]) => (
            <Text key={title} style={s.clauseText}><Text style={{ fontFamily: 'Helvetica-Bold', color: NAVY }}>{title}  </Text>{body}</Text>
          ))}
        </View>

        {/* Signature */}
        <View style={s.sigWrap}>
          {[
            { heading: 'CLIENT AUTHORIZATION', name: proposal.bill_to_company || proposal.bill_to_name || '[Client]', title: '[Title / Company]' },
            { heading: 'INTEGRATION ONE',       name: proposal.rep_name || '[Rep Name]', title: 'Authorized Representative' },
          ].map(({ heading, name, title }) => (
            <View key={heading} style={s.sigBox}>
              <Text style={s.sigHeading}>{heading}</Text>
              {[['Name:', name], ['Title:', title], ['Signature:', ''], ['Date:', '']].map(([label, val]) => (
                <View key={label} style={s.sigLine}>
                  <Text style={s.sigLabel}>{label}</Text>
                  {val ? <Text style={{ fontSize: 8.5 }}>{val}</Text> : <View style={s.sigUnder} />}
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={s.footer}>
          <Text style={s.footText}>Integration One  ·  CA Lic. #987654  ·  info@integrationone.net  ·  (949) 233-1833</Text>
          <Text style={s.footText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
