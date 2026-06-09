import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Activity,
  Apple,
  BrainCircuit,
  ClipboardList,
  Gauge,
  KeySquare,
  LogOut,
  Settings,
  Users,
} from 'lucide-react'
import { Toaster } from 'sonner'
import { useAuth } from '../auth/AuthProvider'
import { Avatar, Button } from '../components/ui'
import { cn, initials } from '../lib/utils'

const navGroups = [
  {
    label: 'Tổng quan',
    items: [{ to: '/', label: 'Dashboard', icon: Gauge }],
  },
  {
    label: 'Vận hành',
    items: [
      { to: '/accounts', label: 'Quản lý Tài khoản', icon: Users },
      { to: '/nutrition/foods', label: 'Dữ liệu Dinh dưỡng', icon: Apple },
      { to: '/inference/jobs', label: 'Phân tích AI', icon: BrainCircuit },
      { to: '/analysis/meals', label: 'Nhật ký & Bữa ăn', icon: ClipboardList },
    ],
  },
  {
    label: 'Quản trị',
    items: [
      { to: '/accounts/activity-levels', label: 'Mức Vận động', icon: Activity },
      { to: '/accounts/otp', label: 'Mã OTP', icon: KeySquare },
      { to: '/settings', label: 'Cài đặt', icon: Settings },
    ],
  },
]

export function AppShell() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()

  const userInitials = initials(profile?.full_name, profile?.email)

  return (
    <div className="min-h-screen bg-background text-ink">
      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-border bg-white xl:flex">
        {/* Logo */}
        <button
          className="flex items-center gap-3 border-b border-border px-4 py-4 text-left transition hover:bg-muted/60"
          onClick={() => navigate('/')}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-primary text-sm font-extrabold text-white shadow-md shadow-primary/25">
            NL
          </div>
          <div>
            <p className="text-[15px] font-extrabold leading-tight text-ink">NutriLens</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-subtle/70">Admin Console</p>
          </div>
        </button>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="mb-1.5 px-3 text-[10px] font-extrabold uppercase tracking-widest text-subtle/60">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] font-bold transition',
                        isActive
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-subtle hover:bg-muted hover:text-ink',
                      )
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Profile block at bottom of sidebar */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-[12px] bg-muted/60 px-3 py-2.5">
            <Avatar
              src={profile?.avatar_url}
              fallback={userInitials}
              size={36}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-extrabold text-ink">
                {profile?.full_name || 'Admin'}
              </p>
              <p className="truncate text-[11px] text-subtle">{profile?.email}</p>
            </div>
            <button
              onClick={() => void logout()}
              title="Đăng xuất"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-subtle transition hover:bg-dangerSoft hover:text-danger"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div className="xl:pl-[264px]">
        {/* Top header */}
        <header className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur-md">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            {/* Mobile logo */}
            <button
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary text-xs font-extrabold text-white xl:hidden"
              onClick={() => navigate('/')}
            >
              NL
            </button>

            {/* Page spacer (search removed from top-bar, kept in sidebar) */}
            <div className="flex-1" />

            {/* ── Profile + Logout — forced to absolute right ── */}
            <div className="ml-auto flex items-center gap-2.5">
              {/* Avatar thumbnail */}
              <Avatar
                src={profile?.avatar_url}
                fallback={userInitials}
                size={34}
                className="shrink-0"
              />
              {/* Name & email */}
              <div className="hidden text-right sm:block">
                <p className="text-[13px] font-extrabold leading-tight text-ink">
                  {profile?.full_name || 'Admin'}
                </p>
                <p className="text-[11px] leading-tight text-subtle">{profile?.email}</p>
              </div>
              {/* Logout button */}
              <Button
                variant="secondary"
                className="h-9 gap-1.5 px-3 text-xs"
                onClick={() => void logout()}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </Button>
            </div>
          </div>

          {/* Mobile bottom nav strip */}
          <div className="flex gap-1.5 overflow-x-auto border-t border-border px-3 py-2 xl:hidden">
            {navGroups.flatMap((g) => g.items).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex shrink-0 items-center gap-1.5 rounded-[9px] px-2.5 py-1.5 text-[11px] font-bold whitespace-nowrap',
                    isActive ? 'bg-primary text-white' : 'bg-muted text-subtle',
                  )
                }
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </header>

        <main className="mx-auto max-w-[1560px] px-4 py-6 sm:px-6">
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
