# Lessons Learned — Integration One

## Always Commit and Push (Critical)
An entire session's worth of work (GV fix, HubSpot removal, form consolidation) was lost because changes were only saved locally and never committed/pushed. The user thought things were broken when they were actually just not deployed. After every set of changes: commit, push, deploy.

## Know Your Deployment Pipeline
- **io-admin**: `git push` then `npx vercel --prod --yes` — manual Vercel deploy required
- **Public site**: `git push origin main` — Cloudflare Pages auto-deploys from GitHub
- These are two completely separate systems. Don't confuse them.

## CSS Variable Names Can Lie
On the public site (integrationone.net), `--color-cyan` is actually `#D4972A` (gold/amber), NOT cyan. `--color-amber` does NOT exist as a CSS variable. Always check the actual value before using a variable by name.

## Google Voice Chrome Extension Pattern
The GV extension injects `<a href="voice.google.com/...">` links via MutationObserver. For dynamically rendered content (React), tel: links need to be cloned and re-inserted after render so the MutationObserver fires:
```tsx
useEffect(() => {
  const t = setTimeout(() => {
    document.querySelectorAll('a[href^="tel:"]').forEach(a => {
      const clone = a.cloneNode(true)
      a.parentNode?.replaceChild(clone, a)
    })
  }, 500)
  return () => clearTimeout(t)
}, [data])
```

## Keep PDF Templates in Sync
ProposalPDF and InvoicePDF should mirror each other: same header layout, tagline, address, contact info, font sizes, footer text, and totals box width. When updating one, always update the other.

## UI Consistency Standards
Established standards to maintain across all admin pages:
- **Detail page labels**: `text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1` — placed above the title as a `<p>` tag
- **Table cells**: `px-5 py-3` padding
- **Form inputs**: `border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500`
- **Modal overlays**: `pt-8` vertical positioning (not pt-16)
- **Empty states**: `py-12` with `text-sm`
- **Status badges**: `text-xs px-2.5 py-1 rounded-full font-medium capitalize` next to title in flex row

## Security Checklist
- Rate limit external-facing APIs (ZIP lookup: 30 req/min per IP)
- Never show raw backend error messages in alerts — use generic messages
- Sandbox YouTube iframes with `sandbox="allow-scripts allow-same-origin"`
- CSP headers: keep connect-src, frame-src updated when adding/removing third-party services
- Web3Forms key is a public form ID, not a secret — safe to expose in client code

## Cloudflare Worker CSP
The public site's `worker.js` controls Content Security Policy. When integrating new services (like Supabase), the CSP `connect-src` must include the new domain or requests will be silently blocked. This caused the quote form submission error.

## Phone Number Formatting
When accepting US phone input, strip a leading "1" before formatting as xxx-xxx-xxxx. Users often type "1" as a country code prefix which throws off 10-digit formatting.
