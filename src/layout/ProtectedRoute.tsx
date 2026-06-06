import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { Skeleton } from '../components/ui'

export function ProtectedRoute() {
  const { isAuthenticated, isProfileLoading } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-12 w-72" />
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-36" />
          ))}
        </div>
      </div>
    )
  }
  return <Outlet />
}
