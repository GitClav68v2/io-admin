'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Users, FileText, Receipt, Package, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/clients',   label: 'Clients',    icon: Users },
  { href: '/proposals', label: 'Proposals',  icon: FileText },
  { href: '/invoices',  label: 'Invoices',   icon: Receipt },
  { href: '/catalog',   label: 'Catalog',    icon: Package },
]

export default function Sidebar() {
  const path   = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-56 bg-[#0F172A] flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="text-lg font-bold tracking-tight">
          <span className="text-white">INTEGRATION</span>
          <span className="text-cyan-400">ONE</span>
        </div>
        <p className="text-slate-500 text-xs mt-0.5">Admin Portal</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== '/dashboard' && path.startsWith(href))
          return (
            <Link
              key={href} href={href}
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

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-slate-800">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors w-full"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
