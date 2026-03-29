# TODO — Integration One Admin Portal

## Completed (March 28-29, 2026)

### Proposals
- [x] Fix tax calculation to use proposal's actual tax rate
- [x] Fix proposal edit header and tax rate display precision
- [x] Show Project Name under title on detail page
- [x] Add Subtotal line, rename One-Time Total to Total
- [x] Reorder totals: Equipment > Tax > Subtotal > Labor > Total
- [x] Show live title and project name in ProposalForm section header
- [x] Make proposal title a clickable link on list page
- [x] Redirect to proposals list after editing draft (Save as Draft)
- [x] Add "PROPOSAL" label above title on detail page
- [x] Update PDF header: new tagline, address, www.IntegrationOne.net
- [x] Update PDF footer: "IntegrationOne" as one word, add website

### Invoices
- [x] Make Invoice # and Title clickable links on list page
- [x] Add Invoice label to detail header
- [x] Add Edit button to invoice detail
- [x] Invoice edit: reorder ZIP/City/State, auto-lookup ZIP, format phone
- [x] Show phone number in Bill To section
- [x] Match invoice PDF header/footer to proposal PDF
- [x] Google Voice tel: link fix on invoice detail

### Prospects
- [x] Build Prospects section (replaced HubSpot)
- [x] Remove HubSpot integration entirely
- [x] Match Prospects table layout to Clients layout
- [x] Google Voice tel: link fix on prospects page

### Clients
- [x] Google Voice tel: link fix on clients page
- [x] Standardize job site input styling (border, padding, focus ring)

### Catalog
- [x] Make entire catalog item row clickable to open edit
- [x] Standardize table padding (px-5 py-3)
- [x] Standardize modal positioning (pt-8)
- [x] Standardize empty state (py-12)

### Security
- [x] Rate limit ZIP code API (30 req/min per IP)
- [x] Sanitize error alerts (ProposalDetail, InvoiceDetail, ProposalForm)
- [x] Sandbox YouTube iframes
- [x] Update CSP headers

### UI Consistency Pass
- [x] Invoice detail label: text-sm → text-xs above title, matching ProposalDetail
- [x] Catalog table padding aligned with other tables
- [x] ClientsManager inputs standardized
- [x] ProposalPDF contact font and totals box width aligned with InvoicePDF

### Public Site (integrationone.net)
- [x] Embed single-page quote form inline on homepage
- [x] Replace tagline with "See Everything, Miss Nothing" / "Security That Never Sleeps"
- [x] Fix CSP in worker.js for Supabase
- [x] Remove HubSpot from CSP
- [x] Google Voice tel: link fix
- [x] Remove floating "Get a Quote" button
- [x] Tighten form spacing, footer nav gaps
- [x] Hero headline restyled (softer, gold, half size)
- [x] Phone field: strip leading "1" before formatting

## Open / Future

- [ ] Verify Google Voice fix on Clients page (user reported issue — may need hard refresh)
- [ ] Consider adding recurring invoice support
- [ ] Dashboard enhancements (revenue trends, aging receivables)
- [ ] Email templates for invoice/proposal sending
