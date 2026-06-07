import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, Apple, BarChart3, BrainCircuit, Database, Users } from 'lucide-react'
import { request } from '../api/client'
import type { InferenceMetrics, NutritionMetrics, SystemUsageMetrics, UserMetrics } from '../api/types'
import { Card, ErrorState, PageHeader, Skeleton } from '../components/ui'
import { formatCalories, formatNumber } from '../lib/format'
import { getErrorMessage } from '../api/client'

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string
  value: string
  helper: string
  icon: typeof Users
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-subtle">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-ink">{value}</p>
          <p className="mt-2 text-xs text-subtle">{helper}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primarySoft text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  )
}

export function DashboardPage() {
  const users = useQuery({ queryKey: ['dashboard', 'users'], queryFn: () => request<UserMetrics>({ url: '/admin/reports/users/' }) })
  const nutrition = useQuery({
    queryKey: ['dashboard', 'nutrition'],
    queryFn: () => request<NutritionMetrics>({ url: '/admin/reports/nutrition/' }),
  })
  const inference = useQuery({
    queryKey: ['dashboard', 'inference'],
    queryFn: () => request<InferenceMetrics>({ url: '/admin/reports/inference/' }),
  })
  const system = useQuery({
    queryKey: ['dashboard', 'system'],
    queryFn: () => request<SystemUsageMetrics>({ url: '/admin/reports/system-usage/' }),
  })

  const hasError = users.error || nutrition.error || inference.error || system.error
  const statusData = useMemo(() => {
    const statuses = inference.data?.jobs_by_status || inference.data?.by_status || {}
    return Object.entries(statuses).map(([name, value]) => ({ name, value }))
  }, [inference.data])
  const sourceData = useMemo(
    () => Object.entries(system.data?.meals_by_source || {}).map(([name, value]) => ({ name, value })),
    [system.data],
  )

  return (
    <>
      <PageHeader title="Dashboard" description="Tổng quan người dùng, dinh dưỡng, inference và mức sử dụng hệ thống." />
      {hasError && <ErrorState message={getErrorMessage(hasError)} />}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {users.isLoading || nutrition.isLoading || inference.isLoading || system.isLoading ? (
          Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-36" />)
        ) : (
          <>
            <MetricCard label="Users" value={formatNumber(users.data?.total_users)} helper={`${formatNumber(users.data?.active_users)} active users`} icon={Users} />
            <MetricCard label="Staff/Admin" value={formatNumber((users.data?.staff_users || 0) + (users.data?.admins || 0))} helper="Internal operators" icon={Activity} />
            <MetricCard label="Meals" value={formatNumber(nutrition.data?.meal_count)} helper={`${formatNumber(nutrition.data?.log_count)} daily logs`} icon={Apple} />
            <MetricCard label="Calories" value={formatCalories(nutrition.data?.totals.sum_calories)} helper="Total tracked energy" icon={BarChart3} />
            <MetricCard label="Inference jobs" value={formatNumber(inference.data?.total_jobs)} helper={`${formatNumber(inference.data?.average_latency_ms, 0)} ms avg latency`} icon={BrainCircuit} />
            <MetricCard label="Open feedback" value={formatNumber(inference.data?.open_feedback ?? inference.data?.feedback_open)} helper="Needs review" icon={Database} />
            <MetricCard label="Daily logs" value={formatNumber(system.data?.total_daily_logs)} helper="All users" icon={Database} />
            <MetricCard label="System meals" value={formatNumber(system.data?.total_meals)} helper={`${formatNumber(system.data?.total_inference_jobs)} AI jobs`} icon={Apple} />
          </>
        )}
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-base font-extrabold">Inference by status</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8ded4" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#006d36" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-base font-extrabold">Meals by source</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sourceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8ded4" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#d97706" fill="#fef3c7" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </>
  )
}
