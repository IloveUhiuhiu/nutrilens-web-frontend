import { useNavigate } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { Button } from '../components/ui'

export function ForbiddenPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-dangerSoft">
        <ShieldOff className="h-8 w-8 text-danger" />
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-ink">403 — Không có quyền truy cập</h1>
        <p className="text-sm text-subtle">
          Bạn không có quyền xem trang này. Liên hệ quản trị viên để được cấp quyền.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Quay lại
        </Button>
        <Button onClick={() => navigate('/')}>
          Về trang chủ
        </Button>
      </div>
    </div>
  )
}
