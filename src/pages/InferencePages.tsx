import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { request } from '../api/client'
import type { InferenceFeedback, InferenceJob, InferenceMetrics, Page } from '../api/types'
import { DataTable, type Column } from '../components/DataTable'
import {
  Badge,
  Button,
  Card,
  DetailModal,
  DrawerField,
  IdCell,
  ImagePreview,
  Input,
  JsonViewer,
  MacroBadge,
  PageHeader,
  Select,
  Skeleton,
} from '../components/ui'
import { formatDateTime, formatNumber } from '../lib/format'
import { cn } from '../lib/utils'

const tabs = [
  { to: '/inference/jobs', label: 'Danh sách Job' },
  { to: '/inference/metrics', label: 'Thống kê' },
  { to: '/inference/feedback', label: 'Phản hồi AI' },
]

export function InferenceLayout() {
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

// ─── Status helpers ───────────────────────────────────────────────────────────

function statusTone(s: string): 'green' | 'amber' | 'red' | 'neutral' {
  if (s === 'succeeded' || s === 'resolved') return 'green'
  if (s === 'failed' || s === 'open') return 'red'
  if (s === 'running' || s === 'reviewed') return 'amber'
  return 'neutral'
}

const JOB_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xử lý',
  running: 'Đang chạy',
  succeeded: 'Thành công',
  failed: 'Thất bại',
}

const FEEDBACK_STATUS_LABELS: Record<string, string> = {
  open: 'Mở',
  reviewed: 'Đã duyệt',
  resolved: 'Đã giải quyết',
}

// ─── Job list ─────────────────────────────────────────────────────────────────

const jobColumns: Column<InferenceJob>[] = [
  { key: 'id', header: 'Mã Job', render: (item) => <IdCell id={item.id} /> },
  {
    key: 'status',
    header: 'Trạng thái',
    render: (item) => (
      <Badge tone={statusTone(item.status)}>
        {JOB_STATUS_LABELS[item.status] || item.status}
      </Badge>
    ),
  },
  { key: 'model', header: 'Phiên bản mô hình', render: (item) => item.model_version || '—' },
  {
    key: 'latency',
    header: 'Độ trễ',
    render: (item) => `${formatNumber(item.latency_ms)} ms`,
  },
  {
    key: 'cal',
    header: 'Năng lượng (kcal)',
    render: (item) => (item.result ? `${formatNumber(item.result.total_calories, 0)} kcal` : '—'),
  },
  { key: 'created', header: 'Thời gian tạo', render: (item) => formatDateTime(item.created_at) },
]

export function JobsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [jobStatus, setJobStatus] = useState('')
  const [drawerItem, setDrawerItem] = useState<InferenceJob | null>(null)

  const query = useQuery({
    queryKey: ['inference-jobs', page, search, jobStatus],
    queryFn: () =>
      request<Page<InferenceJob>>({
        url: '/admin/inference/jobs/',
        params: { page, search: search || undefined, status: jobStatus || undefined },
      }),
  })

  const columnsWithAction: Column<InferenceJob>[] = [
    ...jobColumns,
    {
      key: 'actions',
      header: '',
      className: 'px-4 py-3 text-right',
      render: (item) => (
        <div className="flex justify-end gap-1.5">
          <Link className="btn btn-secondary h-8 px-2.5 text-xs" to={`/inference/jobs/${item.id}`}>
            Chi tiết
          </Link>
          <Button
            variant="secondary"
            className="h-8 px-2.5 text-xs"
            onClick={() => setDrawerItem(item)}
          >
            Xem nhanh
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Danh sách Job AI"
        description="Theo dõi các job phân tích ảnh, độ trễ, kết quả và lỗi."
      />
      <Card className="mb-4 p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <Input
              className="pl-9"
              placeholder="Tìm theo mã job hoặc email người dùng..."
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value) }}
            />
          </div>
          <Select
            value={jobStatus}
            onChange={(e) => { setPage(1); setJobStatus(e.target.value) }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="running">Đang chạy</option>
            <option value="succeeded">Thành công</option>
            <option value="failed">Thất bại</option>
          </Select>
        </div>
      </Card>

      <DataTable
        data={query.data}
        columns={columnsWithAction}
        isLoading={query.isLoading}
        error={query.error}
        page={page}
        onPageChange={setPage}
        emptyTitle="Chưa có Job AI nào"
      />

      {drawerItem && (
        <JobDrawer job={drawerItem} onClose={() => setDrawerItem(null)} />
      )}
    </>
  )
}

// ─── Job Drawer ───────────────────────────────────────────────────────────────

function JobDrawer({ job, onClose }: { job: InferenceJob; onClose: () => void }) {
  return (
    <DetailModal
      open
      onClose={onClose}
      title={`Job AI: ${job.id}`}
      subtitle={`${JOB_STATUS_LABELS[job.status] || job.status} · ${formatDateTime(job.created_at)}`}
    >
      <div className="space-y-4">
        {/* Images */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-subtle/70">Ảnh gốc</p>
            <ImagePreview src={job.image} alt="Original" height={180} />
          </div>
          <div>
            <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-subtle/70">Depth Map</p>
            <ImagePreview src={job.depth_map} alt="Depth map" height={180} />
          </div>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-2 gap-3">
          <DrawerField label="Mã Job" value={<IdCell id={job.id} />} />
          <DrawerField
            label="Trạng thái"
            value={
              <Badge tone={statusTone(job.status)}>
                {JOB_STATUS_LABELS[job.status] || job.status}
              </Badge>
            }
          />
          <DrawerField label="Phiên bản mô hình" value={job.model_version || '—'} />
          <DrawerField label="Độ trễ hệ thống" value={`${formatNumber(job.latency_ms)} ms`} />
          <DrawerField label="Thời gian tạo" value={formatDateTime(job.created_at)} />
          <DrawerField label="Cập nhật lần cuối" value={formatDateTime(job.updated_at)} />
          {job.error_message && (
            <DrawerField label="Thông báo lỗi" value={job.error_message} fullWidth />
          )}
        </div>

        {/* Result macros */}
        {job.result && (
          <div>
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-subtle/70">
              Kết quả Dinh dưỡng
            </p>
            <div className="grid grid-cols-5 gap-2">
              <MacroBadge label="Calories" value={job.result.total_calories} unit="kcal" tone="cal" />
              <MacroBadge label="Chất đạm" value={job.result.total_protein} tone="protein" />
              <MacroBadge label="Tinh bột" value={job.result.total_carbs} tone="carbs" />
              <MacroBadge label="Chất béo" value={job.result.total_fat} tone="fat" />
              <MacroBadge label="Khối lượng" value={job.result.total_weight} tone="weight" />
            </div>
          </div>
        )}

        {/* Raw JSON */}
        <div>
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-subtle/70">
            Raw Output (JSON)
          </p>
          <JsonViewer
            data={{ camera_metadata: job.camera_metadata, raw_output: job.raw_output, components: job.result?.components }}
            maxHeight={280}
          />
        </div>
      </div>
    </DetailModal>
  )
}

// ─── Job Detail Page ──────────────────────────────────────────────────────────

export function JobDetailPage() {
  const { id = '' } = useParams()
  const query = useQuery({
    queryKey: ['inference-job', id],
    queryFn: () => request<InferenceJob>({ url: `/admin/inference/jobs/${id}/` }),
  })
  if (query.isLoading) return <Skeleton className="h-[520px]" />
  if (!query.data) return null
  const job = query.data

  return (
    <>
      <PageHeader
        title={job.id}
        description={`Tạo lúc ${formatDateTime(job.created_at)} · cập nhật ${formatDateTime(job.updated_at)}`}
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Card className="p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoBlock label="Trạng thái" value={JOB_STATUS_LABELS[job.status] || job.status} />
            <InfoBlock label="Mô hình" value={job.model_version || '—'} />
            <InfoBlock label="Độ trễ" value={`${formatNumber(job.latency_ms)} ms`} />
            <InfoBlock label="Lỗi" value={job.error_message || '—'} />
          </div>
          {job.result && (
            <div className="mt-4 grid grid-cols-5 gap-2">
              <MacroBadge label="Calories" value={job.result.total_calories} unit="kcal" tone="cal" />
              <MacroBadge label="Chất đạm" value={job.result.total_protein} tone="protein" />
              <MacroBadge label="Tinh bột" value={job.result.total_carbs} tone="carbs" />
              <MacroBadge label="Chất béo" value={job.result.total_fat} tone="fat" />
              <MacroBadge label="Khối lượng" value={job.result.total_weight} tone="weight" />
            </div>
          )}
          <div className="mt-4">
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-subtle/70">Raw Output</p>
            <JsonViewer
              data={{ camera_metadata: job.camera_metadata, raw_output: job.raw_output, components: job.result?.components }}
              maxHeight={340}
            />
          </div>
        </Card>
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <ImagePreview src={job.image} alt={job.id} height={240} className="rounded-b-none" />
            <div className="border-t border-border p-4">
              <p className="text-xs text-subtle">
                Depth map:{' '}
                {job.depth_map ? (
                  <a className="text-primary hover:underline" href={job.depth_map} target="_blank" rel="noreferrer">
                    Mở file
                  </a>
                ) : (
                  '—'
                )}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}

// ─── Inference Metrics ────────────────────────────────────────────────────────

export function InferenceMetricsPage() {
  const query = useQuery({
    queryKey: ['inference-metrics'],
    queryFn: () => request<InferenceMetrics>({ url: '/admin/inference/metrics/' }),
  })

  return (
    <>
      <PageHeader
        title="Thống kê Inference"
        description="Các chỉ số hiệu suất module phân tích AI từ backend."
      />
      {query.isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="bento-card p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-subtle/80">Tổng Job AI</p>
            <p className="mt-2 text-3xl font-extrabold text-ink">{formatNumber(query.data?.total_jobs)}</p>
          </div>
          <div className="bento-card p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-subtle/80">Độ trễ trung bình</p>
            <p className="mt-2 text-3xl font-extrabold text-mint">{formatNumber(query.data?.average_latency_ms, 0)} ms</p>
          </div>
          <div className="bento-card p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-subtle/80">Phản hồi chưa duyệt</p>
            <p className="mt-2 text-3xl font-extrabold text-danger">
              {formatNumber(query.data?.feedback_open ?? query.data?.open_feedback)}
            </p>
          </div>
          <div className="bento-card p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-subtle/80">Phân phối trạng thái</p>
            <div className="mt-2 space-y-1">
              {Object.entries(
                query.data?.by_status || query.data?.jobs_by_status || {},
              ).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-subtle">{JOB_STATUS_LABELS[k] || k}</span>
                  <span className="font-bold">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

const feedbackColumns: Column<InferenceFeedback>[] = [
  { key: 'id', header: 'Mã Phản hồi', render: (item) => <IdCell id={item.id} /> },
  {
    key: 'job',
    header: 'Mã Job',
    render: (item) => (
      <Link className="font-mono text-xs text-primary hover:underline" to={`/inference/jobs/${item.job}`}>
        {item.job}
      </Link>
    ),
  },
  { key: 'issue', header: 'Loại vấn đề', render: (item) => item.issue_type },
  {
    key: 'status',
    header: 'Trạng thái',
    render: (item) => (
      <Badge tone={statusTone(item.status)}>
        {FEEDBACK_STATUS_LABELS[item.status] || item.status}
      </Badge>
    ),
  },
  {
    key: 'comment',
    header: 'Bình luận',
    render: (item) => <span className="line-clamp-2 max-w-md">{item.comment || '—'}</span>,
  },
  { key: 'created', header: 'Ngày gửi', render: (item) => formatDateTime(item.created_at) },
]

export function FeedbackPage() {
  const [page, setPage] = useState(1)
  const [drawerItem, setDrawerItem] = useState<InferenceFeedback | null>(null)
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['feedback', page],
    queryFn: () =>
      request<Page<InferenceFeedback>>({ url: '/admin/inference/feedback/', params: { page } }),
  })

  const mutation = useMutation({
    mutationFn: ({ id, feedbackStatus }: { id: string; feedbackStatus: string }) =>
      request<InferenceFeedback>({
        url: `/admin/inference/feedback/${id}/`,
        method: 'PATCH',
        data: { status: feedbackStatus },
      }),
    onSuccess: async () => {
      toast.success('Đã cập nhật trạng thái phản hồi')
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
        <div className="flex justify-end gap-1.5">
          <Button
            variant="secondary"
            className="h-8 px-2.5 text-xs"
            onClick={() => setDrawerItem(item)}
          >
            Xem Chi tiết
          </Button>
          <Button
            variant="secondary"
            className="h-8 px-2.5 text-xs"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ id: item.id, feedbackStatus: 'reviewed' })}
          >
            Đã duyệt
          </Button>
          <Button
            variant="secondary"
            className="h-8 px-2.5 text-xs"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ id: item.id, feedbackStatus: 'resolved' })}
          >
            Đã giải quyết
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Phản hồi AI"
        description="Xem xét phản hồi của người dùng gửi cho kết quả phân tích AI."
      />
      <DataTable
        data={query.data}
        columns={columns}
        isLoading={query.isLoading}
        error={query.error}
        page={page}
        onPageChange={setPage}
        emptyTitle="Chưa có phản hồi nào"
      />
      {drawerItem && (
        <FeedbackDrawer
          feedback={drawerItem}
          onClose={() => setDrawerItem(null)}
          onUpdateStatus={(feedbackStatus) => {
            mutation.mutate({ id: drawerItem.id, feedbackStatus })
            setDrawerItem(null)
          }}
        />
      )}
    </>
  )
}

function FeedbackDrawer({
  feedback,
  onClose,
  onUpdateStatus,
}: {
  feedback: InferenceFeedback
  onClose: () => void
  onUpdateStatus: (s: string) => void
}) {
  return (
    <DetailModal
      open
      onClose={onClose}
      title="Chi tiết Phản hồi AI"
      subtitle={`${feedback.id} · ${formatDateTime(feedback.created_at)}`}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <DrawerField label="Mã Phản hồi" value={<IdCell id={feedback.id} />} />
          <DrawerField
            label="Trạng thái"
            value={
              <Badge tone={statusTone(feedback.status)}>
                {FEEDBACK_STATUS_LABELS[feedback.status] || feedback.status}
              </Badge>
            }
          />
          <DrawerField
            label="Mã Job liên quan"
            value={
              <Link className="font-mono text-xs text-primary hover:underline" to={`/inference/jobs/${feedback.job}`}>
                {feedback.job}
              </Link>
            }
          />
          <DrawerField label="Mã Người dùng" value={<span className="font-mono text-xs">{feedback.user}</span>} />
          <DrawerField label="Loại vấn đề" value={feedback.issue_type} />
          <DrawerField label="Duyệt lúc" value={formatDateTime(feedback.reviewed_at)} />
          <DrawerField label="Bình luận" value={feedback.comment || '—'} fullWidth />
        </div>

        <div>
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-subtle/70">
            Dữ liệu hiệu chỉnh
          </p>
          <JsonViewer data={feedback.corrected_data} maxHeight={220} />
        </div>

        <div className="flex gap-2 border-t border-border pt-4">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => onUpdateStatus('reviewed')}
          >
            Đánh dấu Đã duyệt
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => onUpdateStatus('resolved')}
          >
            Đánh dấu Đã giải quyết
          </Button>
        </div>
      </div>
    </DetailModal>
  )
}

// ─── Info block ───────────────────────────────────────────────────────────────

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] bg-background p-3">
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-subtle/70">{label}</p>
      <p className="mt-1 break-words text-sm font-extrabold text-ink">{value}</p>
    </div>
  )
}
