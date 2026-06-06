import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { request } from '../api/client'
import type { DailyLog, MealEntry, Page } from '../api/types'
import { DataTable, type Column } from '../components/DataTable'
import { Badge, Card, Input, PageHeader, Skeleton } from '../components/ui'
import { formatCalories, formatDate, formatDateTime, formatMacro, formatNumber } from '../lib/format'
import { cn } from '../lib/utils'

const tabs = [
  { to: '/analysis/meals', label: 'Meals' },
  { to: '/analysis/logs', label: 'Daily Logs' },
]

export function AnalysisLayout() {
  return (
    <>
      <div className="mb-5 flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => cn('btn-secondary btn shrink-0', isActive && 'bg-primary text-white hover:bg-primary/90')}
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </>
  )
}

const mealColumns: Column<MealEntry>[] = [
  { key: 'meal', header: 'Meal', render: (item) => <Link className="font-extrabold text-primary hover:underline" to={`/analysis/meals/${item.id}`}>{item.food?.vi_name || item.packaged_food?.name || item.id}</Link> },
  { key: 'source', header: 'Source', render: (item) => <Badge tone="blue">{item.source_type}</Badge> },
  { key: 'time', header: 'Time', render: (item) => formatDateTime(item.meal_time) },
  { key: 'cal', header: 'Calories', render: (item) => formatCalories(item.total_calories) },
  { key: 'macro', header: 'Macro', render: (item) => `${formatMacro(item.total_protein)} P · ${formatMacro(item.total_carbs)} C · ${formatMacro(item.total_fat)} F` },
  { key: 'confirmed', header: 'Confirmed', render: (item) => <Badge tone={item.is_confirmed ? 'green' : 'amber'}>{item.is_confirmed ? 'Yes' : 'No'}</Badge> },
]

export function MealsPage() {
  const [page, setPage] = useState(1)
  const [userId, setUserId] = useState('')
  const query = useQuery({
    queryKey: ['meals', page, userId],
    queryFn: () => request<Page<MealEntry>>({ url: '/admin/analysis/meals/', params: { page, user_id: userId || undefined } }),
  })
  return (
    <>
      <PageHeader title="Meals" description="Danh sách bữa ăn của toàn bộ users, hỗ trợ lọc theo user id." />
      <Card className="mb-4 p-4">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <Input
            className="pl-9"
            placeholder="Filter by user_id"
            value={userId}
            onChange={(event) => {
              setPage(1)
              setUserId(event.target.value)
            }}
          />
        </div>
      </Card>
      <DataTable data={query.data} columns={mealColumns} isLoading={query.isLoading} error={query.error} page={page} onPageChange={setPage} />
    </>
  )
}

export function MealDetailPage() {
  const { id = '' } = useParams()
  const query = useQuery({ queryKey: ['meal', id], queryFn: () => request<MealEntry>({ url: `/admin/analysis/meals/${id}/` }) })
  if (query.isLoading) return <Skeleton className="h-[520px]" />
  if (!query.data) return null
  const meal = query.data
  return (
    <>
      <PageHeader title={meal.food?.vi_name || meal.packaged_food?.name || meal.id} description={`${meal.id} · ${formatDateTime(meal.meal_time)}`} />
      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Card className="p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Info label="Calories" value={formatCalories(meal.total_calories)} />
            <Info label="Protein" value={formatMacro(meal.total_protein)} />
            <Info label="Carbs" value={formatMacro(meal.total_carbs)} />
            <Info label="Fat" value={formatMacro(meal.total_fat)} />
            <Info label="Weight" value={formatMacro(meal.total_weight)} />
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Info label="Source" value={meal.source_type} />
            <Info label="Inference job" value={meal.inference_job_id || '—'} />
            <Info label="Barcode" value={meal.barcode || '—'} />
            <Info label="Serving" value={meal.serving_amount ? `${formatNumber(meal.serving_amount, 2)} ${meal.serving_unit_label || ''}` : '—'} />
          </div>
          <h2 className="mt-6 font-extrabold">Components</h2>
          <div className="mt-3 space-y-3">
            {meal.components.length === 0 ? (
              <p className="text-sm text-subtle">No components.</p>
            ) : (
              meal.components.map((component) => (
                <div key={component.id} className="rounded-xl border border-border p-3 text-sm">
                  <div className="flex flex-wrap justify-between gap-3">
                    <span className="font-bold">{component.component_name || component.physical_data_name}</span>
                    <span>{formatCalories(component.calories)}</span>
                  </div>
                  <p className="mt-1 text-xs text-subtle">
                    Volume {formatNumber(component.volume, 1)} cm3 · {formatMacro(component.calculated_weight)}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
        <Card className="overflow-hidden">
          {meal.image_path ? <img alt={meal.id} className="h-80 w-full object-cover" src={meal.image_path} /> : <div className="flex h-80 items-center justify-center bg-muted text-subtle">No image</div>}
          <div className="p-5 text-sm text-subtle">{meal.notes || 'No notes.'}</div>
        </Card>
      </div>
    </>
  )
}

const logColumns: Column<DailyLog>[] = [
  { key: 'id', header: 'Log', render: (item) => <Link className="font-extrabold text-primary hover:underline" to={`/analysis/logs/${item.id}`}>{item.id}</Link> },
  { key: 'date', header: 'Date', render: (item) => formatDate(item.date) },
  { key: 'meals', header: 'Meals', render: (item) => formatNumber(item.meals?.length || 0) },
  { key: 'cal', header: 'Calories', render: (item) => formatCalories(item.total_calories) },
  { key: 'macro', header: 'Macro', render: (item) => `${formatMacro(item.total_protein)} P · ${formatMacro(item.total_carbs)} C · ${formatMacro(item.total_fat)} F` },
]

export function LogsPage() {
  const [page, setPage] = useState(1)
  const [userId, setUserId] = useState('')
  const query = useQuery({
    queryKey: ['logs', page, userId],
    queryFn: () => request<Page<DailyLog>>({ url: '/admin/analysis/logs/', params: { page, user_id: userId || undefined } }),
  })
  return (
    <>
      <PageHeader title="Daily Logs" description="Nhật ký dinh dưỡng theo ngày của users." />
      <Card className="mb-4 p-4">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <Input
            className="pl-9"
            placeholder="Filter by user_id"
            value={userId}
            onChange={(event) => {
              setPage(1)
              setUserId(event.target.value)
            }}
          />
        </div>
      </Card>
      <DataTable data={query.data} columns={logColumns} isLoading={query.isLoading} error={query.error} page={page} onPageChange={setPage} />
    </>
  )
}

export function LogDetailPage() {
  const { id = '' } = useParams()
  const query = useQuery({ queryKey: ['log', id], queryFn: () => request<DailyLog>({ url: `/admin/analysis/logs/${id}/` }) })
  if (query.isLoading) return <Skeleton className="h-[520px]" />
  if (!query.data) return null
  const log = query.data
  return (
    <>
      <PageHeader title={`Daily log ${formatDate(log.date)}`} description={log.id} />
      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Info label="Calories" value={formatCalories(log.total_calories)} />
          <Info label="Protein" value={formatMacro(log.total_protein)} />
          <Info label="Carbs" value={formatMacro(log.total_carbs)} />
          <Info label="Fat" value={formatMacro(log.total_fat)} />
          <Info label="Weight" value={formatMacro(log.total_weight)} />
        </div>
        <h2 className="mt-6 font-extrabold">Meals</h2>
        <div className="mt-3 space-y-3">
          {log.meals.length === 0 ? (
            <p className="text-sm text-subtle">No meals.</p>
          ) : (
            log.meals.map((meal) => (
              <Link key={meal.id} to={`/analysis/meals/${meal.id}`} className="block rounded-xl border border-border p-3 text-sm hover:bg-background">
                <div className="flex flex-wrap justify-between gap-3">
                  <span className="font-bold">{meal.food?.vi_name || meal.packaged_food?.name || meal.id}</span>
                  <span>{formatCalories(meal.total_calories)}</span>
                </div>
                <p className="mt-1 text-xs text-subtle">{formatDateTime(meal.meal_time)} · {meal.source_type}</p>
              </Link>
            ))
          )}
        </div>
      </Card>
    </>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-background p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-subtle">{label}</p>
      <p className="mt-1 break-words text-sm font-extrabold text-ink">{value}</p>
    </div>
  )
}
