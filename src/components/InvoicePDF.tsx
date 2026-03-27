import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { Invoice, CompanySettings } from '@/lib/types'
import { SECTION_LABELS } from '@/lib/utils'

const NAVY = '#4B5563'; const CYAN = '#06B6D4'; const GRAY = '#64748B'; const LIGHT = '#F1F5F9'; const WHITE = '#FFFFFF'
const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
const fmtDate = (s: string | null | undefined) => s ? new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: NAVY, paddingBottom: 40 },
  header: { flexDirection: 'row', backgroundColor: NAVY, padding: '14 20' },
  logoText: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: WHITE },
  logoCyan: { color: CYAN },
  docBlock: { alignItems: 'flex-end', flex: 1 },
  docTitle: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: CYAN },
  metaRow: { flexDirection: 'row', marginTop: 2 },
  metaLabel: { fontSize: 7.5, color: '#94A3B8', fontFamily: 'Helvetica-Bold', marginRight: 3 },
  metaVal: { fontSize: 7.5, color: WHITE },
  clientRow: { flexDirection: 'row', margin: '12 20 0 20', gap: 12 },
  clientBox: { flex: 1, border: '1 solid #E2E8F0', borderRadius: 4, padding: '8 10' },
  boxHeading: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: CYAN, marginBottom: 4 },
  clientName: { fontSize: 9.5, fontFamily: 'Helvetica-Bold' },
  clientLine: { fontSize: 8.5, color: GRAY, marginTop: 1 },
  sectionWrap: { margin: '14 20 0 20' },
  secHeader: { backgroundColor: NAVY, padding: '5 10', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  secTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: WHITE },
  tableHead: { flexDirection: 'row', backgroundColor: LIGHT, padding: '4 0', borderBottom: '1 solid #E2E8F0' },
  tableRow: { flexDirection: 'row', padding: '4 0', borderBottom: '1 solid #F8FAFC' },
  tableRowAlt: { flexDirection: 'row', padding: '4 0', backgroundColor: LIGHT, borderBottom: '1 solid #F8FAFC' },
  colDesc: { flex: 1, paddingLeft: 10 },
  colQty: { width: 55, textAlign: 'center' },
  colUnit: { width: 70, textAlign: 'right' },
  colTotal: { width: 70, textAlign: 'right', paddingRight: 10 },
  thText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: GRAY },
  itemName: { fontSize: 8.5, fontFamily: 'Helvetica-Bold' },
  itemDesc: { fontSize: 7.5, color: GRAY, marginTop: 1 },
  cellText: { fontSize: 8.5 },
  totalsWrap: { margin: '14 20 0 20', alignItems: 'flex-end' },
  totalsBox: { width: 220, border: '1 solid #E2E8F0', borderRadius: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', padding: '3 10' },
  totalLabel: { fontSize: 8.5, color: GRAY },
  totalVal: { fontSize: 8.5 },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', padding: '5 10', backgroundColor: NAVY },
  grandLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: WHITE },
  grandVal: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: CYAN },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', padding: '5 10', backgroundColor: '#FEF2F2', borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  balLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#991B1B' },
  balVal: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#EF4444' },
  footer: { position: 'absolute', bottom: 14, left: 20, right: 20, borderTop: '1 solid #E2E8F0', paddingTop: 5, flexDirection: 'row', justifyContent: 'space-between' },
  footText: { fontSize: 7, color: GRAY },
})

export default function InvoicePDF({ invoice, settings }: { invoice: Invoice; settings: CompanySettings }) {
  const items = invoice.line_items ?? []
  const sections = ['cameras','network','hardware','labor','other'] as const
  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <View style={s.header}>
          <View><Text style={s.logoText}>INTEGRATION<Text style={s.logoCyan}>ONE</Text></Text></View>
          <View style={s.docBlock}>
            <Text style={s.docTitle}>INVOICE</Text>
            {[['Invoice #:', invoice.invoice_number], ['Date:', fmtDate(invoice.issue_date)], ['Due:', fmtDate(invoice.due_date)]].map(([l,v]) => (
              <View key={l} style={s.metaRow}><Text style={s.metaLabel}>{l}</Text><Text style={s.metaVal}>{v}</Text></View>
            ))}
            {settings.license_number ? <Text style={[s.metaVal, { fontSize: 7, color: CYAN, marginTop: 4 }]}>CA Lic. #{settings.license_number}</Text> : null}
          </View>
        </View>

        <View style={s.clientRow}>
          <View style={s.clientBox}>
            <Text style={s.boxHeading}>BILL TO</Text>
            {[invoice.bill_to_company || invoice.bill_to_name, invoice.bill_to_company ? invoice.bill_to_name : null, invoice.bill_to_address, [invoice.bill_to_city, invoice.bill_to_state, invoice.bill_to_zip].filter(Boolean).join(', '), invoice.bill_to_email].filter(Boolean).map((line, i) => (
              <Text key={i} style={i === 0 ? s.clientName : s.clientLine}>{line}</Text>
            ))}
          </View>
          <View style={s.clientBox}>
            <Text style={s.boxHeading}>PAYMENT STATUS</Text>
            <Text style={[s.clientName, { color: invoice.status === 'paid' ? '#16A34A' : '#EF4444' }]}>{invoice.status.toUpperCase()}</Text>
            <Text style={s.clientLine}>Total: {fmt(invoice.grand_total)}</Text>
            <Text style={s.clientLine}>Paid: {fmt(invoice.amount_paid)}</Text>
            <Text style={[s.clientLine, { fontFamily: 'Helvetica-Bold', color: invoice.balance_due > 0 ? '#EF4444' : '#16A34A' }]}>Balance Due: {fmt(invoice.balance_due)}</Text>
          </View>
        </View>

        {sections.map(section => {
          const sectionItems = items.filter(li => li.section === section)
          if (!sectionItems.length) return null
          return (
            <View key={section} style={s.sectionWrap}>
              <View style={s.secHeader}><Text style={s.secTitle}>{SECTION_LABELS[section]}</Text></View>
              <View style={s.tableHead}>
                <View style={s.colDesc}><Text style={s.thText}>DESCRIPTION</Text></View>
                <View style={s.colQty}><Text style={[s.thText,{textAlign:'center'}]}>QTY</Text></View>
                <View style={s.colUnit}><Text style={[s.thText,{textAlign:'right'}]}>UNIT PRICE</Text></View>
                <View style={s.colTotal}><Text style={[s.thText,{textAlign:'right'}]}>TOTAL</Text></View>
              </View>
              {sectionItems.map((li, i) => (
                <View key={li.id} style={i%2===0?s.tableRow:s.tableRowAlt}>
                  <View style={s.colDesc}>
                    <Text style={s.itemName}>{li.name}</Text>
                    {li.description?<Text style={s.itemDesc}>{li.description}</Text>:null}
                  </View>
                  <View style={s.colQty}><Text style={[s.cellText,{textAlign:'center'}]}>{li.qty} {li.unit_label}</Text></View>
                  <View style={s.colUnit}><Text style={[s.cellText,{textAlign:'right'}]}>{fmt(li.unit_price)}</Text></View>
                  <View style={s.colTotal}><Text style={[s.cellText,{textAlign:'right',fontFamily:'Helvetica-Bold'}]}>{fmt(li.total)}</Text></View>
                </View>
              ))}
            </View>
          )
        })}

        <View style={s.totalsWrap}>
          <View style={s.totalsBox}>
            <View style={s.totalRow}><Text style={s.totalLabel}>Subtotal</Text><Text style={s.totalVal}>{fmt(invoice.subtotal)}</Text></View>
            <View style={s.totalRow}><Text style={s.totalLabel}>Tax ({(invoice.tax_rate*100).toFixed(2)}%)</Text><Text style={s.totalVal}>{fmt(invoice.tax_amount)}</Text></View>
            <View style={s.grandRow}><Text style={s.grandLabel}>TOTAL</Text><Text style={s.grandVal}>{fmt(invoice.grand_total)}</Text></View>
            {invoice.amount_paid > 0 && <View style={s.totalRow}><Text style={[s.totalLabel,{color:'#16A34A'}]}>Amount Paid</Text><Text style={[s.totalVal,{color:'#16A34A'}]}>{fmt(invoice.amount_paid)}</Text></View>}
            <View style={s.balanceRow}><Text style={s.balLabel}>BALANCE DUE</Text><Text style={s.balVal}>{fmt(invoice.balance_due)}</Text></View>
          </View>
        </View>

        <View style={s.footer}>
          <Text style={s.footText}>Integration One{settings.license_number ? ` · CA Lic. #${settings.license_number}` : ''} · integrationone.net · info@integrationone.net{settings.phone ? ` · ${settings.phone}` : ''}</Text>
          <Text style={s.footText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
