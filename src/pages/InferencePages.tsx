import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { request } from '../api/client'
import type { InferenceFeedback, InferenceJob, InferenceMetrics, Page } from '../api/types'
import { DataTable, type Column } from '../components/DataTable'
import { Badge, Button, Card, Input, PageHeader, Select, Skeleton } from '../components/ui'
import { formatCalories, formatDateTime, formatMacro, formatNumber } from '../lib/format'
import { cn } from '../lib/utils'

const tabs = [
  { to: '/inference/jobs', label: 'Jobs' },
  { to: '/inference/metrics', label: 'Metrics' },
  { to: '/inference/feedback', label: 'Feedback' },
]

export function InferenceLayout() {
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

function statusTone(status: string) {
  if (status === 'succeeded' || status === 'resolved') return 'green'
  if (status === 'failed' || status === 'open') return 'red'
  if (status === 'running' || status === 'reviewed') return 'amber'
  return 'neutral'
}

const jobColumns: Column<InferenceJob>[] = [
  { key: 'id', header: 'Job', render: (item) => <Link className="font-extrabold text-primary hover:underline" to={`/inference/jobs/${item.id}`}>{item.id}</Link> },
  { key: 'status', header: 'Status', render: (item) => <Badge tone={statusTone(item.status)}>{item.status}</Badge> },
  { key: 'model', header: 'Model', render: (item) => item.model_version || '—' },
  { key: 'latency', header: 'Latency', render: (item) => `${formatNumber(item.latency_ms)} ms` },
  { key: 'cal', header: 'Calories', render: (item) => formatCalories(item.result?.total_calories) },
  { key: 'created', header: 'Created', render: (item) => formatDateTime(item.created_at) },
]

export function JobsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const query = useQuery({
    queryKey: ['inference-jobs', page, search, status],
    queryFn: () =>
      request<Page<InferenceJob>>({
        url: '/admin/inference/jobs/',
        params: { page, search: search || undefined, status: status || undefined },
      }),
  })
  return (
    <>
      <PageHeader title="Inference Jobs" description="Theo dõi job AI phân tích ảnh, latency, kết quả và lỗi." />
      <Card className="mb-4 p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <Input
              className="pl-9"
              placeholder="Search by job id or user email"
              value={search}
              onChange={(event) => {
                setPage(1)
                setSearch(event.target.value)
              }}
            />
          </div>
          <Select
            value={status}
            onChange={(event) => {
              setPage(1)
              setStatus(event.target.value)
            }}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="succeeded">Succeeded</option>
            <option value="failed">Failed</option>
          </Select>
        </div>
      </Card>
      <DataTable data={query.data} columns={jobColumns} isLoading={query.isLoading} error={query.error} page={page} onPageChange={setPage} />
    </>
  )
}

export function JobDetailPage() {
  const { id = '' } = useParams()
  const query = useQuery({ queryKey: ['inference-job', id], queryFn: () => request<InferenceJob>({ url: `/admin/inference/jobs/${id}/` }) })
  if (query.isLoading) return <Skeleton className="h-[520px]" />
  if (!query.data) return null
  const job = query.data
  return (
    <>
      <PageHeader title={job.id} description={`Created ${formatDateTime(job.created_at)} · updated ${formatDateTime(job.updated_at)}`} />
      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Card className="p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Info label="Status" value={job.status} />
            <Info label="Model" value={job.model_version || '—'} />
            <Info label="Latency" value={`${formatNumber(job.latency_ms)} ms`} />
            <Info label="Error" value={job.error_message || '—'} />
          </div>
          {job.result && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Info label="Calories" value={formatCalories(job.result.total_calories)} />
              <Info label="Protein" value={formatMacro(job.result.total_protein)} />
              <Info label="Carbs" value={formatMacro(job.result.total_carbs)} />
              <Info label="Fat" value={formatMacro(job.result.total_fat)} />
              <Info label="Weight" value={formatMacro(job.result.total_weight)} />
            </div>
          )}
          <pre className="mt-5 max-h-96 overflow-auto rounded-2xl bg-ink p-4 text-xs text-white">
            {JSON.stringify({ camera_metadata: job.camera_metadata, raw_output: job.raw_output, components: job.result?.components }, null, 2)}
          </pre>
        </Card>
        <Card className="overflow-hidden">
          <img alt={job.id} className="h-80 w-full object-cover" src={job.image} />
          <div className="p-5 text-sm text-subtle">
            Depth map: {job.depth_map ? <a className="text-primary hover:underline" href={job.depth_map}>open file</a> : '—'}
          </div>
        </Card>
      </div>
    </>
  )
}

export function InferenceMetricsPage() {
  const query = useQuery({ queryKey: ['inference-metrics'], queryFn: () => request<InferenceMetrics>({ url: '/admin/inference/metrics/' }) })
  return (
    <>
      <PageHeader title="Inference Metrics" description="Metrics riêng của module inference từ backend." />
      {query.isLoading ? (
        <Skeleton className="h-52" />
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-5"><Info label="Total jobs" value={formatNumber(query.data?.total_jobs)} /></Card>
          <Card className="p-5"><Info label="Avg latency" value={`${formatNumber(query.data?.average_latency_ms)} ms`} /></Card>
          <Card className="p-5"><Info label="Open feedback" value={formatNumber(query.data?.feedback_open ?? query.data?.open_feedback)} /></Card>
          <Card className="p-5"><Info label="Statuses" value={Object.entries(query.data?.by_status || query.data?.jobs_by_status || {}).map(([k, v]) => `${k}: ${v}`).join(', ') || '—'} /></Card>
        </div>
      )}
    </>
  )
}

const feedbackColumns: Column<InferenceFeedback>[] = [
  { key: 'id', header: 'Feedback', render: (item) => <span className="font-bold">{item.id}</span> },
  { key: 'job', header: 'Job', render: (item) => <Link className="text-primary hover:underline" to={`/inference/jobs/${item.job}`}>{item.job}</Link> },
  { key: 'issue', header: 'Issue', render: (item) => item.issue_type },
  { key: 'status', header: 'Status', render: (item) => <Badge tone={statusTone(item.status)}>{item.status}</Badge> },
  { key: 'comment', header: 'Comment', render: (item) => <span className="line-clamp-2 max-w-md">{item.comment || '—'}</span> },
  { key: 'created', header: 'Created', render: (item) => formatDateTime(item.created_at) },
]

export function FeedbackPage() {
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['feedback', page],
    queryFn: () => request<Page<InferenceFeedback>>({ url: '/admin/inference/feedback/', params: { page } }),
  })
  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      request<InferenceFeedback>({ url: `/admin/inference/feedback/${id}/`, method: 'PATCH', data: { status } }),
    onSuccess: async () => {
      toast.success('Đã cập nhật feedback')
      await queryClient.invalidateQueries({ queryKey: ['feedback'] })
    },
  })
  const columns: Column<InferenceFeedback>[] = [
    ...feedbackColumns,
    {
      key: 'actions',
      header: '',
      className: 'px-4 py-3 text-right',
      render: (item) => (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" disabled={mutation.isPending} onClick={() => mutation.mutate({ id: item.id, status: 'reviewed' })}>
            Reviewed
          </Button>
          <Button variant="secondary" disabled={mutation.isPending} onClick={() => mutation.mutate({ id: item.id, status: 'resolved' })}>
            Resolved
          </Button>
        </div>
      ),
    },
  ]
  return (
    <>
      <PageHeader title="Inference Feedback" description="Review feedback người dùng gửi cho kết quả AI." />
      <DataTable data={query.data} columns={columns} isLoading={query.isLoading} error={query.error} page={page} onPageChange={setPage} />
    </>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-subtle">{label}</p>
      <p className="mt-1 break-words text-sm font-extrabold text-ink">{value}</p>
    </div>
  )
}
