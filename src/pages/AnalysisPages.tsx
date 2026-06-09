import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { request } from '../api/client'
import type { AdminDailyLogItem, AdminMealListItem, DailyLog, MealEntry, Page } from '../api/types'
import { DataTable, type Column } from '../components/DataTable'
import {
  Badge,
  Card,
  DateRangePicker,
  DrawerField,
  IdCell,
  ImagePreview,
  Input,
  MacroBadge,
  PageHeader,
  Select,
  Skeleton,
  Drawer,
} from '../components/ui'
import { formatDate, formatDateTime, formatNumber } from '../lib/format'
import { cn } from '../lib/utils'

// ─── Source type labels ───────────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  image: 'Ảnh AI',
  barcode: 'Mã vạch',
  text: 'Văn bản',
  voice: 'Giọng nói',
  manual: 'Thủ công',
}

function sourceTone(s: string): 'blue' | 'green' | 'amber' | 'neutral' | 'mint' {
  const map: Record<string, 'blue' | 'green' | 'amber' | 'neutral' | 'mint'> = {
    image: 'blue',
    barcode: 'mint',
    text: 'green',
    voice: 'amber',
    manual: 'neutral',
  }
  return map[s] ?? 'neutral'
}

// ─── Layout tabs ──────────────────────────────────────────────────────────────

const tabs = [
  { to: '/analysis/meals', label: 'Bữa ăn' },
  { to: '/analysis/logs', label: 'Nhật ký hàng ngày' },
]

export function AnalysisLayout() {
  return (
    <>
      <div className="mb-5 flex gap-1.5 overflow-x-auto rounded-[12px] border border-border bg-muted p-1">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                'shrink-0 rounded-[9px] px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap',
                isActive ? 'bg-white text-ink shadow-sm' : 'text-subtle hover:text-ink',
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </>
  )
}

// ─── Meals list ───────────────────────────────────────────────────────────────

const mealListColumns: Column<AdminMealListItem>[] = [
  { key: 'id', header: 'Mã Bữa ăn', render: (item) => <IdCell id={item.id} /> },
  {
    key: 'user',
    header: 'Người dùng',
    render: (item) => (
      <Link className="font-mono text-xs text-primary hover:underline" to={`/accounts/${item.user_id}`}>
        {item.user_email}
      </Link>
    ),
  },
  { key: 'date', header: 'Ngày', render: (item) => formatDate(item.log_date) },
  {
    key: 'source',
    header: 'Nguồn',
    render: (item) => (
      <Badge tone={sourceTone(item.source_type)}>
        {SOURCE_LABELS[item.source_type] || item.source_type}
      </Badge>
    ),
  },
  {
    key: 'cal',
    header: 'Năng lượng',
    render: (item) => (
      <span className="font-bold text-accent">{formatNumber(item.total_calories, 0)} kcal</span>
    ),
  },
  {
    key: 'macro',
    header: 'Dinh dưỡng',
    render: (item) => (
      <span className="text-xs text-subtle">
        {formatNumber(item.total_protein, 1)}P · {formatNumber(item.total_carbs, 1)}C · {formatNumber(item.total_fat, 1)}F
      </span>
    ),
  },
  {
    key: 'confirmed',
    header: 'Đã xác nhận',
    render: (item) => (
      <Badge tone={item.is_confirmed ? 'green' : 'amber'}>
        {item.is_confirmed ? 'Đã xác nhận' : 'Chưa xác nhận'}
      </Badge>
    ),
  },
  { key: 'time', header: 'Bữa ăn lúc', render: (item) => formatDateTime(item.meal_time) },
]

export function MealsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sourceType, setSourceType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [drawerItem, setDrawerItem] = useState<AdminMealListItem | null>(null)

  const query = useQuery({
    queryKey: ['meals', page, search, sourceType, startDate, endDate],
    queryFn: () =>
      request<Page<AdminMealListItem>>({
        url: '/admin/analysis/meals/',
        params: {
          page,
          search: search || undefined,
          source_type: sourceType || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        },
      }),
  })

  const columns: Column<AdminMealListItem>[] = [
    ...mealListColumns,
    {
      key: 'actions',
      header: '',
      className: 'px-4 py-3 text-right',
      render: (item) => (
        <div className="flex justify-end gap-1.5">
          <Link
            className="btn btn-secondary h-8 px-2.5 text-xs"
            to={`/analysis/meals/${item.id}`}
          >
            Chi tiết
          </Link>
          <button
            type="button"
            className="btn btn-secondary h-8 px-2.5 text-xs"
            onClick={() => setDrawerItem(item)}
          >
            Xem nhanh
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Bữa ăn"
        description="Tất cả bữa ăn của người dùng — lọc theo nguồn, ngày, email."
      />
      <Card className="mb-4 p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <Input
              className="pl-9"
              placeholder="Tìm theo mã, email người dùng, mã vạch..."
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value) }}
            />
          </div>
          <Select
            value={sourceType}
            onChange={(e) => { setPage(1); setSourceType(e.target.value) }}
          >
            <option value="">Tất cả nguồn</option>
            <option value="image">Ảnh AI</option>
            <option value="barcode">Mã vạch</option>
            <option value="text">Văn bản</option>
            <option value="voice">Giọng nói</option>
            <option value="manual">Thủ công</option>
          </Select>
        </div>
        <div className="mt-3">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartChange={(v) => { setPage(1); setStartDate(v) }}
            onEndChange={(v) => { setPage(1); setEndDate(v) }}
          />
        </div>
      </Card>

      <DataTable
        data={query.data}
        columns={columns}
        isLoading={query.isLoading}
        error={query.error}
        page={page}
        onPageChange={setPage}
        emptyTitle="Chưa có bữa ăn nào"
      />

      {drawerItem && (
        <MealQuickDrawer item={drawerItem} onClose={() => setDrawerItem(null)} />
      )}
    </>
  )
}

// ─── Meal Quick Drawer (from list item) ──────────────────────────────────────

function MealQuickDrawer({ item, onClose }: { item: AdminMealListItem; onClose: () => void }) {
  return (
    <Drawer
      open
      onClose={onClose}
      title="Chi tiết Bữa ăn"
      subtitle={`${item.id} · ${formatDate(item.log_date)}`}
      width={560}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <DrawerField label="Mã Bữa ăn" value={<IdCell id={item.id} />} />
          <DrawerField
            label="Nguồn"
            value={
              <Badge tone={sourceTone(item.source_type)}>
                {SOURCE_LABELS[item.source_type] || item.source_type}
              </Badge>
            }
          />
          <DrawerField
            label="Người dùng"
            value={
              <Link className="text-xs text-primary hover:underline" to={`/accounts/${item.user_id}`}>
                {item.user_email}
              </Link>
            }
          />
          <DrawerField label="Ngày nhật ký" value={formatDate(item.log_date)} />
          <DrawerField label="Giờ bữa ăn" value={formatDateTime(item.meal_time)} />
          <DrawerField
            label="Trạng thái"
            value={
              <Badge tone={item.is_confirmed ? 'green' : 'amber'}>
                {item.is_confirmed ? 'Đã xác nhận' : 'Chưa xác nhận'}
              </Badge>
            }
          />
          {item.barcode && <DrawerField label="Mã vạch" value={item.barcode} />}
          {item.search_query && <DrawerField label="Từ khóa tìm kiếm" value={item.search_query} />}
          {item.serving_amount != null && (
            <DrawerField
              label="Khẩu phần"
              value={`${formatNumber(item.serving_amount, 2)} ${item.serving_unit_label || ''}`}
            />
          )}
        </div>

        <div>
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-subtle/70">
            Giá trị Dinh dưỡng
          </p>
          <div className="grid grid-cols-5 gap-2">
            <MacroBadge label="Calories" value={item.total_calories} unit="kcal" tone="cal" />
            <MacroBadge label="Chất đạm" value={item.total_protein} tone="protein" />
            <MacroBadge label="Tinh bột" value={item.total_carbs} tone="carbs" />
            <MacroBadge label="Chất béo" value={item.total_fat} tone="fat" />
            <MacroBadge label="Khối lượng" value={item.total_weight} tone="weight" />
          </div>
        </div>
      </div>
    </Drawer>
  )
}

// ─── Meal Detail Page ─────────────────────────────────────────────────────────

export function MealDetailPage() {
  const { id = '' } = useParams()
  const query = useQuery({
    queryKey: ['meal', id],
    queryFn: () => request<MealEntry>({ url: `/admin/analysis/meals/${id}/` }),
  })

  if (query.isLoading) return <Skeleton className="h-[520px]" />
  if (!query.data) return null
  const meal = query.data

  return (
    <>
      <PageHeader
        title={meal.food?.vi_name || meal.packaged_food?.name || meal.id}
        description={`${meal.id} · ${formatDateTime(meal.meal_time)}`}
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_400px]">
        <Card className="p-5">
          <div className="grid grid-cols-5 gap-2">
            <MacroBadge label="Calories" value={meal.total_calories} unit="kcal" tone="cal" />
            <MacroBadge label="Chất đạm" value={meal.total_protein} tone="protein" />
            <MacroBadge label="Tinh bột" value={meal.total_carbs} tone="carbs" />
            <MacroBadge label="Chất béo" value={meal.total_fat} tone="fat" />
            <MacroBadge label="Khối lượng" value={meal.total_weight} tone="weight" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoBlock
              label="Nguồn"
              value={SOURCE_LABELS[meal.source_type] || meal.source_type}
            />
            <InfoBlock label="Mã Job AI" value={meal.inference_job_id || '—'} />
            <InfoBlock label="Mã vạch" value={meal.barcode || '—'} />
            <InfoBlock
              label="Khẩu phần"
              value={
                meal.serving_amount
                  ? `${formatNumber(meal.serving_amount, 2)} ${meal.serving_unit_label || ''}`
                  : '—'
              }
            />
            <InfoBlock
              label="Trạng thái"
              value={meal.is_confirmed ? 'Đã xác nhận' : 'Chưa xác nhận'}
            />
            {meal.confirmed_at && (
              <InfoBlock label="Xác nhận lúc" value={formatDateTime(meal.confirmed_at)} />
            )}
          </div>

          <h2 className="mt-6 text-sm font-extrabold text-ink">Thành phần món ăn</h2>
          <div className="mt-3 space-y-2.5">
            {meal.components.length === 0 ? (
              <p className="text-sm text-subtle">Không có thành phần.</p>
            ) : (
              meal.components.map((component) => (
                <div key={component.id} className="rounded-[10px] border border-border p-3 text-sm">
                  <div className="flex flex-wrap justify-between gap-3">
                    <span className="font-bold text-ink">
                      {component.component_name || component.physical_data_name}
                    </span>
                    <span className="font-bold text-accent">
                      {formatNumber(component.calories, 0)} kcal
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-subtle">
                    Thể tích {formatNumber(component.volume, 1)} cm³ ·{' '}
                    {formatNumber(component.calculated_weight, 1)} g ·{' '}
                    {formatNumber(component.protein, 1)}P /
                    {formatNumber(component.carbs, 1)}C /
                    {formatNumber(component.fat, 1)}F
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="overflow-hidden">
            <ImagePreview src={meal.image_path} alt={meal.id} height={260} />
            {meal.notes && (
              <div className="border-t border-border p-4 text-sm text-subtle">{meal.notes}</div>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}

// ─── Daily logs list ──────────────────────────────────────────────────────────

const logListColumns: Column<AdminDailyLogItem>[] = [
  { key: 'id', header: 'Mã Nhật ký', render: (item) => <IdCell id={item.id} /> },
  {
    key: 'user',
    header: 'Người dùng',
    render: (item) => (
      <Link className="font-mono text-xs text-primary hover:underline" to={`/accounts/${item.user_id}`}>
        {item.user_email}
      </Link>
    ),
  },
  { key: 'date', header: 'Ngày', render: (item) => formatDate(item.date) },
  {
    key: 'meals',
    header: 'Số bữa',
    render: (item) => (
      <span className="font-bold text-ink">{formatNumber(item.meal_count, 0)} bữa</span>
    ),
  },
  {
    key: 'cal',
    header: 'Năng lượng',
    render: (item) => (
      <span className="font-bold text-accent">{formatNumber(item.total_calories, 0)} kcal</span>
    ),
  },
  {
    key: 'macro',
    header: 'Dinh dưỡng',
    render: (item) => (
      <span className="text-xs text-subtle">
        {formatNumber(item.total_protein, 1)}P · {formatNumber(item.total_carbs, 1)}C · {formatNumber(item.total_fat, 1)}F
      </span>
    ),
  },
]

export function LogsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [drawerItem, setDrawerItem] = useState<AdminDailyLogItem | null>(null)

  const query = useQuery({
    queryKey: ['logs', page, search, startDate, endDate],
    queryFn: () =>
      request<Page<AdminDailyLogItem>>({
        url: '/admin/analysis/logs/',
        params: {
          page,
          search: search || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        },
      }),
  })

  const columns: Column<AdminDailyLogItem>[] = [
    ...logListColumns,
    {
      key: 'actions',
      header: '',
      className: 'px-4 py-3 text-right',
      render: (item) => (
        <div className="flex justify-end gap-1.5">
          <Link
            className="btn btn-secondary h-8 px-2.5 text-xs"
            to={`/analysis/logs/${item.id}`}
          >
            Chi tiết
          </Link>
          <button
            type="button"
            className="btn btn-secondary h-8 px-2.5 text-xs"
            onClick={() => setDrawerItem(item)}
          >
            Xem nhanh
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Nhật ký hàng ngày"
        description="Nhật ký dinh dưỡng theo ngày của tất cả người dùng."
      />
      <Card className="mb-4 p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <Input
              className="pl-9"
              placeholder="Tìm theo mã nhật ký, email người dùng..."
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value) }}
            />
          </div>
        </div>
        <div className="mt-3">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartChange={(v) => { setPage(1); setStartDate(v) }}
            onEndChange={(v) => { setPage(1); setEndDate(v) }}
          />
        </div>
      </Card>

      <DataTable
        data={query.data}
        columns={columns}
        isLoading={query.isLoading}
        error={query.error}
        page={page}
        onPageChange={setPage}
        emptyTitle="Chưa có nhật ký nào"
      />

      {drawerItem && (
        <LogQuickDrawer item={drawerItem} onClose={() => setDrawerItem(null)} />
      )}
    </>
  )
}

// ─── Log Quick Drawer (from list item) ───────────────────────────────────────

function LogQuickDrawer({ item, onClose }: { item: AdminDailyLogItem; onClose: () => void }) {
  return (
    <Drawer
      open
      onClose={onClose}
      title="Chi tiết Nhật ký"
      subtitle={`${item.id} · ${formatDate(item.date)}`}
      width={520}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <DrawerField label="Mã Nhật ký" value={<IdCell id={item.id} />} />
          <DrawerField label="Ngày" value={formatDate(item.date)} />
          <DrawerField
            label="Người dùng"
            value={
              <Link className="text-xs text-primary hover:underline" to={`/accounts/${item.user_id}`}>
                {item.user_email}
              </Link>
            }
          />
          <DrawerField label="Số bữa ăn" value={`${formatNumber(item.meal_count, 0)} bữa`} />
        </div>

        <div>
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-subtle/70">
            Tổng Dinh dưỡng trong ngày
          </p>
          <div className="grid grid-cols-5 gap-2">
            <MacroBadge label="Calories" value={item.total_calories} unit="kcal" tone="cal" />
            <MacroBadge label="Chất đạm" value={item.total_protein} tone="protein" />
            <MacroBadge label="Tinh bột" value={item.total_carbs} tone="carbs" />
            <MacroBadge label="Chất béo" value={item.total_fat} tone="fat" />
            <MacroBadge label="Khối lượng" value={item.total_weight} tone="weight" />
          </div>
        </div>
      </div>
    </Drawer>
  )
}

// ─── Log Detail Page ──────────────────────────────────────────────────────────

export function LogDetailPage() {
  const { id = '' } = useParams()
  const query = useQuery({
    queryKey: ['log', id],
    queryFn: () => request<DailyLog>({ url: `/admin/analysis/logs/${id}/` }),
  })

  if (query.isLoading) return <Skeleton className="h-[520px]" />
  if (!query.data) return null
  const log = query.data

  return (
    <>
      <PageHeader
        title={`Nhật ký ngày ${formatDate(log.date)}`}
        description={log.id}
      />
      <Card className="mb-4 p-5">
        <div className="grid grid-cols-5 gap-2">
          <MacroBadge label="Calories" value={log.total_calories} unit="kcal" tone="cal" />
          <MacroBadge label="Chất đạm" value={log.total_protein} tone="protein" />
          <MacroBadge label="Tinh bột" value={log.total_carbs} tone="carbs" />
          <MacroBadge label="Chất béo" value={log.total_fat} tone="fat" />
          <MacroBadge label="Khối lượng" value={log.total_weight} tone="weight" />
        </div>
      </Card>

      <h2 className="mb-3 text-sm font-extrabold text-ink">
        Các bữa ăn trong ngày ({log.meals.length})
      </h2>
      <div className="space-y-2.5">
        {log.meals.length === 0 ? (
          <p className="text-sm text-subtle">Chưa có bữa ăn nào trong nhật ký này.</p>
        ) : (
          log.meals.map((meal) => (
            <Link
              key={meal.id}
              to={`/analysis/meals/${meal.id}`}
              className="block rounded-[12px] border border-border bg-white p-4 transition hover:border-primary/40 hover:shadow-card"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-extrabold text-ink">
                    {meal.food?.vi_name || meal.packaged_food?.name || meal.id}
                  </p>
                  <p className="mt-0.5 text-xs text-subtle">
                    {formatDateTime(meal.meal_time)} ·{' '}
                    <span className={cn(
                      'inline-block rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                      meal.source_type === 'image' ? 'bg-blue-50 text-blue-600' :
                      meal.source_type === 'barcode' ? 'bg-purple-50 text-purple-600' :
                      meal.source_type === 'voice' ? 'bg-amber-50 text-amber-600' :
                      'bg-muted text-subtle',
                    )}>
                      {SOURCE_LABELS[meal.source_type] || meal.source_type}
                    </span>
                  </p>
                </div>
                <span className="text-lg font-extrabold text-accent">
                  {formatNumber(meal.total_calories, 0)} kcal
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </>
  )
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] bg-background p-3">
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-subtle/70">{label}</p>
      <p className="mt-1 break-words text-sm font-extrabold text-ink">{value}</p>
    </div>
  )
}
