import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Activity,
  Apple,
  BrainCircuit,
  ClipboardList,
  Gauge,
  LogOut,
  Search,
  Settings,
  Users,
} from 'lucide-react'
import { Toaster } from 'sonner'
import { useAuth } from '../auth/AuthProvider'
import { Button } from '../components/ui'
import { cn, initials } from '../lib/utils'

const navGroups = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: Gauge }],
  },
  {
    label: 'Operations',
    items: [
      { to: '/accounts', label: 'Accounts', icon: Users },
      { to: '/nutrition/foods', label: 'Nutrition Data', icon: Apple },
      { to: '/inference/jobs', label: 'Inference', icon: BrainCircuit },
      { to: '/analysis/meals', label: 'Analysis', icon: ClipboardList },
    ],
  },
  {
    label: 'Admin',
    items: [
      { to: '/accounts/activity-levels', label: 'Activity Levels', icon: Activity },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export function AppShell() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background text-ink">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-border bg-white/90 p-4 backdrop-blur xl:block">
        <button className="flex w-full items-center gap-3 rounded-2xl p-3 text-left" onClick={() => navigate('/')}>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
            NL
          </div>
          <div>
            <p className="text-lg font-extrabold leading-none">NutriLens</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-subtle">Admin Console</p>
          </div>
        </button>
        <nav className="mt-8 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-3 text-xs font-extrabold uppercase tracking-wide text-subtle/80">{group.label}</p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition',
                        isActive ? 'bg-primary text-white shadow-sm' : 'text-subtle hover:bg-muted hover:text-ink',
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="xl:pl-72">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-extrabold text-white xl:hidden">
              NL
            </button>
            <div className="relative max-w-xl flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <input className="field pl-9" placeholder="Search users, jobs, foods..." />
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              <div className="text-right">
                <p className="text-sm font-extrabold">{profile?.full_name || 'Admin'}</p>
                <p className="text-xs text-subtle">{profile?.email}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primarySoft text-sm font-extrabold text-primary">
                {initials(profile?.full_name, profile?.email)}
              </div>
            </div>
            <Button variant="secondary" onClick={() => void logout()}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
          <div className="flex gap-2 overflow-x-auto border-t border-border px-4 py-2 xl:hidden">
            {navGroups.flatMap((group) => group.items).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold',
                    isActive ? 'bg-primary text-white' : 'bg-white text-subtle',
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  )
}

export function LoginLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
      <Toaster position="top-right" richColors />
    </div>
  )
}
