'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Users, FileText, Receipt, Package, Truck, Tag, Settings, LogOut, Menu, X, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/clients',   label: 'Clients',    icon: Users },
  { href: '/proposals', label: 'Proposals',  icon: FileText },
  { href: '/invoices',     label: 'Invoices',    icon: Receipt },
  { href: '/commissions', label: 'Commissions', icon: TrendingUp },
  { href: '/catalog',     label: 'Catalog',     icon: Package },
  { href: '/suppliers', label: 'OEM Suppliers', icon: Truck },
  { href: '/promos',    label: 'Promo Codes',  icon: Tag },
  { href: '/settings',  label: 'Settings',     icon: Settings },
]

export default function Sidebar() {
  const path   = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const sidebarInner = (
    <>
      <div className="px-5 py-5 border-b border-slate-800 flex items-center justify-between">
        <div>
          <div className="text-lg font-bold tracking-tight">
            <span className="text-white">INTEGRATION</span>
            <span className="text-cyan-400">ONE</span>
          </div>
          <p className="text-slate-500 text-xs mt-0.5">Admin Portal</p>
        </div>
        <button onClick={() => setMobileOpen(false)} className="md:hidden text-slate-400 hover:text-white">
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== '/dashboard' && path.startsWith(href))
          return (
            <Link
              key={href} href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-cyan-500/15 text-cyan-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-800">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors w-full"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="md:hidden fixed top-3 left-3 z-40 bg-[#0F172A] text-slate-400 hover:text-white p-2 rounded-lg shadow-lg"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar — always in flow */}
      <aside className="hidden md:flex w-56 bg-[#0F172A] flex-col shrink-0">
        {sidebarInner}
      </aside>

      {/* Mobile sidebar — overlay when open */}
      {mobileOpen && (
        <aside className="md:hidden fixed inset-y-0 left-0 z-50 w-56 bg-[#0F172A] flex flex-col">
          {sidebarInner}
        </aside>
      )}
    </>
  )
}
