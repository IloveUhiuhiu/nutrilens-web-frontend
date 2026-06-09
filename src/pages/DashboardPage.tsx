import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Activity, Apple, BarChart3, BrainCircuit, Database, MessageSquare, TrendingUp, Users } from 'lucide-react'
import { request, getErrorMessage } from '../api/client'
import type { InferenceMetrics, NutritionMetrics, SystemUsageMetrics, UserMetrics } from '../api/types'
import { Card, ErrorState, PageHeader, Skeleton } from '../components/ui'
import { formatCalories, formatNumber } from '../lib/format'

const PALETTE_BARS = ['#1B4332', '#40916C', '#74C69D', '#B7E4C7', '#D8F3DC']

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  helper: string
  icon: typeof Users
  accent?: 'primary' | 'mint' | 'amber' | 'danger'
}) {
  const iconStyles: Record<string, string> = {
    primary: 'bg-primarySoft text-primary',
    mint: 'bg-mintSoft text-mint',
    amber: 'bg-accentSoft text-accent',
    danger: 'bg-dangerSoft text-danger',
  }
  const accentKey = accent || 'primary'
  return (
    <div className="bento-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-subtle/80">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-ink">{value}</p>
          <p className="mt-1.5 text-xs text-subtle">{helper}</p>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] ${iconStyles[accentKey]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const users = useQuery({
    queryKey: ['dashboard', 'users'],
    queryFn: () => request<UserMetrics>({ url: '/admin/reports/users/' }),
  })
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
  const isLoading = users.isLoading || nutrition.isLoading || inference.isLoading || system.isLoading

  const statusData = useMemo(() => {
    const statuses = inference.data?.jobs_by_status || inference.data?.by_status || {}
    return Object.entries(statuses).map(([name, value]) => ({ name, value }))
  }, [inference.data])

  const sourceData = useMemo(
    () =>
      Object.entries(system.data?.meals_by_source || {}).map(([name, value]) => ({
        name: SOURCE_LABELS[name] || name,
        value,
      })),
    [system.data],
  )

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Tổng quan người dùng, dinh dưỡng, phân tích AI và mức sử dụng hệ thống."
      />

      {hasError && <ErrorState message={getErrorMessage(hasError)} />}

      {/* ── Bento Grid — 4-col metrics ───────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32" />)
          : (
            <>
              <MetricCard
                label="Tổng người dùng"
                value={formatNumber(users.data?.total_users)}
                helper={`${formatNumber(users.data?.active_users)} đang hoạt động`}
                icon={Users}
                accent="primary"
              />
              <MetricCard
                label="Nhân sự / Quản trị"
                value={formatNumber((users.data?.staff_users || 0) + (users.data?.admins || 0))}
                helper="Vận hành nội bộ"
                icon={Activity}
                accent="mint"
              />
              <MetricCard
                label="Tổng bữa ăn"
                value={formatNumber(nutrition.data?.meal_count)}
                helper={`${formatNumber(nutrition.data?.log_count)} nhật ký ngày`}
                icon={Apple}
                accent="amber"
              />
              <MetricCard
                label="Tổng năng lượng"
                value={formatCalories(nutrition.data?.totals?.sum_calories)}
                helper="Năng lượng đã ghi nhận"
                icon={BarChart3}
                accent="primary"
              />
              <MetricCard
                label="Job AI"
                value={formatNumber(inference.data?.total_jobs)}
                helper={`Trung bình ${formatNumber(inference.data?.average_latency_ms, 0)} ms`}
                icon={BrainCircuit}
                accent="mint"
              />
              <MetricCard
                label="Phản hồi chưa duyệt"
                value={formatNumber(inference.data?.open_feedback ?? inference.data?.feedback_open)}
                helper="Cần xem xét"
                icon={MessageSquare}
                accent="danger"
              />
              <MetricCard
                label="Nhật ký hệ thống"
                value={formatNumber(system.data?.total_daily_logs)}
                helper="Tất cả người dùng"
                icon={Database}
                accent="primary"
              />
              <MetricCard
                label="Bữa ăn hệ thống"
                value={formatNumber(system.data?.total_meals)}
                helper={`${formatNumber(system.data?.total_inference_jobs)} lần phân tích AI`}
                icon={TrendingUp}
                accent="amber"
              />
            </>
          )}
      </div>

      {/* ── Bento Grid — Charts ───────────────────────────────────────── */}
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {/* Bar chart — Inference by status */}
        <div className="bento-card p-5">
          <h2 className="mb-1 text-sm font-extrabold text-ink">Phân tích AI theo trạng thái</h2>
          <p className="mb-4 text-xs text-subtle">Phân phối kết quả job AI theo từng trạng thái</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="#ccd8cc" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4a5c50' }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#4a5c50' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #ccd8cc', fontSize: 12 }}
                  cursor={{ fill: '#eaf0ec' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {statusData.map((_, index) => (
                    <Cell key={index} fill={PALETTE_BARS[index % PALETTE_BARS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Area chart — Meals by source */}
        <div className="bento-card p-5">
          <h2 className="mb-1 text-sm font-extrabold text-ink">Bữa ăn theo nguồn nhập</h2>
          <p className="mb-4 text-xs text-subtle">Phân phối phương thức ghi nhận bữa ăn</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sourceData}>
                <defs>
                  <linearGradient id="sourceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="10%" stopColor="#40916C" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#40916C" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ccd8cc" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4a5c50' }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#4a5c50' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #ccd8cc', fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#40916C"
                  strokeWidth={2}
                  fill="url(#sourceGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Bento bottom — Macro averages ────────────────────────────── */}
      {!isLoading && nutrition.data && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="bento-card p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-subtle/70">Trung bình Calories / ngày</p>
            <p className="mt-2 text-2xl font-extrabold text-ink">
              {formatCalories(nutrition.data.totals?.average_calories)}
            </p>
          </div>
          <div className="bento-card p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-subtle/70">Tổng Chất đạm (P)</p>
            <p className="mt-2 text-2xl font-extrabold text-mint">
              {formatNumber(nutrition.data.totals?.total_protein, 0)} g
            </p>
          </div>
          <div className="bento-card p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-subtle/70">Tổng Tinh bột (C)</p>
            <p className="mt-2 text-2xl font-extrabold text-accent">
              {formatNumber(nutrition.data.totals?.total_carbs, 0)} g
            </p>
          </div>
          <div className="bento-card p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-subtle/70">Tổng Chất béo (F)</p>
            <p className="mt-2 text-2xl font-extrabold text-danger">
              {formatNumber(nutrition.data.totals?.total_fat, 0)} g
            </p>
          </div>
        </div>
      )}
    </>
  )
}

const SOURCE_LABELS: Record<string, string> = {
  image: 'Ảnh AI',
  barcode: 'Mã vạch',
  text: 'Văn bản',
  voice: 'Giọng nói',
  manual: 'Thủ công',
}
