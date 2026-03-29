@AGENTS.md

# Integration One Admin Portal (io-admin)

## Project Overview
Internal admin portal for IntegrationOne, a security camera installation & access control company in Vista, CA. Built with Next.js + Supabase, deployed on Vercel at admin.integrationone.net.

## Architecture
- **Framework**: Next.js (App Router) + TypeScript + Tailwind CSS
- **Database**: Supabase (PostgreSQL + RLS)
- **PDF Generation**: @react-pdf/renderer for proposals and invoices
- **Deployment**: `git push` then `npx vercel --prod --yes`
- **Auth**: Supabase auth with middleware-based route protection

## Key Components
- `ProposalForm.tsx` — Create/edit proposals with line items by section (cameras, network, hardware, labor, other)
- `ProposalDetail.tsx` — View proposal with status badge, bill-to info, line items, PDF/email actions
- `InvoiceDetail.tsx` — View invoice, created from accepted proposals
- `ProposalPDF.tsx` / `InvoicePDF.tsx` — PDF templates with matching headers/footers
- `CatalogManager.tsx` — Product/service catalog CRUD
- `ProspectsManager.tsx` — Lead tracking (replaced HubSpot)
- `ClientsManager.tsx` — Client management with job sites
- `DashboardCards.tsx` — Dashboard with stats and charts

## Companion Codebase
The public website (integrationone.net) lives at `/Volumes/iMac RAID/Claude/Integration One/` — static HTML deployed on Cloudflare Pages via `git push origin main` to GitHub repo `GitClav68v2/securetest`.

## Conventions
- Company tagline: "See Everything, Miss Nothing — Security That Never Sleeps"
- Company address: 1227 Stonemark Place, Suite One, Vista, California, 92081
- Website displayed as: www.IntegrationOne.net
- "IntegrationOne" is one word (no space) in footer/branding
- Detail page labels: `text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1` above title
- Table cells: `px-5 py-3` padding standard
- Form inputs: `border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500`
- Modal overlays: `pt-8` vertical positioning
- PDF templates: ProposalPDF and InvoicePDF should stay in sync (font sizes, totals box width, header/footer layout)

## Google Voice Integration
Tel: links use a clone/replace pattern via useEffect so the GV Chrome extension's MutationObserver picks them up. Applied to ProspectsManager, ClientsManager, and InvoiceDetail.

## Security
- ZIP code API has IP-based rate limiting (30 req/min)
- Error alerts show generic messages, not raw backend errors
- YouTube iframes are sandboxed
- CSP headers configured in Cloudflare worker (public site) and Vercel (admin)
