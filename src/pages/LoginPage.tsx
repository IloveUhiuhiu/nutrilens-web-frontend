import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../auth/AuthProvider'
import { Button, Input } from '../components/ui'
import { getErrorMessage } from '../api/client'

export function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to="/" replace />

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-primary lg:block">
        <img
          alt="NutriLens food scan"
          className="absolute inset-0 h-full w-full object-cover opacity-45"
          src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1600&q=80"
        />
        <div className="absolute inset-0 bg-primary/55" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/95 text-lg font-extrabold text-primary">NL</div>
            <div>
              <p className="text-xl font-extrabold">NutriLens</p>
              <p className="text-sm text-white/75">Health & Nutrition Intelligence</p>
            </div>
          </div>
          <div className="max-w-xl">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-white/70">Admin Console</p>
            <h1 className="text-5xl font-extrabold leading-tight">Quản trị dữ liệu dinh dưỡng và AI inference trong một nơi.</h1>
            <p className="mt-5 text-lg text-white/78">
              Thiết kế chuyển thể từ mobile prototype: Manrope, xanh sức khỏe, nền sáng trung tính và các bề mặt sạch cho thao tác lặp lại.
            </p>
          </div>
        </div>
      </section>
      <section className="flex min-w-0 items-center justify-start overflow-hidden p-4 sm:p-5 lg:justify-center">
        <div className="w-full max-w-[22rem] rounded-3xl border border-border bg-white p-6 shadow-panel sm:max-w-md sm:p-8">
          <div className="mb-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-lg font-extrabold text-white">NL</div>
            <h1 className="text-2xl font-extrabold text-ink">Đăng nhập admin</h1>
            <p className="mt-2 text-sm text-subtle">Sử dụng tài khoản staff/admin từ backend NutriLens.</p>
          </div>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault()
              setSubmitting(true)
              try {
                await login(email, password)
                toast.success('Đăng nhập thành công')
              } catch (error) {
                toast.error(getErrorMessage(error))
              } finally {
                setSubmitting(false)
              }
            }}
          >
            <label>
              <span className="mb-1 block text-sm font-bold text-ink">Email</span>
              <Input autoComplete="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-sm font-bold text-ink">Mật khẩu</span>
              <Input
                autoComplete="current-password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Đăng nhập
            </Button>
          </form>
        </div>
      </section>
    </main>
  )
}
